import React from 'react'
import { Filter, TrendingUp } from 'lucide-react'

type ResultsBarProps = {
  count: number
  sort: string
  setSort: (v: string) => void
  onlyNew: boolean
  setOnlyNew: (v: boolean) => void
  hideApplied: boolean
  setHideApplied: (v: boolean) => void
  onExport?: () => void
}

export function ResultsBar({ count, sort, setSort, onlyNew, setOnlyNew, hideApplied, setHideApplied, onExport }: ResultsBarProps){
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 pointer-events-none" />
      
      <div className="relative flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-slate-800 dark:text-white">
              {count.toLocaleString()}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">results</span>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input 
                type="checkbox" 
                checked={onlyNew} 
                onChange={e=>setOnlyNew(e.currentTarget.checked)}
                className="w-4 h-4 rounded border-2 border-emerald-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
              />
              <span className="text-slate-700 dark:text-slate-300">Only new</span>
              <span className="px-2 py-1 rounded-full text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium">
                ≤ 36h
              </span>
            </label>
            
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input 
                type="checkbox" 
                checked={hideApplied} 
                onChange={e=>setHideApplied(e.currentTarget.checked)}
                className="w-4 h-4 rounded border-2 border-amber-300 text-amber-600 focus:ring-amber-500 focus:ring-2"
              />
              <span className="text-slate-700 dark:text-slate-300">Hide applied/interview/offer</span>
            </label>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={sort} 
            onChange={e=>setSort(e.currentTarget.value)}
            className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
          >
            <option value="newest">🕐 Newest</option>
            <option value="oldest">🕑 Oldest</option>
            <option value="salary">💰 Highest pay</option>
            <option value="title">🔤 Title (A–Z)</option>
          </select>
          
          {onExport && (
            <button 
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={onExport}
            >
              Export
            </button>
          )}
        </div>
      </div>
    </div>
  )
}