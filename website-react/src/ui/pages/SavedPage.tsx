import React, { useMemo } from 'react'
import type { Job, PersistState } from '@/types/job'
import { text } from '@/utils/text'
import { timeAgo } from '@/utils/time'
import { Bookmark, Building2, MapPin, Clock, Sparkles } from 'lucide-react'

export function SavedPage({ jobs, state }:{jobs: Job[], state: PersistState}){
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
        {saved.map((j, index) => (
          <div key={j.id} className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            {/* Gradient overlay */}
            <div className={`absolute inset-0 pointer-events-none ${
              index % 3 === 0 ? 'bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20' :
              index % 3 === 1 ? 'bg-gradient-to-br from-emerald-50/50 via-transparent to-teal-50/30 dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/20' :
              'bg-gradient-to-br from-rose-50/50 via-transparent to-pink-50/30 dark:from-rose-950/20 dark:via-transparent dark:to-pink-950/20'
            }`} />
            
            <div className="relative p-5">
              {/* Status badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-2 border-white/60 dark:border-slate-700/60 shadow-sm">
                  <Bookmark className="h-3 w-3" fill="currentColor" />
                  Saved
                </span>
              </div>

              {/* Title */}
              <h3 className='mb-3 font-semibold text-slate-900 dark:text-white leading-snug'>
                {text(j.title)}
              </h3>

              {/* Meta info */}
              <div className='space-y-2 text-sm'>
                {text(j.company) && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="font-medium">{text(j.company)}</span>
                  </div>
                )}
                {text(j.location) && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4 text-rose-500 flex-shrink-0" />
                    <span>{text(j.location)}</span>
                  </div>
                )}
                {j.created && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                    <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span>{timeAgo(j.created)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}