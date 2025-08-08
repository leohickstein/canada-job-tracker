import { useEffect, useState } from 'react'
import type { PersistState, ColumnKey, Persist } from '@/types/job'
import { loadState, saveState, setStatus, setTracked } from '@/services/storageService'

export function usePersist(){
  const [state, setState] = useState<PersistState>(()=>loadState())
  useEffect(()=>{ saveState(state) },[state])

  function updateItem(id:string, patch:Persist){
    setState(prev=>({ ...prev, items:{ ...prev.items, [id]:{ ...(prev.items[id]||{}), ...patch } } }))
  }
  function moveToColumn(jobId:string, column:ColumnKey|null){ setState(prev=> setStatus(prev, jobId, column)) }
  function toggleTracked(jobId:string, tracked:boolean){ setState(prev=> setTracked(prev, jobId, tracked)) }

  function reorderColumn(column: ColumnKey, items:string[]){
    setState(prev => {
      const prevItems = prev.boardOrder[column] || []
      const same = prevItems.length===items.length && prevItems.every((v,i)=>v===items[i])
      if (same) return prev
      return { ...prev, boardOrder:{ ...prev.boardOrder, [column]: items } }
    })
  }

  // Keep board order clean relative to tracked jobs
  function ensureOrders(jobIds:string[], trackedIds?: Set<string>){
    const allowed = trackedIds ?? new Set(jobIds)
    setState(prev=>{
      const next = { ...prev, boardOrder:{ ...prev.boardOrder } }
      let changed = false as any
      ;(Object.keys(next.boardOrder) as ColumnKey[]).forEach(k=>{
        const filtered = (next.boardOrder[k]||[]).filter(id => allowed.has(id) && jobIds.includes(id))
        const prevList = next.boardOrder[k]||[]
        const same = filtered.length===prevList.length && filtered.every((v,i)=>v===prevList[i])
        if(!same){ next.boardOrder[k]=filtered; changed = true }
      })
      return changed? next: prev
    })
  }

  return { state, updateItem, moveToColumn, toggleTracked, reorderColumn, ensureOrders } as const
}
