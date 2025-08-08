# Canada Job Tracker — Glass React + DnD
- SOLID-ish folders (types, utils, services, hooks, ui/components, ui/pages)
- Drag & drop Kanban with @dnd-kit (status + order persisted to localStorage)
- Light/Dark/System theme switch with localStorage + `<html class="dark">`
- iOS-style glass UI utilities
- Base URL-aware (works at `/` in dev and `/canada-job-tracker/` on Pages)
- Robust JSON parsing + dedupe

## Dev
```bash
npm i
# Option A: copy your JSON to public/data/jobs.json (create the folder)
# Option B: use remote JSON
echo "VITE_JOBS_URL=https://leohickstein.github.io/canada-job-tracker/data/jobs.json" > .env.local
npm run dev
```

## Build & publish to your repo Pages
```bash
npm run build
npm run build:to-website   # copies dist/* -> ../website/
# commit ../website and push
```
