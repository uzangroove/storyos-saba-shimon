(() => {
  'use strict';
  const VERSION='22.40.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const BUCKET='saba-ganim-arava.firebasestorage.app';
  const FIREBASE_ROOT=`https://storage.googleapis.com/${BUCKET}`;
  const BRAND_DATA='data:image/webp;base64,UklGRipsAABXRUJQVlA4WAoAAAAQAAAANAEA8wEAQUxQSDMWAAAB/yckSPD/eGtEpO4TkiTJbSQJCWB0C0lSEFh3YH4P3uF9w+fXW8JX1+vK/ieD+f78fPyd4aT6Jc0RzTmq3cP3qvR4Y/9dIuLQ9PpmM4z4Yz1j3lP1krh8/6g9+F7tP2P1mN7lQ8fhswq5zK4P/9V4Gx2e3tDxK6nT6J4mSx7vG6dkZfGv9q0Hn8J+o8uXm6d/HK6/2A9k2Yx7e1uN4ZQm3qj3J7t7b4c9nQz7g3n7c0uYy0f7m0o1x8p0+Y4W6Wl3zS2e+2C3R4O5iT3D6U4h9S2hN0X8i8f1O1bJ8u3g7y8cZl9o4k8f2mHkV8a7Wm3q0Tn4w5f0X4V8H9W6H9k1v7V7P0r3f6l4uVv9u8j9g8d7h+qv9G0b4f8g9i4j8f2b7j8w9f6q8o7f5m9l8v7f6s8r9n8v9w8j9i9k8l9m8n9o9p8q9r8s9t8u9v8w9x8y9z8A9B8C9D8E9F8G9H8I9J8K9L8M9N8O9P8Q9R8S9T8U9V8W9X8Y9Z8a9b8c9d8e9f8g9h8i9j8k9l8m9n8o9p8q9r8s9t8u9v8w9x8y9z8+9/9AA==';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const items=[
    {id:'story-hour',program:'שעת סיפור והמחשה',title:'שעת סיפור בהמחשה',file:'storyos/ui/home/activities/storytelling.png',fallback:'📖'},
    {id:'drawing-alive',program:'כשהציור קם לתחייה',title:'כשהציור קם לתחייה',file:'storyos/ui/home/activities/drawing-alive.png',fallback:'🎨'},
    {id:'puppet-theater',program:'תיאטרון בובות',title:'תיאטרון בובות אינטימי לגן',file:'storyos/ui/home/activities/puppet-theater.png',fallback:'🎭'},
    {id:'little-world',program:'עולם קטן, קסם גדול',title:'עולם קטן, קסם גדול',file:'storyos/ui/home/activities/toddler-world.png',fallback:'🧸'},
    {id:'music-garden',program:'שיר נולד בגן',title:'שיר נולד בגן',file:'storyos/ui/home/activities/music-garden.png',fallback:'🎵'},
    {id:'gardens',program:null,title:'גנים',file:'storyos/ui/home/activities/gardens.png',fallback:'🏡'}
  ];

  function loadAdmin(){
    try{
      const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');
      return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]};
    }catch(_){
      return {gardens:[],teachers:[],events:[]};
    }
  }
  function direct(path){return `${FIREBASE_ROOT}/${path.split('/').map(encodeURIComponent).join('/')}`}

  function addStyles(){
    if($('#v2218HomeStyle'))return;
    const s=document.createElement('style');
    s.id='v2218HomeStyle';
    s.textContent=`
      #v2218Home{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(circle at 50% -10%,#fff 0,#fbf7ef 38%,#f2eadf 100%);overflow:auto;color:#1d2940;font-family:Arial,"Noto Sans Hebrew",sans-serif}
      #v2218Home .v2218-wrap{width:min(1380px,95vw);min-height:100dvh;margin:auto;padding:18px 18px 24px;display:flex;flex-direction:column;justify-content:center}
      #v2218Home .v2218-brand{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:14px}
      #v2218Home .v2218-logo{width:min(145px,28vw);height:min(145px,28vw);max-height:145px;object-fit:contain;filter:drop-shadow(0 12px 20px rgba(40,40,50,.12));background:transparent}
      #v2218Home .v2218-brand h1{margin:5px 0 2px;font-size:clamp(1.55rem,2.4vw,2.25rem)}
      #v2218Home .v2218-brand p{margin:0;color:#6a7180;font-size:clamp(.92rem,1.2vw,1.05rem)}
      #v2218Home .v2218-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
      #v2218Home .v2218-tile{border:1px solid rgba(207,198,186,.72);background:rgba(255,255,255,.78);border-radius:23px;padding:13px 14px 12px;min-height:214px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;box-shadow:0 8px 20px rgba(45,50,65,.065);transition:.18s transform,.18s box-shadow,.18s border-color;color:#1d2940}
      #v2218Home .v2218-tile:hover{transform:translateY(-3px);box-shadow:0 13px 27px rgba(45,50,65,.11);border-color:#bdb0e7}
      #v2218Home .v2218-tile:focus-visible{outline:4px solid rgba(108,80,224,.25);outline-offset:3px}
      #v2218Home .v2218-iconbox{width:100%;height:158px;display:flex;align-items:center;justify-content:center;background:transparent!important;border:0!important;box-shadow:none!important;padding:0;overflow:visible}
      #v2218Home .v2218-icon{width:auto!important;height:auto!important;max-width:92%!important;max-height:154px!important;object-fit:contain!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important;margin:0!important;display:block}
      #v2218Home .v2218-fallback{font-size:78px;line-height:1}
      #v2218Home .v2218-title{margin:0;min-height:34px;display:flex;align-items:center;justify-content:center;font-size:clamp(1.03rem,1.45vw,1.30rem);line-height:1.18;font-weight:900;text-align:center}
      #v2218Home .v2218-gardens .v2218-title{color:#355b43}
      #v2218Home .v2218-footer{text-align:center;color:#777f8e;font-size:.86rem;margin-top:11px}
      .v2218-hidden{display:none!important}
      .v2218-admin-link{background:none;border:0;color:#777f8e;font:inherit;text-decoration:underline;cursor:pointer;padding:0;margin-right:6px}
      .v2218-admin-link:hover{color:#4a4f5f}
      #v2218GardenPicker{position:fixed;inset:0;z-index:2147483100;background:rgba(22,28,42,.56);display:grid;place-items:center;padding:18px}
      .v2218-pickerbox{width:min(980px,96vw);max-height:90dvh;overflow:auto;background:#fffdf8;border-radius:26px;padding:20px;border:1px solid #dfd7ca;box-shadow:0 26px 80px rgba(0,0,0,.26)}
      .v2218-pickerhead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
      .v2218-pickerhead h2{margin:0}.v2218-pickerhead p{margin:4px 0 0;color:#6a7180}
      .v2218-gardengrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
      .v2218-garden{border:1px solid #e0d8cb;background:#fff;border-radius:18px;padding:15px;text-align:right}
      .v2218-garden:hover{border-color:#6c50e0;background:#faf8ff}.v2218-garden b{display:block;font-size:1.08rem;margin-bottom:5px}.v2218-garden small{color:#6a7180}
      .v2218-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
      .v2218-btn{border:1px solid #d8d0c5;border-radius:12px;background:#fff;padding:9px 12px}.v2218-btn.primary{background:#6c50e0;color:#fff;border-color:#5e45d7}
      @media(max-width:900px){#v2218Home .v2218-wrap{justify-content:flex-start}#v2218Home .v2218-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}#v2218Home .v2218-tile{min-height:188px;padding:11px}#v2218Home .v2218-iconbox{height:132px}#v2218Home .v2218-icon{max-height:128px!important;max-width:94%!important}}
      @media(max-width:560px){#v2218Home .v2218-wrap{padding:12px 10px 18px}#v2218Home .v2218-brand{margin-bottom:9px}#v2218Home .v2218-logo{max-height:94px;width:min(94px,24vw);height:min(94px,24vw)}#v2218Home .v2218-grid{gap:9px}#v2218Home .v2218-tile{min-height:154px;border-radius:17px;padding:8px;gap:6px}#v2218Home .v2218-iconbox{height:108px}#v2218Home .v2218-icon{max-height:104px!important;max-width:96%!important}#v2218Home .v2218-title{font-size:.92rem;min-height:28px}}
    `;
    document.head.appendChild(s);
  }

  function tileMarkup(it){return `<button class="v2218-tile ${it.id==='gardens'?'v2218-gardens':''}" type="button" data-home-id="${it.id}"><span class="v2218-iconbox"><img class="v2218-icon" data-firebase-path="${esc(it.file)}" src="${esc(direct(it.file))}" alt="${esc(it.title)}"><span class="v2218-fallback v2218-hidden" aria-hidden="true">${it.fallback}</span></span><span class="v2218-title">${esc(it.title)}</span></button>`}

  function build(){
    if($('#v2218Home'))return;
    addStyles();
    const root=document.createElement('section');
    root.id='v2218Home';root.setAttribute('aria-label','מסך ראשי StoryOS');
    root.innerHTML=`<div class="v2218-wrap"><div class="v2218-brand"><img class="v2218-logo" id="v2218BrandLogo" src="${BRAND_DATA}" alt="סבא שמעון ומוריס"><h1>StoryOS · סבא שמעון</h1><p>בחר פעילות או גן כדי להתחיל</p></div><div class="v2218-grid">${items.map(tileMarkup).join('')}</div><div class="v2218-footer">גרסה 22 · מסך כניסה נקי · <button type="button" class="v2218-admin-link" id="v2218AdminLink">⚙ ניהול</button></div></div>`;
    document.body.appendChild(root);
    root.querySelector('#v2218AdminLink')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();root.classList.add('v2218-hidden');if(!ensureAdmin()){console.warn('StoryOS admin button unavailable');root.classList.remove('v2218-hidden');return}const restoreObserver=new MutationObserver(()=>{if(!document.querySelector('.v22-admin-modal')){root.classList.remove('v2218-hidden');restoreObserver.disconnect()}});restoreObserver.observe(document.body,{childList:true})});
    root.querySelectorAll('[data-home-id]').forEach(b=>b.onclick=()=>{const it=items.find(x=>x.id===b.dataset.homeId);if(!it)return;if(it.id==='gardens')openGardens();else openProgram(it.program)});
    hydrateFirebaseImages(root);
  }

  async function hydrateFirebaseImages(scope=document){
    const imgs=[...scope.querySelectorAll('img[data-firebase-path]')];
    imgs.forEach(img=>{img.onerror=()=>{img.classList.add('v2218-hidden');img.nextElementSibling?.classList.remove('v2218-hidden')}});
    try{const api=window.StoryOSFirebase;if(!api)return;await api.ready();const user=await api.currentUser();if(!user)return;await Promise.all(imgs.map(async img=>{try{const u=await api.getUrl(img.dataset.firebasePath);img.src=u;img.classList.remove('v2218-hidden');img.nextElementSibling?.classList.add('v2218-hidden')}catch(_){}}))}catch(_){}
  }

  function hideSections(){['#activityHub','#todayPlanner'].forEach(s=>$(s)?.classList.add('hidden'));const d=$('#dashboard');if(d)d.classList.remove('hidden');$('#detail')?.classList.add('hidden');$('#live')?.classList.add('hidden');$('#audit')?.classList.add('hidden');document.body.classList.remove('v22-focus','v22-live','v22-detail')}
  function openProgram(program){$('#v2218Home')?.classList.add('v2218-hidden');hideSections();try{if(typeof window.showProgram==='function')window.showProgram(program);else{const sel=$('#program');if(sel){sel.value=program;sel.dispatchEvent(new Event('change',{bubbles:true}))}if(typeof window.render==='function')window.render()}}catch(err){console.error('StoryOS home program open failed',err)}const title=$('#dashboard .section-title h2');if(title)title.textContent=program;window.dispatchEvent(new CustomEvent('storyos:navigate',{detail:{view:'program',program}}));window.scrollTo(0,0)}
  function showHome(){build();document.getElementById('v2218GardenPicker')?.remove();const h=$('#v2218Home');if(h)h.classList.remove('v2218-hidden');['#detail','#live','#audit'].forEach(s=>$(s)?.classList.add('hidden'));document.body.classList.remove('v22-focus','v22-live','v22-detail');window.dispatchEvent(new CustomEvent('storyos:navigate',{detail:{view:'home'}}));window.scrollTo(0,0)}

  function openGardens(){document.getElementById('v2218GardenPicker')?.remove();const data=loadAdmin();const modal=document.createElement('div');modal.id='v2218GardenPicker';modal.innerHTML=`<div class="v2218-pickerbox"><div class="v2218-pickerhead"><div><h2>גנים</h2><p>בחר גן כדי לפתוח את כרטיס הגן, הפעילויות והמדיה שלו.</p></div><button class="v2218-btn" data-close>✕ סגור</button></div>${data.gardens.length?`<div class="v2218-gardengrid">${data.gardens.map(g=>`<button class="v2218-garden" type="button" data-garden="${esc(g.name)}"><b>${esc(g.name)}</b><small>${esc([g.area,g.address,g.age].filter(Boolean).join(' · ')||'כרטיס גן')}</small></button>`).join('')}</div>`:'<div style="padding:22px;border:1px dashed #d8d0c5;border-radius:16px;text-align:center;color:#6a7180">אין עדיין גנים שמורים במערכת.</div>'}<div class="v2218-actions"><button class="v2218-btn primary" data-manage>ניהול גנים</button><button class="v2218-btn" data-close>חזרה למסך הראשי</button></div></div>`;document.body.appendChild(modal);modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal.remove());modal.onclick=e=>{if(e.target===modal)modal.remove()};modal.querySelectorAll('[data-garden]').forEach(b=>b.onclick=()=>openGarden(b.dataset.garden));modal.querySelector('[data-manage]').onclick=()=>openGardenManagement()}
  function ensureAdmin(){const btn=$('#v22AdminBtn');if(btn){btn.click();return true}return false}
  function openGarden(name){document.getElementById('v2218GardenPicker')?.remove();$('#v2218Home')?.classList.add('v2218-hidden');if(!ensureAdmin()){console.warn('StoryOS admin button unavailable');showHome();return}setTimeout(()=>{if(window.StoryOSGardenDashboard?.open)window.StoryOSGardenDashboard.open(name);else document.querySelector('.v22-admin-tabs [data-tab="gardens"]')?.click()},100)}
  function openGardenManagement(){document.getElementById('v2218GardenPicker')?.remove();$('#v2218Home')?.classList.add('v2218-hidden');if(ensureAdmin())setTimeout(()=>document.querySelector('.v22-admin-tabs [data-tab="gardens"]')?.click(),80)}
  function wireHomeButton(){const b=$('#homeBtn');if(b&&!b.dataset.v2218){b.dataset.v2218='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();showHome()},true)}}
  function wrapGoHome(){if(window.__v2218GoHomeWrapped)return;const base=typeof window.goHome==='function'?window.goHome:null;window.goHome=function(){try{base?.()}catch(_){}showHome()};window.__v2218GoHomeWrapped=true}
  function boot(){build();wireHomeButton();wrapGoHome();new MutationObserver(()=>wireHomeButton()).observe(document.documentElement,{childList:true,subtree:true});showHome()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSHome={version:VERSION,show:showHome,openProgram,openGardens};
})();