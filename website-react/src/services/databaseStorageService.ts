import type { PersistState, ColumnKey, Persist } from '@/types/job'
import { userJobTracking, auth } from './supabaseService'

// Modern database-only storage (like LinkedIn, Indeed, etc.)
export class DatabaseStorageService {
  private userId: string | null = null

  async getCurrentUser(): Promise<string | null> {
    if (this.userId) return this.userId
    
    const { data: { user } } = await auth.getUser()
    this.userId = user?.id || null
    return this.userId
  }

  async loadState(): Promise<PersistState> {
    const userId = await this.getCurrentUser()
    
    if (!userId) {
      // Anonymous users get empty state
      return {
        items: {},
        boardOrder: { backlog: [], applied: [], interview: [], offer: [], rejected: [], saved: [] },
        version: 2
      }
    }

    try {
      console.log('Loading user data from database for:', userId)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
      
      const supabaseData = await Promise.race([
        userJobTracking.getAll(userId),
        timeoutPromise
      ]) as any[]
      
      // Convert database data to app format
      const items: Record<string, Persist> = {}
      const boardOrder: Record<ColumnKey, string[]> = {
        backlog: [], applied: [], interview: [], offer: [], rejected: [], saved: []
      }

      supabaseData.forEach(item => {
        items[item.job_id] = {
          status: item.status as any,
          notes: item.notes || undefined,
          tracked: item.tracked,
          appliedAt: item.applied_at || undefined,
          clickedAt: undefined // Can add this column later if needed
        }

        // Add to appropriate board column
        const column = item.status === 'saved' ? 'saved' : (item.status as ColumnKey)
        if (column && boardOrder[column]) {
          boardOrder[column].push(item.job_id)
        }
      })

      console.log(`Loaded ${Object.keys(items).length} tracked jobs from database`)
      return { items, boardOrder, version: 2 }
      
    } catch (error) {
      console.error('Failed to load from database:', error)
      // Return empty state on error
      return {
        items: {},
        boardOrder: { backlog: [], applied: [], interview: [], offer: [], rejected: [], saved: [] },
        version: 2
      }
    }
  }

  async saveItem(jobId: string, persist: Persist): Promise<void> {
    const userId = await this.getCurrentUser()
    if (!userId) {
      console.warn('Cannot save job data - user not authenticated')
      return
    }

    try {
      console.log('Saving job to database:', { jobId, persist })
      
      await userJobTracking.upsert(userId, jobId, {
        canonical_job_id: jobId,
        status: persist.status,
        notes: persist.notes,
        tracked: persist.tracked,
        applied_at: persist.appliedAt
      })
      
      console.log('Successfully saved to database')
    } catch (error: any) {
      console.error('Failed to save to database:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      // Handle specific error types
      if (error.code === '23505') {
        console.error('❌ Duplicate key constraint violation - this should not happen with proper upsert')
      } else if (error.code === '42P01') {
        console.error('❌ Table user_job_tracking does not exist - run schema.sql')
      }
      
      throw error // Let the UI handle the error
    }
  }

  async removeItem(jobId: string): Promise<void> {
    const userId = await this.getCurrentUser()
    if (!userId) {
      console.warn('Cannot remove job data - user not authenticated')
      return
    }

    try {
      console.log('Removing job from database:', jobId)
      await userJobTracking.remove(userId, jobId)
      console.log('Successfully removed from database')
    } catch (error) {
      console.error('Failed to remove from database:', error)
      throw error
    }
  }

  async updateItem(jobId: string, patch: Persist): Promise<void> {
    const userId = await this.getCurrentUser()
    if (!userId) {
      console.warn('Cannot update job data - user not authenticated')
      return
    }

    // If removing all data, delete the record
    if (patch.status === undefined && !patch.tracked && !patch.notes) {
      await this.removeItem(jobId)
      return
    }

    // Otherwise save/update the item
    await this.saveItem(jobId, patch)
  }

  async setStatus(jobId: string, status: ColumnKey | null): Promise<void> {
    if (status === null) {
      await this.removeItem(jobId)
    } else {
      const persist: Persist = { 
        status: status === 'backlog' ? 'saved' : (status as any),
        tracked: status !== 'saved' // Auto-track if moved to pipeline
      }
      await this.saveItem(jobId, persist)
    }
  }

  async setTracked(jobId: string, tracked: boolean): Promise<void> {
    if (!tracked) {
      await this.removeItem(jobId)
    } else {
      await this.saveItem(jobId, { tracked: true })
    }
  }

  // Clear user's auth cache when they sign out
  clearUserCache(): void {
    this.userId = null
  }
}

// Export singleton instance
export const databaseStorage = new DatabaseStorageService()

// Clear cache on sign out
auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    databaseStorage.clearUserCache()
  }
})