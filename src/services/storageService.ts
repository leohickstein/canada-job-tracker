import type { PersistState, ColumnKey, Persist } from '@/types/job'
const KEY = 'jobtracker:v5'

const DEFAULT: PersistState = { items: {}, boardOrder: { backlog: [], applied: [], interview: [], offer: [], rejected: [] }, version: 2 }

function migrate(old: any): PersistState {
  const base: PersistState = { ...DEFAULT, ...(old||{}) }
  // v2 migration: set tracked = true if status progressed or notes exist
  let changed = false
  Object.keys(base.items||{}).forEach(id => {
    const it = base.items[id] as Persist
    if (it && it.tracked == null) {
      const progressed = it.status && it.status !== 'saved'
      if (progressed || (it.notes && it.notes.trim() !== '')) {
        it.tracked = true; changed = true
      }
    }
  })
  if (changed) base.version = 2
  return base
}

export function loadState(): PersistState { 
  try { 
    const raw = localStorage.getItem(KEY); 
    if (!raw) {
      // migrate from previous key if present
      const old = localStorage.getItem('jobtracker:v4')
      if (old) {
        const migrated = migrate(JSON.parse(old))
        localStorage.setItem(KEY, JSON.stringify(migrated))
        return migrated
      }
      return DEFAULT 
    }
    const parsed = JSON.parse(raw)
    return migrate(parsed) 
  } catch { 
    return DEFAULT 
  } 
}

export function saveState(state: PersistState){ localStorage.setItem(KEY, JSON.stringify(state)) }

export function setStatus(state: PersistState, jobId: string, column: ColumnKey | null){
  const next = {...state}
  if (!next.items[jobId]) next.items[jobId] = {}
  next.items[jobId].status = column === 'backlog' ? 'saved' : (column as any) || undefined
  // If status is a pipeline status, force tracked
  if (next.items[jobId].status && next.items[jobId].status !== 'saved') {
    next.items[jobId].tracked = true
  }
  // Remove job from all columns, then add to target
  ;(Object.keys(next.boardOrder) as ColumnKey[]).forEach(k => {
    next.boardOrder[k] = (next.boardOrder[k]||[]).filter(id => id !== jobId)
  })
  const target: ColumnKey = column || 'backlog'
  if (!next.boardOrder[target]) next.boardOrder[target] = []
  if (!next.boardOrder[target].includes(jobId)) next.boardOrder[target].push(jobId)
  return next
}

export function setTracked(state: PersistState, jobId: string, tracked: boolean){
  const next = { ...state, items: { ...state.items } }
  next.items[jobId] = { ...(next.items[jobId] || {}), tracked }
  // If untracking, also remove from all boardOrder columns
  if (!tracked) {
    next.boardOrder = { ...next.boardOrder }
    ;(Object.keys(next.boardOrder) as ColumnKey[]).forEach(k => {
      next.boardOrder[k] = (next.boardOrder[k]||[]).filter(id => id !== jobId)
    })
  } else {
    // If tracking and has a status, ensure it's in the right column; otherwise backlog
    const status = next.items[jobId]?.status
    const col: ColumnKey = status && status !== 'saved' ? (status as ColumnKey) : 'backlog'
    next.boardOrder = { ...next.boardOrder, [col]: [ ...(next.boardOrder[col]||[]), jobId ].filter((v,i,arr)=> arr.indexOf(v)===i ) }
  }
  return next
}

export const STORAGE_KEY = KEY
