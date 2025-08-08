async function load() {
  const res = await fetch('data/jobs.json', { cache: 'no-store' });
  const payload = await res.json();
  const elResults = document.getElementById('results');
  const q = document.getElementById('q');
  const regionFilter = document.getElementById('regionFilter');
  const roleFilter = document.getElementById('roleFilter');
  const onlyNew = document.getElementById('onlyNew');
  const hideApplied = document.getElementById('hideApplied');
  const sortBy = document.getElementById('sortBy');
  const exportCsv = document.getElementById('exportCsv');

  const all = payload.jobs || [];
  const now = Date.now();
  const NEW_MS = 36 * 60 * 60 * 1000; // janela "new"

  // storage helpers
  const STORAGE_KEY = 'jobTracker:v1';
  const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  function saveStore() { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }

  // deduz "new"
  all.forEach(j => j._isNew = j.first_seen_at ? (now - Date.parse(j.first_seen_at) <= NEW_MS) : false);

  // filtros dinâmicos
  const regions = [...new Set(all.map(j => j.region).filter(Boolean))];
  regions.forEach(r => { const opt = document.createElement('option'); opt.value = r; opt.textContent = r; regionFilter.appendChild(opt); });
  const roles = [...new Set(all.map(j => j.roleMatched).filter(Boolean))];
  roles.forEach(r => { const opt = document.createElement('option'); opt.value = r; opt.textContent = r; roleFilter.appendChild(opt); });

  function render(list) {
    elResults.innerHTML = '';
    list.forEach(j => {
      const status = store[j.id]?.status || '';
      const notes = store[j.id]?.notes || '';
      const isApplied = ['applied','interview','offer','rejected'].includes(status);

      const card = document.createElement('div');
      card.className = 'card';

      const newBadge = j._isNew ? `<span class="badge new">NEW</span>` : '';
      card.innerHTML = `
        <h3>${j.title || ''} ${newBadge}</h3>
        <div class="meta">${j.company || ''} • ${j.location || ''} • ${j.created ? new Date(j.created).toLocaleDateString() : ''}</div>
        <div>${(j.rawSnippet || '').replace(/</g,'&lt;')}</div>
        <div style="margin-top:8px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <a class="btn view" target="_blank" rel="noopener" href="${j.url}">View posting</a>
          <span class="badge">${j.source}</span>
          <span class="badge">${j.region || ''}</span>
          <span class="badge">${j.roleMatched || ''}</span>
        </div>
        <div class="status" style="margin-top:8px;">
          <label>Status:
            <select data-id="${j.id}" class="statusSel">
              <option value="">—</option>
              <option value="applied" ${status==='applied'?'selected':''}>Applied</option>
              <option value="interview" ${status==='interview'?'selected':''}>Interviewing</option>
              <option value="offer" ${status==='offer'?'selected':''}>Offer</option>
              <option value="rejected" ${status==='rejected'?'selected':''}>Rejected</option>
            </select>
          </label>
          <label>Notes:
            <textarea rows="2" data-id="${j.id}" class="notes">${notes||''}</textarea>
          </label>
        </div>
      `;
      elResults.appendChild(card);

      // track click (marca clickedAt)
      card.querySelector('.view').addEventListener('click', () => {
        store[j.id] = store[j.id] || {};
        store[j.id].clickedAt = new Date().toISOString();
        saveStore();
      });
    });

    // listeners de status/notes
    document.querySelectorAll('.statusSel').forEach(sel => {
      sel.addEventListener('change', e => {
        const id = e.target.getAttribute('data-id');
        store[id] = store[id] || {};
        store[id].status = e.target.value;
        if (e.target.value === 'applied' && !store[id].appliedAt) store[id].appliedAt = new Date().toISOString();
        saveStore();
        applyFilters(); // re-filtra se "Hide applied" ativo
      });
    });
    document.querySelectorAll('.notes').forEach(t => {
      t.addEventListener('input', e => {
        const id = e.target.getAttribute('data-id');
        store[id] = store[id] || {};
        store[id].notes = e.target.value;
        saveStore();
      });
    });
  }

  function applyFilters() {
    const term = (q.value || '').toLowerCase();
    const r = regionFilter.value;
    const role = roleFilter.value;
    const onlyN = onlyNew.checked;
    const hideA = hideApplied.checked;
    const sort = sortBy.value;

    let filtered = all.filter(j => {
      const matchesText = [j.title, j.company, j.location].join(' ').toLowerCase().includes(term);
      const matchesRegion = !r || j.region === r;
      const matchesRole = !role || j.roleMatched === role;
      const matchesNew = !onlyN || j._isNew;
      const st = store[j.id]?.status || '';
      const matchesApplied = !hideA || (st === '' || st === 'rejected'); // esconde applied/interview/offer
      return matchesText && matchesRegion && matchesRole && matchesNew && matchesApplied;
    });

    filtered.sort((a,b) => {
      const da = a.created ? Date.parse(a.created) : 0;
      const db = b.created ? Date.parse(b.created) : 0;
      return sort === 'newest' ? (db - da) : (da - db);
    });

    render(filtered);
  }

  // export CSV
  exportCsv.addEventListener('click', () => {
    const rows = [['id','title','company','location','created','status','appliedAt','notes','url']];
    all.forEach(j => {
      const s = store[j.id] || {};
      if (s.status) rows.push([j.id, j.title||'', j.company||'', j.location||'', j.created||'', s.status||'', s.appliedAt||'', (s.notes||'').replace(/\n/g,' '), j.url||'']);
    });
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'applied-jobs.csv';
    a.click();
  });

  [q, regionFilter, roleFilter, onlyNew, hideApplied, sortBy].forEach(el => el.addEventListener('input', applyFilters));
  render(all);
}
load();
