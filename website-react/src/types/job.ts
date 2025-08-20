// Canonical job schema - provider agnostic
export type Job = {
  // Core identifiers
  id: string                    // Format: "provider:external_id" 
  external_id: string           // Original ID from job provider
  canonical_id: string          // Our internal dedupe key
  
  // Essential job data
  title: string
  company: string
  location: string
  description?: string
  
  // URLs and application
  job_url: string               // Direct link to job posting
  application_url?: string      // Direct application link if different
  
  // Salary information (normalized to CAD annually)
  salary_min?: number
  salary_max?: number
  salary_currency?: string      // 'CAD', 'USD', etc.
  salary_period?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  
  // Dates (ISO 8601 strings)
  posted_date?: string
  expires_date?: string
  
  // Classification
  job_type?: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship'
  remote_type?: 'remote' | 'hybrid' | 'onsite'
  seniority_level?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
  
  // Provider metadata
  provider: string              // 'adzuna', 'linkedin', 'indeed', etc.
  provider_data?: Record<string, any>  // Raw provider data for debugging
  
  // Our metadata
  first_seen_at: string         // When we first discovered this job
  last_seen_at: string          // Last time we saw this job active
  search_terms_matched: string[] // Which search terms found this job
  
  // Quality scores (for ranking/filtering)
  relevance_score?: number      // 0-1, how well it matches search
  quality_score?: number        // 0-1, overall job posting quality
}
// Provider adapter interfaces
export interface JobProvider {
  name: string
  fetchJobs(searchTerm: string, location: string, options?: JobSearchOptions): Promise<Job[]>
  normalizeJob(rawJob: any, searchContext: SearchContext): Job
}

export interface JobSearchOptions {
  page?: number
  limit?: number
  salary_min?: number
  job_type?: string[]
  remote_only?: boolean
}

export interface SearchContext {
  search_term: string
  location: string
  fetched_at: string
}

// User tracking types
export type Status = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
export type Persist = { 
  status?: Status; 
  notes?: string; 
  clickedAt?: string; 
  appliedAt?: string;
  tracked?: boolean;
}
export type ColumnKey = 'backlog' | 'applied' | 'interview' | 'offer' | 'rejected' | 'saved'
export type PersistState = { items: Record<string, Persist>; boardOrder: Record<ColumnKey, string[]>; version: number }

// Multi-user database schema types
export interface UserJobInterests {
  user_id: string
  job_titles: string[]
  locations: string[]
  salary_min?: number
  job_types?: ('full-time' | 'part-time' | 'contract')[]
  remote_preference?: 'remote' | 'hybrid' | 'onsite' | 'any'
  updated_at: string
}

export interface JobCache {
  id: string
  search_key: string            // "Software Engineer|Remote"
  search_term: string
  location: string
  jobs: Job[]
  fetched_at: string
  expires_at: string
  user_count: number           // How many users want this search
  priority: number
}

// Phase 1: Salary Intelligence Features
export interface SalaryAnalysis {
  averageSalary?: number
  salaryRange?: { min: number; max: number }
  marketPosition?: 'below' | 'average' | 'above' | 'excellent'
  demandLevel?: 'low' | 'medium' | 'high' | 'very-high'
  trendDirection?: 'declining' | 'stable' | 'growing' | 'hot'
  confidence?: number // 0-1 confidence in the analysis
}

export interface JobWithAnalysis extends Job {
  salaryAnalysis?: SalaryAnalysis
}
