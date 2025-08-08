import React, { useMemo } from 'react'
import type { Job, PersistState } from '@/types/job'
import { text } from '@/utils/text'
import { timeAgo } from '@/utils/time'
export function SavedPage({ jobs, state }:{jobs: Job[], state: PersistState}){
  const saved = useMemo(()=> jobs.filter(j => state.items[j.id]?.status === 'saved'), [jobs, state])
  return (
    <main className='container mx-auto max-w-5xl space-y-4'>
      {saved.length===0 && <div className='card glass p-6 text-center meta'>No saved jobs yet.</div>}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {saved.map(j=>(
          <div key={j.id} className='card glass p-4'>
            <div className='mb-1 font-medium'>{text(j.title)}</div>
            <div className='meta'>{text(j.company)} • {text(j.location)} • {timeAgo(j.created)}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
