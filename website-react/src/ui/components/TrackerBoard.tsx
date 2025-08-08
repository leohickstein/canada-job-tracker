import React, { useMemo } from 'react'
import type { ColumnKey, Job, PersistState } from '@/types/job'
import { text } from '@/utils/text'
import { timeAgo } from '@/utils/time'
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
const COLS: Array<{ key: ColumnKey, title: string }> = [
  { key: 'backlog', title: 'Interesting' },
  { key: 'applied', title: 'Applied' },
  { key: 'interview', title: 'Interviews' },
  { key: 'offer', title: 'Offers' },
  { key: 'rejected', title: 'Rejected' },
]
type Props = { jobs: Job[]; state: PersistState; onMove: (jobId: string, dest: ColumnKey|null) => void; onReorder: (column: ColumnKey, items: string[]) => void }
export function TrackerBoard({ jobs, state, onMove, onReorder }: Props){
  const lists = useMemo(() => {
    const byId = new Map(jobs.map(j => [j.id, j]))
    const result: Record<ColumnKey, string[]> = { backlog: [], applied: [], interview: [], offer: [], rejected: [] }
    for (const c of COLS) result[c.key] = [...(state.boardOrder[c.key] || [])].filter(id => byId.has(id))
    for (const j of jobs) {
      const st = state.items[j.id]?.status
      const col: ColumnKey = st ? (st as ColumnKey) : 'backlog'
      if (!result[col].includes(j.id)) result[col].push(j.id)
    }
    return result
  }, [jobs, state])
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor))
  const handleDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id)
    const overId = e.over?.id ? String(e.over.id) : null
    if (!overId) return
    if (overId.startsWith('col:')) { onMove(id, overId.slice(4) as ColumnKey); return }
    const col = (Object.keys(lists) as ColumnKey[]).find(k => (lists[k] || []).includes(overId))
    if (!col) return
    const current = lists[col] || []
    const oldIndex = current.indexOf(id)
    const newIndex = current.indexOf(overId)
    if (oldIndex === -1) { onMove(id, col); return }
    if (oldIndex !== newIndex) { onReorder(col, arrayMove(current, oldIndex, newIndex)) }
  }
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className='grid gap-4 md:grid-cols-5'>
        {COLS.map(c => <Column key={c.key} column={c.key} title={c.title} items={lists[c.key]} jobs={jobs} />)}
      </div>
    </DndContext>
  )
}
function Column({ column, title, items, jobs }:{ column: ColumnKey, title: string, items: string[], jobs: Job[] }){
  const { setNodeRef } = useDroppable({ id: 'col:'+column })
  return (
    <div className='card glass' ref={setNodeRef}>
      <div className='border-b border-slate-200 p-3 text-sm dark:border-slate-800'>{title}</div>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className='space-y-3 p-3'>
          {items.map(id => <DraggableCard key={id} id={id} job={jobs.find(j => j.id===id)!} />)}
          {items.length===0 && <p className='p-2 text-center text-xs meta'>Empty</p>}
        </div>
      </SortableContext>
    </div>
  )
}
function DraggableCard({ id, job }:{ id: string, job: Job }){
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className='rounded-xl border border-slate-200 bg-white/60 p-3 text-sm dark:border-slate-800 dark:bg-slate-950'>
      <div className='mb-1 font-medium'>{text(job.title)}</div>
      <div className='flex flex-wrap items-center gap-3 text-xs meta'>
        {text(job.company) && <span>{text(job.company)}</span>}
        {text(job.location) && <span>• {text(job.location)}</span>}
        {job.created && <span>• {timeAgo(job.created)}</span>}
      </div>
    </div>
  )
}
