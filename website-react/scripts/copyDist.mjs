import fs from 'fs'
import path from 'path'
import url from 'url'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const dist = path.resolve(__dirname, '..', 'dist')
const website = path.resolve(__dirname, '..', '..', 'website')
if (!fs.existsSync(dist)) { console.error('Run `npm run build` first.'); process.exit(1) }
fs.rmSync(website, { recursive: true, force: true })
fs.mkdirSync(website, { recursive: true })
function copyDir(src, dest){ fs.mkdirSync(dest, { recursive: true }); for (const ent of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, ent.name); const d = path.join(dest, ent.name); if (ent.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d) } }
copyDir(dist, website); console.log('Copied dist ->', website)
