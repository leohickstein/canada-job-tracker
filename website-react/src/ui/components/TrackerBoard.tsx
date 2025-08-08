import React, { useMemo } from 'react'
import type { ColumnKey, Job, PersistState } from '@/types/job'
import { text } from '@/utils/text'
import { timeAgo } from '@/utils/time'
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, Building2, MapPin, Plus, GripVertical } from 'lucide-react'

const COLS: Array<{ key: ColumnKey, title: string, gradient: string, icon: string }> = [
  { key: 'backlog', title: 'Interesting', gradient: 'from-slate-400 to-slate-600', icon: '🤔' },
  { key: 'applied', title: 'Applied', gradient: 'from-blue-400 to-indigo-600', icon: '📝' },
  { key: 'interview', title: 'Interviews', gradient: 'from-purple-400 to-pink-600', icon: '💬' },
  { key: 'offer', title: 'Offers', gradient: 'from-emerald-400 to-teal-600', icon: '🎉' },
  { key: 'rejected', title: 'Rejected', gradient: 'from-red-400 to-rose-600', icon: '❌' },
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
      <div className='grid gap-4 md:grid-cols-5 auto-rows-max'>
        {COLS.map(c => (
          <Column key={c.key} column={c} items={lists[c.key]} jobs={visibleJobs} />
        ))}
      </div>
    </DndContext>
  )
}

function Column({ column, items, jobs }:{ column: typeof COLS[0], items: string[], jobs: Job[] }){
  const { setNodeRef } = useDroppable({ id: 'col:'+column.key })
  const safeItems = Array.isArray(items) ? items : []
  
  return (
    <div className='relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg min-h-[400px]' ref={setNodeRef}>
      {/* Gradient overlay for each column */}
      <div className={`absolute inset-0 bg-gradient-to-b ${column.gradient.replace('from-', 'from-').replace('to-', 'to-')}/10 dark:${column.gradient.replace('from-', 'from-').replace('to-', 'to-')}/5 pointer-events-none`} />
      
      {/* Header */}
      <div className={`relative border-b border-white/30 dark:border-slate-700/50 p-4 bg-gradient-to-r ${column.gradient} bg-opacity-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{column.icon}</span>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              {column.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-gradient-to-r ${column.gradient} text-white shadow-sm`}>
              {safeItems.length}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <SortableContext items={safeItems} strategy={verticalListSortingStrategy}>
        <div className='relative space-y-3 p-4'>
          {safeItems.map(id => {
            const job = jobs.find(j => j.id===id)
            if (!job) return null
            return <DraggableCard key={id} id={id} job={job} />
          })}
          
          {safeItems.length === 0 && (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <div className="p-3 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm mb-3">
                <Plus className="h-5 w-5 text-slate-400" />
              </div>
              <p className='text-xs text-slate-500 dark:text-slate-400 font-medium'>
                Drop jobs here
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function DraggableCard({ id, job }:{ id: string, job: Job }){
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    zIndex: isDragging ? 1000 : 'auto'
  }
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`group relative overflow-hidden rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-white/40 dark:border-slate-600/40 p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-200 ${isDragging ? 'rotate-3 scale-105' : 'hover:scale-[1.02]'}`}
    >
      {/* Drag handle */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>
      
      {/* Content */}
      <div className="pr-6">
        <h4 className='mb-2 font-medium text-slate-900 dark:text-white leading-snug line-clamp-2'>
          {text(job.title)}
        </h4>
        
        <div className='space-y-1.5 text-xs'>
          {text(job.company) && (
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Building2 className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <span className="truncate font-medium">{text(job.company)}</span>
            </div>
          )}
          {text(job.location) && (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <MapPin className="h-3 w-3 text-rose-500 flex-shrink-0" />
              <span className="truncate">{text(job.location)}</span>
            </div>
          )}
          {job.created && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500">
              <Clock className="h-3 w-3 text-amber-500 flex-shrink-0" />
              <span>{timeAgo(job.created)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}