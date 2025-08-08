import React, { useMemo } from 'react'
import type { Job, PersistState } from '@/types/job'
import { JobCard } from '@/ui/components/JobCard'
import { FiltersPanel } from './FiltersPanel'
import { regionOf, roleOf, text } from '@/utils/text'
type Props = { jobs: Job[]; state: PersistState; setState: (id:string, patch:any)=>void; filters: { q: string; setQ:(s:string)=>void; region: string; setRegion:(s:string)=>void; role: string; setRole:(s:string)=>void; onlyNew: boolean; setOnlyNew:(b:boolean)=>void; hideApplied: boolean; setHideApplied:(b:boolean)=>void; sort: string; setSort:(s:string)=>void } }
export function SearchPage({ jobs, state, setState, filters }: Props){
  const regions = useMemo(()=>Array.from(new Set((jobs||[]).map(regionOf).filter(Boolean))) as string[], [jobs])
  const roles   = useMemo(()=>Array.from(new Set((jobs||[]).map(roleOf).filter(Boolean))) as string[], [jobs])
  const merged = useMemo(()=> jobs.map(j=>({...j, ...(state.items[j.id]||{})})), [jobs, state])
  const filtered = useMemo(()=> merged
    .filter(j=> filters.q ? ([text(j.title), text(j.company), text(j.location), roleOf(j), regionOf(j)].join(' ').toLowerCase().includes(filters.q.toLowerCase())): true)
    .filter(j=> !filters.region || regionOf(j)===filters.region)
    .filter(j=> !filters.role   || roleOf(j)===filters.role)
    .filter(j=> !filters.onlyNew || Boolean(j.first_seen_at && (Date.now()-+new Date(j.first_seen_at)) <= 36*3600*1000))
    .filter(j=> !filters.hideApplied || !['applied','interview','offer'].includes(String(state.items[j.id]?.status)))
    .sort((a,b)=>{ const ca = +new Date(String(a.created)||0), cb = +new Date(String(b.created)||0); if(filters.sort==='newest') return cb - ca; if(filters.sort==='oldest') return ca - cb; if(filters.sort==='salary') return (Number(b.salaryMax)||0) - (Number(a.salaryMax)||0); return text(a.title).localeCompare(text(b.title)) })
  , [merged, filters, state])
  return (
    <main className='container mx-auto grid max-w-7xl grid-cols-12 gap-4'>
      <aside className='col-span-12 lg:col-span-3'>
        <FiltersPanel 
          q={filters.q} setQ={filters.setQ}
          region={filters.region} setRegion={filters.setRegion}
          role={filters.role} setRole={filters.setRole}
          onlyNew={filters.onlyNew} setOnlyNew={filters.setOnlyNew}
          hideApplied={filters.hideApplied} setHideApplied={filters.setHideApplied}
          sort={filters.sort} setSort={filters.setSort}
          regions={regions} roles={roles}
        />
      </aside>
      <section className='col-span-12 space-y-4 lg:col-span-9'>
        <p className='meta'>{filtered.length} results</p>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {filtered.map(j=> (
            <JobCard key={j.id} job={j as any} persist={state.items[j.id]}
              onOpen={()=>setState(j.id, { clickedAt: new Date().toISOString() })}
              onApply={()=>setState(j.id, { status: 'applied', appliedAt: new Date().toISOString() })}
              onSave={()=>setState(j.id, { status: state.items[j.id]?.status === 'saved' ? undefined : 'saved' })}
              onNotes={(t)=>setState(j.id, { notes: t })}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
