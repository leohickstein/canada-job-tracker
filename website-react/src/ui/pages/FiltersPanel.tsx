import React from 'react'
export function FiltersPanel({q,setQ,region,setRegion,role,setRole,onlyNew,setOnlyNew,hideApplied,setHideApplied,sort,setSort,regions,roles}:{ 
  q:string,setQ:(s:string)=>void,region:string,setRegion:(s:string)=>void,role:string,setRole:(s:string)=>void,
  onlyNew:boolean,setOnlyNew:(b:boolean)=>void,hideApplied:boolean,setHideApplied:(b:boolean)=>void,sort:string,setSort:(s:string)=>void,
  regions:string[],roles:string[]
}){
  return (
    <div className='card glass p-4 space-y-4'>
      <div className='space-y-1'>
        <label className='text-xs uppercase text-slate-500'>Search</label>
        <input className='input' placeholder='title, company, city' value={q} onChange={e=>setQ(e.target.value)}/>
      </div>
      <div className='space-y-1'>
        <label className='text-xs uppercase text-slate-500'>Region</label>
        <select className='select' value={region} onChange={e=>setRegion(e.target.value)}>
          <option value=''>All regions</option>
          {regions.map(r=> <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className='space-y-1'>
        <label className='text-xs uppercase text-slate-500'>Role</label>
        <select className='select' value={role} onChange={e=>setRole(e.target.value)}>
          <option value=''>All roles</option>
          {roles.map(r=> <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className='space-y-2'>
        <label className='flex items-center gap-2 text-sm'><input type='checkbox' checked={onlyNew} onChange={e=>setOnlyNew(e.target.checked)}/>Only new (≤ 36h)</label>
        <label className='flex items-center gap-2 text-sm'><input type='checkbox' checked={hideApplied} onChange={e=>setHideApplied(e.target.checked)}/>Hide applied/interview/offer</label>
      </div>
      <div className='space-y-1'>
        <label className='text-xs uppercase text-slate-500'>Sort</label>
        <select className='select' value={sort} onChange={e=>setSort(e.target.value)}>
          <option value='newest'>Newest</option>
          <option value='oldest'>Oldest</option>
          <option value='salary'>Higher salary</option>
          <option value='title'>Title (A–Z)</option>
        </select>
      </div>
    </div>
  )
}
