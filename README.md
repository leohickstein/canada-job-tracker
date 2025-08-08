# Canada Jobs Tracker (Roles: HR, TA, Admin, Reception)

**What it is:** a minimal, free-to-host website that refreshes daily and lists Canadian job postings for specific roles, using the **Adzuna API** (free dev key) and optionally **WorkBC** (BC provincial jobs).

**Why this approach:** no servers to pay, easy deploy on **GitHub Pages**, and a daily **GitHub Actions** cron keeps data fresh.

## Features
- Watchlists for roles: HR Coordinator, Talent Acquisition, Administrative Assistant, Receptionist (+ synonyms)
- Regions: Remote (Canada-wide) heuristic + British Columbia
- Normalized JSON output at `website/data/jobs.json`
- Static website UI with search + filters
- One command to build (`npm run build`)

> Email alerts are not included in this first cut (to keep setup friction low). Add-ons suggested at the end.

## Setup
1. **Clone** this repo and install dependencies:
   ```bash
   npm install
   ```

2. **Create `.env`** from `.env.example` and add your Adzuna credentials:
   - Get a free key: https://developer.adzuna.com/ (app_id + app_key)
   - Put them here:
     ```env
     ADZUNA_APP_ID=...
     ADZUNA_APP_KEY=...
     ```

3. **Run the build** (fetch + generate site data):
   ```bash
   npm run build
   npm run start   # optional local preview at http://localhost:8080
   ```

4. **Deploy to GitHub Pages**: serve the `website/` folder. (Or on any static host.)

## Daily refresh via GitHub Actions (cron)
Add this workflow as `.github/workflows/daily.yml` in your repo and set `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` as encrypted **Repository secrets**:

```yaml
name: Daily Data Refresh
on:
  schedule:
    - cron: "20 16 * * *"   # every day at 09:20 America/Vancouver (16:20 UTC)
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          ADZUNA_APP_ID: ${{ secrets.ADZUNA_APP_ID }}
          ADZUNA_APP_KEY: ${{ secrets.ADZUNA_APP_KEY }}
      - name: Commit website/data/jobs.json
        run: |
          git config user.name "github-actions"
          git config user.email "actions@users.noreply.github.com"
          git add website/data/jobs.json
          git commit -m "chore: refresh jobs data" || echo "No changes"
          git push
```

> Adjust the cron if you prefer another time.

## Notes on sources
- **Adzuna API**: official, free developer plan with rate limits and fair use. We query by role synonyms + region. Remote is detected heuristically by keywords in the posting (remote/work from home/hybrid). See docs. 
- **WorkBC**: an official BC government API for WorkBC job board. This repo has placeholders; fill `WORKBC_BASE_URL` and `WORKBC_API_KEY` when you get access. 

## Extend (next steps)
- **Email alerts**: easiest path is GitHub Actions + an SMTP action (or SendGrid). Filter “new since last run” and send a daily digest.
- **Better remote signal**: add rules per source and parse structured fields when available.
- **More sources**: Greenhouse Job Board API & Lever Postings API (per-company), Job Bank (if an API becomes available), etc.
- **Search & facets**: ship the site with a small front-end search index for faster filtering.

## Developer commands
```bash
npm test    # checks config format
npm run build
npm run serve
```

---

*Generated on 2025-08-08T03:56:15.444690Z*
