import { dataUrl } from '@/utils/baseUrl'
import type { Job, JobWithAnalysis } from '@/types/job'
import { text } from '@/utils/text'
import { jobCache, userInterests, searchQueue, auth } from './supabaseService'
import { salaryAnalysisService } from './salaryAnalysisService'

function dedupeJobs(arr: Job[]): Job[] {
  const seen = new Set<string>()
  const out: Job[] = []
  for (const j of arr) {
    const canonicalId = j.canonical_id || j.id
    if (!canonicalId) continue
    if (seen.has(canonicalId)) continue
    seen.add(canonicalId)
    out.push(j)
  }
  return out
}

// Legacy function for backward compatibility (loads static JSON)
export async function loadJobsStatic(): Promise<Job[]> {
  const url = dataUrl('data/jobs.json')
  const res = await fetch(url + '?ts=' + Date.now(), { cache: 'no-store' })
  const txt = await res.text()
  let json: any
  try { json = JSON.parse(txt) } catch { throw new Error('Could not parse jobs.json (starts with): '+txt.slice(0,80)) }
  if (!json || typeof json !== 'object' || !Array.isArray(json.jobs)) throw new Error('Invalid jobs.json shape: expected { jobs: [] }')
  return dedupeJobs(json.jobs as Job[])
}

// New function for authenticated users (loads from cache + triggers refresh if needed)
export async function loadJobsForUser(userId?: string): Promise<Job[]> {
  if (!userId) {
    // Anonymous user - fallback to static data
    return loadJobsStatic()
  }

  try {
    // 1. Get cached jobs for user's interests
    const cachedJobs = await jobCache.getForUser(userId)
    
    // 2. Check if we need to refresh any data
    const interests = await userInterests.get(userId)
    if (interests) {
      const searchKeys: string[] = []
      interests.job_titles.forEach(title => {
        interests.locations.forEach(location => {
          searchKeys.push(`${title}|${location}`)
        })
      })

      const staleSearches = await jobCache.getStaleSearches(searchKeys)
      if (staleSearches.length > 0) {
        // Queue refresh for stale data (don't wait for it)
        searchQueue.requestRefresh(staleSearches, userId).catch(console.error)
      }
    }

    // 3. If we have cached data, return it. Otherwise fallback to static
    if (cachedJobs.length > 0) {
      return dedupeJobs(cachedJobs)
    } else {
      // No cached data yet, fallback to static while fresh data is being fetched
      return loadJobsStatic()
    }
    
  } catch (error) {
    console.error('Error loading user jobs:', error)
    // Fallback to static data on any error
    return loadJobsStatic()
  }
}

// Phase 1: Enhance jobs with salary analysis
async function enhanceJobsWithSalaryAnalysis(jobs: Job[]): Promise<JobWithAnalysis[]> {
  // Only analyze jobs that have salary data to avoid unnecessary API calls
  const jobsWithSalary = jobs.filter(job => job.salary_min || job.salary_max)
  const jobsWithoutSalary = jobs.filter(job => !(job.salary_min || job.salary_max))
  
  // Conservative batch processing - limit to avoid API overuse
  const batchSize = 3 // Reduced batch size
  const maxJobsToAnalyze = 15 // Only analyze top 15 jobs with salaries
  const enhancedJobs: JobWithAnalysis[] = []
  
  // Prioritize jobs by salary (analyze highest paying jobs first)
  const prioritizedJobs = jobsWithSalary
    .sort((a, b) => {
      const aSalary = (a.salary_max || a.salary_min || 0)
      const bSalary = (b.salary_max || b.salary_min || 0)
      return bSalary - aSalary
    })
    .slice(0, maxJobsToAnalyze)
  
  for (let i = 0; i < prioritizedJobs.length; i += batchSize) {
    const batch = prioritizedJobs.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async (job): Promise<JobWithAnalysis> => {
      try {
        const salaryAnalysis = await salaryAnalysisService.analyzeSalary(job, jobs)
        return { ...job, salaryAnalysis }
      } catch (error) {
        console.warn('Failed to analyze salary for job:', job.id, error)
        return job as JobWithAnalysis
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    enhancedJobs.push(...batchResults)
  }
  
  // Add jobs without salary data and non-prioritized jobs (no analysis needed)
  const jobsWithoutAnalysis = jobsWithoutSalary.map(job => job as JobWithAnalysis)
  const nonPrioritizedJobs = jobsWithSalary.slice(maxJobsToAnalyze).map(job => job as JobWithAnalysis)
  
  return [...enhancedJobs, ...jobsWithoutAnalysis, ...nonPrioritizedJobs]
}

// Main function that routes to appropriate loading strategy
export async function loadJobs(): Promise<JobWithAnalysis[]> {
  try {
    const { data: { user } } = await auth.getUser()
    const jobs = await loadJobsForUser(user?.id)
    
    // Phase 1: Add salary analysis to jobs with salary data
    return await enhanceJobsWithSalaryAnalysis(jobs)
  } catch (error) {
    console.error('Error getting user:', error)
    const staticJobs = await loadJobsStatic()
    return await enhanceJobsWithSalaryAnalysis(staticJobs)
  }
}

// Filter jobs based on user interests (client-side filtering)
export function filterJobsForUser(jobs: Job[], interests: {
  job_titles: string[]
  locations: string[]
  salary_min?: number
  job_types?: string[]
  remote_preference?: string
}): Job[] {
  return jobs.filter(job => {
    // Check if job title matches any interest
    const titleMatch = interests.job_titles.some(title => 
      job.title.toLowerCase().includes(title.toLowerCase()) ||
      job.search_terms_matched?.some(term => 
        term.toLowerCase().includes(title.toLowerCase())
      )
    )

    // Check location preference
    const locationMatch = interests.remote_preference === 'any' ||
      (interests.remote_preference === 'remote' && job.remote_type === 'remote') ||
      (interests.remote_preference === 'hybrid' && ['remote', 'hybrid'].includes(job.remote_type || '')) ||
      (interests.remote_preference === 'onsite' && job.remote_type === 'onsite') ||
      interests.locations.some(location => 
        job.location.toLowerCase().includes(location.toLowerCase())
      )

    // Check salary minimum
    const salaryMatch = !interests.salary_min || 
      (job.salary_min && job.salary_min >= interests.salary_min)

    // Check job type
    const jobTypeMatch = !interests.job_types?.length ||
      interests.job_types.includes(job.job_type || 'full-time')

    return titleMatch && locationMatch && salaryMatch && jobTypeMatch
  })
}
