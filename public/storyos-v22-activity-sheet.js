(() => {
  'use strict';

  const VERSION = '22.36.0';
  const STORAGE_PREFIX = 'storyos_activity_sheet_';

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const list = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
  const unique = (arr) => [...new Set(arr.filter(Boolean).map(x => String(x).trim()).filter(Boolean))];

  function findItem(id) {
    try {
      return STORIES.find(item => item.id === id) || null;
    } catch (_) {
      return null;
    }
  }

  function keyFor(id) {
    return STORAGE_PREFIX + id;
  }

  function readChecks(id) {
    try { return JSON.parse(localStorage.getItem(keyFor(id)) || '{}'); }
    catch (_) { return {}; }
  }

  function saveChecks(id, state) {
    localStorage.setItem(keyFor(id), JSON.stringify(state));
  }

  function classify(item) {
    const packing = unique(list(item.packing));
    const puppets = unique(list(item.puppets));
    const props = unique(list(item.props));
    const all = unique([...packing, ...puppets, ...props]);

    const books = all.filter(x => /ספר|כריכה|כרטיס הפעלה/.test(x));
    const digital = all.filter(x => /מחשב|מסך|מקרן|טלפון|סמארטפון|מצלמה|רמקול|מיקרופון|כבל|מטען|קובץ|תיקיית|גלריה|אפליקציה|PDF|מצגת/.test(x));
    const puppetSet = unique(puppets.filter(x => !/סבא שמעון/.test(x)));
    const propsSet = unique(props);

    const used = new Set([...books, ...digital, ...puppetSet, ...propsSet]);
    const equipment = all.filter(x => !used.has(x));

    return { books, digital, puppets: puppetSet, props: propsSet, equipment };
  }

  function beforeChecklist(item) {
    const base = [
      'בדיקת כתובת, שעה ופרטי המסגרת',
      'טלפון טעון',
      'בדיקת כל קובצי המדיה לפני יציאה',
      'בדיקת ארגז/שקית הציוד של הפעילות',
      'בדיקת רגע ה-WOW והאביזר המרכזי'
    ];
    if (item.program === 'שיר נולד בגן') {
      base.push('בדיקת גיטרה וכלי הקשה', 'בדיקת הקלטה ומיקרופון');
    }
    if (item.program === 'כשהציור קם לתחייה') {
      base.push('בדיקת חומרי ציור בכמות מספקת', 'פתיחת תיקיית השמירה של המפגש');
    }
    if (item.program === 'תיאטרון בובות') {
      base.push('בדיקת הבמה והסתרת המפעיל', 'סידור הבובות לפי סדר הופעה');
    }
    if (item.program === 'עולם קטן, קסם גדול') {
      base.push('בדיקת ניקיון ובטיחות האביזרים', 'בדיקת עוצמת הצליל');
    }
    if (item.program === 'שעת סיפור והמחשה') {
      base.push('בדיקת הספר המקורי', 'בדיקת בובות ואביזרי ההמחשה');
    }
    return unique(base);
  }

  function afterChecklist(item) {
    const base = ['רישום הערות קצרות מהמפגש', 'החזרת הציוד למקום', 'סימון ציוד שחסר/דורש תיקון'];
    if (item.program === 'כשהציור קם לתחייה') {
      base.push('צילום ושיוך היצירות לילדים', 'גיבוי התמונות', 'העברה לתהליך הסטודיו', 'עדכון סטטוס התוצרים');
    }
    if (item.program === 'שיר נולד בגן') {
      base.push('העתקת ההקלטה למחשב', 'מתן שם ברור לקובץ', 'גיבוי קובצי האודיו', 'עדכון סטטוס השיר');
    }
    if (item.program === 'שעת סיפור והמחשה') {
      base.push('שמירת הערת קשב/התאמה לפעם הבאה');
    }
    return unique(base);
  }

  function checkboxRows(activityId, section, items, state) {
    if (!items.length) return '<div class="as-empty">לא נדרש פריט ייעודי בסעיף זה.</div>';
    return `<div class="as-checks">${items.map((text, index) => {
      const id = `${section}_${index}`;
      const checked = !!state[id];
      return `<label class="as-check"><input type="checkbox" data-check-id="${id}" ${checked ? 'checked' : ''}><span>${escapeHtml(text)}</span></label>`;
    }).join('')}</div>`;
  }

  function timelineMarkup(item) {
    const timeline = list(item.timeline);
    if (!timeline.length) return '<div class="as-empty">לא קיים ציר זמן מפורט לפריט זה.</div>';
    return `<div class="as-timeline">${timeline.map(step => `<div class="as-step"><b>${escapeHtml(step.m || '')} · ${escapeHtml(step.title || '')}</b><span>${escapeHtml(step.cue || '')}</span></div>`).join('')}</div>`;
  }

  function ensureStyles() {
    if (document.getElementById('storyosActivitySheetStyles')) return;
    const style = document.createElement('style');
    style.id = 'storyosActivitySheetStyles';
    style.textContent = `
      .activity-sheet-btn{background:linear-gradient(135deg,#2589d8,#4867e8)!important;color:#fff!important;border-color:#2876c3!important;font-weight:700}
      .as-overlay{position:fixed;inset:0;z-index:99999;background:rgba(20,31,52,.58);display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow:auto;direction:rtl}
      .as-dialog{width:min(1080px,96vw);background:#fffdf8;border-radius:24px;box-shadow:0 26px 80px rgba(0,0,0,.28);border:1px solid #ded7ca;overflow:hidden}
      .as-head{position:sticky;top:0;z-index:2;background:#fffdf8;border-bottom:1px solid #ded7ca;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .as-title h2{margin:0;font-size:1.45rem}.as-title p{margin:4px 0 0;color:#64708a}
      .as-actions{display:flex;gap:8px;flex-wrap:wrap}.as-actions button{border:1px solid #d8d0c4;background:#fff;border-radius:12px;padding:9px 12px;cursor:pointer;font-weight:700}
      .as-actions .primary{background:#278bd8;color:#fff;border-color:#278bd8}.as-actions .good{background:#35a462;color:#fff;border-color:#35a462}
      .as-body{padding:20px}.as-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}.as-meta>div{border:1px solid #e3ddd2;border-radius:14px;padding:10px;background:#faf7f1}.as-meta small{display:block;color:#64708a;margin-bottom:4px}
      .as-summary{background:#f5f8ff;border:1px solid #dce8fa;border-radius:16px;padding:14px;line-height:1.6;margin-bottom:16px}
      .as-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.as-section{border:1px solid #e2dbcf;border-radius:16px;padding:14px;background:#fff}.as-section h3{margin:0 0 10px;font-size:1.05rem;color:#243b63}.as-section.full{grid-column:1/-1}
      .as-checks{display:grid;gap:8px}.as-check{display:flex;align-items:flex-start;gap:9px;padding:7px 8px;border-radius:10px;background:#faf9f5}.as-check input{width:20px;height:20px;margin:0;flex:0 0 auto}.as-check span{line-height:1.4}
      .as-empty{color:#8790a0;font-style:italic}.as-timeline{display:grid;gap:8px}.as-step{display:grid;grid-template-columns:190px 1fr;gap:10px;border-bottom:1px solid #eee7dc;padding:8px 0}.as-step span{line-height:1.5;color:#39445c}
      .as-footer-note{margin-top:16px;border-top:1px solid #e6dfd4;padding-top:12px;color:#64708a;font-size:.9rem}
      @media(max-width:760px){.as-meta,.as-grid{grid-template-columns:1fr}.as-section.full{grid-column:auto}.as-step{grid-template-columns:1fr}.as-overlay{padding:8px}.as-body{padding:12px}}
      @media print{body>*:not(.as-overlay){display:none!important}.as-overlay{position:static;background:#fff;padding:0;overflow:visible}.as-dialog{width:100%;box-shadow:none;border:0}.as-head{position:static}.as-actions{display:none!important}.as-body{padding:8px}.as-section{break-inside:avoid}.as-check input{appearance:none;width:15px;height:15px;border:1px solid #333;border-radius:2px}.as-check input:checked::after{content:'✓';display:block;font-size:13px;line-height:13px;text-align:center}.as-grid{gap:8px}.as-title h2{font-size:18pt}}
    `;
    document.head.appendChild(style);
  }

  function closeSheet() {
    document.querySelector('.as-overlay')?.remove();
  }

  function updateProgress(dialog) {
    const boxes = [...dialog.querySelectorAll('input[type="checkbox"]')];
    const checked = boxes.filter(x => x.checked).length;
    const label = dialog.querySelector('[data-role="progress"]');
    if (label) label.textContent = `מוכן: ${checked}/${boxes.length}`;
  }

  window.openActivitySheet = function(id) {
    const item = findItem(id);
    if (!item) {
      alert('לא נמצא תוכן הפעילות להפקת הדף.');
      return;
    }
    ensureStyles();
    closeSheet();

    const grouped = classify(item);
    const state = readChecks(id);
    const overlay = document.createElement('div');
    overlay.className = 'as-overlay';
    overlay.innerHTML = `
      <section class="as-dialog" role="dialog" aria-modal="true" aria-label="דף פעילות: ${escapeHtml(item.title)}">
        <div class="as-head">
          <div class="as-title"><h2>📋 דף פעילות — ${escapeHtml(item.title)}</h2><p>${escapeHtml(item.program || '')} · ${escapeHtml(item.category || '')}</p></div>
          <div class="as-actions">
            <button data-role="progress">מוכן: 0/0</button>
            <button data-action="reset">איפוס ✓</button>
            <button class="good" data-action="all">סמן הכול מוכן</button>
            <button class="primary" data-action="print">🖨️ הדפס / PDF</button>
            <button data-action="close">✕ סגור</button>
          </div>
        </div>
        <div class="as-body">
          <div class="as-meta">
            <div><small>פעילות</small><b>${escapeHtml(item.program || '')}</b></div>
            <div><small>מספר</small><b>${escapeHtml(item.num || '')}</b></div>
            <div><small>גיל</small><b>${escapeHtml(item.age || '')}</b></div>
            <div><small>משך</small><b>${escapeHtml(item.duration || '')}</b></div>
          </div>
          <div class="as-summary"><b>תוכן הפעילות:</b><br>${escapeHtml(item.summary || '')}<br><br><b>מסר / תוצר מרכזי:</b> ${escapeHtml(item.message || item.wow || '')}</div>
          <div class="as-grid">
            <div class="as-section"><h3>🎭 בובות / דמויות</h3>${checkboxRows(id,'puppets',grouped.puppets,state)}</div>
            <div class="as-section"><h3>📚 ספרים / חומר מודפס</h3>${checkboxRows(id,'books',grouped.books,state)}</div>
            <div class="as-section"><h3>🧰 אביזרים</h3>${checkboxRows(id,'props',grouped.props,state)}</div>
            <div class="as-section"><h3>💻 ציוד דיגיטלי / מדיה</h3>${checkboxRows(id,'digital',grouped.digital,state)}</div>
            <div class="as-section"><h3>📦 ציוד ואריזה נוספים</h3>${checkboxRows(id,'equipment',grouped.equipment,state)}</div>
            <div class="as-section"><h3>🚗 לפני יציאה</h3>${checkboxRows(id,'before',beforeChecklist(item),state)}</div>
            <div class="as-section full"><h3>🕒 מהלך הפעילות</h3>${timelineMarkup(item)}</div>
            <div class="as-section full"><h3>✅ אחרי הפעילות</h3>${checkboxRows(id,'after',afterChecklist(item),state)}</div>
          </div>
          ${item.wow ? `<div class="as-footer-note"><b>רגע WOW:</b> ${escapeHtml(item.wow)}</div>` : ''}
        </div>
      </section>`;
    document.body.appendChild(overlay);
    const dialog = overlay.querySelector('.as-dialog');

    dialog.addEventListener('change', (event) => {
      const box = event.target.closest('input[data-check-id]');
      if (!box) return;
      const next = readChecks(id);
      next[box.dataset.checkId] = box.checked;
      saveChecks(id, next);
      updateProgress(dialog);
    });

    dialog.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'close') closeSheet();
      if (action === 'print') window.print();
      if (action === 'reset') {
        saveChecks(id, {});
        dialog.querySelectorAll('input[type="checkbox"]').forEach(x => x.checked = false);
        updateProgress(dialog);
      }
      if (action === 'all') {
        const next = {};
        dialog.querySelectorAll('input[data-check-id]').forEach(x => { x.checked = true; next[x.dataset.checkId] = true; });
        saveChecks(id, next);
        updateProgress(dialog);
      }
    });

    overlay.addEventListener('click', event => { if (event.target === overlay) closeSheet(); });
    updateProgress(dialog);
  };

  function activityIdFromCard(card) {
    const button = card.querySelector('button[onclick*="openStory("]') || card.querySelector('button[onclick*="startLive("]');
    if (!button) return null;
    const raw = button.getAttribute('onclick') || '';
    const match = raw.match(/(?:openStory|startLive)\(['"]([^'"]+)['"]\)/);
    return match ? match[1] : null;
  }

  function enhanceCards() {
    document.querySelectorAll('.card').forEach(card => {
      if (card.querySelector('.activity-sheet-btn')) return;
      const id = activityIdFromCard(card);
      if (!id || !findItem(id)) return;
      const actions = card.querySelector('.card-actions');
      if (!actions) return;
      const btn = document.createElement('button');
      btn.className = 'btn small activity-sheet-btn';
      btn.type = 'button';
      btn.textContent = '📋 הפקת דף פעילות';
      btn.addEventListener('click', (event) => { event.stopPropagation(); window.openActivitySheet(id); });
      actions.insertBefore(btn, actions.querySelector('.star'));
    });
  }

  function enhanceDetail() {
    const detail = document.getElementById('detail');
    if (!detail || detail.classList.contains('hidden')) return;
    const actions = detail.querySelector('.detail-actions');
    if (!actions || actions.querySelector('.activity-sheet-btn')) return;
    try {
      if (!current?.id) return;
      const btn = document.createElement('button');
      btn.className = 'btn activity-sheet-btn';
      btn.type = 'button';
      btn.textContent = '📋 הפקת דף פעילות';
      btn.addEventListener('click', () => window.openActivitySheet(current.id));
      actions.appendChild(btn);
    } catch (_) {}
  }

  function enhanceLive() {
    const live = document.getElementById('live');
    if (!live || live.classList.contains('hidden') || live.querySelector('.activity-sheet-btn')) return;
    try {
      if (!current?.id) return;
      const top = live.querySelector('.live-top') || live.querySelector('.detail-actions') || live.firstElementChild;
      if (!top) return;
      const btn = document.createElement('button');
      btn.className = 'btn small activity-sheet-btn';
      btn.type = 'button';
      btn.textContent = '📋 דף פעילות';
      btn.addEventListener('click', () => window.openActivitySheet(current.id));
      top.appendChild(btn);
    } catch (_) {}
  }

  ensureStyles();
  const observer = new MutationObserver(() => {
    enhanceCards();
    enhanceDetail();
    enhanceLive();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  enhanceCards();
  enhanceDetail();
  enhanceLive();

  console.info(`[StoryOS] Activity sheet checklist loaded v${VERSION}`);
})();