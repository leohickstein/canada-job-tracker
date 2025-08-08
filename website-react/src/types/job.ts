export type Job = {
  id: string
  title: any
  company?: any
  location?: any
  created?: any
  url?: any
  salaryMin?: any
  salaryMax?: any
  roleMatched?: any
  region?: any
  rawSnippet?: any
  first_seen_at?: any
  last_seen_at?: any
}
export type Status = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
export type Persist = { status?: Status; notes?: string; clickedAt?: string; appliedAt?: string }
export type ColumnKey = 'backlog' | 'applied' | 'interview' | 'offer' | 'rejected'
export type PersistState = { items: Record<string, Persist>; boardOrder: Record<ColumnKey, string[]>; version: number }
