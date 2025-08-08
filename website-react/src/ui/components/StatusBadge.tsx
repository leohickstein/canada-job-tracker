import React from 'react'
import type { Persist } from '@/types/job'
import { Bookmark, Send, Calendar, Gift, X } from 'lucide-react'

export function StatusBadge({status}:{status:Persist['status']}){
  const configs = {
    saved: {
      icon: Bookmark,
      gradient: 'from-amber-400 to-orange-500',
      label: 'Saved',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-700 dark:text-amber-300'
    },
    applied: {
      icon: Send,
      gradient: 'from-blue-400 to-indigo-500',
      label: 'Applied',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    interview: {
      icon: Calendar,
      gradient: 'from-purple-400 to-pink-500',
      label: 'Interview',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300'
    },
    offer: {
      icon: Gift,
      gradient: 'from-emerald-400 to-teal-500',
      label: 'Offer',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-700 dark:text-emerald-300'
    },
    rejected: {
      icon: X,
      gradient: 'from-red-400 to-rose-500',
      label: 'Rejected',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300'
    }
  }
  
  const config = configs[status || 'saved']
  const Icon = config.icon
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm
      ${config.bgColor} ${config.textColor} border-2 border-white/60 dark:border-slate-700/60
    `}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}