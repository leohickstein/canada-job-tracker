-- Canada Job Tracker - Supabase Schema
-- This schema supports multi-user job tracking with smart caching

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User job interests - what each user wants to track
CREATE TABLE user_job_interests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_titles TEXT[] NOT NULL DEFAULT '{}',
  locations TEXT[] NOT NULL DEFAULT '{}',
  salary_min INTEGER,
  job_types TEXT[] DEFAULT '{}',
  remote_preference TEXT CHECK (remote_preference IN ('remote', 'hybrid', 'onsite', 'any')) DEFAULT 'any',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job cache - stores fetched jobs with expiration
CREATE TABLE job_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  search_key TEXT NOT NULL UNIQUE, -- "Software Engineer|Remote"
  search_term TEXT NOT NULL,
  location TEXT NOT NULL,
  jobs JSONB NOT NULL DEFAULT '[]',
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_count INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User job tracking - individual user's job application status
CREATE TABLE user_job_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL, -- External job ID like "adzuna:12345"
  canonical_job_id TEXT NOT NULL, -- Our internal dedup ID
  status TEXT CHECK (status IN ('saved', 'applied', 'interview', 'offer', 'rejected')) DEFAULT 'saved',
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE,
  tracked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate tracking
  UNIQUE(user_id, job_id)
);

-- User preferences - theme, board order, etc.
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'system',
  board_order JSONB DEFAULT '{"backlog":[],"applied":[],"interview":[],"offer":[],"rejected":[],"saved":[]}',
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search request queue - for batching API calls
CREATE TABLE job_search_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  search_term TEXT NOT NULL,
  location TEXT NOT NULL,
  requested_by UUID[] DEFAULT '{}', -- Array of user IDs requesting this search
  priority INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_job_interests_user_id ON user_job_interests(user_id);
CREATE INDEX idx_job_cache_search_key ON job_cache(search_key);
CREATE INDEX idx_job_cache_expires_at ON job_cache(expires_at);
CREATE INDEX idx_user_job_tracking_user_id ON user_job_tracking(user_id);
CREATE INDEX idx_user_job_tracking_status ON user_job_tracking(status);
CREATE INDEX idx_job_search_queue_status ON job_search_queue(status);
CREATE INDEX idx_job_search_queue_priority ON job_search_queue(priority DESC);

-- Row Level Security (RLS) policies
ALTER TABLE user_job_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_job_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view their own job interests" ON user_job_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job interests" ON user_job_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job interests" ON user_job_interests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job interests" ON user_job_interests
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for user_job_tracking
CREATE POLICY "Users can view their own job tracking" ON user_job_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job tracking" ON user_job_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job tracking" ON user_job_tracking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job tracking" ON user_job_tracking
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Job cache is readable by all authenticated users (shared resource)
CREATE POLICY "Authenticated users can read job cache" ON job_cache
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only system/admin can write to job cache and search queue
-- These will be handled by your backend job fetching service

-- Functions for common operations
-- Update user interest and bump cache priority
CREATE OR REPLACE FUNCTION update_user_interests_and_cache(
  p_user_id UUID,
  p_job_titles TEXT[],
  p_locations TEXT[],
  p_salary_min INTEGER DEFAULT NULL,
  p_job_types TEXT[] DEFAULT '{}',
  p_remote_preference TEXT DEFAULT 'any'
) RETURNS VOID AS $$
BEGIN
  -- Upsert user interests
  INSERT INTO user_job_interests (user_id, job_titles, locations, salary_min, job_types, remote_preference, updated_at)
  VALUES (p_user_id, p_job_titles, p_locations, p_salary_min, p_job_types, p_remote_preference, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    job_titles = EXCLUDED.job_titles,
    locations = EXCLUDED.locations,
    salary_min = EXCLUDED.salary_min,
    job_types = EXCLUDED.job_types,
    remote_preference = EXCLUDED.remote_preference,
    updated_at = NOW();
    
  -- Update cache priorities for affected search terms
  UPDATE job_cache 
  SET user_count = (
    SELECT COUNT(DISTINCT ui.user_id)
    FROM user_job_interests ui
    WHERE ui.job_titles && ARRAY[job_cache.search_term]
      AND ui.locations && ARRAY[job_cache.location]
  ),
  priority = user_count
  WHERE search_term = ANY(p_job_titles)
    AND location = ANY(p_locations);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM job_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;