window.StoryOSLive = {
  async load() {
    const r = await fetch('/api/v21-data', { headers: { Accept: 'application/json' } });
    const data = await r.json();
    if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  },
  esc(v) { return String(v ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
  date(v) { if (!v) return '—'; const [y,m,d] = v.split('-'); return `${d}.${m}.${y}`; },
  time(v) { return v ? String(v).slice(0,5) : '—'; },
  status(v) { return v === 'HOLIDAY' ? '<span class="chip warn">חופשה</span>' : '<span class="chip ok">מתוכנן</span>'; }
};
