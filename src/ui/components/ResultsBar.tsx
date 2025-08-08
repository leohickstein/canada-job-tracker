import React from 'react'

type Props = {
  count: number
  sort: string
  setSort: (v: string) => void
  onlyNew: boolean
  setOnlyNew: (v: boolean) => void
  hideApplied: boolean
  setHideApplied: (v: boolean) => void
  onExport?: () => void
}

export function ResultsBar({ count, sort, setSort, onlyNew, setOnlyNew, hideApplied, setHideApplied, onExport }: Props){
  return (
    <div className="card glass flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 dark:text-slate-300">{count} results</span>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyNew} onChange={e=>setOnlyNew(e.currentTarget.checked)} />
          Only new (≤ 36h)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={hideApplied} onChange={e=>setHideApplied(e.currentTarget.checked)} />
          Hide applied/interview/offer
        </label>
      </div>
      <div className="flex items-center gap-2">
        <select value={sort} onChange={e=>setSort(e.currentTarget.value)} className="input !h-9">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="salary">Highest pay</option>
          <option value="title">Title (A–Z)</option>
        </select>
        {onExport && <button className="btn btn-ghost" onClick={onExport}>Export</button>}
      </div>
    </div>
  )
}
