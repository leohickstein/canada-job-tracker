import React, { useMemo } from 'react'
import type { Job, PersistState } from '@/types/job'
import { Bookmark, Sparkles } from 'lucide-react'
import { JobCard } from '@/ui/components/JobCard'

export function SavedPage({ jobs, state, setState }:{jobs: Job[], state: PersistState, setState?: (id: string, patch: any) => void}){
  const saved = useMemo(()=> jobs.filter(j => state.items[j.id]?.status === 'saved'), [jobs, state])
  
  return (
    <main className='container mx-auto max-w-6xl space-y-6 py-6'>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg">
            <Bookmark className="h-6 w-6 text-white" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Saved Jobs
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">Jobs you've bookmarked for later review</p>
      </div>

      {saved.length === 0 && (
        <div className='relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg p-12'>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-orange-50/30 dark:from-amber-950/20 dark:via-transparent dark:to-orange-950/20 pointer-events-none" />
          <div className="relative text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                <Sparkles className="h-8 w-8 text-amber-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No saved jobs yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Start exploring jobs and bookmark the ones that catch your interest. They'll appear here for easy access.
            </p>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
        {saved.map((job) => (
          <JobCard 
            key={job.id}
            job={job}
            persist={state.items[job.id]}
            onSave={() => setState?.(job.id, { status: undefined })}
            onNotes={(notes) => setState?.(job.id, { notes })}
            onTrack={(tracked) => setState?.(job.id, { tracked })}
          />
        ))}
      </div>
    </main>
  )
}