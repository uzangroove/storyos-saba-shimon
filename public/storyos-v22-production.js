(() => {
  const ACTIVE_STORY_COUNT = 16;
  const VERSION = '22.2.0';
  const ADMIN_KEY = 'storyos_v22_admin_v1';
  const PROGRAMS = ['שעת סיפור והמחשה','כשהציור קם לתחייה','עולם קטן, קסם גדול','תיאטרון בובות','שיר נולד בגן'];
  const $ = sel => document.querySelector(sel);

  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function uid(prefix){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);}
  function getStories(){try{return Array.isArray(STORIES)?STORIES:[]}catch(_){return[]}}
  function isActiveItem(item){return !item || item.program!=='שעת סיפור והמחשה' || Number(item.num||0)<=ACTIVE_STORY_COUNT;}

  function loadAdmin(){
    try{
      const data=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');
      return {gardens:Array.isArray(data.gardens)?data.gardens:[],teachers:Array.isArray(data.teachers)?data.teachers:[],events:Array.isArray(data.events)?data.events:[]};
    }catch(_){return {gardens:[],teachers:[],events:[]};}
  }
  function saveAdmin(data){localStorage.setItem(ADMIN_KEY,JSON.stringify(data));}

  function addStyles(){
    if(document.getElementById('storyos-v22-production-style'))return;
    const style=document.createElement('style');
    style.id='storyos-v22-production-style';
    style.textContent=`
      body.v22-focus #activityHub,body.v22-focus #todayPlanner,body.v22-focus #dashboard,body.v22-focus #v20UnifiedControls,body.v22-focus .v20-main-layout{display:none!important}
      body.v22-focus main{max-width:none;width:100%;padding:12px 18px 18px}
      body.v22-focus #detail,body.v22-focus #live,body.v22-focus #audit{width:100%;max-width:1800px;margin:0 auto}
      body.v22-detail #detail .grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      body.v22-live{overflow:hidden}
      body.v22-live header{display:none!important}
      body.v22-live main{height:100dvh;overflow:hidden;padding:10px 14px}
      body.v22-live #live{height:calc(100dvh - 20px);overflow:hidden;display:flex;flex-direction:column}
      body.v22-live #live>.btn.back{flex:0 0 auto;margin-bottom:7px}
      body.v22-live #live .live-top{flex:0 0 auto;margin-bottom:8px}
      body.v22-live #live .live-layout{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(360px,.85fr);align-items:stretch;gap:12px}
      body.v22-live #live .live-layout>section,body.v22-live #live .live-presentation{min-height:0;overflow:hidden}
      body.v22-live #live .live-layout>section{display:flex;flex-direction:column}
      body.v22-live #live .live-card{min-height:0;flex:1;padding:18px;overflow:auto}
      body.v22-live #live .panel{padding:12px}
      body.v22-live #live .steps-mini{max-height:170px;overflow:auto}
      body.v22-live #live .live-presentation .panel{height:100%;display:flex;flex-direction:column;overflow:hidden}
      body.v22-live #live .slide-stage{min-height:0;flex:1;overflow:hidden}
      body.v22-live #live .slide-stage img{max-height:100%;height:100%;width:100%;object-fit:contain}
      body.v22-live #live .footer-note{display:none}
      .v22-flip-btn{background:linear-gradient(135deg,#2ea6ff,#6c50e0)!important;color:#fff!important;border-color:#5c61d6!important}
      .v22-live-flip{font-weight:800}
      .v22-admin-modal{position:fixed;inset:0;z-index:1000;background:rgba(29,41,64,.5);display:grid;place-items:center;padding:16px}
      .v22-admin-box{width:min(1220px,97vw);height:min(860px,94dvh);overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:24px;box-shadow:0 24px 70px rgba(0,0,0,.22);display:flex;flex-direction:column}
      .v22-admin-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:18px 20px 12px;border-bottom:1px solid var(--line)}
      .v22-admin-head h2{margin:0}.v22-admin-head p{margin:5px 0 0;color:var(--muted)}
      .v22-admin-tabs{display:flex;gap:7px;flex-wrap:wrap;padding:10px 20px;border-bottom:1px solid var(--line);background:#faf8f3}
      .v22-admin-tabs button{border:1px solid var(--line);background:#fff;border-radius:12px;padding:9px 12px}.v22-admin-tabs button.active{background:#6c50e0;color:#fff;border-color:#5e45d7}
      .v22-admin-body{flex:1;min-height:0;overflow:auto;padding:18px 20px}
      .v22-admin-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:16px}
      .v22-admin-stat{border:1px solid var(--line);border-radius:16px;padding:12px;background:#faf8f3}.v22-admin-stat b{display:block;font-size:1.35rem}
      .v22-admin-grid{display:grid;grid-template-columns:1fr 1.5fr;gap:14px}
      .v22-admin-panel{border:1px solid var(--line);border-radius:18px;padding:14px;background:#fffdf8}
      .v22-admin-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v22-admin-form label{display:flex;flex-direction:column;gap:5px;font-weight:700}.v22-admin-form input,.v22-admin-form select,.v22-admin-form textarea{border:1px solid var(--line);border-radius:12px;padding:10px;background:#fff}.v22-admin-form textarea{min-height:80px}.v22-admin-form .wide{grid-column:1/-1}.v22-admin-form-actions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}
      .v22-admin-list{display:grid;gap:8px}.v22-admin-row{border:1px solid #e7e0d5;border-radius:13px;padding:10px 12px;background:#fff;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.v22-admin-row small{color:var(--muted);display:block;margin-top:3px}.v22-admin-row-actions{display:flex;gap:6px;flex-wrap:wrap}
      .v22-badge{display:inline-block;border-radius:999px;padding:3px 8px;font-size:.8rem}.v22-badge.active{background:#edfff3;color:#246b42}.v22-badge.archive{background:#fff3e5;color:#8a5815}.v22-badge.done{background:#edfff3;color:#246b42}.v22-badge.cancelled{background:#fff0f0;color:#9a3434}.v22-badge.planned{background:#eef7ff;color:#275c88}
      .v22-empty{border:1px dashed var(--line);border-radius:14px;padding:20px;text-align:center;color:var(--muted)}
      @media(max-width:1000px){body.v22-live{overflow:auto}body.v22-live main,body.v22-live #live{height:auto;overflow:visible}body.v22-live #live .live-layout{grid-template-columns:1fr}body.v22-live #live .live-card{min-height:360px}.v22-admin-stats{grid-template-columns:repeat(3,1fr)}.v22-admin-grid{grid-template-columns:1fr}}
      @media(max-width:760px){body.v22-detail #detail .grid{grid-template-columns:1fr}.v22-admin-box{height:96dvh}.v22-admin-body{padding:12px}.v22-admin-stats{grid-template-columns:1fr 1fr}.v22-admin-form{grid-template-columns:1fr}.v22-admin-form .wide,.v22-admin-form-actions{grid-column:1}.v22-admin-row{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function updateReleaseIdentity(){
    document.title='Story OS · סבא שמעון · גרסה 22';
    const subtitle=$('.brand p');
    if(subtitle)subtitle.textContent=subtitle.textContent.replace(/גרסה\s*20(?:\.\d+)?/g,'גרסה 22');
    const auditBtn=$('#auditBtn');if(auditBtn)auditBtn.textContent='בדיקת מאגר הספרים';
    const exportBtn=$('#exportBooksBtn');if(exportBtn){exportBtn.textContent='📊 ייצוא מאגר ספרים';exportBtn.title='ייצוא מאגר הספרים המלא, כולל ספרי הארכיון';}
  }

  function wrapFiltering(){
    if(window.__storyosV22ActiveFilterWrapped||typeof window.filtered!=='function')return;
    const base=window.filtered;window.filtered=function(){return base().filter(isActiveItem)};window.__storyosV22ActiveFilterWrapped=true;
    if(typeof window.render==='function')window.render();
  }

  function toggleFocusMode(){
    const live=$('#live'),detail=$('#detail'),audit=$('#audit');
    const liveOn=live&&!live.classList.contains('hidden');
    const detailOn=detail&&!detail.classList.contains('hidden');
    const auditOn=audit&&!audit.classList.contains('hidden');
    document.body.classList.toggle('v22-focus',liveOn||detailOn||auditOn);
    document.body.classList.toggle('v22-live',liveOn);
    document.body.classList.toggle('v22-detail',detailOn);
  }

  function viewerUrl(story){
    const url=new URL('/book-viewer.html',location.origin);url.searchParams.set('v',VERSION);url.searchParams.set('story',story.id);url.searchParams.set('title',story.title);return url.toString();
  }
  function openFlip(story){
    const url=viewerUrl(story);
    try{window.top.location.href=url}catch(_){window.location.href=url}
  }

  function injectDetailFlip(id){
    const detail=$('#detail');if(!detail||detail.classList.contains('hidden'))return;
    const story=getStories().find(s=>s.id===id);if(!story||story.program!=='שעת סיפור והמחשה')return;
    const actions=detail.querySelector('.detail-actions');if(!actions||actions.querySelector('[data-v22-flip]'))return;
    const btn=document.createElement('button');btn.type='button';btn.className='btn v22-flip-btn';btn.dataset.v22Flip='1';btn.textContent='📖 פתח ספר בפליפ';btn.onclick=()=>openFlip(story);actions.prepend(btn);
  }

  function injectLiveFlip(){
    const live=$('#live');if(!live||live.classList.contains('hidden'))return;
    let story=null;try{story=current}catch(_){story=null}
    if(!story||story.program!=='שעת סיפור והמחשה')return;
    if(live.querySelector('[data-v22-live-flip]'))return;
    const btn=document.createElement('button');btn.type='button';btn.className='btn v22-flip-btn v22-live-flip';btn.dataset.v22LiveFlip='1';btn.textContent='📖 ספר בפליפ · מסך גדול';btn.onclick=()=>openFlip(story);
    const tools=live.querySelector('.slide-tools');
    const emergency=live.querySelector('.emergency');
    if(tools)tools.prepend(btn);else if(emergency)emergency.prepend(btn);else live.prepend(btn);
  }

  function wrapNavigation(){
    if(window.__storyosV22NavigationWrapped)return;
    if(typeof window.openStory==='function'){
      const baseOpen=window.openStory;window.openStory=function(id){const story=getStories().find(s=>s.id===id);if(story&&!isActiveItem(story))return;const out=baseOpen(id);setTimeout(()=>{injectDetailFlip(id);toggleFocusMode()},0);return out;};
    }
    if(typeof window.startLive==='function'){
      const baseLive=window.startLive;window.startLive=function(id){const story=getStories().find(s=>s.id===id);if(story&&!isActiveItem(story))return;const out=baseLive(id);setTimeout(()=>{injectLiveFlip();toggleFocusMode()},0);return out;};
    }
    window.__storyosV22NavigationWrapped=true;
  }

  function installFocusObserver(){
    ['#dashboard','#detail','#live','#audit'].map($).filter(Boolean).forEach(el=>new MutationObserver(()=>{toggleFocusMode();if(el.id==='live')injectLiveFlip();}).observe(el,{attributes:true,attributeFilter:['class'],childList:true,subtree:false}));
    toggleFocusMode();
  }

  function closeAdmin(){document.querySelector('.v22-admin-modal')?.remove();}
  let currentAdminTab='overview';
  let editGardenId=null,editTeacherId=null,editEventId=null;

  function adminShell(){
    closeAdmin();
    const modal=document.createElement('div');modal.className='v22-admin-modal';modal.innerHTML=`
      <div class="v22-admin-box" role="dialog" aria-modal="true" aria-label="ניהול StoryOS">
        <div class="v22-admin-head"><div><h2>ניהול StoryOS · גרסה 22</h2><p>גנים, גננות, לוח שנה, ספרים ונתוני הפעלה — נשמרים במכשיר הזה.</p></div><button class="btn" data-close>✕ סגור</button></div>
        <div class="v22-admin-tabs">
          <button data-tab="overview">סקירה</button><button data-tab="gardens">גנים</button><button data-tab="teachers">גננות / אנשי קשר</button><button data-tab="calendar">לוח שנה</button><button data-tab="books">ספרים</button><button data-tab="backup">גיבוי</button>
        </div><div class="v22-admin-body" id="v22AdminBody"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-close]').onclick=closeAdmin;modal.addEventListener('click',e=>{if(e.target===modal)closeAdmin()});
    modal.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>renderAdminTab(b.dataset.tab));
    renderAdminTab(currentAdminTab);
  }

  function setActiveTab(tab){document.querySelectorAll('.v22-admin-tabs [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));}
  function recordButtons(type,id){return `<div class="v22-admin-row-actions"><button class="btn small" onclick="v22Edit${type}('${id}')">עריכה</button><button class="btn small danger" onclick="v22Delete${type}('${id}')">מחיקה</button></div>`;}

  function renderAdminTab(tab){
    currentAdminTab=tab;setActiveTab(tab);const body=$('#v22AdminBody');if(!body)return;const data=loadAdmin();const stories=getStories();const books=stories.filter(s=>s.program==='שעת סיפור והמחשה').sort((a,b)=>(a.num||0)-(b.num||0));const active=books.filter(isActiveItem),archive=books.filter(s=>!isActiveItem(s));
    if(tab==='overview'){
      const upcoming=[...data.events].filter(e=>e.date&&e.status!=='cancelled'&&e.date>=new Date().toISOString().slice(0,10)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,8);
      body.innerHTML=`<div class="v22-admin-stats"><div class="v22-admin-stat"><b>${data.gardens.length}</b><span>גנים</span></div><div class="v22-admin-stat"><b>${data.teachers.length}</b><span>גננות / קשר</span></div><div class="v22-admin-stat"><b>${data.events.length}</b><span>אירועים בלוח</span></div><div class="v22-admin-stat"><b>${active.length}</b><span>ספרים פעילים</span></div><div class="v22-admin-stat"><b>${archive.length}</b><span>ספרים בארכיון</span></div><div class="v22-admin-stat"><b>${stories.length}</b><span>כל פריטי התוכן</span></div></div><div class="v22-admin-grid"><section class="v22-admin-panel"><h3>פעולות מהירות</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" onclick="v22AdminGo('calendar')">+ קבע פעילות</button><button class="btn" onclick="v22AdminGo('gardens')">+ הוסף גן</button><button class="btn" onclick="v22AdminGo('teachers')">+ הוסף גננת</button></div></section><section class="v22-admin-panel"><h3>הפעילויות הקרובות</h3>${upcoming.length?`<div class="v22-admin-list">${upcoming.map(e=>`<div class="v22-admin-row"><div><b>${esc(e.date)} ${esc(e.time||'')}</b> · ${esc(e.title||e.program)}<small>${esc(e.garden||'')} · ${esc(e.program||'')}</small></div><span class="v22-badge ${esc(e.status||'planned')}">${e.status==='done'?'בוצע':e.status==='cancelled'?'בוטל':'מתוכנן'}</span></div>`).join('')}</div>`:'<div class="v22-empty">עדיין אין פעילויות עתידיות בלוח השנה.</div>'}</section></div>`;
    }
    if(tab==='gardens'){
      const editing=data.gardens.find(x=>x.id===editGardenId)||{};
      body.innerHTML=`<div class="v22-admin-grid"><section class="v22-admin-panel"><h3>${editGardenId?'עריכת גן':'הוספת גן'}</h3><form id="v22GardenForm" class="v22-admin-form"><label>שם הגן<input name="name" required value="${esc(editing.name||'')}"></label><label>שכונה / אזור<input name="area" value="${esc(editing.area||'')}"></label><label class="wide">כתובת<input name="address" value="${esc(editing.address||'')}"></label><label>קבוצת גיל<input name="age" value="${esc(editing.age||'')}"></label><label>טלפון בגן<input name="phone" value="${esc(editing.phone||'')}"></label><label class="wide">הערות<textarea name="notes">${esc(editing.notes||'')}</textarea></label><div class="v22-admin-form-actions"><button class="btn primary" type="submit">${editGardenId?'שמור שינויים':'הוסף גן'}</button>${editGardenId?'<button class="btn" type="button" onclick="v22CancelEditGarden()">ביטול</button>':''}</div></form></section><section class="v22-admin-panel"><h3>רשימת גנים (${data.gardens.length})</h3>${data.gardens.length?`<div class="v22-admin-list">${data.gardens.sort((a,b)=>(a.name||'').localeCompare(b.name||'','he')).map(g=>`<div class="v22-admin-row"><div><b>${esc(g.name)}</b><small>${esc([g.area,g.address,g.age,g.phone].filter(Boolean).join(' · '))}</small></div>${recordButtons('Garden',g.id)}</div>`).join('')}</div>`:'<div class="v22-empty">עדיין לא הוגדרו גנים.</div>'}</section></div>`;
      $('#v22GardenForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),d=loadAdmin(),obj={id:editGardenId||uid('g'),name:f.get('name').trim(),area:f.get('area').trim(),address:f.get('address').trim(),age:f.get('age').trim(),phone:f.get('phone').trim(),notes:f.get('notes').trim()};if(editGardenId)d.gardens=d.gardens.map(x=>x.id===editGardenId?obj:x);else d.gardens.push(obj);saveAdmin(d);editGardenId=null;renderAdminTab('gardens');};
    }
    if(tab==='teachers'){
      const editing=data.teachers.find(x=>x.id===editTeacherId)||{};const gardenOptions=data.gardens.map(g=>`<option ${editing.garden===g.name?'selected':''}>${esc(g.name)}</option>`).join('');
      body.innerHTML=`<div class="v22-admin-grid"><section class="v22-admin-panel"><h3>${editTeacherId?'עריכת איש קשר':'הוספת גננת / איש קשר'}</h3><form id="v22TeacherForm" class="v22-admin-form"><label>שם<input name="name" required value="${esc(editing.name||'')}"></label><label>תפקיד<input name="role" value="${esc(editing.role||'גננת')}"></label><label>גן<select name="garden"><option value="">ללא שיוך</option>${gardenOptions}</select></label><label>טלפון<input name="phone" value="${esc(editing.phone||'')}"></label><label class="wide">דוא״ל<input type="email" name="email" value="${esc(editing.email||'')}"></label><label class="wide">הערות<textarea name="notes">${esc(editing.notes||'')}</textarea></label><div class="v22-admin-form-actions"><button class="btn primary" type="submit">${editTeacherId?'שמור שינויים':'הוסף איש קשר'}</button>${editTeacherId?'<button class="btn" type="button" onclick="v22CancelEditTeacher()">ביטול</button>':''}</div></form></section><section class="v22-admin-panel"><h3>גננות ואנשי קשר (${data.teachers.length})</h3>${data.teachers.length?`<div class="v22-admin-list">${data.teachers.map(t=>`<div class="v22-admin-row"><div><b>${esc(t.name)}</b> · ${esc(t.role||'')}<small>${esc([t.garden,t.phone,t.email].filter(Boolean).join(' · '))}</small></div>${recordButtons('Teacher',t.id)}</div>`).join('')}</div>`:'<div class="v22-empty">עדיין לא הוגדרו אנשי קשר.</div>'}</section></div>`;
      $('#v22TeacherForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),d=loadAdmin(),obj={id:editTeacherId||uid('t'),name:f.get('name').trim(),role:f.get('role').trim(),garden:f.get('garden').trim(),phone:f.get('phone').trim(),email:f.get('email').trim(),notes:f.get('notes').trim()};if(editTeacherId)d.teachers=d.teachers.map(x=>x.id===editTeacherId?obj:x);else d.teachers.push(obj);saveAdmin(d);editTeacherId=null;renderAdminTab('teachers');};
    }
    if(tab==='calendar'){
      const editing=data.events.find(x=>x.id===editEventId)||{};const gardens=data.gardens.map(g=>`<option ${editing.garden===g.name?'selected':''}>${esc(g.name)}</option>`).join('');const programs=PROGRAMS.map(p=>`<option ${editing.program===p?'selected':''}>${esc(p)}</option>`).join('');const rows=[...data.events].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
      body.innerHTML=`<div class="v22-admin-grid"><section class="v22-admin-panel"><h3>${editEventId?'עריכת פעילות':'קביעת פעילות בלוח'}</h3><form id="v22EventForm" class="v22-admin-form"><label>תאריך<input type="date" name="date" required value="${esc(editing.date||new Date().toISOString().slice(0,10))}"></label><label>שעה<input type="time" name="time" value="${esc(editing.time||'09:00')}"></label><label>גן<select name="garden"><option value="">בחר גן</option>${gardens}</select></label><label>פעילות<select name="program">${programs}</select></label><label class="wide">כותרת / ספר / מפגש<input name="title" value="${esc(editing.title||'')}"></label><label>סטטוס<select name="status"><option value="planned" ${editing.status!=='done'&&editing.status!=='cancelled'?'selected':''}>מתוכנן</option><option value="done" ${editing.status==='done'?'selected':''}>בוצע</option><option value="cancelled" ${editing.status==='cancelled'?'selected':''}>בוטל</option></select></label><label>משך<input name="duration" value="${esc(editing.duration||'45 דקות')}"></label><label class="wide">הערות<textarea name="notes">${esc(editing.notes||'')}</textarea></label><div class="v22-admin-form-actions"><button class="btn primary" type="submit">${editEventId?'שמור שינויים':'הוסף ללוח'}</button>${editEventId?'<button class="btn" type="button" onclick="v22CancelEditEvent()">ביטול</button>':''}</div></form></section><section class="v22-admin-panel"><h3>לוח פעילויות (${rows.length})</h3>${rows.length?`<div class="v22-admin-list">${rows.map(e=>`<div class="v22-admin-row"><div><b>${esc(e.date)} ${esc(e.time||'')}</b> · ${esc(e.title||e.program)} <span class="v22-badge ${esc(e.status||'planned')}">${e.status==='done'?'בוצע':e.status==='cancelled'?'בוטל':'מתוכנן'}</span><small>${esc([e.garden,e.program,e.duration].filter(Boolean).join(' · '))}</small></div>${recordButtons('Event',e.id)}</div>`).join('')}</div>`:'<div class="v22-empty">עדיין אין פעילויות בלוח השנה.</div>'}</section></div>`;
      $('#v22EventForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),d=loadAdmin(),obj={id:editEventId||uid('e'),date:f.get('date'),time:f.get('time'),garden:f.get('garden').trim(),program:f.get('program'),title:f.get('title').trim(),status:f.get('status'),duration:f.get('duration').trim(),notes:f.get('notes').trim()};if(editEventId)d.events=d.events.map(x=>x.id===editEventId?obj:x);else d.events.push(obj);saveAdmin(d);editEventId=null;renderAdminTab('calendar');};
    }
    if(tab==='books'){
      body.innerHTML=`<div class="v22-admin-stats"><div class="v22-admin-stat"><b>${active.length}</b><span>פעילים</span></div><div class="v22-admin-stat"><b>${archive.length}</b><span>ארכיון</span></div></div><div class="v22-admin-grid"><section class="v22-admin-panel"><h3>16 הספרים הפעילים</h3><div class="v22-admin-list">${active.map(s=>`<div class="v22-admin-row"><span>${s.num}. ${esc(s.title)}</span><span class="v22-badge active">פעיל</span></div>`).join('')}</div></section><section class="v22-admin-panel"><h3>מאגר הרחבה</h3><div class="v22-admin-list">${archive.map(s=>`<div class="v22-admin-row"><span>${s.num}. ${esc(s.title)}</span><span class="v22-badge archive">ארכיון</span></div>`).join('')}</div></section></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn" onclick="v22RunAudit()">בדיקת מאגר מלא</button><button class="btn" onclick="v22ExportBooks()">ייצוא מאגר מלא</button></div>`;
    }
    if(tab==='backup'){
      body.innerHTML=`<section class="v22-admin-panel"><h3>גיבוי נתוני הניהול</h3><p>הגנים, אנשי הקשר ולוח השנה נשמרים כרגע מקומית בדפדפן במכשיר. מומלץ להוריד גיבוי מדי פעם.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" onclick="v22BackupAdmin()">⬇ הורדת גיבוי JSON</button><label class="btn" style="cursor:pointer">⬆ שחזור מגיבוי<input id="v22RestoreInput" type="file" accept="application/json,.json" style="display:none"></label></div></section>`;const input=$('#v22RestoreInput');input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!parsed||!Array.isArray(parsed.gardens)||!Array.isArray(parsed.teachers)||!Array.isArray(parsed.events))throw new Error('מבנה קובץ לא תקין');saveAdmin(parsed);alert('הגיבוי שוחזר בהצלחה.');renderAdminTab('overview');}catch(err){alert('לא ניתן לשחזר את הקובץ: '+err.message)}};
    }
  }

  window.v22AdminGo=tab=>renderAdminTab(tab);
  window.v22EditGarden=id=>{editGardenId=id;renderAdminTab('gardens')};window.v22CancelEditGarden=()=>{editGardenId=null;renderAdminTab('gardens')};window.v22DeleteGarden=id=>{if(!confirm('למחוק את הגן?'))return;const d=loadAdmin();d.gardens=d.gardens.filter(x=>x.id!==id);saveAdmin(d);renderAdminTab('gardens')};
  window.v22EditTeacher=id=>{editTeacherId=id;renderAdminTab('teachers')};window.v22CancelEditTeacher=()=>{editTeacherId=null;renderAdminTab('teachers')};window.v22DeleteTeacher=id=>{if(!confirm('למחוק את איש הקשר?'))return;const d=loadAdmin();d.teachers=d.teachers.filter(x=>x.id!==id);saveAdmin(d);renderAdminTab('teachers')};
  window.v22EditEvent=id=>{editEventId=id;renderAdminTab('calendar')};window.v22CancelEditEvent=()=>{editEventId=null;renderAdminTab('calendar')};window.v22DeleteEvent=id=>{if(!confirm('למחוק את הפעילות מהלוח?'))return;const d=loadAdmin();d.events=d.events.filter(x=>x.id!==id);saveAdmin(d);renderAdminTab('calendar')};
  window.v22RunAudit=()=>{closeAdmin();if(typeof window.showAudit==='function')window.showAudit()};window.v22ExportBooks=()=>{if(typeof window.exportBooksTable==='function')window.exportBooksTable()};
  window.v22BackupAdmin=()=>{const blob=new Blob([JSON.stringify(loadAdmin(),null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='StoryOS_ניהול_גנים_לוח_שנה_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};

  function installAdminButton(){
    const actions=$('.head-actions');if(!actions||$('#v22AdminBtn'))return;const btn=document.createElement('button');btn.id='v22AdminBtn';btn.type='button';btn.textContent='⚙ ניהול';btn.className='btn secondary';btn.onclick=adminShell;const home=$('#homeBtn');if(home&&home.nextSibling)actions.insertBefore(btn,home.nextSibling);else actions.prepend(btn);
  }

  function init(){addStyles();updateReleaseIdentity();wrapFiltering();wrapNavigation();installAdminButton();installFocusObserver();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();
