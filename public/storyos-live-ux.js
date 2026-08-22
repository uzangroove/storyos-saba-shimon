(() => {
  const VISIBLE = (el) => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');

  function addStyles() {
    if (document.getElementById('storyosV21LiveUxStyles')) return;
    const style = document.createElement('style');
    style.id = 'storyosV21LiveUxStyles';
    style.textContent = `
      body.storyos-activity-focus .activity-tiles,
      body.storyos-activity-focus #v20UnifiedControls{display:none!important}
      body.storyos-activity-focus .v20-main-layout{display:block!important}
      body.storyos-activity-focus .v20-main-layout>.dashboard-wrap{width:100%!important}

      body.storyos-live-focus{padding-bottom:92px!important}
      body.storyos-live-focus header{display:none!important}
      body.storyos-live-focus .activity-tiles,
      body.storyos-live-focus #v20UnifiedControls,
      body.storyos-live-focus .hero-banner{display:none!important}
      body.storyos-live-focus main{max-width:none!important;padding:10px 12px 18px!important}
      body.storyos-live-focus .live-top{position:sticky;top:0;z-index:44;background:rgba(248,244,237,.96);backdrop-filter:blur(8px);padding:8px 0;margin-bottom:8px!important}
      body.storyos-live-focus .live-nav{display:none!important}
      body.storyos-live-focus .live-card{min-height:calc(100vh - 180px)!important}
      body.storyos-live-focus .live-layout{gap:10px!important}

      #storyosV21LiveBar{position:fixed;left:0;right:0;bottom:0;z-index:999;background:rgba(255,253,249,.98);backdrop-filter:blur(10px);border-top:1px solid var(--line,#ddd5c9);box-shadow:0 -8px 24px rgba(29,41,64,.10);padding:max(8px,env(safe-area-inset-bottom)) 10px 8px}
      #storyosV21LiveBar .inner{max-width:1500px;margin:auto;display:grid;grid-template-columns:auto auto minmax(88px,1fr) auto auto auto;gap:8px;align-items:center}
      #storyosV21LiveBar button{min-height:48px;border:1px solid var(--line,#ddd5c9);background:#fff;border-radius:14px;padding:9px 13px;font-weight:800;color:var(--ink,#1d2940);cursor:pointer}
      #storyosV21LiveBar button.primary{background:linear-gradient(135deg,var(--primary,#f09a29),#ffb752);color:#fff;border-color:#e28b19}
      #storyosV21LiveBar .time{min-height:48px;display:grid;place-items:center;border-radius:14px;background:#1d2940;color:#fff;font-size:1.1rem;font-weight:900;font-variant-numeric:tabular-nums;padding:8px 12px;white-space:nowrap}
      #storyosV21LiveBar .disabled{opacity:.45;pointer-events:none}
      body.storyos-live-steps-hidden .steps-mini{display:none!important}

      #storyosV21ActivityHome{position:fixed;top:12px;left:12px;z-index:998;border:1px solid var(--line,#ddd5c9);background:rgba(255,255,255,.96);border-radius:13px;padding:9px 12px;box-shadow:0 5px 18px rgba(29,41,64,.12);font-weight:800;cursor:pointer}
      body.storyos-live-focus #storyosV21ActivityHome{top:10px}

      @media(max-width:900px){
        body.storyos-live-focus .live-layout{grid-template-columns:1fr!important}
        body.storyos-live-focus .live-presentation{order:2}
        #storyosV21LiveBar .inner{grid-template-columns:1fr 1fr 1fr;gap:6px}
        #storyosV21LiveBar button,#storyosV21LiveBar .time{min-height:46px;padding:8px;font-size:.92rem}
        #storyosV21LiveBar .time{grid-column:2}
      }
      @media(max-width:560px){
        body.storyos-live-focus{padding-bottom:144px!important}
        #storyosV21LiveBar .inner{grid-template-columns:repeat(3,1fr)}
        #storyosV21ActivityHome{top:7px;left:7px;padding:8px 10px;font-size:.88rem}
      }
    `;
    document.head.appendChild(style);
  }

  function textOf(el){ return (el?.textContent || '').replace(/\s+/g,' ').trim(); }
  function visible(selector){ return [...document.querySelectorAll(selector)].find(VISIBLE) || null; }

  function findBackButton() {
    const buttons = [...document.querySelectorAll('button,a')].filter(VISIBLE);
    return buttons.find(el => /חזרה|לרשימה|ספרים|פעילויות/.test(textOf(el)) && !el.closest('#storyosV21LiveBar')) || null;
  }

  function ensureHomeButton(activityMode) {
    let btn = document.getElementById('storyosV21ActivityHome');
    if (!activityMode) { btn?.remove(); return; }
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'storyosV21ActivityHome';
      btn.type = 'button';
      btn.textContent = '↩ חזרה';
      btn.addEventListener('click', () => {
        const target = findBackButton();
        if (target) target.click();
        else window.scrollTo({top:0,behavior:'smooth'});
      });
      document.body.appendChild(btn);
    }
  }

  function ensureLiveBar(live) {
    let bar = document.getElementById('storyosV21LiveBar');
    if (!live) { bar?.remove(); return; }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'storyosV21LiveBar';
      bar.innerHTML = `<div class="inner">
        <button type="button" data-act="prev">→ הקודם</button>
        <button type="button" class="primary" data-act="next">הבא ←</button>
        <div class="time" data-role="time">00:00</div>
        <button type="button" data-act="book">📖 ספר</button>
        <button type="button" data-act="steps">☰ שלבים</button>
        <button type="button" data-act="full">⛶ מלא</button>
      </div>`;
      document.body.appendChild(bar);

      bar.querySelector('[data-act="prev"]').addEventListener('click', () => {
        const originals = [...document.querySelectorAll('.live-nav button')];
        originals[0]?.click();
      });
      bar.querySelector('[data-act="next"]').addEventListener('click', () => {
        const originals = [...document.querySelectorAll('.live-nav button')];
        originals[1]?.click();
      });
      bar.querySelector('[data-act="book"]').addEventListener('click', () => {
        window.top.location.href = '/book-flip-viewer.html?v=21.1.0';
      });
      bar.querySelector('[data-act="steps"]').addEventListener('click', () => {
        document.body.classList.toggle('storyos-live-steps-hidden');
      });
      bar.querySelector('[data-act="full"]').addEventListener('click', async () => {
        try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch {}
      });
    }

    const originals = [...document.querySelectorAll('.live-nav button')];
    const prev = bar.querySelector('[data-act="prev"]');
    const next = bar.querySelector('[data-act="next"]');
    prev?.classList.toggle('disabled', !!originals[0]?.disabled);
    next?.classList.toggle('disabled', !!originals[1]?.disabled);

    const timer = visible('.timer');
    const time = bar.querySelector('[data-role="time"]');
    if (time && timer) time.textContent = textOf(timer) || '00:00';
  }

  function sync() {
    addStyles();
    const live = !!visible('.live-layout');
    const detail = !!visible('.hero');
    const activityMode = live || detail;
    document.body.classList.toggle('storyos-live-focus', live);
    document.body.classList.toggle('storyos-activity-focus', activityMode && !live);
    if (!live) document.body.classList.remove('storyos-live-steps-hidden');
    ensureHomeButton(activityMode);
    ensureLiveBar(live);
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; sync(); });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, {once:true});
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});
  setInterval(sync, 1000);
})();
