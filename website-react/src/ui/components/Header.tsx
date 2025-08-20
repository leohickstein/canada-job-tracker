// Header.tsx
import React from 'react'
import { Sun, Moon, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type Props = {
  view: 'search' | 'tracker' | 'saved' | 'alerts' | 'preferences'
  setView: (v: Props['view']) => void
  rowsForExport: string[][]
  user?: any
  onAuthClick: () => void
  loading?: boolean
}

export function Header({ view, setView, rowsForExport, user, onAuthClick, loading }: Props){
  return (
    <header className="sticky top-0 z-40 border-b border-white/30 dark:border-slate-700/40 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 shadow-lg">
      <div className="container mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="flex items-center gap-1 p-1 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-inner">
            {(['search','tracker','saved','alerts'] as Props['view'][]).map((tab, index) => {
              const isActive = view === tab
              const gradients = [
                'from-blue-500 to-indigo-600',
                'from-purple-500 to-pink-600', 
                'from-amber-500 to-orange-600',
                'from-emerald-500 to-teal-600'
              ]
              return (
                <button key={tab}
                  className={`
                    relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${gradients[index]} text-white shadow-md scale-105` 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
                    }
                  `}
                  onClick={()=>setView(tab)}>
                  {tab[0].toUpperCase()+tab.slice(1)}
                </button>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* Preferences shortcut button */}
          <button
            onClick={() => setView('preferences')}
            className={`
              p-2 rounded-xl transition-all duration-300
              ${view === 'preferences'
                ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-md scale-105'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
              }
            `}
            title="Job Preferences"
          >
            <Settings className="h-4 w-4" />
          </button>
          <UserMenu user={user} onAuthClick={onAuthClick} loading={loading} />
          <ThemeToggle />
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
    <button
      className="relative inline-flex h-10 w-20 items-center rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      onClick={() => setDark(!dark)}
      title={`Switch to ${dark ? 'Light' : 'Dark'} mode`}
    >
      {/* Sliding background */}
      <span className={`
        absolute left-1 h-8 w-8 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out
        ${dark ? 'translate-x-10' : 'translate-x-0'}
      `} />
      
      {/* Icons - positioned absolutely for perfect alignment */}
      <span className={`
        absolute left-1 flex h-8 w-8 items-center justify-center transition-all duration-300 z-10
        ${!dark ? 'text-amber-500' : 'text-slate-400'}
      `}>
        <Sun className="h-4 w-4" />
      </span>
      
      <span className={`
        absolute right-1 flex h-8 w-8 items-center justify-center transition-all duration-300 z-10
        ${dark ? 'text-slate-700' : 'text-slate-400'}
      `}>
        <Moon className="h-4 w-4" />
      </span>
    </button>
  )
}

function UserMenu({ user, onAuthClick, loading }: { user?: any, onAuthClick: () => void, loading?: boolean }) {
  const { signOut } = useAuth()

  if (!user) {
    return (
      <button
        onClick={onAuthClick}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
      >
        <User className="h-4 w-4" />
        Sign In
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-inner">
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            {user.email?.split('@')[0] || 'User'}
          </span>
          {loading && (
            <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>
      <button
        onClick={signOut}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40 transition-all duration-300"
        title="Sign Out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}

function Logo(){
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden className="drop-shadow-lg">
          <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7C3AED"/>
              <stop offset="0.5" stopColor="#3B82F6"/>
              <stop offset="1" stopColor="#06B6D4"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="8" fill="url(#logo-gradient)" />
          <path d="M12 6l1.5 3 3.3-.3-2.4 2.4 1 3.4L12 13l-3.4 1.5 1-3.4L7.2 8.7l3.3.3L12 6z" 
                fill="white" opacity="0.95" className="drop-shadow-sm"/>
        </svg>
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-red-400 to-pink-500 rounded-full animate-pulse"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
          Canada Jobs
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Find your dream job</span>
      </div>
    </div>
  )
}