import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const WORKBC_BASE_URL = process.env.WORKBC_BASE_URL || '';
const WORKBC_API_KEY = process.env.WORKBC_API_KEY || '';

// Utility: wait
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Fetch user preferences from Supabase
async function fetchUserPreferences() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log('⚠️  Supabase credentials missing - using popular job feed');
    // Fallback with diverse, popular job titles for broad appeal
    return {
      watchlists: [
        {
          name: "Popular Jobs Feed",
          synonyms: [
            "Software Engineer", "Product Manager", "Data Scientist", "UX Designer", 
            "Marketing Manager", "Business Analyst", "Project Manager", "Sales Manager",
            "DevOps Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer"
          ]
        }
      ],
      regions: [
        { name: "Remote-Canada", type: "remote", where: "Canada" },
        { name: "Toronto-ON", type: "onsite", where: "Toronto, ON" },
        { name: "Vancouver-BC", type: "onsite", where: "Vancouver, BC" },
        { name: "Montreal-QC", type: "onsite", where: "Montreal, QC" }
      ]
    };
  }

  try {
    console.log('🔍 Fetching user preferences from Supabase...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_job_interests?select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
    }

    const userInterests = await response.json();
    console.log(`✅ Found ${userInterests.length} user preference profiles`);

    if (userInterests.length === 0) {
      console.log('📋 No user preferences found, using popular job feed for non-authenticated users');
      return {
        watchlists: [
          {
            name: "Popular Jobs Feed",
            synonyms: [
              "Software Engineer", "Product Manager", "Data Scientist", "UX Designer", 
              "Marketing Manager", "Business Analyst", "Project Manager", "Sales Manager",
              "DevOps Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer"
            ]
          }
        ],
        regions: [
          { name: "Remote-Canada", type: "remote", where: "Canada" },
          { name: "Toronto-ON", type: "onsite", where: "Toronto, ON" },
          { name: "Vancouver-BC", type: "onsite", where: "Vancouver, BC" },
          { name: "Montreal-QC", type: "onsite", where: "Montreal, QC" }
        ]
      };
    }

    // Aggregate all unique job titles and locations from all users
    const allJobTitles = new Set();
    const allLocations = new Set();

    userInterests.forEach(interest => {
      // Add job titles
      if (interest.job_titles && Array.isArray(interest.job_titles)) {
        interest.job_titles.forEach(title => allJobTitles.add(title));
      }
      
      // Add locations
      if (interest.locations && Array.isArray(interest.locations)) {
        interest.locations.forEach(location => allLocations.add(location));
      }
    });

    // Convert to watchlist format
    const watchlists = [{
      name: "User Defined Roles",
      synonyms: Array.from(allJobTitles)
    }];

    // Convert locations to regions format
    const regions = Array.from(allLocations).map(location => {
      const isRemote = location.toLowerCase().includes('remote') || location.toLowerCase().includes('hybrid');
      return {
        name: location,
        type: isRemote ? 'remote' : 'onsite',
        where: location === 'Remote' ? 'Canada' : location
      };
    });

    console.log(`📋 Aggregated preferences: ${allJobTitles.size} job titles, ${allLocations.size} locations`);
    console.log(`🎯 Job titles: ${Array.from(allJobTitles).join(', ')}`);
    console.log(`📍 Locations: ${Array.from(allLocations).join(', ')}`);

    return { watchlists, regions };

  } catch (error) {
    console.error('❌ Failed to fetch user preferences:', error.message);
    console.log('🔄 Falling back to default job search...');
    
    return {
      watchlists: [
        {
          name: "Fallback Search",
          synonyms: ["Software Engineer", "Product Manager", "Data Scientist"]
        }
      ],
      regions: [
        { name: "Remote-Canada", type: "remote", where: "Canada" },
        { name: "British Columbia", type: "onsite", where: "British Columbia" }
      ]
    };
  }
}

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
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.log('⚠️  Adzuna API credentials missing - skipping Adzuna fetch');
    return [];
  }
  
  const encodedSyn = encodeURIComponent(synonym);
  const encodedWhere = encodeURIComponent(region.where);
  
  // Add date filter for jobs posted in last 7 days
  const maxAge = 7; // days
  const url = `https://api.adzuna.com/v1/api/jobs/ca/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=${results_per_page}&what=${encodedSyn}&where=${encodedWhere}&max_days_old=${maxAge}&content-type=application/json`;
  
  console.log(`🔍 Fetching: "${synonym}" in "${region.where}" (page ${page})`);
  
  for (let attempt=1; attempt<=3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Adzuna HTTP ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      const jobs = data.results?.map(r => normalizeJob({ source:'adzuna', raw:r, roleMatched: synonym, region })) ?? [];
      console.log(`✅ Found ${jobs.length} jobs for "${synonym}" in "${region.where}" (total available: ${data.count || 'unknown'})`);
      return jobs;
    } catch (err) {
      console.error(`❌ Attempt ${attempt}/3 failed for "${synonym}" in "${region.where}":`, err.message);
      if (attempt === 3) {
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
  console.log('🚀 Starting job fetch process...');
  
  // Fetch dynamic user preferences instead of hardcoded watchlists
  const userPreferences = await fetchUserPreferences();
  const { watchlists, regions } = userPreferences;
  
  console.log(`📋 Processing ${watchlists.length} watchlists × ${regions.length} regions`);
  
  const all = [];
  let totalFetched = 0;
  
  for (const wl of watchlists) {
    console.log(`\n📄 Processing watchlist: ${wl.name} (${wl.synonyms.length} synonyms)`);
    
    for (const region of regions) {
      console.log(`\n🌍 Region: ${region.name} (${region.type})`);
      
      for (const syn of wl.synonyms) {
        // Adzuna
        const a = await adzunaFetch({ synonym: syn, region });
        // WorkBC (optional)
        const w = await workbcFetch({ synonym: syn, region });

        let combined = [...a, ...w];
        totalFetched += combined.length;

        // Remote filter if region.type === 'remote'
        if (region.type === 'remote') {
          const beforeFilter = combined.length;
          combined = combined.filter(j => looksRemote(`${j.title} ${j.rawSnippet}`));
          console.log(`🏠 Remote filter: ${beforeFilter} → ${combined.length} jobs`);
        }

        // Basic dedupe by (title+company+region)
        const seen = new Set();
        const beforeDedupe = all.length;
        combined.forEach(j => {
          const key = (j.title||'') + '|' + (j.company||'') + '|' + (j.region||'');
          if (!seen.has(key)) {
            seen.add(key);
            all.push(j);
          }
        });
        console.log(`🔄 Added ${all.length - beforeDedupe} new unique jobs (${combined.length - (all.length - beforeDedupe)} duplicates removed)`);

        // be gentle
        await sleep(300);
      }
    }
  }
  
  console.log(`\n📊 Summary: Fetched ${totalFetched} total jobs, ${all.length} unique after deduplication`);

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
