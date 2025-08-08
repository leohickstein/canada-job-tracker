import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

const WORKBC_BASE_URL = process.env.WORKBC_BASE_URL || '';
const WORKBC_API_KEY = process.env.WORKBC_API_KEY || '';

// Load watchlists
const watchlists = JSON.parse(fs.readFileSync('config/watchlists.json', 'utf-8'));

// Utility: wait
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Normalize record
function normalizeJob({ source, raw, roleMatched, region }) {
  const created = raw.created || raw.date || raw.postedDate || raw.publishDate || null;
  const title = raw.title || '';
  const description = raw.description || '';
  const company = raw.company?.display_name || raw.company || raw.employer || '';
  const location = raw.location?.display_name || raw.city || raw.location || region?.where || '';
  const url = raw.redirect_url || raw.url || raw.jobUrl || '';
  const salaryMin = raw.salary_min || raw.salaryMin || null;
  const salaryMax = raw.salary_max || raw.salaryMax || null;

  return {
    id: `${source}:${raw.id ?? Buffer.from((url||title).slice(0,128)).toString('base64')}`,
    source,
    title,
    company,
    location,
    created,
    url,
    salaryMin,
    salaryMax,
    roleMatched,
    region: region?.name,
    rawSnippet: description?.slice(0, 280) || '',
  };
}

// Heuristic 'remote' matcher
function looksRemote(text) {
  const t = (text || '').toLowerCase();
  return (
    t.includes('remote') ||
    t.includes('work from home') ||
    t.includes('wfh') ||
    t.includes('anywhere in canada') ||
    t.includes('hybrid')
  );
}

// Fetch from Adzuna for a given synonym & region (with retries)
async function adzunaFetch({ synonym, region, page=1, results_per_page = 50 }) {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) return [];
  const encodedSyn = encodeURIComponent(synonym);
  const encodedWhere = encodeURIComponent(region.where);
  const url = `https://api.adzuna.com/v1/api/jobs/ca/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=${results_per_page}&what=${encodedSyn}&where=${encodedWhere}&content-type=application/json`;
  for (let attempt=1; attempt<=3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Adzuna HTTP ${res.status}`);
      const data = await res.json();
      return data.results?.map(r => normalizeJob({ source:'adzuna', raw:r, roleMatched: synonym, region })) ?? [];
    } catch (err) {
      if (attempt === 3) {
        console.error('Adzuna fetch failed:', err.message);
        return [];
      }
      await sleep(500 * attempt);
    }
  }
  return [];
}

// Placeholder WorkBC fetcher (skipped if no base URL/key)
async function workbcFetch({ synonym, region }) {
  if (!WORKBC_BASE_URL || !WORKBC_API_KEY) return [];
  try {
    const url = `${WORKBC_BASE_URL}`; // TODO: set to actual endpoint
    const res = await fetch(url, { headers: { 'apikey': WORKBC_API_KEY }});
    if (!res.ok) throw new Error(`WorkBC HTTP ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    return items.map(item => normalizeJob({ source:'workbc', raw:item, roleMatched: synonym, region }));
  } catch (err) {
    console.error('WorkBC fetch failed:', err.message);
    return [];
  }
}

// Main
async function main() {
  const all = [];
  for (const wl of watchlists.watchlists) {
    for (const region of watchlists.regions) {
      for (const syn of wl.synonyms) {
        // Adzuna
        const a = await adzunaFetch({ synonym: syn, region });
        // WorkBC (optional)
        const w = await workbcFetch({ synonym: syn, region });

        let combined = [...a, ...w];

        // Remote filter if region.type === 'remote'
        if (region.type === 'remote') {
          combined = combined.filter(j => looksRemote(`${j.title} ${j.rawSnippet}`));
        }

        // Basic dedupe by (title+company+region)
        const seen = new Set();
        combined.forEach(j => {
          const key = (j.title||'') + '|' + (j.company||'') + '|' + (j.region||'');
          if (!seen.has(key)) {
            seen.add(key);
            all.push(j);
          }
        });

        // be gentle
        await sleep(300);
      }
    }
  }

  // Sort by created desc when available, else by title
  all.sort((a,b) => {
    const da = a.created ? Date.parse(a.created) : 0;
    const db = b.created ? Date.parse(b.created) : 0;
    if (db !== da) return db - da;
    return (a.title||'').localeCompare(b.title||'');
  });

  // === Persist "first_seen_at" so the UI can mark NEW postings ===
  const outDir = 'website/data';
  fs.mkdirSync(outDir, { recursive: true });

  let prev = {};
  try {
    const old = JSON.parse(fs.readFileSync(path.join(outDir, 'jobs.json'), 'utf-8'));
    (old.jobs || []).forEach(j => {
      if (j.id) prev[j.id] = j.first_seen_at || old.generated_at;
    });
  } catch (e) {
    // no previous file, ignore
  }

  const nowIso = new Date().toISOString();
  all.forEach(j => {
    j.first_seen_at = prev[j.id] || nowIso;
    j.last_seen_at = nowIso;
  });

  // Output to website/data/jobs.json
  fs.writeFileSync(path.join(outDir, 'jobs.json'), JSON.stringify({
    generated_at: nowIso,
    total: all.length,
    jobs: all,
  }, null, 2));

  // Copy static site assets if not already present
  if (!fs.existsSync('website/index.html')) {
    fs.mkdirSync('website', { recursive: true });
    fs.copyFileSync('website_template/index.html', 'website/index.html');
    fs.copyFileSync('website_template/styles.css', 'website/styles.css');
    fs.copyFileSync('website_template/app.js', 'website/app.js');
  }

  console.log(`Wrote website/data/jobs.json with ${all.length} jobs.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
