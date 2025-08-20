import type { Job, JobProvider, JobSearchOptions, SearchContext } from '@/types/job'

export class AdzunaProvider implements JobProvider {
  name = 'adzuna'
  
  private appId: string
  private appKey: string
  private baseUrl = 'https://api.adzuna.com/v1/api/jobs/ca/search'

  constructor(appId: string, appKey: string) {
    this.appId = appId
    this.appKey = appKey
  }

  async fetchJobs(
    searchTerm: string, 
    location: string, 
    options: JobSearchOptions = {}
  ): Promise<Job[]> {
    const { page = 1, limit = 50, salary_min, remote_only } = options
    
    const params = new URLSearchParams({
      app_id: this.appId,
      app_key: this.appKey,
      what: searchTerm,
      where: location,
      results_per_page: limit.toString(),
      page: page.toString(),
      sort_by: 'date',
      ...(salary_min && { salary_min: salary_min.toString() })
    })

    const response = await fetch(`${this.baseUrl}?${params}`)
    const data = await response.json()
    
    if (!data.results) {
      throw new Error(`Adzuna API error: ${data.message || 'Unknown error'}`)
    }

    const searchContext: SearchContext = {
      search_term: searchTerm,
      location,
      fetched_at: new Date().toISOString()
    }

    let jobs = data.results.map((rawJob: any) => this.normalizeJob(rawJob, searchContext))
    
    // Apply client-side remote filter if needed
    if (remote_only) {
      jobs = jobs.filter(job => this.isRemoteJob(job))
    }
    
    return jobs
  }

  normalizeJob(rawJob: any, searchContext: SearchContext): Job {
    // Generate canonical ID for deduplication
    const canonicalId = this.generateCanonicalId(rawJob)
    
    return {
      // Core identifiers
      id: `adzuna:${rawJob.id}`,
      external_id: rawJob.id.toString(),
      canonical_id: canonicalId,
      
      // Essential job data
      title: rawJob.title || '',
      company: rawJob.company?.display_name || '',
      location: rawJob.location?.display_name || searchContext.location,
      description: rawJob.description || '',
      
      // URLs
      job_url: rawJob.redirect_url || '',
      application_url: rawJob.redirect_url || '',
      
      // Salary (Adzuna provides CAD values)
      salary_min: rawJob.salary_min || undefined,
      salary_max: rawJob.salary_max || undefined,
      salary_currency: 'CAD',
      salary_period: 'yearly',
      
      // Dates
      posted_date: rawJob.created || undefined,
      expires_date: undefined, // Adzuna doesn't provide expiry
      
      // Classification (infer from job data)
      job_type: this.inferJobType(rawJob),
      remote_type: this.inferRemoteType(rawJob),
      seniority_level: this.inferSeniorityLevel(rawJob),
      
      // Provider metadata
      provider: this.name,
      provider_data: rawJob, // Store raw data for debugging
      
      // Our metadata
      first_seen_at: searchContext.fetched_at,
      last_seen_at: searchContext.fetched_at,
      search_terms_matched: [searchContext.search_term],
      
      // Quality scores (basic implementation)
      relevance_score: this.calculateRelevanceScore(rawJob, searchContext),
      quality_score: this.calculateQualityScore(rawJob)
    }
  }

  private generateCanonicalId(rawJob: any): string {
    // Create deduplication key from company + title + location
    const company = (rawJob.company?.display_name || '').toLowerCase().trim()
    const title = (rawJob.title || '').toLowerCase().trim()
    const location = (rawJob.location?.display_name || '').toLowerCase().trim()
    
    return Buffer.from(`${company}|${title}|${location}`).toString('base64')
  }

  private isRemoteJob(job: Job): boolean {
    const text = `${job.title} ${job.description} ${job.location}`.toLowerCase()
    return (
      text.includes('remote') ||
      text.includes('work from home') ||
      text.includes('telecommute') ||
      text.includes('distributed team')
    )
  }

  private inferJobType(rawJob: any): Job['job_type'] {
    const title = (rawJob.title || '').toLowerCase()
    const description = (rawJob.description || '').toLowerCase()
    
    if (title.includes('intern') || description.includes('internship')) return 'internship'
    if (title.includes('contract') || description.includes('contractor')) return 'contract'
    if (title.includes('part time') || description.includes('part-time')) return 'part-time'
    if (title.includes('temporary') || title.includes('temp')) return 'temporary'
    
    return 'full-time' // Default assumption
  }

  private inferRemoteType(rawJob: any): Job['remote_type'] {
    const text = `${rawJob.title} ${rawJob.description} ${rawJob.location?.display_name}`.toLowerCase()
    
    if (text.includes('remote') || text.includes('work from home')) return 'remote'
    if (text.includes('hybrid')) return 'hybrid'
    
    return 'onsite' // Default assumption
  }

  private inferSeniorityLevel(rawJob: any): Job['seniority_level'] {
    const title = (rawJob.title || '').toLowerCase()
    
    if (title.includes('senior') || title.includes('sr.')) return 'senior'
    if (title.includes('lead') || title.includes('principal')) return 'lead'
    if (title.includes('director') || title.includes('vp') || title.includes('chief')) return 'executive'
    if (title.includes('junior') || title.includes('jr.') || title.includes('entry')) return 'entry'
    
    return 'mid' // Default assumption
  }

  private calculateRelevanceScore(rawJob: any, searchContext: SearchContext): number {
    // Simple relevance scoring based on title match
    const title = (rawJob.title || '').toLowerCase()
    const searchTerm = searchContext.search_term.toLowerCase()
    
    if (title.includes(searchTerm)) return 1.0
    
    // Check for partial matches
    const searchWords = searchTerm.split(' ')
    const matchedWords = searchWords.filter(word => title.includes(word))
    
    return matchedWords.length / searchWords.length
  }

  private calculateQualityScore(rawJob: any): number {
    let score = 0.5 // Base score
    
    // Boost for complete salary information
    if (rawJob.salary_min && rawJob.salary_max) score += 0.2
    
    // Boost for company information
    if (rawJob.company?.display_name) score += 0.1
    
    // Boost for detailed description
    if (rawJob.description && rawJob.description.length > 100) score += 0.2
    
    return Math.min(score, 1.0)
  }
}