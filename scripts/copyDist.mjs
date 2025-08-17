import fs from 'fs'
import path from 'path'
import url from 'url'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const dist = path.resolve(__dirname, '..', 'website-react', 'dist')
const website = path.resolve(__dirname, '..', 'website')
const jobsData = path.join(website, 'data', 'jobs.json')

if (!fs.existsSync(dist)) { console.error('Run `npm run build` first.'); process.exit(1) }

// Backup jobs data if it exists
let jobsBackup = null
if (fs.existsSync(jobsData)) {
  jobsBackup = fs.readFileSync(jobsData, 'utf-8')
  console.log('📦 Backing up existing jobs data')
}

fs.rmSync(website, { recursive: true, force: true })
fs.mkdirSync(website, { recursive: true })
function copyDir(src, dest){ fs.mkdirSync(dest, { recursive: true }); for (const ent of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, ent.name); const d = path.join(dest, ent.name); if (ent.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d) } }
copyDir(dist, website)

// Restore jobs data
if (jobsBackup) {
  fs.mkdirSync(path.dirname(jobsData), { recursive: true })
  fs.writeFileSync(jobsData, jobsBackup)
  console.log('✅ Restored jobs data')
}

console.log('Copied dist ->', website)
