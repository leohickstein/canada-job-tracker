import React, { useState } from 'react'
import type { Job, PersistState, ColumnKey } from '@/types/job'
import { TrackerBoard } from '@/ui/components/TrackerBoard'

export function TrackerPage({ jobs, state, onMove, onReorder }:{ jobs: Job[], state: PersistState, onMove: (id:string, col:ColumnKey|null)=>void, onReorder:(col:ColumnKey, items:string[])=>void }){
  const [q,setQ] = useState('')
  const [hideDone, setHideDone] = useState(true)
  return (
    <main className='container mx-auto max-w-7xl space-y-3 py-4'>
      <div className='card glass p-3 flex flex-wrap items-center gap-3'>
        <input className='input max-w-sm' placeholder='Search tracked jobs (title, company)' value={q} onChange={e=>setQ(e.target.value)} />
        <label className='flex items-center gap-2 text-sm'>
          <input type='checkbox' checked={hideDone} onChange={e=>setHideDone(e.target.checked)} />
          Hide offer/rejected
        </label>
      </div>
      <TrackerBoard jobs={jobs} state={state} onMove={onMove} onReorder={onReorder} q={q} hideDone={hideDone} />
    </main>
  )
}
