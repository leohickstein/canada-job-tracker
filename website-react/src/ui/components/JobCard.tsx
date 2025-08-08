import React, { useState } from 'react'
import { MapPin, Building2, Clock, DollarSign, ExternalLink, Bookmark, Pin } from 'lucide-react'
import type { Job, Persist } from '@/types/job'
import { text, regionOf, roleOf } from '@/utils/text'
import { fmtDate, isNew, timeAgo } from '@/utils/time'
import { StatusBadge } from './StatusBadge'

// Helper function to format time more descriptively
const formatTimeAgo = (dateString: string) => {
  const time = timeAgo(dateString)
  if (time.includes('1d')) return 'Yesterday'
  if (time.includes('2d')) return '2 days ago'
  if (time.includes('3d')) return '3 days ago'
  if (time.includes('h')) return 'Today'
  return time
}

// Helper function to format salary
const formatSalary = (min: string | number | undefined, max: string | number | undefined) => {
  const minNum = Number(min)
  const maxNum = Number(max)
  
  if (minNum && maxNum) {
    return `${minNum.toLocaleString()} - ${maxNum.toLocaleString()}`
  } else if (maxNum) {
    return `Up to ${maxNum.toLocaleString()}`
  } else if (minNum) {
    return `From ${minNum.toLocaleString()}`
  }
  return 'Not specified'
}

export function JobCard({ job, persist, onOpen, onApply, onSave, onNotes, onTrack }:{ 
  job: Job, 
  persist?: Persist, 
  onOpen?: ()=>void, 
  onApply?: ()=>void, 
  onSave?: ()=>void, 
  onNotes?:(t:string)=>void,
  onTrack?:(v:boolean)=>void,
}){
  const isSaved = persist?.status === 'saved'
  const isTracked = !!persist?.tracked
  const hasStatus = persist?.status && persist.status !== 'saved'
  const [expanded, setExpanded] = useState(false)
  const [showNotes, setShowNotes] = useState(!!persist?.notes)
  const [titleExpanded, setTitleExpanded] = useState(false)

  const chips = [regionOf(job), roleOf(job)].filter(Boolean).slice(0,2) as string[]
  const extraChipCount = [regionOf(job), roleOf(job)].filter(Boolean).length - chips.length
  
  // Determine card styling based on status
  const getCardStyling = () => {
    if (hasStatus) {
      switch(persist?.status) {
        case 'applied': return 'ring-2 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20'
        case 'interview': return 'ring-2 ring-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20'
        case 'offer': return 'ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
        case 'rejected': return 'ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/20'
      }
    }
    return 'bg-white/80 dark:bg-slate-900/80'
  }

  // Check for content length to show more buttons
  const description = text(job.rawSnippet)
  const shouldShowMoreDesc = description && description.length > 200  // Reduced threshold
  const jobTitle = text(job.title)
  const shouldShowMoreTitle = jobTitle && jobTitle.length > 60

  console.log('Description length:', description?.length, 'Should show more:', shouldShowMoreDesc) // Debug log

  return (
    <div className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 dark:hover:bg-slate-900/90 ${getCardStyling()}`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 pointer-events-none" />
      
      <div className="relative p-5 flex flex-col h-full min-h-[320px]">
        {/* Header with consistent badge area */}
        <div className="mb-4">
          {/* Badge row - Always reserve space */}
          <div className="flex items-center gap-2 mb-3 min-h-[24px]">
            <div className="flex items-center gap-2">
              {isNew(job.first_seen_at) && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm animate-pulse">
                  ✨ NEW
                </span>
              )}
              {hasStatus && persist?.status && <StatusBadge status={persist.status}/>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {onTrack && (
                <button
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isTracked 
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md scale-110" 
                      : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:scale-105"
                  }`}
                  onClick={()=>onTrack(!isTracked)}
                  aria-pressed={isTracked}
                  title={isTracked ? "Tracked" : "Track"}
                >
                  <Pin className="h-4 w-4" strokeWidth={2.5} fill={isTracked ? "currentColor" : "none"} />
                </button>
              )}
              {onSave && (
                <button
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isSaved 
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md scale-110" 
                      : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-105"
                  }`}
                  onClick={onSave}
                  aria-pressed={isSaved}
                  title={isSaved ? "Saved" : "Save"}
                >
                  <Bookmark className="h-4 w-4" strokeWidth={2.5} fill={isSaved ? "currentColor" : "none"} />
                </button>
              )}
            </div>
          </div>
          
          {/* Enhanced Title with expand option */}
          <div className="relative">
            <h3 className={`text-lg font-semibold leading-snug text-slate-900 dark:text-white ${
              titleExpanded ? "" : "line-clamp-2 min-h-[3.5rem]"
            }`}>
              {jobTitle}
            </h3>
            {!titleExpanded && shouldShowMoreTitle && (
              <button 
                className="absolute bottom-0 right-0 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                onClick={()=>setTitleExpanded(true)}
              >
                …
              </button>
            )}
            {titleExpanded && shouldShowMoreTitle && (
              <div className="mt-1 text-right">
                <button 
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" 
                  onClick={()=>setTitleExpanded(false)}
                >
                  Show less
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced meta info with better structure and consistent alignment */}
        <div className="mb-4 space-y-3">
          {/* Company and Location - First row */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {text(job.company) && (
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0"/>
                <span className="font-semibold">{text(job.company)}</span>
              </span>
            )}
            {text(job.location) && (
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <MapPin className="h-4 w-4 text-rose-500 flex-shrink-0"/>
                {text(job.location)}
              </span>
            )}
          </div>
          
          {/* Time and Salary - Second row with consistent alignment */}
          <div className="flex items-center justify-between">
            {/* Time - Always on the left */}
            {text(job.created) && (
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0"/>
                {formatTimeAgo(job.created)}
              </span>
            )}
            
            {/* Salary - Always on the right when present */}
            {(job.salaryMin || job.salaryMax) && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-700/30">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0"/>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300 text-xs">
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Colorful chips */}
        <div className="mb-4 min-h-[2rem] flex items-start">
          {(chips.length>0 || extraChipCount>0) && (
            <div className="flex flex-wrap gap-2">
              {chips.map((tag, index) => (
                <span key={tag} className={`
                  px-3 py-1 rounded-full text-xs font-medium shadow-sm
                  ${index === 0 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                    : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                  }
                `}>
                  {tag}
                </span>
              ))}
              {extraChipCount>0 && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-sm">
                  +{extraChipCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Enhanced description with hover-to-expand functionality */}
        <div className="flex-1 mb-4">
          {description && (
            <div className="group/description relative">
              <div className={`text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${
                expanded ? "" : "line-clamp-5"
              }`}>
                {description}
              </div>
              
              {/* Hover overlay that appears when description is truncated */}
              {!expanded && (description.length > 100) && (
                <div className="absolute inset-0 opacity-0 group-hover/description:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/description:pointer-events-auto">
                  {/* Gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/95 dark:from-slate-900/95 to-transparent" />
                  
                  {/* Expand button */}
                  <div className="absolute bottom-1 right-1">
                    <button 
                      className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm border border-blue-200/50 dark:border-blue-700/50"
                      onClick={()=>setExpanded(true)}
                    >
                      Expand
                    </button>
                  </div>
                </div>
              )}
              
              {expanded && (
                <div className="mt-2 text-right">
                  <button 
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" 
                    onClick={()=>setExpanded(false)}
                  >
                    Show less
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes section */}
        {onNotes && showNotes && (
          <div className="mb-4">
            <textarea
              className="w-full p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 resize-none text-sm placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
              rows={3}
              placeholder="Add your notes..."
              defaultValue={persist?.notes || ''}
              onBlur={(e)=>onNotes?.(e.target.value)}
              onFocus={()=>{ if (onTrack && !isTracked) onTrack(true) }}
            />
          </div>
        )}

        {/* Enhanced bottom actions with better hierarchy */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex gap-2">
            {text(job.url) && (
              <a 
                href={text(job.url)} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={onOpen}
              >
                <ExternalLink className="mr-2 h-4 w-4"/>
                Open posting
              </a>
            )}
          </div>
          
          {!showNotes && onNotes && (
            <button 
              className="px-3 py-2 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-sm transition-all duration-200"
              onClick={()=>setShowNotes(true)}
            >
              Add notes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}