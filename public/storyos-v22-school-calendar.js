(() => {
  const VERSION='22.33.0';
  const START='2026-09-01';
  const END='2027-06-30';
  const MEETINGS_PER_DAY=37;
  const CLOSURES=[
    ['2026-09-11','2026-09-13','חופשת ראש השנה'],
    ['2026-09-20','2026-10-03','יום כיפור וחופשת סוכות'],
    ['2026-12-06','2026-12-12','חופשת חנוכה'],
    ['2027-03-23','2027-03-24','חופשת פורים'],
    ['2027-04-13','2027-04-28','חופשת פסח'],
    ['2027-05-12','2027-05-12','יום העצמאות'],
    ['2027-06-10','2027-06-11','חופשת שבועות']
  ];
  const LIMITED={'2027-05-11':'יום הזיכרון – יום לימודים מקוצר עד 12:00'};
  const $=s=>document.querySelector(s);
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const heDate=s=>{const [y,m,d]=s.split('-');return `${d}.${m}.${y}`};
  function closureFor(s){for(const [a,b,r] of CLOSURES)if(s>=a&&s<=b)return r;return ''}
  function build(){
    const rows=[];const counters={ראשון:0,שלישי:0};
    const d=new Date(2026,8,1,12,0,0);
    const end=new Date(2027,5,30,12,0,0);
    while(d<=end){
      const dow=d.getDay();
      if(dow===0||dow===2){
        const date=iso(d),day=dow===0?'ראשון':'שלישי',closedReason=closureFor(date),limited=LIMITED[date]||'';
        const status=closedReason?'סגור':limited?'מוגבל':'זמין';
        let meetingNo='';if(status!=='סגור'){counters[day]++;meetingNo=counters[day]}
        rows.push({date,displayDate:heDate(date),day,status,reason:closedReason||limited,meetingNo,available:status!=='סגור'});
      }
      d.setDate(d.getDate()+1);
    }
    return rows;
  }
  const rows=build();
  const summary={
    sundayTotal:rows.filter(r=>r.day==='ראשון').length,
    tuesdayTotal:rows.filter(r=>r.day==='שלישי').length,
    sundayClosed:rows.filter(r=>r.day==='ראשון'&&r.status==='סגור').length,
    tuesdayClosed:rows.filter(r=>r.day==='שלישי'&&r.status==='סגור').length,
    sundayAvailable:rows.filter(r=>r.day==='ראשון'&&r.status!=='סגור').length,
    tuesdayAvailable:rows.filter(r=>r.day==='שלישי'&&r.status!=='סגור').length
  };

  function addStyles(){if($('#v2233SchoolCalendarStyle'))return;const s=document.createElement('style');s.id='v2233SchoolCalendarStyle';s.textContent=`
    .v2233-cal-wrap{display:grid;gap:14px}.v2233-cal-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.v2233-cal-stat{border:1px solid var(--line);background:#fffdf8;border-radius:16px;padding:12px}.v2233-cal-stat b{display:block;font-size:1.35rem}.v2233-cal-table{width:100%;border-collapse:collapse;background:#fff}.v2233-cal-table th,.v2233-cal-table td{padding:9px 10px;border-bottom:1px solid #e7e0d5;text-align:right;vertical-align:top}.v2233-cal-table th{position:sticky;top:0;background:#f7f3eb;z-index:1}.v2233-status{display:inline-block;border-radius:999px;padding:3px 8px;font-size:.82rem}.v2233-status.open{background:#eafff0;color:#246b42}.v2233-status.closed{background:#fff0f0;color:#963737}.v2233-status.limited{background:#fff6dc;color:#8a6517}.v2233-cal-note{background:#eef7ff;border:1px solid #d6eaff;border-radius:14px;padding:10px 12px;color:#355b7a}.v2233-filters{display:flex;gap:8px;flex-wrap:wrap}.v2233-filters button.active{background:#6c50e0;color:#fff;border-color:#5e45d7}@media(max-width:800px){.v2233-cal-summary{grid-template-columns:1fr 1fr}.v2233-cal-table{font-size:.88rem}}
  `;document.head.appendChild(s)}

  function renderCalendar(filter='all'){
    const body=$('#v22AdminBody');if(!body)return;
    addStyles();
    const list=rows.filter(r=>filter==='all'||filter===r.day||filter===r.status);
    body.innerHTML=`<div class="v2233-cal-wrap"><div><h3 style="margin:0 0 5px">לוח שנת הלימודים 2026–2027 · ראשון ושלישי</h3><div class="v2233-cal-note">המערכת כוללת 37 מפגשי פעילות אפשריים לכל יום קבוע. ימים שבהם הגן סגור אינם מקבלים מספר מפגש. יום לימודים מקוצר מסומן כ״מוגבל״.</div></div><div class="v2233-cal-summary"><div class="v2233-cal-stat"><b>${summary.sundayAvailable}</b><span>ימי ראשון זמינים</span></div><div class="v2233-cal-stat"><b>${summary.tuesdayAvailable}</b><span>ימי שלישי זמינים</span></div><div class="v2233-cal-stat"><b>${summary.sundayClosed}</b><span>ימי ראשון סגורים</span></div><div class="v2233-cal-stat"><b>${summary.tuesdayClosed}</b><span>ימי שלישי סגורים</span></div></div><div class="v2233-filters"><button class="btn ${filter==='all'?'active':''}" data-v2233-filter="all">הכול</button><button class="btn ${filter==='ראשון'?'active':''}" data-v2233-filter="ראשון">ראשון</button><button class="btn ${filter==='שלישי'?'active':''}" data-v2233-filter="שלישי">שלישי</button><button class="btn ${filter==='זמין'?'active':''}" data-v2233-filter="זמין">זמין</button><button class="btn ${filter==='סגור'?'active':''}" data-v2233-filter="סגור">סגור</button><button class="btn ${filter==='מוגבל'?'active':''}" data-v2233-filter="מוגבל">מוגבל</button></div><div style="max-height:58dvh;overflow:auto;border:1px solid var(--line);border-radius:16px"><table class="v2233-cal-table"><thead><tr><th>תאריך</th><th>יום</th><th>מס׳ מפגש</th><th>סטטוס</th><th>חג / הערה</th></tr></thead><tbody>${list.map(r=>`<tr><td>${r.displayDate}</td><td>${r.day}</td><td>${r.meetingNo||'—'}</td><td><span class="v2233-status ${r.status==='זמין'?'open':r.status==='סגור'?'closed':'limited'}">${r.status}</span></td><td>${r.reason||''}</td></tr>`).join('')}</tbody></table></div></div>`;
    body.querySelectorAll('[data-v2233-filter]').forEach(b=>b.onclick=()=>renderCalendar(b.dataset.v2233Filter));
  }

  function injectAdminTab(){
    const tabs=$('.v22-admin-tabs');if(!tabs||tabs.querySelector('[data-tab="school-calendar"]'))return;
    const b=document.createElement('button');b.dataset.tab='school-calendar';b.textContent='לוח לימודים';b.onclick=()=>{tabs.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));renderCalendar('all')};tabs.appendChild(b);
  }
  function watch(){injectAdminTab();new MutationObserver(()=>injectAdminTab()).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('#v22AdminBtn'))setTimeout(injectAdminTab,80)},true)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
  window.StoryOSSchoolCalendar={version:VERSION,start:START,end:END,meetingCount:MEETINGS_PER_DAY,rows,summary,closures:CLOSURES,limited:LIMITED,render:renderCalendar};
})();
