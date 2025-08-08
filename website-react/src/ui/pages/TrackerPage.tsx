import React from 'react'
import type { Job, PersistState, ColumnKey } from '@/types/job'
import { TrackerBoard } from '@/ui/components/TrackerBoard'
export function TrackerPage({ jobs, state, onMove, onReorder }:{ jobs: Job[], state: PersistState, onMove: (id:string, col:ColumnKey|null)=>void, onReorder:(col:ColumnKey, items:string[])=>void }){
  return (
    <main className='container mx-auto max-w-7xl py-4'>
      <TrackerBoard jobs={jobs} state={state} onMove={onMove} onReorder={onReorder} />
    </main>
  )
}
