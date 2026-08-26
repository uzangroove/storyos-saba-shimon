(() => {
  const VERSION='22.14.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const WEEKLY_KEY='storyos_v22_weekly_v1';
  const PROGRAMS=['שעת סיפור והמחשה','כשהציור קם לתחייה','עולם קטן, קסם גדול','תיאטרון בובות','שיר נולד בגן'];
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>`weekly_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  function loadAdmin(){try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]}}catch(_){return {gardens:[],teachers:[],events:[]}}}
  function saveAdmin(d){localStorage.setItem(ADMIN_KEY,JSON.stringify(d))}
  function loadWeekly(){try{const x=JSON.parse(localStorage.getItem(WEEKLY_KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
  function saveWeekly(x){localStorage.setItem(WEEKLY_KEY,JSON.stringify(x))}
  function addDays(iso,days){const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}

  function injectTab(){
    const tabs=$('.v22-admin-tabs');if(!tabs||tabs.querySelector('[data-tab="weekly"]'))return;
    const b=document.createElement('button');b.dataset.tab='weekly';b.textContent='מסלולים שבועיים';b.onclick=()=>renderWeekly();
    const cal=tabs.querySelector('[data-tab="calendar"]');cal?.after(b) || tabs.appendChild(b);
  }
  function setActive(){document.querySelectorAll('.v22-admin-tabs [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab==='weekly'))}

  function renderWeekly(){
    injectTab();setActive();const body=$('#v22AdminBody');if(!body)return;
    const admin=loadAdmin(),weekly=loadWeekly();
    const gardenOpts=admin.gardens.map(g=>`<option value="${esc(g.name)}">${esc(g.name)}</option>`).join('');
    const programOpts=PROGRAMS.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
    body.innerHTML=`<div class="v22-admin-grid"><section class="v22-admin-panel"><h3>יצירת מסלול שבועי שנתי</h3><form id="v2214WeeklyForm" class="v22-admin-form"><label>גן<select name="garden" required><option value="">בחר גן</option>${gardenOpts}</select></label><label>פעילות<select name="program">${programOpts}</select></label><label>תאריך מפגש ראשון<input name="startDate" type="date" required></label><label>שעה<input name="time" type="time" value="09:00"></label><label>מספר מפגשים<input name="count" type="number" min="1" max="60" value="22"></label><label>משך<input name="duration" value="45 דקות"></label><label class="wide">כותרת בסיס<input name="title" value="מפגש שבועי"></label><label class="wide">הערות<textarea name="notes" placeholder="למשל: פעילות שבועית לכל שנת הלימודים"></textarea></label><div class="v22-admin-form-actions"><button class="btn primary" type="submit">צור מסלול ופתח את כל המפגשים בלוח</button></div></form><p style="color:var(--muted);margin-top:10px">המערכת יוצרת אירוע כל 7 ימים. אחר כך אפשר לערוך מפגש בודד בלוח השנה בלי לשנות את שאר המסלול.</p></section><section class="v22-admin-panel"><h3>מסלולים קיימים (${weekly.length})</h3>${weekly.length?`<div class="v22-admin-list">${weekly.map(w=>`<div class="v22-admin-row"><div><b>${esc(w.garden)} · ${esc(w.program)}</b><small>${esc(w.startDate)} · ${esc(w.time)} · ${w.count} מפגשים · ${esc(w.duration)}</small></div><div class="v22-admin-row-actions"><button class="btn small" data-open-calendar="${w.id}">לוח</button><button class="btn small danger" data-delete-weekly="${w.id}">מחיקה</button></div></div>`).join('')}</div>`:'<div class="v22-empty">עדיין לא הוגדר מסלול שבועי.</div>'}</section></div>`;
    const form=$('#v2214WeeklyForm');if(form)form.onsubmit=e=>{e.preventDefault();const f=new FormData(form);const garden=String(f.get('garden')||'').trim();if(!garden)return;const record={id:uid(),garden,program:String(f.get('program')||''),startDate:String(f.get('startDate')||''),time:String(f.get('time')||'09:00'),count:Math.max(1,Number(f.get('count')||22)),duration:String(f.get('duration')||'45 דקות'),title:String(f.get('title')||'מפגש שבועי').trim(),notes:String(f.get('notes')||'').trim(),createdAt:Date.now()};const arr=loadWeekly();arr.push(record);saveWeekly(arr);const adminNow=loadAdmin();for(let i=0;i<record.count;i++){adminNow.events.push({id:`${record.id}_${i+1}`,date:addDays(record.startDate,i*7),time:record.time,garden:record.garden,program:record.program,title:`${record.title} ${i+1}`,status:'planned',duration:record.duration,notes:record.notes,scheduleId:record.id,meetingNo:i+1});}saveAdmin(adminNow);renderWeekly();};
    body.querySelectorAll('[data-delete-weekly]').forEach(b=>b.onclick=()=>{const id=b.dataset.deleteWeekly;if(!confirm('למחוק את המסלול ואת המפגשים שיצר בלוח?'))return;saveWeekly(loadWeekly().filter(x=>x.id!==id));const a=loadAdmin();a.events=a.events.filter(e=>e.scheduleId!==id);saveAdmin(a);renderWeekly();});
    body.querySelectorAll('[data-open-calendar]').forEach(b=>b.onclick=()=>{const tab=document.querySelector('.v22-admin-tabs [data-tab="calendar"]');tab?.click();});
  }

  function watch(){new MutationObserver(()=>{injectTab();const modal=$('.v22-admin-modal');if(modal&&!modal.dataset.v2214Weekly){modal.dataset.v2214Weekly='1';injectTab();}}).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('click',e=>{const b=e.target.closest?.('.v22-admin-tabs [data-tab="weekly"]');if(b){e.preventDefault();e.stopPropagation();renderWeekly();}},true);setTimeout(injectTab,500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
  window.StoryOSWeeklyManagement={version:VERSION,render:renderWeekly};
})();
