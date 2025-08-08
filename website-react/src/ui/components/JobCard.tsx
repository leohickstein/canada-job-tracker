import React from 'react'
import { MapPin, Building2, Clock, DollarSign, ExternalLink, Star } from 'lucide-react'
import type { Job, Persist } from '@/types/job'
import { text, regionOf, roleOf } from '@/utils/text'
import { fmtDate, isNew, timeAgo } from '@/utils/time'
import { StatusBadge } from './StatusBadge'
export function JobCard({ job, persist, onOpen, onApply, onSave, onNotes }:{ job: Job, persist?: Persist, onOpen?: ()=>void, onApply?: ()=>void, onSave?: ()=>void, onNotes?:(t:string)=>void }){
  const isSaved = persist?.status === 'saved'
  return (
    <div className='card glass p-4'>
      <div className='mb-2 flex flex-wrap items-center gap-2'>
        <h3 className='text-lg font-semibold'>{text(job.title)}</h3>
        {isNew(job.first_seen_at) && <span className='badge badge-new'>NEW</span>}
        {persist?.status && <StatusBadge status={persist.status}/>}
        {onSave && (
          <button className={'icon-btn ml-auto '+(isSaved?'icon-btn-active':'')} onClick={onSave} aria-pressed={isSaved} title={isSaved ? 'Saved' : 'Save'}>
            <Star className='h-5 w-5' strokeWidth={2} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className='mb-2 flex flex-wrap items-center gap-4 meta'>
        {text(job.company) && <span className='flex items-center gap-1'><Building2 className='h-4 w-4'/>{text(job.company)}</span>}
        {text(job.location) && <span className='flex items-center gap-1'><MapPin className='h-4 w-4'/>{text(job.location)}</span>}
        {(job.salaryMin||job.salaryMax) && <span className='flex items-center gap-1'><DollarSign className='h-4 w-4'/>{Number(job.salaryMin)||'?'}-{Number(job.salaryMax)||'?'}</span>}
        {text(job.created) && <span className='flex items-center gap-1'><Clock className='h-4 w-4'/>{fmtDate(job.created)} • {timeAgo(job.created)}</span>}
        {regionOf(job) && <span className='badge'>{regionOf(job)}</span>}
        {roleOf(job) && <span className='badge'>{roleOf(job)}</span>}
      </div>
      <p className='text-sm'>{text(job.rawSnippet)}</p>
      <div className='mt-3 flex flex-wrap gap-2'>
        {text(job.url) && <a href={text(job.url)} target='_blank' rel='noreferrer' className='btn btn-primary' onClick={onOpen}><ExternalLink className='mr-2 h-4 w-4'/>Open posting</a>}
        {onApply && <button className='btn' onClick={onApply}>Mark applied</button>}
        {onNotes && <textarea className='area flex-1' placeholder='Notes (recruiter, follow-up, etc.)' onChange={e=>onNotes(e.target.value)}/>}
      </div>
    </div>
  )
}
