import React from 'react'
import { Search, MapPin, Briefcase, Filter, Clock, EyeOff, ArrowUpDown } from 'lucide-react'

export function FiltersPanel({q,setQ,region,setRegion,role,setRole,onlyNew,setOnlyNew,hideApplied,setHideApplied,sort,setSort,regions,roles}:{ 
  q:string,setQ:(s:string)=>void,region:string,setRegion:(s:string)=>void,role:string,setRole:(s:string)=>void,
  onlyNew:boolean,setOnlyNew:(b:boolean)=>void,hideApplied:boolean,setHideApplied:(b:boolean)=>void,sort:string,setSort:(s:string)=>void,
  regions:string[],roles:string[]
}){
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-cyan-50/30 dark:from-violet-950/20 dark:via-transparent dark:to-cyan-950/20 pointer-events-none" />
      
      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
          <Filter className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Filters</h3>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Search className="h-4 w-4 text-blue-500" />
            Search
          </label>
          <input 
            className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
            placeholder="title, company, city" 
            value={q} 
            onChange={e=>setQ(e.target.value)}
          />
        </div>

        {/* Region */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <MapPin className="h-4 w-4 text-rose-500" />
            Region
          </label>
          <select 
            className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all"
            value={region} 
            onChange={e=>setRegion(e.target.value)}
          >
            <option value="">All regions</option>
            {regions.map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Briefcase className="h-4 w-4 text-purple-500" />
            Role
          </label>
          <select 
            className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all"
            value={role} 
            onChange={e=>setRole(e.target.value)}
          >
            <option value="">All roles</option>
            {roles.map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all">
            <input 
              type="checkbox" 
              checked={onlyNew} 
              onChange={e=>setOnlyNew(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-emerald-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
            />
            <Clock className="h-4 w-4 text-emerald-500" />
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Only new</span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium">
                ≤ 36h
              </span>
            </div>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all">
            <input 
              type="checkbox" 
              checked={hideApplied} 
              onChange={e=>setHideApplied(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-amber-300 text-amber-600 focus:ring-amber-500 focus:ring-2"
            />
            <EyeOff className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Hide applied/interview/offer</span>
          </label>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <ArrowUpDown className="h-4 w-4 text-indigo-500" />
            Sort by
          </label>
          <select 
            className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
            value={sort} 
            onChange={e=>setSort(e.target.value)}
          >
            <option value="newest">🕐 Newest first</option>
            <option value="oldest">🕑 Oldest first</option>
            <option value="salary">💰 Highest salary</option>
            <option value="title">🔤 Title (A–Z)</option>
          </select>
        </div>
      </div>
    </div>
  )
}