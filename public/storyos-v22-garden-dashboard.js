(() => {
  const VERSION='22.16.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const WEEKLY_KEY='storyos_v22_weekly_v1';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  let selectedGarden='';

  function loadAdmin(){try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]}}catch(_){return {gardens:[],teachers:[],events:[]}}}
  function loadWeekly(){try{const d=JSON.parse(localStorage.getItem(WEEKLY_KEY)||'[]');return Array.isArray(d)?d:[]}catch(_){return[]}}
  function statusLabel(s){return s==='done'?'בוצע':s==='cancelled'?'בוטל':'מתוכנן'}
  function addStyles(){if($('#v2216GardenDashStyle'))return;const s=document.createElement('style');s.id='v2216GardenDashStyle';s.textContent=`
    .v2216-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:14px}.v2216-head h2{margin:0}.v2216-head p{margin:4px 0 0;color:var(--muted)}
    .v2216-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:12px}.v2216-stat{border:1px solid var(--line);background:#faf8f3;border-radius:14px;padding:11px}.v2216-stat b{display:block;font-size:1.35rem}.v2216-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.v2216-card{border:1px solid var(--line);border-radius:16px;padding:13px;background:#fffdf8}.v2216-card h3{margin:0 0 9px}.v2216-kv{display:grid;grid-template-columns:130px 1fr;gap:5px 9px;font-size:.93rem}.v2216-kv b{color:#536079}.v2216-list{display:grid;gap:7px}.v2216-row{border:1px solid #e6dfd4;border-radius:11px;padding:9px;background:#fff}.v2216-row small{display:block;color:var(--muted);margin-top:3px}.v2216-actions{display:flex;gap:7px;flex-wrap:wrap}.v2216-media{display:flex;gap:7px;flex-wrap:wrap}.v2216-chip{border-radius:999px;padding:5px 9px;background:#eef3ff;color:#34507a;font-size:.84rem}.v2216-chip.ok{background:#eaf8ee;color:#23693c}.v2216-garden-open{margin-inline-start:6px}@media(max-width:900px){.v2216-stats{grid-template-columns:repeat(2,1fr)}.v2216-grid{grid-template-columns:1fr}.v2216-kv{grid-template-columns:100px 1fr}}
  `;document.head.appendChild(s)}

  function gardenByName(name){return loadAdmin().gardens.find(g=>g.name===name)||null}
  function gardenEvents(name){return loadAdmin().events.filter(e=>e.garden===name).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))}
  function weeklyFor(name){return loadWeekly().filter(w=>w.garden===name)}
  function contactsFor(name){return loadAdmin().teachers.filter(t=>t.garden===name)}

  async function mediaSummary(name){const host=$('#v2216Media');if(!host)return;host.innerHTML='<span class="v2216-chip">בודק Firebase…</span>';try{if(!window.StoryOSFlatMedia){host.innerHTML='<span class="v2216-chip">שכבת המדיה עדיין לא נטענה</span>';return}const info=await window.StoryOSFlatMedia.inspectGarden(name);const kids=Object.keys(info.children||{}),complete=kids.filter(k=>Object.values(info.children[k]).every(Boolean)).length;host.innerHTML=`<span class="v2216-chip ok">${info.total} קבצים</span><span class="v2216-chip">${kids.length} ילדים מזוהים</span><span class="v2216-chip">${complete} עם 4/4 תוצרים</span><span class="v2216-chip">${esc(info.prefix)}</span>`;}catch(err){host.innerHTML=`<span class="v2216-chip">מדיה: ${esc(err?.message||'נדרשת התחברות')}</span>`}}

  function renderGarden(name){
    selectedGarden=name;const body=$('#v22AdminBody'),g=gardenByName(name);if(!body||!g)return;addStyles();document.querySelectorAll('.v22-admin-tabs [data-tab]').forEach(b=>b.classList.remove('active'));
    const events=gardenEvents(name),weekly=weeklyFor(name),contacts=contactsFor(name),done=events.filter(e=>e.status==='done').length,planned=events.filter(e=>e.status!=='done'&&e.status!=='cancelled').length,next=events.find(e=>e.status!=='cancelled'&&e.date>=new Date().toISOString().slice(0,10));
    const src=g.catalog||{};
    body.innerHTML=`<div class="v2216-head"><div><h2>🏡 ${esc(g.name)}</h2><p>${esc([g.area||src.neighborhood,g.address||src.address,g.age||src.ages].filter(Boolean).join(' · '))}</p></div><div class="v2216-actions"><button class="btn" id="v2216Back">← רשימת גנים</button><button class="btn primary" id="v2216NewWeekly">+ מסלול שבועי</button><button class="btn" id="v2216Calendar">לוח פעילויות</button></div></div>
    <div class="v2216-stats"><div class="v2216-stat"><b>${weekly.length}</b><span>מסלולים שנתיים</span></div><div class="v2216-stat"><b>${events.length}</b><span>כל המפגשים</span></div><div class="v2216-stat"><b>${planned}</b><span>מתוכננים</span></div><div class="v2216-stat"><b>${done}</b><span>בוצעו</span></div><div class="v2216-stat"><b>${next?esc(next.date):'—'}</b><span>המפגש הבא</span></div></div>
    <div class="v2216-grid"><section class="v2216-card"><h3>פרטי הגן</h3><div class="v2216-kv"><b>סוג מסגרת</b><span>${esc(src.type||g.type||'—')}</span><b>גילאים</b><span>${esc(g.age||src.ages||'—')}</span><b>כתובת</b><span>${esc(g.address||src.address||'—')}</span><b>שכונה</b><span>${esc(g.area||src.neighborhood||'—')}</span><b>טלפון</b><span>${esc(g.phone||src.phone||'—')}</span><b>גננת/מנהלת</b><span>${esc(src.manager||contacts[0]?.name||'—')}</span><b>בעלות</b><span>${esc(src.owner||'—')}</span><b>סמל מוסד</b><span>${esc(src.symbol||'—')}</span><b>אימות</b><span>${esc(src.verification||'—')}</span></div></section>
    <section class="v2216-card"><h3>מדיה ב־Firebase</h3><div id="v2216Media" class="v2216-media"></div><p style="color:var(--muted)">בדיקה לפי המבנה storyos/gardens/&lt;garden&gt;/before|after|videos|3dmodel.</p></section>
    <section class="v2216-card"><h3>מסלולים שבועיים</h3>${weekly.length?`<div class="v2216-list">${weekly.map(w=>`<div class="v2216-row"><b>${esc(w.program)}</b><small>${esc(w.startDate)} · ${esc(w.time)} · ${w.count} מפגשים · ${esc(w.duration)}</small></div>`).join('')}</div>`:'<div class="v22-empty">אין עדיין מסלול שבועי לגן הזה.</div>'}</section>
    <section class="v2216-card"><h3>מפגשים קרובים</h3>${events.length?`<div class="v2216-list">${events.slice(0,12).map(e=>`<div class="v2216-row"><b>${esc(e.date)} ${esc(e.time||'')} · ${esc(e.title||e.program)}</b><small>${esc(e.program||'')} · ${statusLabel(e.status)}</small></div>`).join('')}</div>`:'<div class="v22-empty">אין עדיין מפגשים בלוח.</div>'}</section>
    <section class="v2216-card"><h3>אנשי קשר</h3>${contacts.length?`<div class="v2216-list">${contacts.map(t=>`<div class="v2216-row"><b>${esc(t.name)} · ${esc(t.role||'')}</b><small>${esc([t.phone,t.email].filter(Boolean).join(' · '))}</small></div>`).join('')}</div>`:'<div class="v22-empty">אין איש קשר משויך לגן.</div>'}</section>
    <section class="v2216-card"><h3>פעולות</h3><div class="v2216-actions"><button class="btn primary" id="v2216AddWeekly2">צור 22 מפגשים שבועיים</button><button class="btn" id="v2216EditGarden">עריכת פרטי הגן</button><button class="btn" id="v2216AddContact">הוסף איש קשר</button></div></section></div>`;
    const back=()=>document.querySelector('.v22-admin-tabs [data-tab="gardens"]')?.click();$('#v2216Back').onclick=back;
    const weeklyOpen=()=>{document.querySelector('.v22-admin-tabs [data-tab="weekly"]')?.click();setTimeout(()=>{const sel=document.querySelector('#v2214WeeklyForm select[name="garden"]');if(sel){sel.value=name;sel.dispatchEvent(new Event('change',{bubbles:true}))}},70)};$('#v2216NewWeekly').onclick=weeklyOpen;$('#v2216AddWeekly2').onclick=weeklyOpen;
    $('#v2216Calendar').onclick=()=>{document.querySelector('.v22-admin-tabs [data-tab="calendar"]')?.click();setTimeout(()=>{const s=document.querySelector('#v22EventForm select[name="garden"]');if(s)s.value=name},60)};
    $('#v2216EditGarden').onclick=()=>{if(typeof window.v22EditGarden==='function'){window.v22EditGarden(g.id)}};
    $('#v2216AddContact').onclick=()=>{document.querySelector('.v22-admin-tabs [data-tab="teachers"]')?.click();setTimeout(()=>{const s=document.querySelector('#v22TeacherForm select[name="garden"]');if(s)s.value=name},60)};
    mediaSummary(name);
  }

  function enhanceGardenList(){
    const body=$('#v22AdminBody');if(!body)return;const form=$('#v22GardenForm');if(!form)return;addStyles();const data=loadAdmin();body.querySelectorAll('.v22-admin-list .v22-admin-row').forEach(row=>{if(row.querySelector('.v2216-garden-open'))return;const name=(row.querySelector('b')?.textContent||'').trim(),g=data.gardens.find(x=>x.name===name);if(!g)return;const actions=row.querySelector('.v22-admin-row-actions')||row;const b=document.createElement('button');b.className='btn small v2216-garden-open';b.textContent='כרטיס גן';b.onclick=e=>{e.preventDefault();e.stopPropagation();renderGarden(g.name)};actions.prepend(b)});
  }
  function addTab(){const tabs=$('.v22-admin-tabs');if(!tabs||tabs.querySelector('[data-tab="garden-card"]'))return;const b=document.createElement('button');b.dataset.tab='garden-card';b.textContent='כרטיס גן';b.onclick=()=>{const gardens=loadAdmin().gardens;if(selectedGarden&&gardenByName(selectedGarden))renderGarden(selectedGarden);else if(gardens.length)renderGarden(gardens[0].name);else document.querySelector('[data-tab="gardens"]')?.click()};tabs.appendChild(b)}
  function watch(){new MutationObserver(()=>{addTab();enhanceGardenList()}).observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>{addTab();enhanceGardenList()},500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
  window.StoryOSGardenDashboard={version:VERSION,open:renderGarden};
})();
