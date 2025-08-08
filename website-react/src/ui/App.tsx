import React, { useEffect, useMemo, useState } from 'react'
import { useJobs } from '@/hooks/useJobs'
import { usePersist } from '@/hooks/usePersist'
import type { ColumnKey } from '@/types/job'
import { Header } from '@/ui/components/Header'
import { SearchPage } from '@/ui/pages/SearchPage'
import { SavedPage } from '@/ui/pages/SavedPage'
import { AlertsPage } from '@/ui/pages/AlertsPage'
import { TrackerPage } from '@/ui/pages/TrackerPage'
import { text } from '@/utils/text'

export default function App(){
  const { jobs, error, rawSample } = useJobs()
  const { state, updateItem, moveToColumn, reorderColumn, ensureOrders } = usePersist()
  const [view,setView]=useState<'search'|'tracker'|'saved'|'alerts'>(()=> (new URLSearchParams(location.search).get('tab') as any) || 'search')
  const [q,setQ]=useState(''); const [region,setRegion]=useState(''); const [role,setRole]=useState(''); const [onlyNew,setOnlyNew]=useState(false); const [hideApplied,setHideApplied]=useState(false); const [sort,setSort]=useState('newest')
  useEffect(()=>{ if (jobs) ensureOrders(jobs.map(j=>j.id)) },[jobs])
  const rowsForExport = useMemo(()=>{ const arr: string[][] = [['id','title','company','location','status','appliedAt','url']]; (jobs||[]).forEach(j=>{ const p = state.items[j.id]; if (!p?.status || p.status==='saved') return; arr.push([j.id, text(j.title), text(j.company), text(j.location), String(p.status), String(p.appliedAt||''), text(j.url)]) }); return arr },[jobs,state])
  if(error){ return <div className='container mx-auto max-w-3xl p-6'><p className='mb-2 text-red-600'>Error: {error}</p>{rawSample && <pre className='mt-3 rounded bg-slate-100 p-2 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300'>{rawSample}</pre>}</div> }
  if(!jobs){ return <div className='p-6 text-center text-slate-500'>Loading jobs…</div> }
  return (
    <div className='min-h-screen'>
      <div aria-hidden className='pointer-events-none fixed inset-x-0 top-0 -z-10 h-[40vh] hero-glow opacity-70 dark:opacity-50' />
      <Header view={view} setView={setView} rowsForExport={rowsForExport}/>
      {view==='search' && (<SearchPage jobs={jobs} state={state} setState={updateItem} filters={{ q,setQ, region,setRegion, role,setRole, onlyNew,setOnlyNew, hideApplied,setHideApplied, sort,setSort }} />)}
      {view==='saved' && <SavedPage jobs={jobs} state={state} />}
      {view==='tracker' && (<TrackerPage jobs={jobs} state={state} onMove={(id, col)=> moveToColumn(id, col as ColumnKey)} onReorder={(col, items)=> reorderColumn(col, items)} />)}
      {view==='alerts' && <AlertsPage />}
    </div>
  )
}
