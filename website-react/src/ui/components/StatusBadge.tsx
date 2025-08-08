import React from 'react'
import type { Persist } from '@/types/job'
export function StatusBadge({status}:{status:Persist['status']}){
  const map: Record<string,string> = {
    saved:'border-yellow-500 text-yellow-700 dark:text-yellow-300',
    applied:'border-blue-500 text-blue-700 dark:text-blue-300',
    interview:'border-purple-500 text-purple-700 dark:text-purple-300',
    offer:'border-emerald-500 text-emerald-700 dark:text-emerald-300',
    rejected:'border-red-500 text-red-700 dark:text-red-300',
  }
  return <span className={'badge '+map[status||'saved']}>{status}</span>
}
