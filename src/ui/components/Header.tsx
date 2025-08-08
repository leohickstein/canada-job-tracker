import React from 'react'
import { Download } from 'lucide-react'

type Props = {
  view: 'search' | 'tracker' | 'saved' | 'alerts'
  setView: (v: Props['view']) => void
  rowsForExport: string[][]
}

function downloadCSV(rows: string[][]){
  const csv = rows.map(r => r.map(cell => {
    const s = String(cell ?? '')
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }).join(',')).join('\r\n')
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'applied.csv'; a.click(); URL.revokeObjectURL(url)
}

export function Header({ view, setView, rowsForExport }: Props){
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
      <div className="container mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-2">
        <div className="flex items-center gap-3">
          <Logo />
          <nav className="tabs-xl">
            {(['search','tracker','saved','alerts'] as Props['view'][]).map(tab => (
              <button key={tab}
                className={"tab " + (view===tab ? "tab-active" : "")}
                onClick={()=>setView(tab)}>
                {tab[0].toUpperCase()+tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="btn btn-ghost" onClick={()=>downloadCSV(rowsForExport)}>
            <Download className="mr-2 h-4 w-4" />Export
          </button>
        </div>
      </div>
    </header>
  )
}

function ThemeToggle(){
  const KEY = 'jobtracker_theme'
  const [dark, setDark] = React.useState<boolean>(() => (localStorage.getItem(KEY) || 'light') === 'dark')
  React.useEffect(()=>{
    localStorage.setItem(KEY, dark ? 'dark' : 'light')
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    ;(root.style as any).colorScheme = dark ? 'dark' : 'light'
  },[dark])
  return (
    <label className="switch" title="Theme">
      <input type="checkbox" checked={dark} onChange={e=>setDark(e.currentTarget.checked)} />
      <span className="slider">{dark ? 'Dark' : 'Light'}</span>
    </label>
  )
}

function Logo(){
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7C3AED"/><stop offset="1" stopColor="#2563EB"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#g)" />
        <path d="M12 5l1.3 2.7 3-.2-2 2.1.8 2.9-3.1-1.5-3.1 1.5.8-2.9-2-2.1 3 .2L12 5z" fill="white" opacity=".95"/>
      </svg>
      <span className="text-base font-semibold">Canada Jobs</span>
    </div>
  )
}
