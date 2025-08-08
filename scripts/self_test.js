import fs from 'fs';
const cfg = JSON.parse(fs.readFileSync('config/watchlists.json', 'utf-8'));
if (!cfg.watchlists || !cfg.regions) {
  console.error('Config missing keys');
  process.exit(1);
}
console.log('Config OK. Watchlists:', cfg.watchlists.map(w=>w.name).join(', '));
