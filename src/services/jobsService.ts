import { dataUrl } from '@/utils/baseUrl'
import type { Job } from '@/types/job'
import { text } from '@/utils/text'

function dedupeJobs(arr: Job[]): Job[] {
  const seen = new Set<string>()
  const out: Job[] = []
  for (const j of arr) {
    const id = String(j.id || '').trim().toLowerCase()
    const composite = [text(j.company), text(j.title), text(j.location)].map(s => s.trim().toLowerCase()).join('|')
    const key = id || composite
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    out.push(j)
  }
  return out
}

export async function loadJobs(): Promise<Job[]> {
  const url = dataUrl('data/jobs.json')
  const res = await fetch(url + '?ts=' + Date.now(), { cache: 'no-store' })
  const txt = await res.text()
  let json: any
  try { json = JSON.parse(txt) } catch { throw new Error('Could not parse jobs.json (starts with): '+txt.slice(0,80)) }
  if (!json || typeof json !== 'object' || !Array.isArray(json.jobs)) throw new Error('Invalid jobs.json shape: expected { jobs: [] }')
  return dedupeJobs(json.jobs as Job[])
}
