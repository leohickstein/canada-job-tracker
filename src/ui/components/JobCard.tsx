import React, { useState } from 'react'
import { MapPin, Building2, Clock, DollarSign, ExternalLink, Bookmark, Pin } from 'lucide-react'
import type { Job, Persist } from '@/types/job'
import { text, regionOf, roleOf } from '@/utils/text'
import { fmtDate, isNew, timeAgo } from '@/utils/time'
import { StatusBadge } from './StatusBadge'

export function JobCard({ job, persist, onOpen, onSave, onTrack }:{ 
  job: Job, 
  persist?: Persist, 
  onOpen?: ()=>void, 
  onSave?: ()=>void, 
  onTrack?:(v:boolean)=>void,
}){
  const isSaved = persist?.status === 'saved'
  const isTracked = !!persist?.tracked
  const [expanded, setExpanded] = useState(false)

  const chipsRaw = [regionOf(job), roleOf(job)].filter(Boolean) as string[]
  const chips = chipsRaw.slice(0,2)
  const extraChipCount = chipsRaw.length - chips.length

  return (
    <div className="card glass p-4 flex flex-col">
      {/* Header */}
      <div className="mb-2 flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isNew(job.first_seen_at) && <span className="badge badge-new">NEW</span>}
            {persist?.status && <StatusBadge status={persist.status}/>}
          </div>
          <h3 className="mt-1 line-clamp-2 text-[20px] font-semibold leading-snug">
            {text(job.title)}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onTrack && (
            <button
              className={"icon-btn " + (isTracked ? "icon-btn-active" : "")}
              onClick={()=>onTrack(!isTracked)}
              aria-pressed={isTracked}
              title={isTracked ? "Tracked" : "Track"}
            >
              <Pin className="h-5 w-5" strokeWidth={2} fill={isTracked ? "currentColor" : "none"} />
            </button>
          )}
          {onSave && (
            <button
              className={"icon-btn " + (isSaved ? "icon-btn-active" : "")}
              onClick={onSave}
              aria-pressed={isSaved}
              title={isSaved ? "Saved" : "Save"}
            >
              <Bookmark className="h-5 w-5" strokeWidth={2} fill={isSaved ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-600 dark:text-slate-400">
        {text(job.company) && <span className="flex items-center gap-1"><Building2 className="h-4 w-4"/>{text(job.company)}</span>}
        {text(job.location) && <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/>{text(job.location)}</span>}
        {text(job.created) && <span className="flex items-center gap-1"><Clock className="h-4 w-4"/>{fmtDate(job.created)} · {timeAgo(job.created)}</span>}
        {(job.salaryMin||job.salaryMax) && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4"/>{Number(job.salaryMin)||"?"}-{Number(job.salaryMax)||"?"} /h</span>}
      </div>

      {/* Chips */}
      {(chips.length>0 || extraChipCount>0) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map(tag => <span key={tag} className="badge">{tag}</span>)}
          {extraChipCount>0 && <span className="badge">+{extraChipCount}</span>}
        </div>
      )}

      {/* Description with inline fade + '… more' */}
      {text(job.rawSnippet) && (
        <div className="mt-2">
          <div className={"desc-wrap relative " + (expanded ? "unclamp" : "clamp-3")}>
            <div className="desc text-[16px] text-slate-800 dark:text-slate-200">{text(job.rawSnippet)}</div>
            {!expanded && <div className="fade pointer-events-none" />}
            {!expanded && <button className="more-pill" onClick={()=>setExpanded(true)}>… more</button>}
          </div>
          {expanded && (
            <div className="mt-1 text-right">
              <button className="btn btn-ghost btn-s" onClick={()=>setExpanded(false)}>Show less</button>
            </div>
          )}
        </div>
      )}

      {/* Actions: only Open posting; bottom-aligned */}
      <div className="mt-auto pt-3">
        {text(job.url) && (
          <a href={text(job.url)} target="_blank" rel="noreferrer" className="btn btn-primary btn-s w-full sm:w-auto" onClick={onOpen}>
            <ExternalLink className="mr-2 h-4 w-4"/>Open posting
          </a>
        )}
      </div>
    </div>
  )
}
