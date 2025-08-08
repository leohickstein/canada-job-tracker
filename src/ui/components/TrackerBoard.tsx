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

type Props = {
  jobs: Job[]
  state: PersistState
  onMove: (jobId: string, dest: ColumnKey|null) => void
  onReorder: (column: ColumnKey, items: string[]) => void
  q?: string
  hideDone?: boolean
}

export function TrackerBoard({ jobs, state, onMove, onReorder, q='', hideDone=false }: Props){
  // Visible jobs are the tracked ones or any with progressed status
  const visibleJobs = useMemo(()=>{
    const out: Job[] = []
    for (const j of jobs) {
      const p = state.items[j.id]
      const progressed = p?.status && p.status !== 'saved'
      if (p?.tracked || progressed) out.push(j)
    }
    // text filter
    const qq = q.trim().toLowerCase()
    const filtered = qq ? out.filter(j => (text(j.title)+' '+text(j.company)).toLowerCase().includes(qq)) : out
    // hide offers/rejected if requested
    return hideDone ? filtered.filter(j => !['offer','rejected'].includes(String(state.items[j.id]?.status))) : filtered
  }, [jobs, state, q, hideDone])

  const lists = useMemo(() => {
    const byId = new Map(visibleJobs.map(j => [j.id, j]))
    const result: Record<ColumnKey, string[]> = { backlog: [], applied: [], interview: [], offer: [], rejected: [] }

    // Seed from saved order (ignore unknown columns safely)
    ;(Object.keys(state.boardOrder || {}) as Array<keyof typeof state.boardOrder>).forEach((k) => {
      const key = (k === 'saved' ? 'backlog' : k) as ColumnKey
      if (!(key in result)) return
      result[key] = [...(state.boardOrder[k] || [])].filter(id => byId.has(id))
    })

    // Add any missing visible jobs to their status column (map 'saved' -> 'backlog')
    for (const j of visibleJobs) {
      const st = state.items?.[j.id]?.status
      const col: ColumnKey = st && st !== 'saved' ? (st as ColumnKey) : 'backlog'
      if (!(col in result)) continue
      if (!result[col].includes(j.id)) result[col].push(j.id)
    }
    return result
  }, [visibleJobs, state])

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor))

  const handleDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id)
    const overId = e.over?.id ? String(e.over.id) : null
    if (!overId) return

    if (overId.startsWith('col:')) {
      const dest = overId.slice(4) as ColumnKey
      onMove(id, dest)
      return
    }
    // Dropped over another item -> reorder within that column (or move to that column if not present)
    const col = (Object.keys(lists) as ColumnKey[]).find(k => (lists[k] || []).includes(overId))
    if (!col) return
    const current = lists[col] || []
    const oldIndex = current.indexOf(id)
    const newIndex = current.indexOf(overId)
    if (oldIndex === -1) {
      onMove(id, col)
      return
    }
    if (oldIndex !== newIndex) {
      const next = arrayMove(current, oldIndex, newIndex)
      onReorder(col, next)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className='grid gap-4 md:grid-cols-5'>
        {COLS.map(c => (
          <Column key={c.key} column={c.key} title={c.title} items={lists[c.key]} jobs={visibleJobs} />
        ))}
      </div>
    </DndContext>
  )
}

function Column({ column, title, items, jobs }:{ column: ColumnKey, title: string, items: string[], jobs: Job[] }){
  const { setNodeRef } = useDroppable({ id: 'col:'+column })
  const safeItems = Array.isArray(items) ? items : []
  return (
    <div className='card glass' ref={setNodeRef}>
      <div className='border-b border-slate-200 p-3 text-sm dark:border-slate-800'>{title}</div>
      <SortableContext items={safeItems} strategy={verticalListSortingStrategy}>
        <div className='space-y-3 p-3'>
          {safeItems.map(id => {
            const job = jobs.find(j => j.id===id)
            if (!job) return null
            return <DraggableCard key={id} id={id} job={job} />
          })}
          {safeItems.length===0 && <p className='p-2 text-center text-xs meta'>Empty</p>}
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
