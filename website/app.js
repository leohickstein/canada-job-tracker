async function load() {
  const res = await fetch('data/jobs.json', { cache: 'no-store' });
  const payload = await res.json();
  const elResults = document.getElementById('results');
  const q = document.getElementById('q');
  const regionFilter = document.getElementById('regionFilter');
  const roleFilter = document.getElementById('roleFilter');

  const all = payload.jobs || [];
  const regions = [...new Set(all.map(j => j.region).filter(Boolean))];
  regions.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r; opt.textContent = r;
    regionFilter.appendChild(opt);
  });
  const roles = [...new Set(all.map(j => j.roleMatched).filter(Boolean))];
  roles.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r; opt.textContent = r;
    roleFilter.appendChild(opt);
  });

  function render(list) {
    elResults.innerHTML = '';
    list.forEach(j => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${j.title || ''}</h3>
        <div class="meta">${j.company || ''} • ${j.location || ''} • ${j.created ? new Date(j.created).toLocaleDateString() : ''}</div>
        <div>${(j.rawSnippet || '').replace(/</g,'&lt;')}</div>
        <div style="margin-top:8px;">
          <a class="btn" target="_blank" rel="noopener" href="${j.url}">View posting</a>
          <span style="font-size:12px; opacity:.7; margin-left:6px;">${j.source}</span>
        </div>
      `;
      elResults.appendChild(card);
    });
  }

  function applyFilters() {
    const term = (q.value || '').toLowerCase();
    const r = regionFilter.value;
    const role = roleFilter.value;
    const filtered = all.filter(j => {
      const matchesText = [j.title, j.company, j.location].join(' ').toLowerCase().includes(term);
      const matchesRegion = !r || j.region === r;
      const matchesRole = !role || j.roleMatched === role;
      return matchesText && matchesRegion && matchesRole;
    });
    render(filtered);
  }

  q.addEventListener('input', applyFilters);
  regionFilter.addEventListener('change', applyFilters);
  roleFilter.addEventListener('change', applyFilters);

  render(all);
}

load();
