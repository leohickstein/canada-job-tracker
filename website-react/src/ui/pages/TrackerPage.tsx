import React, { useState } from 'react'
import type { Job, PersistState, ColumnKey } from '@/types/job'
import { TrackerBoard } from '@/ui/components/TrackerBoard'
import { Search, Target, EyeOff } from 'lucide-react'

export function TrackerPage({ jobs, state, onMove, onReorder }:{ jobs: Job[], state: PersistState, onMove: (id:string, col:ColumnKey|null)=>void, onReorder:(col:ColumnKey, items:string[])=>void }){
  const [q,setQ] = useState('')
  const [hideDone, setHideDone] = useState(true)
  
  return (
    <main className='container mx-auto max-w-7xl space-y-6 py-6'>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
            <Target className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Job Tracker
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">Track your application progress with our Kanban board</p>
      </div>

      {/* Controls */}
      <div className='relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg'>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-transparent to-pink-50/30 dark:from-purple-950/20 dark:via-transparent dark:to-pink-950/20 pointer-events-none" />
        
        <div className='relative p-5 flex flex-wrap items-center gap-4'>
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                className='w-full pl-10 pr-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all' 
                placeholder='Search tracked jobs (title, company)' 
                value={q} 
                onChange={e=>setQ(e.target.value)} 
              />
            </div>
          </div>
          
          {/* Hide completed toggle */}
          <label className='flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all'>
            <input 
              type='checkbox' 
              checked={hideDone} 
              onChange={e=>setHideDone(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-rose-300 text-rose-600 focus:ring-rose-500 focus:ring-2"
            />
            <EyeOff className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Hide completed</span>
          </label>
        </div>
      </div>

      {/* Board */}
      <TrackerBoard jobs={jobs} state={state} onMove={onMove} onReorder={onReorder} q={q} hideDone={hideDone} />
    </main>
  )
}