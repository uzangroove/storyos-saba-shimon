(() => {
  const VERSION='22.17.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const WEEKLY_KEY='storyos_v22_weekly_v1';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let currentGarden='';

  function loadAdmin(){try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]}}catch(_){return {gardens:[],teachers:[],events:[]}}}
  function saveAdmin(d){localStorage.setItem(ADMIN_KEY,JSON.stringify(d))}
  function loadWeekly(){try{const d=JSON.parse(localStorage.getItem(WEEKLY_KEY)||'[]');return Array.isArray(d)?d:[]}catch(_){return[]}}
  function getStories(){try{return Array.isArray(STORIES)?STORIES:[]}catch(_){return []}}
  function normProgram(p){return String(p||'').trim().replace('שעת סיפור בהמחשה','שעת סיפור והמחשה')}
  function programItems(program){const p=normProgram(program);return getStories().filter(x=>normProgram(x.program)===p).sort((a,b)=>Number(a.num||999)-Number(b.num||999));}
  function meetingLabel(item){return `${item.num?item.num+'. ':''}${item.title||item.summary||item.id||'תוכן ללא שם'}`}

  function bindSchedule(scheduleId,force=false){
    const admin=loadAdmin(),schedule=loadWeekly().find(w=>w.id===scheduleId);if(!schedule)return {bound:0,total:0};const items=programItems(schedule.program),events=admin.events.filter(e=>e.scheduleId===scheduleId).sort((a,b)=>Number(a.meetingNo||0)-Number(b.meetingNo||0));let bound=0;
    events.forEach((e,i)=>{if(!force&&e.contentId)return;const item=items[i];if(!item)return;e.contentId=item.id||`${normProgram(schedule.program)}-${i+1}`;e.contentNum=item.num||i+1;e.contentTitle=item.title||item.summary||`מפגש ${i+1}`;e.contentSummary=item.summary||'';e.contentProgram=item.program||schedule.program;e.title=e.contentTitle;bound++;});
    saveAdmin(admin);return {bound,total:events.length,available:items.length};
  }
  function setEventContent(eventId,contentId){const admin=loadAdmin(),e=admin.events.find(x=>x.id===eventId);if(!e)return;const item=getStories().find(x=>x.id===contentId);if(item){e.contentId=item.id;e.contentNum=item.num||'';e.contentTitle=item.title||item.summary||'';e.contentSummary=item.summary||'';e.contentProgram=item.program||e.program;e.title=e.contentTitle||e.title}else{delete e.contentId;delete e.contentNum;delete e.contentTitle;delete e.contentSummary;delete e.contentProgram}saveAdmin(admin)}

  function openContent(event){
    if(!event?.contentId)return;
    const item=getStories().find(x=>x.id===event.contentId);if(!item)return;
    if(typeof window.openStory==='function')window.openStory(item.id);
  }

  function addStyles(){if($('#v2217ContentStyle'))return;const s=document.createElement('style');s.id='v2217ContentStyle';s.textContent=`
    .v2217-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px}.v2217-head h2{margin:0}.v2217-head p{margin:4px 0 0;color:var(--muted)}.v2217-toolbar{display:flex;gap:8px;flex-wrap:wrap}.v2217-select{border:1px solid var(--line);border-radius:12px;padding:9px;background:#fff;min-width:190px}.v2217-schedule{border:1px solid var(--line);border-radius:16px;background:#fffdf8;padding:13px;margin-bottom:12px}.v2217-schedule-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.v2217-meetings{display:grid;gap:7px;margin-top:10px}.v2217-meeting{display:grid;grid-template-columns:80px 130px minmax(220px,1fr) auto;gap:8px;align-items:center;border:1px solid #e7e0d5;border-radius:11px;padding:8px;background:#fff}.v2217-meeting select{width:100%;border:1px solid var(--line);border-radius:9px;padding:7px;background:#fff}.v2217-meeting small{color:var(--muted)}.v2217-badge{border-radius:999px;padding:4px 8px;background:#eef3ff;color:#34507a;font-size:.8rem}.v2217-badge.ok{background:#eaf8ee;color:#23693c}.v2217-empty{border:1px dashed var(--line);border-radius:13px;padding:18px;text-align:center;color:var(--muted)}@media(max-width:850px){.v2217-meeting{grid-template-columns:1fr}.v2217-meeting .btn{justify-self:start}}
  `;document.head.appendChild(s)}

  function render(garden){
    addStyles();currentGarden=garden||currentGarden;const body=$('#v22AdminBody');if(!body)return;const admin=loadAdmin(),weekly=loadWeekly(),gardens=admin.gardens.map(g=>g.name);if(!currentGarden)currentGarden=gardens[0]||'';document.querySelectorAll('.v22-admin-tabs [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab==='content-binding'));
    const gardenOpts=gardens.map(g=>`<option value="${esc(g)}" ${g===currentGarden?'selected':''}>${esc(g)}</option>`).join('');const schedules=weekly.filter(w=>w.garden===currentGarden);
    body.innerHTML=`<div class="v2217-head"><div><h2>קישור תוכן פעילות לגן</h2><p>כל מפגש בלוח נקשר לפריט התוכן המפורט שכבר קיים ב־StoryOS. אפשר לשייך אוטומטית לפי סדר המפגשים או לשנות כל מפגש ידנית.</p></div><div class="v2217-toolbar"><select id="v2217Garden" class="v2217-select"><option value="">בחר גן</option>${gardenOpts}</select></div></div>${schedules.length?schedules.map(schedule=>renderSchedule(schedule,admin)).join(''):'<div class="v2217-empty">לגן הזה עדיין אין מסלול שבועי. צור קודם מסלול שבועי ואז נחבר אליו את התוכן.</div>'}`;
    $('#v2217Garden').onchange=e=>render(e.target.value);
    body.querySelectorAll('[data-bind-schedule]').forEach(b=>b.onclick=()=>{const id=b.dataset.bindSchedule,r=bindSchedule(id,false);alert(`שויכו ${r.bound} מפגשים מתוך ${r.total}. במאגר התוכן נמצאו ${r.available||0} פריטים.`);render(currentGarden)});
    body.querySelectorAll('[data-rebind-schedule]').forEach(b=>b.onclick=()=>{if(!confirm('לדרוס את השיוכים הקיימים ולשייך מחדש לפי סדר התוכן?'))return;bindSchedule(b.dataset.rebindSchedule,true);render(currentGarden)});
    body.querySelectorAll('[data-event-content]').forEach(sel=>sel.onchange=()=>{setEventContent(sel.dataset.eventContent,sel.value);render(currentGarden)});
    body.querySelectorAll('[data-open-content]').forEach(b=>b.onclick=()=>{const e=loadAdmin().events.find(x=>x.id===b.dataset.openContent);openContent(e)});
  }

  function renderSchedule(schedule,admin){
    const items=programItems(schedule.program),events=admin.events.filter(e=>e.scheduleId===schedule.id).sort((a,b)=>Number(a.meetingNo||0)-Number(b.meetingNo||0)),bound=events.filter(e=>e.contentId).length;
    return `<section class="v2217-schedule"><div class="v2217-schedule-head"><div><h3 style="margin:0">${esc(schedule.garden)} · ${esc(schedule.program)}</h3><small>${events.length} מפגשים בלוח · ${items.length} פריטי תוכן במערכת</small></div><div class="v2217-toolbar"><span class="v2217-badge ${bound===events.length&&events.length?'ok':''}">${bound}/${events.length} משויכים</span><button class="btn primary" data-bind-schedule="${esc(schedule.id)}">שייך אוטומטית לפי סדר</button><button class="btn" data-rebind-schedule="${esc(schedule.id)}">שייך מחדש</button></div></div><div class="v2217-meetings">${events.map(e=>{const opts=['<option value="">ללא שיוך</option>',...items.map(i=>`<option value="${esc(i.id)}" ${e.contentId===i.id?'selected':''}>${esc(meetingLabel(i))}</option>`)].join('');return `<div class="v2217-meeting"><b>מפגש ${esc(e.meetingNo||'')}</b><span>${esc(e.date||'')}<small>${esc(e.time||'')}</small></span><select data-event-content="${esc(e.id)}">${opts}</select><button class="btn small" data-open-content="${esc(e.id)}" ${e.contentId?'':'disabled'}>פתח תוכן</button></div>`}).join('')}</div></section>`;
  }

  function injectTab(){const tabs=$('.v22-admin-tabs');if(!tabs||tabs.querySelector('[data-tab="content-binding"]'))return;const b=document.createElement('button');b.dataset.tab='content-binding';b.textContent='תוכן לגנים';b.onclick=()=>render(currentGarden);const weekly=tabs.querySelector('[data-tab="weekly"]');weekly?.after(b)||tabs.appendChild(b)}
  function watch(){new MutationObserver(()=>injectTab()).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('click',e=>{const b=e.target.closest?.('.v22-admin-tabs [data-tab="content-binding"]');if(b){e.preventDefault();e.stopPropagation();render(currentGarden)}},true);setTimeout(injectTab,500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
  window.StoryOSContentBinding={version:VERSION,render,bindSchedule,setEventContent};
})();
