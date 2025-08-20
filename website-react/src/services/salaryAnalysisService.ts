import type { Job, SalaryAnalysis } from '@/types/job'

// Phase 1 Salary Intelligence Service with Smart Caching
export class SalaryAnalysisService {
  private readonly APP_ID = import.meta.env.VITE_ADZUNA_APP_ID
  private readonly APP_KEY = import.meta.env.VITE_ADZUNA_APP_KEY
  private readonly BASE_URL = 'https://api.adzuna.com/v1/api/jobs/ca'
  
  // Smart caching to minimize API calls
  private cache = new Map<string, { data: any[], timestamp: number }>()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly MAX_DAILY_CALLS = 50 // Conservative limit for free tier
  private dailyCallCount = 0
  private lastResetDate = new Date().toDateString()

  constructor() {
    if (!this.APP_ID || !this.APP_KEY) {
      console.warn('Adzuna API credentials not configured - salary analysis disabled')
    }
    
    // Load cached call count from localStorage
    this.loadCallCount()
  }

  private loadCallCount() {
    try {
      const stored = localStorage.getItem('adzuna_daily_calls')
      if (stored) {
        const { count, date } = JSON.parse(stored)
        if (date === new Date().toDateString()) {
          this.dailyCallCount = count
        } else {
          // New day, reset counter
          this.dailyCallCount = 0
          this.lastResetDate = new Date().toDateString()
        }
      }
    } catch (error) {
      console.warn('Failed to load API call count:', error)
    }
  }

  private saveCallCount() {
    try {
      localStorage.setItem('adzuna_daily_calls', JSON.stringify({
        count: this.dailyCallCount,
        date: this.lastResetDate
      }))
    } catch (error) {
      console.warn('Failed to save API call count:', error)
    }
  }

  private incrementCallCount() {
    this.dailyCallCount++
    this.saveCallCount()
    console.log(`📊 Adzuna API calls today: ${this.dailyCallCount}/${this.MAX_DAILY_CALLS}`)
  }

  private getCacheKey(title: string, location: string): string {
    // Normalize cache key to group similar searches
    const normalizedTitle = title.toLowerCase()
      .replace(/\b(senior|sr|junior|jr)\b/gi, '') // Remove seniority levels
      .replace(/\b(developer|engineer|programmer)\b/gi, 'dev') // Normalize role terms
      .trim()
    const normalizedLocation = location.toLowerCase().replace(/\b(canada|ca)\b/gi, '').trim()
    return `${normalizedTitle}|${normalizedLocation}`
  }

  // Analyze salary for a job with market context
  async analyzeSalary(job: Job, similarJobs: Job[] = []): Promise<SalaryAnalysis | null> {
    try {
      if (!this.APP_ID || !this.APP_KEY) return null

      // Check daily API limit
      if (this.dailyCallCount >= this.MAX_DAILY_CALLS) {
        console.warn(`🚫 Daily API limit reached (${this.MAX_DAILY_CALLS}). Skipping salary analysis.`)
        return null
      }

      // Get market data for similar positions (with caching)
      const marketData = await this.getMarketSalaryData(job.title, job.location)
      
      if (!marketData || marketData.length === 0) {
        return null // No market data available
      }
      
      // Calculate analysis based on job's salary vs market
      const analysis = this.calculateSalaryAnalysis(job, marketData, similarJobs)
      
      return analysis
    } catch (error) {
      console.warn('Failed to analyze salary:', error)
      return null
    }
  }

  // Get salary statistics from Adzuna for similar roles (with smart caching)
  private async getMarketSalaryData(title: string, location: string): Promise<any[]> {
    const cacheKey = this.getCacheKey(title, location)
    const now = Date.now()
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`📋 Using cached market data for "${cacheKey}" (${Math.round((now - cached.timestamp) / (60 * 60 * 1000))}h old)`)
      return cached.data
    }
    
    // Check API limit before making call
    if (this.dailyCallCount >= this.MAX_DAILY_CALLS) {
      console.warn(`🚫 API limit reached. Using fallback analysis for "${cacheKey}"`)
      return cached?.data || [] // Return old cache or empty array
    }

    try {
      console.log(`🔍 Fetching fresh market data for "${cacheKey}" (API call ${this.dailyCallCount + 1}/${this.MAX_DAILY_CALLS})`)
      
      const searchUrl = `${this.BASE_URL}/search/1`
      const params = new URLSearchParams({
        app_id: this.APP_ID,
        app_key: this.APP_KEY,
        what: title,
        where: location,
        results_per_page: '30', // Reduced from 50 to save quota
        sort_by: 'salary'
      })

      const response = await fetch(`${searchUrl}?${params}`)
      if (!response.ok) {
        throw new Error(`Market data fetch failed: ${response.status}`)
      }
      
      const data = await response.json()
      const results = data.results || []
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: results,
        timestamp: now
      })
      
      // Increment API call counter
      this.incrementCallCount()
      
      console.log(`✅ Cached ${results.length} market jobs for "${cacheKey}"`)
      return results
      
    } catch (error) {
      console.warn(`Failed to fetch market data for "${cacheKey}":`, error)
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log(`📋 Using expired cache for "${cacheKey}" due to API error`)
        return cached.data
      }
      
      return []
    }
  }

  // Calculate comprehensive salary analysis
  private calculateSalaryAnalysis(job: Job, marketJobs: any[], similarJobs: Job[]): SalaryAnalysis {
    const jobSalary = this.getJobSalaryMidpoint(job)
    
    // Extract salary data from market jobs
    const marketSalaries = marketJobs
      .map(j => this.getJobSalaryMidpoint(j))
      .filter(s => s > 0)
    
    if (marketSalaries.length === 0) {
      return { confidence: 0.1 }
    }

    // Calculate market statistics
    const averageSalary = marketSalaries.reduce((a, b) => a + b, 0) / marketSalaries.length
    const sortedSalaries = marketSalaries.sort((a, b) => a - b)
    const salaryRange = {
      min: sortedSalaries[Math.floor(sortedSalaries.length * 0.25)], // 25th percentile
      max: sortedSalaries[Math.floor(sortedSalaries.length * 0.75)]  // 75th percentile
    }

    // Determine market position
    const marketPosition = this.getMarketPosition(jobSalary, averageSalary)
    
    // Determine demand level based on job count
    const demandLevel = this.getDemandLevel(marketJobs.length)
    
    // Calculate trend (simplified for Phase 1)
    const trendDirection = this.getTrendDirection(marketJobs)
    
    // Confidence based on data quality
    const confidence = Math.min(0.9, marketSalaries.length / 20)

    return {
      averageSalary: Math.round(averageSalary),
      salaryRange,
      marketPosition,
      demandLevel,
      trendDirection,
      confidence
    }
  }

  // Get midpoint salary for comparison
  private getJobSalaryMidpoint(job: any): number {
    // Handle both our Job type and Adzuna API response format
    const min = job.salary_min || job.salaryMin
    const max = job.salary_max || job.salaryMax
    
    if (min && max) return (min + max) / 2
    if (max) return max * 0.9 // Assume max is slightly higher than typical
    if (min) return min * 1.1 // Assume min is slightly lower than typical
    return 0
  }

  // Determine where job salary sits in market
  private getMarketPosition(jobSalary: number, marketAverage: number): SalaryAnalysis['marketPosition'] {
    if (jobSalary === 0) return undefined
    
    const ratio = jobSalary / marketAverage
    if (ratio >= 1.3) return 'excellent'
    if (ratio >= 1.1) return 'above'
    if (ratio >= 0.9) return 'average'
    return 'below'
  }

  // Determine demand level based on job count
  private getDemandLevel(jobCount: number): SalaryAnalysis['demandLevel'] {
    if (jobCount >= 100) return 'very-high'
    if (jobCount >= 50) return 'high'
    if (jobCount >= 20) return 'medium'
    return 'low'
  }

  // Simple trend analysis (Phase 1 - basic implementation)
  private getTrendDirection(jobs: any[]): SalaryAnalysis['trendDirection'] {
    // For Phase 1, use posting recency as a proxy for trend
    const recentJobs = jobs.filter(job => {
      const created = new Date(job.created)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return created > weekAgo
    })

    const trendRatio = recentJobs.length / Math.max(jobs.length, 1)
    
    if (trendRatio >= 0.7) return 'hot'
    if (trendRatio >= 0.4) return 'growing'
    if (trendRatio >= 0.2) return 'stable'
    return 'declining'
  }

  // Helper to format salary ranges for display
  formatSalaryRange(range: { min: number; max: number } | undefined): string {
    if (!range) return 'Not available'
    return `$${range.min.toLocaleString()} - $${range.max.toLocaleString()}`
  }

  // Helper to format market position for display
  getMarketPositionText(position: SalaryAnalysis['marketPosition']): string {
    switch (position) {
      case 'excellent': return 'Excellent pay (30%+ above market)'
      case 'above': return 'Above market average (+10%)'
      case 'average': return 'Market average'
      case 'below': return 'Below market average'
      default: return 'Unable to compare'
    }
  }

  // Helper to get demand level text
  getDemandLevelText(level: SalaryAnalysis['demandLevel']): string {
    switch (level) {
      case 'very-high': return 'Very high demand (100+ similar jobs)'
      case 'high': return 'High demand (50+ similar jobs)'
      case 'medium': return 'Medium demand (20+ similar jobs)'
      case 'low': return 'Lower demand (<20 similar jobs)'
      default: return 'Demand unknown'
    }
  }

  // Helper to get trend text
  getTrendText(trend: SalaryAnalysis['trendDirection']): string {
    switch (trend) {
      case 'hot': return '🔥 Hot trend - many recent postings'
      case 'growing': return '📈 Growing field'
      case 'stable': return '📊 Stable market'
      case 'declining': return '📉 Fewer recent postings'
      default: return 'Trend unknown'
    }
  }
}

// Export singleton instance
export const salaryAnalysisService = new SalaryAnalysisService()