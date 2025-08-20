import { createClient } from '@supabase/supabase-js'
import type { Job, UserJobInterests, JobCache, UserJobTracking } from '@/types/job'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your_project_url_here') &&
  !supabaseAnonKey.includes('your_anon_key_here')

let supabase: any = null

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('Supabase not configured - authentication features disabled')
  // Create a mock client for development
  supabase = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signUp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ error: null }),
      upsert: () => Promise.resolve({ error: null }),
      delete: () => Promise.resolve({ error: null })
    }),
    rpc: () => Promise.resolve({ error: null })
  }
}

export { supabase }

// Auth helpers
export const auth = {
  signUp: (email: string, password: string) => supabase.auth.signUp({ email, password }),
  signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getUser: () => supabase.auth.getUser(),
  onAuthStateChange: (callback: (event: string, session: any) => void) => 
    supabase.auth.onAuthStateChange(callback)
}

// User interests management
export const userInterests = {
  // Get user's job interests
  async get(userId: string): Promise<UserJobInterests | null> {
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured - skipping user interests')
      return null
    }
    
    try {
      console.log('Fetching user interests for userId:', userId)
      
      // First check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('User not authenticated - skipping user interests')
        return null
      }
      
      const { data, error } = await supabase
        .from('user_job_interests')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when no rows

      if (error) {
        console.warn('Error fetching user interests:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        
        // Check for specific error types
        if (error.code === '42P01') {
          console.error('❌ Table user_job_interests does not exist. Please run the schema.sql file in your Supabase SQL editor.')
        } else if (error.message.includes('RLS')) {
          console.error('❌ RLS policy issue. Make sure RLS policies are set up correctly.')
        } else if (error.code === '406') {
          console.error('❌ Not Acceptable error - likely RLS policy or authentication issue')
        }
        
        return null
      }
      
      console.log('User interests fetched successfully:', data)
      return data
    } catch (error: any) {
      console.warn('Failed to get user interests:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      return null
    }
  },

  // Update user's job interests (triggers cache priority updates)
  async update(userId: string, interests: Omit<UserJobInterests, 'user_id' | 'created_at' | 'updated_at'>) {
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured - skipping user interests update')
      return
    }

    try {
      // Try the RPC function first (if schema is fully deployed)
      const { error: rpcError } = await supabase.rpc('update_user_interests_and_cache', {
        p_user_id: userId,
        p_job_titles: interests.job_titles,
        p_locations: interests.locations,
        p_salary_min: interests.salary_min || null,
        p_job_types: interests.job_types || [],
        p_remote_preference: interests.remote_preference || 'any'
      })

      if (rpcError) {
        console.warn('RPC function not available, falling back to simple upsert:', rpcError.message)
        
        // Fallback to simple upsert if RPC function doesn't exist
        const { error: upsertError } = await supabase
          .from('user_job_interests')
          .upsert({
            user_id: userId,
            job_titles: interests.job_titles,
            locations: interests.locations,
            salary_min: interests.salary_min,
            job_types: interests.job_types,
            remote_preference: interests.remote_preference,
            updated_at: new Date().toISOString()
          })

        if (upsertError) {
          console.error('Failed to upsert user interests:', upsertError)
        }
      }
    } catch (error) {
      console.warn('Failed to update user interests:', error)
    }
  },

  // Get all unique search terms from all users (for admin/system use)
  async getAllSearchTerms() {
    const { data, error } = await supabase
      .from('user_job_interests')
      .select('job_titles, locations')

    if (error) throw error

    // Aggregate all unique combinations
    const searchTerms = new Set<string>()
    data?.forEach(interest => {
      interest.job_titles?.forEach((title: string) => {
        interest.locations?.forEach((location: string) => {
          searchTerms.add(`${title}|${location}`)
        })
      })
    })

    return Array.from(searchTerms)
  }
}

// Job cache management
export const jobCache = {
  // Get cached jobs for user's interests
  async getForUser(userId: string): Promise<Job[]> {
    const interests = await userInterests.get(userId)
    if (!interests) return []

    const searchKeys: string[] = []
    interests.job_titles.forEach(title => {
      interests.locations.forEach(location => {
        searchKeys.push(`${title}|${location}`)
      })
    })

    const { data, error } = await supabase
      .from('job_cache')
      .select('jobs')
      .in('search_key', searchKeys)
      .gt('expires_at', new Date().toISOString())

    if (error) throw error

    // Flatten and deduplicate jobs from all cache entries
    const allJobs: Job[] = []
    const seenIds = new Set<string>()

    data?.forEach(cache => {
      cache.jobs.forEach((job: Job) => {
        if (!seenIds.has(job.canonical_id)) {
          seenIds.add(job.canonical_id)
          allJobs.push(job)
        }
      })
    })

    return allJobs
  },

  // Get specific cache entry
  async get(searchKey: string): Promise<JobCache | null> {
    const { data, error } = await supabase
      .from('job_cache')
      .select('*')
      .eq('search_key', searchKey)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Check if cache is stale for given search terms
  async getStaleSearches(searchKeys: string[]): Promise<string[]> {
    const { data, error } = await supabase
      .from('job_cache')
      .select('search_key, expires_at')
      .in('search_key', searchKeys)

    if (error) throw error

    const cachedKeys = new Set(data?.map(item => item.search_key) || [])
    const staleKeys = new Set<string>()

    // Check for missing or expired entries
    searchKeys.forEach(key => {
      if (!cachedKeys.has(key)) {
        staleKeys.add(key)
      }
    })

    data?.forEach(item => {
      if (new Date(item.expires_at) < new Date()) {
        staleKeys.add(item.search_key)
      }
    })

    return Array.from(staleKeys)
  }
}

// User job tracking (application status)
export const userJobTracking = {
  // Get all tracked jobs for user
  async getAll(userId: string): Promise<UserJobTracking[]> {
    const { data, error } = await supabase
      .from('user_job_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Update job tracking status
  async upsert(userId: string, jobId: string, tracking: Partial<UserJobTracking>) {
    const { error } = await supabase
      .from('user_job_tracking')
      .upsert({
        user_id: userId,
        job_id: jobId,
        canonical_job_id: tracking.canonical_job_id || jobId,
        status: tracking.status,
        notes: tracking.notes,
        applied_at: tracking.applied_at,
        tracked: tracking.tracked,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,job_id', // Specify the unique constraint columns
        ignoreDuplicates: false // Update on conflict instead of ignoring
      })

    if (error) throw error
  },

  // Remove job tracking
  async remove(userId: string, jobId: string) {
    const { error } = await supabase
      .from('user_job_tracking')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', jobId)

    if (error) throw error
  },

  // Get tracking data for specific job
  async get(userId: string, jobId: string): Promise<UserJobTracking | null> {
    const { data, error } = await supabase
      .from('user_job_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}

// User preferences
export const userPreferences = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async update(userId: string, preferences: any) {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
  }
}

// Search queue (for triggering fresh data fetches)
export const searchQueue = {
  async requestRefresh(searchTerms: string[], userId: string) {
    const requests = searchTerms.map(term => {
      const [search_term, location] = term.split('|')
      return {
        search_term,
        location,
        requested_by: [userId],
        priority: 1,
        status: 'pending'
      }
    })

    const { error } = await supabase
      .from('job_search_queue')
      .upsert(requests, { 
        onConflict: 'search_term,location',
        ignoreDuplicates: false 
      })

    if (error) throw error
  }
}