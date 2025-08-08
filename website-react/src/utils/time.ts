export const NEW_WINDOW_HOURS = 36
export function fmtDate(s?: any){ const t = String(s||''); return t ? new Date(t).toLocaleDateString() : '' }
export function timeAgo(iso?: any){ const t = String(iso||''); if(!t) return ''; const diff = Math.floor((Date.now() - +new Date(t))/1000); const d = Math.floor(diff/86400); if(d>0) return d+'d'; const h = Math.floor((diff%86400)/3600); if(h>0) return h+'h'; const m = Math.floor((diff%3600)/60); return m+'m' }
export function isNew(iso?: any){ const t = String(iso||''); if(!t) return false; return Date.now() - +new Date(t) <= NEW_WINDOW_HOURS*3600*1000 }
