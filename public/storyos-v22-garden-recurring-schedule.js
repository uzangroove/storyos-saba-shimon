(() => {
  'use strict';

  const VERSION='22.37.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const PROGRAM_START='2026-09-06';
  const PROGRAM_END='2027-06-30';
  const DURATION_MINUTES=45;
  const TRANSITION_MINUTES=15;
  const DAYS=[
    {value:'0',label:'יום ראשון'},
    {value:'1',label:'יום שני'},
    {value:'2',label:'יום שלישי'},
    {value:'3',label:'יום רביעי'},
    {value:'4',label:'יום חמישי'}
  ];
  const SLOTS=[
    {value:'09:00',label:'09:00–09:45'},
    {value:'10:00',label:'10:00–10:45'},
    {value:'11:00',label:'11:00–11:45'},
    {value:'12:00',label:'12:00–12:45'}
  ];

  // חופשות תשפ״ז שנמצאות כבר בלוח StoryOS, עם גיבוי מקומי אם המודול טרם נטען.
  const FALLBACK_CLOSURES=[
    ['2026-09-11','2026-09-13','חופשת ראש השנה'],
    ['2026-09-20','2026-09-21','יום כיפור'],
    ['2026-09-25','2026-10-03','חופשת סוכות'],
    ['2026-12-06','2026-12-12','חופשת חנוכה'],
    ['2027-03-23','2027-03-24','חופשת פורים'],
    ['2027-04-13','2027-04-28','חופשת פסח'],
    ['2027-05-12','2027-05-12','יום העצמאות'],
    ['2027-06-10','2027-06-11','חופשת שבועות']
  ];

  const $=s=>document.querySelector(s);
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function loadAdmin(){
    try{
      const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');
      return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]};
    }catch(_){return {gardens:[],teachers:[],events:[]}}
  }
  function saveAdmin(d){localStorage.setItem(ADMIN_KEY,JSON.stringify(d))}

  function closures(){
    const src=window.StoryOSSchoolCalendar?.closures;
    return Array.isArray(src)&&src.length?src:FALLBACK_CLOSURES;
  }
  function closureFor(date){
    for(const [a,b,reason] of closures()) if(date>=a&&date<=b) return reason||'חופשה';
    return '';
  }

  function occurrencesFor(dayValue,timeValue){
    if(dayValue===''||!timeValue)return[];
    const targetDay=Number(dayValue);
    const rows=[];
    const d=new Date(2026,8,6,12,0,0);
    const end=new Date(2027,5,30,12,0,0);
    while(d<=end){
      const date=iso(d);
      if(d.getDay()===targetDay){
        const reason=closureFor(date);
        rows.push({date,time:timeValue,available:!reason,reason});
      }
      d.setDate(d.getDate()+1);
    }
    return rows;
  }

  function getSchedule(g){
    return {
      day:String(g?.activityDay??''),
      time:g?.activityTime||'',
      duration:Number(g?.activityDuration||DURATION_MINUTES),
      transition:Number(g?.transitionMinutes||TRANSITION_MINUTES),
      start:g?.scheduleStart||PROGRAM_START,
      end:g?.scheduleEnd||PROGRAM_END
    };
  }

  function dayLabel(value){return DAYS.find(x=>x.value===String(value))?.label||''}
  function slotLabel(value){return SLOTS.find(x=>x.value===value)?.label||value||''}

  function addStyles(){
    if($('#v2237GardenScheduleStyle'))return;
    const s=document.createElement('style');s.id='v2237GardenScheduleStyle';s.textContent=`
      .v2237-schedule-note{grid-column:1/-1;background:#eef7ff;border:1px solid #d5e9fb;border-radius:13px;padding:10px 12px;color:#355b7a;line-height:1.45}
      .v2237-schedule-preview{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .v2237-stat{border:1px solid var(--line);border-radius:12px;background:#fffdf8;padding:9px 10px}.v2237-stat b{display:block;font-size:1.05rem}.v2237-stat small{color:var(--muted)}
      .v2237-schedule-chip{display:inline-block;margin-inline-start:6px;padding:3px 8px;border-radius:999px;background:#eef7ff;color:#285d89;font-size:.8rem;font-weight:700}
      @media(max-width:760px){.v2237-schedule-preview{grid-template-columns:1fr 1fr}}
    `;document.head.appendChild(s)
  }

  function preview(form){
    const day=form.querySelector('[name="activityDay"]')?.value??'';
    const time=form.querySelector('[name="activityTime"]')?.value??'';
    const host=form.querySelector('#v2237SchedulePreview');if(!host)return;
    if(day===''||!time){host.innerHTML='<div class="v2237-stat" style="grid-column:1/-1"><small>בחר יום ושעה כדי לראות את לוח השנה הקבוע.</small></div>';return}
    const rows=occurrencesFor(day,time);
    const available=rows.filter(x=>x.available);
    const skipped=rows.filter(x=>!x.available);
    host.innerHTML=`
      <div class="v2237-stat"><b>${esc(dayLabel(day))}</b><small>יום קבוע</small></div>
      <div class="v2237-stat"><b>${esc(slotLabel(time))}</b><small>45 דק׳ פעילות + 15 דק׳ מעבר</small></div>
      <div class="v2237-stat"><b>${available.length}</b><small>מועדים זמינים</small></div>
      <div class="v2237-stat"><b>${skipped.length}</b><small>מועדים שנדחו בגלל חופשה</small></div>`;
  }

  function currentEditingGarden(){
    const form=$('#v22GardenForm');if(!form)return null;
    const name=form.querySelector('[name="name"]')?.value?.trim();
    if(!name)return null;
    return loadAdmin().gardens.find(g=>g.name===name)||null;
  }

  function injectFields(){
    const form=$('#v22GardenForm');
    if(!form||form.querySelector('[data-v2237-schedule]'))return;
    addStyles();
    const g=currentEditingGarden();
    const schedule=getSchedule(g);
    const notes=form.querySelector('label.wide:last-of-type')||form.querySelector('[name="notes"]')?.closest('label');
    const anchor=notes||form.querySelector('.v22-admin-form-actions');
    if(!anchor)return;

    const frag=document.createElement('div');
    frag.dataset.v2237Schedule='1';
    frag.style.display='contents';
    frag.innerHTML=`
      <label>יום פעילות קבוע<select name="activityDay" required><option value="">בחר יום</option>${DAYS.map(d=>`<option value="${d.value}" ${schedule.day===d.value?'selected':''}>${d.label}</option>`).join('')}</select></label>
      <label>שעת פעילות קבועה<select name="activityTime" required><option value="">בחר שעה</option>${SLOTS.map(s=>`<option value="${s.value}" ${schedule.time===s.value?'selected':''}>${s.label}</option>`).join('')}</select></label>
      <div class="v2237-schedule-note"><b>מערכת שנתית קבועה:</b> הפעילות הראשונה יכולה להתקיים החל מ־06.09.2026. כל מפגש נמשך 45 דקות, ולאחריו נשמרות 15 דקות למעבר לגן הבא. המערכת מדלגת אוטומטית על מועדים החלים בחופשות הגנים.</div>
      <div id="v2237SchedulePreview" class="v2237-schedule-preview"></div>`;
    form.insertBefore(frag,anchor);
    form.querySelector('[name="activityDay"]')?.addEventListener('change',()=>preview(form));
    form.querySelector('[name="activityTime"]')?.addEventListener('change',()=>preview(form));
    preview(form);
  }

  // נשמר לפני ה-submit המקורי, ואז מוזרק חזרה לרשומת הגן אחרי שהקוד הקיים יוצר/מעדכן אותה.
  document.addEventListener('submit',e=>{
    const form=e.target;
    if(form?.id!=='v22GardenForm')return;
    const fd=new FormData(form);
    const schedule={
      name:String(fd.get('name')||'').trim(),
      day:String(fd.get('activityDay')??''),
      time:String(fd.get('activityTime')||''),
      activityDuration:DURATION_MINUTES,
      transitionMinutes:TRANSITION_MINUTES,
      scheduleStart:PROGRAM_START,
      scheduleEnd:PROGRAM_END
    };
    if(!schedule.day||!schedule.time)return;
    setTimeout(()=>{
      const data=loadAdmin();
      const g=data.gardens.find(x=>x.name===schedule.name);
      if(!g)return;
      g.activityDay=schedule.day;
      g.activityTime=schedule.time;
      g.activityDuration=schedule.activityDuration;
      g.transitionMinutes=schedule.transitionMinutes;
      g.scheduleStart=schedule.scheduleStart;
      g.scheduleEnd=schedule.scheduleEnd;
      g.recurringSchedule=true;
      saveAdmin(data);
      setTimeout(augmentGardenRows,40);
    },30);
  },true);

  function augmentGardenRows(){
    const body=$('#v22AdminBody');if(!body||!body.textContent.includes('רשימת גנים'))return;
    const data=loadAdmin();
    body.querySelectorAll('.v22-admin-row').forEach(row=>{
      const name=row.querySelector('b')?.textContent?.trim();
      const g=data.gardens.find(x=>x.name===name);if(!g||g.activityDay==null||!g.activityTime)return;
      if(row.querySelector('[data-v2237-chip]'))return;
      const small=row.querySelector('small');if(!small)return;
      const chip=document.createElement('span');chip.dataset.v2237Chip='1';chip.className='v2237-schedule-chip';
      chip.textContent=`${dayLabel(g.activityDay)} · ${g.activityTime}`;
      small.appendChild(chip);
    });
  }

  function scheduleForGarden(gardenOrName){
    const data=loadAdmin();
    const g=typeof gardenOrName==='string'?data.gardens.find(x=>x.name===gardenOrName):gardenOrName;
    if(!g)return[];
    return occurrencesFor(String(g.activityDay??''),g.activityTime||'').map((x,index)=>({...x,meetingNumber:x.available?null:null,index:index+1,garden:g.name}));
  }

  const observer=new MutationObserver(()=>{injectFields();augmentGardenRows()});
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    const t=e.target.closest?.('button');if(!t)return;
    if(t.id==='v22AdminBtn'||t.dataset?.tab==='gardens'||/עריכה/.test(t.textContent||''))setTimeout(()=>{injectFields();augmentGardenRows()},50);
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{injectFields();augmentGardenRows()},{once:true});else{injectFields();augmentGardenRows()}

  window.StoryOSGardenRecurringSchedule={
    version:VERSION,
    start:PROGRAM_START,
    end:PROGRAM_END,
    durationMinutes:DURATION_MINUTES,
    transitionMinutes:TRANSITION_MINUTES,
    days:DAYS,
    slots:SLOTS,
    closures:FALLBACK_CLOSURES,
    getOccurrences:occurrencesFor,
    getGardenSchedule:scheduleForGarden
  };
  console.info(`[StoryOS] fixed garden schedule loaded v${VERSION}`);
})();