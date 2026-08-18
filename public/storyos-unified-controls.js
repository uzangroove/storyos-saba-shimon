(() => {
  const $ = (sel) => document.querySelector(sel);

  function addStyles() {
    const style = document.createElement('style');
    style.id = 'v20-unified-controls-style';
    style.textContent = `
      main{max-width:1800px}
      .v20-main-layout{display:flex;flex-direction:row;gap:18px;align-items:flex-start;margin-top:18px}
      #v20UnifiedControls{width:390px;min-width:390px;flex:0 0 390px;position:sticky;top:102px;background:var(--paper);border:1px solid var(--line);border-radius:24px;padding:16px;box-shadow:var(--shadow);z-index:10}
      #v20UnifiedControls h2{margin:0;font-size:1.25rem}
      #v20UnifiedControls .v20-sub{margin:4px 0 14px;color:var(--muted);font-size:.9rem;line-height:1.45}
      .v20-control-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
      .v20-control{display:flex;flex-direction:column;gap:6px;font-size:.9rem;font-weight:700;min-width:0}
      .v20-control.search{grid-column:1/-1}
      .v20-control input,.v20-control select{width:100%;min-width:0;border:1px solid var(--line);background:#fff;border-radius:13px;padding:10px 11px;color:var(--ink)}
      .v20-actions{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
      .v20-actions button{flex:1;min-width:120px}
      .v20-result-note{margin-top:10px;padding:9px 11px;border-radius:12px;background:#f7f3ff;color:#55428f;font-size:.86rem;line-height:1.4}
      .v20-main-layout>.dashboard-wrap{flex:1 1 auto;min-width:0;margin:0}
      .v20-main-layout>.dashboard-wrap>.controls{display:none!important}
      #todayPlanner{display:none!important}
      #v20UnifiedControls .v20-hidden-source{display:none!important}
      @media(max-width:1180px){
        .v20-main-layout{flex-direction:column}
        #v20UnifiedControls{width:100%;min-width:0;flex:1 1 auto;position:static}
        .v20-main-layout>.dashboard-wrap{width:100%}
      }
      @media(max-width:620px){
        .v20-control-grid{grid-template-columns:1fr}
        .v20-control.search{grid-column:auto}
        #v20UnifiedControls{padding:14px}
      }
    `;
    document.head.appendChild(style);
  }

  function field(labelText, control, extraClass='') {
    const label = document.createElement('label');
    label.className = `v20-control ${extraClass}`.trim();
    const title = document.createElement('span');
    title.textContent = labelText;
    label.append(title, control);
    return label;
  }

  function init() {
    if ($('#v20UnifiedControls')) return;

    const controls = {
      search: $('#search'),
      program: $('#program'),
      age: $('#ageFilter'),
      theme: $('#theme'),
      season: $('#season'),
      count: $('#pCount'),
      setting: $('#pSetting')
    };
    if (Object.values(controls).some((el) => !el)) {
      console.warn('StoryOS v20 unified controls: required controls were not found.');
      return;
    }

    addStyles();

    const oldPlanner = $('#todayPlanner');
    const dashboard = $('.dashboard-wrap');
    if (!dashboard || !dashboard.parentElement) return;

    const category = $('#category');
    if (category) category.value = '';
    const attention = $('#pAttention');
    if (attention) attention.value = '';

    const layout = document.createElement('div');
    layout.className = 'v20-main-layout';
    dashboard.parentElement.insertBefore(layout, dashboard);

    const aside = document.createElement('aside');
    aside.id = 'v20UnifiedControls';
    aside.setAttribute('aria-label', 'בחירת פעילות');
    aside.innerHTML = '<h2>בחירת פעילות</h2><p class="v20-sub">מסננים פעם אחת — וכל התוצאות מתעדכנות במקום אחד.</p>';

    const grid = document.createElement('div');
    grid.className = 'v20-control-grid';
    grid.append(
      field('חיפוש חופשי', controls.search, 'search'),
      field('סוג פעילות', controls.program),
      field('גיל הילדים', controls.age),
      field('נושא / ערך', controls.theme),
      field('עונה / חג', controls.season),
      field('מספר ילדים', controls.count),
      field('סוג מסגרת', controls.setting)
    );

    const actions = document.createElement('div');
    actions.className = 'v20-actions';
    const showBtn = document.createElement('button');
    showBtn.className = 'btn primary';
    showBtn.type = 'button';
    showBtn.textContent = 'הצג פעילויות מתאימות';
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn';
    clearBtn.type = 'button';
    clearBtn.textContent = 'נקה הכל';
    actions.append(showBtn, clearBtn);

    const note = document.createElement('div');
    note.className = 'v20-result-note';
    note.textContent = 'התוצאות מסוננות לפי חיפוש, פעילות, גיל, נושא ועונה; מספר הילדים וסוג המסגרת משפיעים על סדר ההתאמה.';

    aside.append(grid, actions, note);
    layout.append(aside, dashboard);

    if (oldPlanner) oldPlanner.classList.add('v20-hidden-source');

    // Preserve the existing filtering logic, and add relevance ordering for
    // group size and setting without duplicating any controls.
    if (typeof window.filtered === 'function' && !window.__storyosV20FilteredWrapped) {
      const baseFiltered = window.filtered;
      window.filtered = function() {
        const rows = baseFiltered();
        const count = controls.count.value;
        const setting = controls.setting.value;
        return rows.slice().sort((a, b) => {
          const aBase = Number(a.score || 0);
          const bBase = Number(b.score || 0);
          const aSize = typeof window.sizeBonus === 'function' ? window.sizeBonus(a, count) : 0;
          const bSize = typeof window.sizeBonus === 'function' ? window.sizeBonus(b, count) : 0;
          const aSetting = typeof window.settingBonus === 'function' ? window.settingBonus(a, setting) : 0;
          const bSetting = typeof window.settingBonus === 'function' ? window.settingBonus(b, setting) : 0;
          return (bBase + bSize + bSetting) - (aBase + aSize + aSetting);
        });
      };
      window.__storyosV20FilteredWrapped = true;
    }

    const refresh = () => {
      if (typeof window.render === 'function') window.render();
    };
    controls.count.addEventListener('change', refresh);
    controls.setting.addEventListener('change', refresh);

    showBtn.addEventListener('click', () => {
      refresh();
      dashboard.scrollIntoView({behavior:'smooth', block:'start'});
    });

    clearBtn.addEventListener('click', () => {
      controls.search.value = '';
      controls.program.value = '';
      controls.age.value = '';
      controls.theme.value = '';
      controls.season.value = '';
      controls.count.value = '';
      controls.setting.value = '';
      if (category) category.value = '';
      if (attention) attention.value = '';
      refresh();
    });

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), {once:true});
  } else {
    setTimeout(init, 0);
  }
})();
