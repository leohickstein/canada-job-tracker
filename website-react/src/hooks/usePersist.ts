import { useEffect, useState, useCallback } from 'react'
import type { PersistState, ColumnKey, Persist } from '@/types/job'
import { databaseStorage } from '@/services/databaseStorageService'
import { useAuth } from './useAuth'

export function usePersist(){
  const [state, setState] = useState<PersistState>({ 
    items: {}, 
    boardOrder: { backlog: [], applied: [], interview: [], offer: [], rejected: [], saved: [] }, 
    version: 2 
  })
  const [loading, setLoading] = useState(false) // Don't block UI on startup
  const [pendingAction, setPendingAction] = useState<{action: string, jobId: string, data: any} | null>(null)
  const [onAuthRequired, setOnAuthRequired] = useState<(() => void) | null>(null)
  const { user } = useAuth()

  // Reload data when user changes or on initial load
  const reloadData = useCallback(async () => {
    try {
      const loadedState = await databaseStorage.loadState()
      setState(loadedState)
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data when component mounts or user changes (non-blocking)
  useEffect(() => {
    // Load data in background without blocking UI
    reloadData()
  }, [reloadData, user])

  // Execute pending action after successful login
  useEffect(() => {
    if (user && pendingAction) {
      const { action, jobId, data } = pendingAction
      setPendingAction(null) // Clear the pending action
      
      // Execute the stored action
      setTimeout(() => {
        if (action === 'updateItem') {
          updateItem(jobId, data)
        } else if (action === 'moveToColumn') {
          moveToColumn(jobId, data)
        } else if (action === 'toggleTracked') {
          toggleTracked(jobId, data)
        } else if (action === 'toggleSaved') {
          toggleSaved(jobId, data)
        }
      }, 100) // Small delay to ensure auth state is fully ready
    }
  }, [user, pendingAction])

  async function updateItem(id: string, patch: Persist) {
    if (!user) {
      // Store the pending action and trigger auth
      setPendingAction({ action: 'updateItem', jobId: id, data: patch })
      if (onAuthRequired) onAuthRequired()
      return
    }

    try {
      // Optimistically update UI
      setState(prev => ({
        ...prev,
        items: {
          ...prev.items,
          [id]: { ...(prev.items[id] || {}), ...patch }
        }
      }))

      // Save to database
      await databaseStorage.updateItem(id, patch)
      
      // Reload to ensure consistency
      await reloadData()
    } catch (error) {
      console.error('Failed to update item:', error)
      // Reload to revert optimistic update
      await reloadData()
    }
  }
  
  async function moveToColumn(jobId: string, column: ColumnKey | null) {
    if (!user) {
      // Store the pending action and trigger auth
      setPendingAction({ action: 'moveToColumn', jobId, data: column })
      if (onAuthRequired) onAuthRequired()
      return
    }

    try {
      // Optimistically update UI
      setState(prev => {
        const newState = { ...prev }
        
        // Remove from all columns
        Object.keys(newState.boardOrder).forEach(col => {
          newState.boardOrder[col as ColumnKey] = newState.boardOrder[col as ColumnKey].filter(id => id !== jobId)
        })
        
        // Add to new column if not null
        if (column) {
          if (!newState.boardOrder[column]) newState.boardOrder[column] = []
          newState.boardOrder[column].push(jobId)
          
          // Update item status
          const status = column === 'backlog' ? 'saved' : column
          newState.items[jobId] = { 
            ...(newState.items[jobId] || {}), 
            status,
            tracked: column !== 'saved'
          }
        } else {
          // Remove item entirely
          delete newState.items[jobId]
        }
        
        return newState
      })

      // Save to database
      await databaseStorage.setStatus(jobId, column)
      
      // Reload to ensure consistency
      await reloadData()
    } catch (error) {
      console.error('Failed to move item:', error)
      // Reload to revert optimistic update
      await reloadData()
    }
  }
  
  // SAVE: Just bookmark the job (no pipeline involvement)
  async function toggleSaved(jobId: string, saved: boolean) {
    if (!user) {
      setPendingAction({ action: 'toggleSaved', jobId, data: saved })
      if (onAuthRequired) onAuthRequired()
      return
    }

    try {
      setState(prev => {
        const newState = { ...prev }
        
        if (saved) {
          // Just save to saved collection, no pipeline
          newState.items[jobId] = { ...(prev.items[jobId] || {}), status: 'saved', tracked: false }
          newState.boardOrder.saved = [...(newState.boardOrder.saved || []), jobId]
        } else {
          // Remove from saved only
          newState.boardOrder.saved = (newState.boardOrder.saved || []).filter(id => id !== jobId)
          const item = newState.items[jobId]
          if (item && !item.tracked) {
            delete newState.items[jobId] // Remove entirely if not tracked
          } else if (item) {
            delete item.status // Keep tracked status but remove saved status
          }
        }
        
        return newState
      })

      const persist = saved ? { status: 'saved', tracked: false } : {}
      await databaseStorage.updateItem(jobId, persist)
      await reloadData()
    } catch (error) {
      console.error('Failed to toggle saved:', error)
      await reloadData()
    }
  }

  // TRACK: Add to application pipeline (backlog column)
  async function toggleTracked(jobId: string, tracked: boolean) {
    if (!user) {
      setPendingAction({ action: 'toggleTracked', jobId, data: tracked })
      if (onAuthRequired) onAuthRequired()
      return
    }

    try {
      setState(prev => {
        const newState = { ...prev }
        
        if (tracked) {
          // Add to pipeline backlog, mark as tracked
          newState.items[jobId] = { ...(prev.items[jobId] || {}), tracked: true }
          // Remove from saved if it was there
          newState.boardOrder.saved = (newState.boardOrder.saved || []).filter(id => id !== jobId)
          // Add to backlog if not already in pipeline
          const inPipeline = ['backlog', 'applied', 'interview', 'offer', 'rejected'].some(
            col => newState.boardOrder[col as ColumnKey]?.includes(jobId)
          )
          if (!inPipeline) {
            newState.boardOrder.backlog.push(jobId)
          }
        } else {
          // Remove from all pipeline columns
          ['backlog', 'applied', 'interview', 'offer', 'rejected'].forEach(col => {
            newState.boardOrder[col as ColumnKey] = newState.boardOrder[col as ColumnKey].filter(id => id !== jobId)
          })
          const item = newState.items[jobId]
          if (item && item.status === 'saved') {
            // Keep as saved if it was saved
            newState.items[jobId] = { ...item, tracked: false }
            if (!newState.boardOrder.saved.includes(jobId)) {
              newState.boardOrder.saved.push(jobId)
            }
          } else {
            delete newState.items[jobId] // Remove entirely if not saved
          }
        }
        
        return newState
      })

      await databaseStorage.setTracked(jobId, tracked)
      await reloadData()
    } catch (error) {
      console.error('Failed to toggle tracking:', error)
      await reloadData()
    }
  }

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

  return { state, updateItem, moveToColumn, toggleTracked, toggleSaved, reorderColumn, ensureOrders, loading, setOnAuthRequired, pendingAction } as const
}
