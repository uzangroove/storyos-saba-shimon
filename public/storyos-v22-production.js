(() => {
  const ACTIVE_STORY_COUNT = 16;
  const VERSION = '22.1.0';
  const $ = (sel) => document.querySelector(sel);

  function isActiveItem(item) {
    return !item || item.program !== 'שעת סיפור והמחשה' || Number(item.num || 0) <= ACTIVE_STORY_COUNT;
  }

  function addStyles() {
    if (document.getElementById('storyos-v22-production-style')) return;
    const style = document.createElement('style');
    style.id = 'storyos-v22-production-style';
    style.textContent = `
      body.v22-focus #v20UnifiedControls{display:none!important}
      body.v22-focus .v20-main-layout{display:none!important}
      body.v22-focus main{max-width:1800px;padding-top:14px}
      body.v22-focus #detail,body.v22-focus #live,body.v22-focus #audit{width:100%;max-width:1720px;margin:0 auto}
      body.v22-focus #detail .grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      body.v22-focus #live .live-layout{grid-template-columns:minmax(0,1.25fr) minmax(360px,.95fr);align-items:start}
      body.v22-focus #live .live-card{min-height:360px}
      body.v22-focus #live .steps-mini{max-height:240px}
      .v22-admin-modal{position:fixed;inset:0;z-index:1000;background:rgba(29,41,64,.5);display:grid;place-items:center;padding:20px}
      .v22-admin-box{width:min(980px,96vw);max-height:90vh;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:24px;box-shadow:0 24px 70px rgba(0,0,0,.22);padding:22px}
      .v22-admin-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:18px}
      .v22-admin-head h2{margin:0}.v22-admin-head p{margin:5px 0 0;color:var(--muted)}
      .v22-admin-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:14px 0}
      .v22-admin-stat{border:1px solid var(--line);border-radius:16px;padding:12px;background:#faf8f3}.v22-admin-stat b{display:block;font-size:1.35rem}
      .v22-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .v22-admin-panel{border:1px solid var(--line);border-radius:18px;padding:14px;background:#fffdf8}
      .v22-admin-list{display:grid;gap:7px;max-height:340px;overflow:auto}.v22-admin-row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #eee;padding:7px 0}
      .v22-badge{display:inline-block;border-radius:999px;padding:3px 8px;font-size:.8rem}.v22-badge.active{background:#edfff3;color:#246b42}.v22-badge.archive{background:#fff3e5;color:#8a5815}
      .v22-flip-btn{background:linear-gradient(135deg,#2ea6ff,#6c50e0)!important;color:#fff!important;border-color:#5c61d6!important}
      @media(max-width:1000px){body.v22-focus #live .live-layout{grid-template-columns:1fr}.v22-admin-stats{grid-template-columns:repeat(2,1fr)}.v22-admin-grid{grid-template-columns:1fr}}
      @media(max-width:760px){body.v22-focus #detail .grid{grid-template-columns:1fr}.v22-admin-box{padding:15px}.v22-admin-stats{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function getStories() {
    try { return Array.isArray(STORIES) ? STORIES : []; } catch (_) { return []; }
  }

  function updateReleaseIdentity() {
    document.title = 'Story OS · סבא שמעון · גרסה 22';
    const subtitle = $('.brand p');
    if (subtitle) subtitle.textContent = subtitle.textContent.replace(/גרסה\s*20(?:\.\d+)?/g, 'גרסה 22');
    const auditBtn = $('#auditBtn');
    if (auditBtn) auditBtn.textContent = 'בדיקת מאגר הספרים';
    const exportBtn = $('#exportBooksBtn');
    if (exportBtn) {
      exportBtn.textContent = '📊 ייצוא מאגר ספרים';
      exportBtn.title = 'ייצוא מאגר הספרים המלא, כולל ספרי הארכיון';
    }
  }

  function wrapFiltering() {
    if (window.__storyosV22ActiveFilterWrapped || typeof window.filtered !== 'function') return;
    const baseFiltered = window.filtered;
    window.filtered = function() {
      return baseFiltered().filter(isActiveItem);
    };
    window.__storyosV22ActiveFilterWrapped = true;
    if (typeof window.render === 'function') window.render();
  }

  function toggleFocusMode() {
    const focused = ['#detail','#live','#audit'].some(sel => {
      const el = $(sel);
      return el && !el.classList.contains('hidden');
    });
    document.body.classList.toggle('v22-focus', focused);
  }

  function installFocusObserver() {
    const targets = ['#dashboard','#detail','#live','#audit'].map($).filter(Boolean);
    const observer = new MutationObserver(toggleFocusMode);
    targets.forEach(el => observer.observe(el, {attributes:true, attributeFilter:['class']}));
    toggleFocusMode();
  }

  function injectFlipButton(id) {
    const detail = $('#detail');
    if (!detail || detail.classList.contains('hidden')) return;
    const story = getStories().find(s => s.id === id);
    if (!story || story.program !== 'שעת סיפור והמחשה') return;
    const actions = detail.querySelector('.detail-actions');
    if (!actions || actions.querySelector('[data-v22-flip]')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn v22-flip-btn';
    btn.dataset.v22Flip = '1';
    btn.textContent = '📖 פתח ספר בפליפ';
    btn.addEventListener('click', () => {
      const url = new URL('/book-viewer.html', location.origin);
      url.searchParams.set('v', VERSION);
      url.searchParams.set('story', story.id);
      url.searchParams.set('title', story.title);
      window.open(url.toString(), '_blank', 'noopener');
    });
    const liveBtn = actions.querySelector('.primary');
    if (liveBtn && liveBtn.nextSibling) actions.insertBefore(btn, liveBtn.nextSibling);
    else actions.prepend(btn);
  }

  function wrapNavigation() {
    if (window.__storyosV22NavigationWrapped) return;
    if (typeof window.openStory === 'function') {
      const baseOpen = window.openStory;
      window.openStory = function(id) {
        const story = getStories().find(s => s.id === id);
        if (story && !isActiveItem(story)) return;
        const out = baseOpen(id);
        setTimeout(() => { injectFlipButton(id); toggleFocusMode(); }, 0);
        return out;
      };
    }
    if (typeof window.startLive === 'function') {
      const baseLive = window.startLive;
      window.startLive = function(id) {
        const story = getStories().find(s => s.id === id);
        if (story && !isActiveItem(story)) return;
        const out = baseLive(id);
        setTimeout(toggleFocusMode, 0);
        return out;
      };
    }
    window.__storyosV22NavigationWrapped = true;
  }

  function closeAdmin() {
    document.querySelector('.v22-admin-modal')?.remove();
  }

  function openAdmin() {
    closeAdmin();
    const stories = getStories();
    const books = stories.filter(s => s.program === 'שעת סיפור והמחשה').sort((a,b)=>(a.num||0)-(b.num||0));
    const active = books.filter(isActiveItem);
    const archive = books.filter(s => !isActiveItem(s));
    const counts = {
      art: stories.filter(s => s.program === 'כשהציור קם לתחייה').length,
      puppet: stories.filter(s => s.program === 'תיאטרון בובות').length,
      toddler: stories.filter(s => s.program === 'עולם קטן, קסם גדול').length,
      music: stories.filter(s => s.program === 'שיר נולד בגן').length
    };
    const modal = document.createElement('div');
    modal.className = 'v22-admin-modal';
    modal.innerHTML = `
      <div class="v22-admin-box" role="dialog" aria-modal="true" aria-label="ניהול StoryOS">
        <div class="v22-admin-head"><div><h2>ניהול StoryOS · גרסה 22</h2><p>מאגר ההרחבה נשמר, ובתצוגת העבודה מוצגים רק 16 ספרי שעת הסיפור הפעילים.</p></div><button class="btn" data-close>✕ סגור</button></div>
        <div class="v22-admin-stats">
          <div class="v22-admin-stat"><b>${active.length}</b><span>ספרים פעילים</span></div>
          <div class="v22-admin-stat"><b>${archive.length}</b><span>ספרים בארכיון</span></div>
          <div class="v22-admin-stat"><b>${counts.art}</b><span>ציור קם לתחייה</span></div>
          <div class="v22-admin-stat"><b>${counts.puppet}</b><span>הצגות בובות</span></div>
          <div class="v22-admin-stat"><b>${counts.toddler + counts.music}</b><span>פעוטות + מוזיקה</span></div>
        </div>
        <div class="v22-admin-grid">
          <section class="v22-admin-panel"><h3>16 הספרים הפעילים</h3><div class="v22-admin-list">${active.map(s=>`<div class="v22-admin-row"><span>${s.num}. ${s.title}</span><span class="v22-badge active">פעיל</span></div>`).join('')}</div></section>
          <section class="v22-admin-panel"><h3>מאגר הרחבה</h3><div class="v22-admin-list">${archive.map(s=>`<div class="v22-admin-row"><span>${s.num}. ${s.title}</span><span class="v22-badge archive">ארכיון</span></div>`).join('')}</div></section>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
          <button class="btn" data-audit>בדיקת מאגר מלא</button>
          <button class="btn" data-export>ייצוא מאגר מלא</button>
          <button class="btn primary" data-home>חזרה למסך העבודה</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-close]').onclick = closeAdmin;
    modal.addEventListener('click', e => { if (e.target === modal) closeAdmin(); });
    modal.querySelector('[data-audit]').onclick = () => { closeAdmin(); if (typeof window.showAudit === 'function') window.showAudit(); };
    modal.querySelector('[data-export]').onclick = () => { if (typeof window.exportBooksTable === 'function') window.exportBooksTable(); };
    modal.querySelector('[data-home]').onclick = () => { closeAdmin(); if (typeof window.goHome === 'function') window.goHome(); };
  }

  function installAdminButton() {
    const actions = $('.head-actions');
    if (!actions || $('#v22AdminBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'v22AdminBtn';
    btn.type = 'button';
    btn.textContent = '⚙ ניהול';
    btn.className = 'btn secondary';
    btn.addEventListener('click', openAdmin);
    const home = $('#homeBtn');
    if (home && home.nextSibling) actions.insertBefore(btn, home.nextSibling);
    else actions.prepend(btn);
  }

  function init() {
    addStyles();
    updateReleaseIdentity();
    wrapFiltering();
    wrapNavigation();
    installAdminButton();
    installFocusObserver();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), {once:true});
  else setTimeout(init, 0);
})();
