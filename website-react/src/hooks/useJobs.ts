import { useEffect, useState } from 'react'
import type { JobWithAnalysis } from '@/types/job'
import { loadJobs } from '@/services/jobsService'

export function useJobs() {
  const [jobs, setJobs] = useState<JobWithAnalysis[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rawSample, setRawSample] = useState<string>('')

  useEffect(() => {
    (async () => {
      try {
        const data = await loadJobs()
        setJobs(data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
        try {
          const res = await fetch((import.meta as any).env?.BASE_URL + 'data/jobs.json?ts=' + Date.now(), { cache: 'no-store' })
          const txt = await res.text()
          setRawSample(txt.slice(0, 200))
        } catch {}
      }
    })()
  }, [])

  return { jobs, error, rawSample } as const
}