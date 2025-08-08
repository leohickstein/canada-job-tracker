import type { PersistState, ColumnKey } from '@/types/job'
const KEY = 'jobtracker:v4'
const DEFAULT: PersistState = { items: {}, boardOrder: { backlog: [], applied: [], interview: [], offer: [], rejected: [] }, version: 1 }
export function loadState(): PersistState { try { const raw = localStorage.getItem(KEY); return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT } catch { return DEFAULT } }
export function saveState(state: PersistState){ localStorage.setItem(KEY, JSON.stringify(state)) }
export function setStatus(state: PersistState, jobId: string, column: ColumnKey | null){ const next = {...state}; if (!next.items[jobId]) next.items[jobId] = {}; next.items[jobId].status = column === 'backlog' ? 'saved' : (column as any) || undefined; for (const k of Object.keys(next.boardOrder) as ColumnKey[]) next.boardOrder[k] = next.boardOrder[k].filter(id => id !== jobId); const target: ColumnKey = column || 'backlog'; if (!next.boardOrder[target].includes(jobId)) next.boardOrder[target].push(jobId); return next }
export const STORAGE_KEY = KEY
