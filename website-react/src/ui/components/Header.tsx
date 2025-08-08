import React from 'react'
import { Download, LayoutList, KanbanSquare, Star, Bell, Moon, Sun, Monitor } from 'lucide-react'
import { exportAppliedCSV } from '@/utils/csv'
import { useTheme } from '@/hooks/useTheme'
export function Header({view, setView, rowsForExport}:{view:string, setView:(v:string)=>void, rowsForExport: string[][]}){
  const { theme, setTheme, effective } = useTheme()
  const ThemeIcon = effective === 'dark' ? Moon : theme === 'system' ? Monitor : Sun
  const nextTheme = () => setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light')
  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'
  return (
    <header className='container mx-auto flex max-w-7xl items-center justify-between gap-4 py-3'>
      <div className='flex items-center gap-3'>
        <span className='rounded-xl bg-indigo-600/10 px-2 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-300'>Canada Jobs</span>
        <div className='tabs-glass'>
          {([['search','Search',LayoutList],['tracker','Tracker',KanbanSquare],['saved','Saved',Star],['alerts','Alerts',Bell]] as const).map(([id,label,Icon])=> (
            <button key={id} className={'tab '+(view===id?'tab-active':'')} onClick={()=>setView(id)}><Icon className='h-4 w-4'/><span>{label}</span></button>
          ))}
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <button className='btn' onClick={()=>exportAppliedCSV(rowsForExport)}><Download className='mr-2 h-4 w-4'/>Export</button>
        <button className='btn' onClick={nextTheme} title={'Theme: '+themeLabel}><ThemeIcon className='mr-2 h-4 w-4'/>{themeLabel}</button>
      </div>
    </header>
  )
}
