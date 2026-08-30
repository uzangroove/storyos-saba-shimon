(() => {
  const VERSION='22.35.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const WEEKLY_KEY='storyos_v22_weekly_v1';
  const ADMIN_PATH='storyos/data/admin-state.json';
  const OP_PATH='storyos/data/operator-state.json';
  const SEED_URL='/storyos-shared-admin-seed.json?v='+VERSION;
  let lastAdminSig='';
  let syncing=false;
  const $=s=>document.querySelector(s);
  const clone=v=>JSON.parse(JSON.stringify(v));

  function loadAdmin(){try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]}}catch(_){return {gardens:[],teachers:[],events:[]}}}
  function saveAdmin(d){localStorage.setItem(ADMIN_KEY,JSON.stringify(d))}
  function loadWeekly(){try{const d=JSON.parse(localStorage.getItem(WEEKLY_KEY)||'[]');return Array.isArray(d)?d:[]}catch(_){return[]}}
  function saveWeekly(d){localStorage.setItem(WEEKLY_KEY,JSON.stringify(d))}
  async function readSeed(){try{const r=await fetch(SEED_URL,{cache:'no-store'});return r.ok?await r.json():null}catch(_){return null}}

  function mergeByKey(base=[],incoming=[],keyFn){
    const map=new Map();
    for(const row of base){const k=keyFn(row);if(k)map.set(k,clone(row))}
    for(const row of incoming){const k=keyFn(row);if(!k)continue;map.set(k,{...(map.get(k)||{}),...clone(row)})}
    return [...map.values()];
  }
  const gardenKey=g=>String(g?.id||g?.name||'').trim();
  const teacherKey=t=>String(t?.id||[t?.garden,t?.name,t?.phone,t?.email].filter(Boolean).join('|')||'').trim();
  const eventKey=e=>String(e?.id||[e?.garden,e?.date,e?.time,e?.meetingNo].filter(v=>v!==''&&v!=null).join('|')||'').trim();

  function dayNameFromDate(iso){const d=new Date(iso+'T12:00:00');return d.getDay()===0?'ראשון':d.getDay()===2?'שלישי':''}
  function availableDates(day,count){
    const rows=window.StoryOSSchoolCalendar?.rows||[];
    return rows.filter(r=>r.day===day&&r.status!=='סגור').slice(0,count).map(r=>r.date);
  }
  function ensureSeedSchedules(admin,seed){
    const schedules=Array.isArray(seed?.recurringSchedules)?seed.recurringSchedules:[];
    let weekly=loadWeekly();
    for(const s of schedules){
      if(!weekly.some(w=>w.id===s.id||w.garden===s.garden&&w.startDate&&dayNameFromDate(w.startDate)===s.day)){
        weekly.push({id:s.id,garden:s.garden,program:s.program||'',startDate:'',time:s.time||'',count:Number(s.meetingCount||37),duration:s.duration||'45 דקות',title:'מפגש שבועי',notes:'',schoolYear:s.schoolYear||'2026-2027',day:s.day,source:'shared-seed'});
      }
      const dates=availableDates(s.day,Number(s.meetingCount||37));
      dates.forEach((date,i)=>{
        const id=`${s.id}_${i+1}`;
        if(admin.events.some(e=>String(e.id)===id))return;
        admin.events.push({id,date,time:s.time||'',garden:s.garden,program:s.program||'',title:`מפגש שבועי ${i+1}`,status:'planned',duration:s.duration||'45 דקות',notes:'',scheduleId:s.id,meetingNo:i+1,schoolYear:s.schoolYear||'2026-2027',source:'shared-seed'});
      });
    }
    saveWeekly(weekly);
    return admin;
  }

  async function readCloud(path){const fb=window.StoryOSFirebase;if(!fb)return null;await fb.ready();const user=await fb.currentUser();if(!user)return null;try{const url=await fb.getUrl(path);const r=await fetch(url+'#'+Date.now(),{cache:'no-store'});if(!r.ok)return null;return await r.json()}catch(_){return null}}
  async function uploadJson(path,data){const fb=window.StoryOSFirebase;if(!fb)return false;await fb.ready();const user=await fb.currentUser();if(!user)return false;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});await fb.upload(path,blob,{contentType:'application/json',customMetadata:{storyosVersion:VERSION,updatedAt:new Date().toISOString()}});return true}

  async function hydrateShared(){
    const seed=await readSeed()||{gardens:[],teachers:[],recurringSchedules:[]};
    const cloud=await readCloud(ADMIN_PATH);
    const local=loadAdmin();
    let merged={
      gardens:mergeByKey(seed.gardens||[],cloud?.gardens||[],gardenKey),
      teachers:mergeByKey(seed.teachers||[],cloud?.teachers||[],teacherKey),
      events:mergeByKey([],cloud?.events||[],eventKey)
    };
    merged.gardens=mergeByKey(merged.gardens,local.gardens,gardenKey);
    merged.teachers=mergeByKey(merged.teachers,local.teachers,teacherKey);
    merged.events=mergeByKey(merged.events,local.events,eventKey);
    merged=ensureSeedSchedules(merged,seed);
    saveAdmin(merged);
    lastAdminSig='';
    window.dispatchEvent(new CustomEvent('storyos-shared-admin-ready',{detail:{version:VERSION,gardens:merged.gardens.length,events:merged.events.length}}));
    return merged;
  }

  async function pushAdmin(){if(syncing)return;const fb=window.StoryOSFirebase;if(!fb)return;try{await fb.ready();if(!await fb.currentUser())return;const admin=loadAdmin();const payload={version:VERSION,updatedAt:new Date().toISOString(),...admin};const sig=JSON.stringify(admin);if(sig===lastAdminSig)return;syncing=true;await uploadJson(ADMIN_PATH,payload);lastAdminSig=sig;window.dispatchEvent(new CustomEvent('storyos-reporting-sync',{detail:{type:'admin-pushed'}}))}catch(err){console.warn('StoryOS reporting push failed',err)}finally{syncing=false}}
  async function pullOperator(){const cloud=await readCloud(OP_PATH);if(!cloud||!Array.isArray(cloud.reports))return;const admin=loadAdmin();let changed=false;for(const rep of cloud.reports){const ev=admin.events.find(e=>String(e.id)===String(rep.eventId));if(!ev)continue;const patch={reportStatus:rep.status||'',checkInAt:rep.checkInAt||'',checkOutAt:rep.checkOutAt||'',actualMinutes:rep.actualMinutes??'',operatorNotes:rep.operatorNotes||'',childrenCount:rep.childrenCount??'',completed:rep.completed??'',feedbackStatus:rep.feedbackStatus||'',feedbackSentAt:rep.feedbackSentAt||''};for(const [k,v] of Object.entries(patch)){if(ev[k]!==v){ev[k]=v;changed=true}}if(rep.status==='completed'&&ev.status!=='done'){ev.status='done';changed=true}else if(rep.status==='in-progress'&&ev.status==='planned'){ev.status='in-progress';changed=true}}
    if(changed){saveAdmin(admin);lastAdminSig='';setTimeout(pushAdmin,100)}
  }
  function installButton(){if($('#v2234OperatorBtn'))return;const actions=$('.head-actions');if(!actions)return;const b=document.createElement('button');b.id='v2234OperatorBtn';b.type='button';b.className='btn';b.textContent='📱 דיווח מפעיל';b.title='פתיחת אפליקציית דיווח כניסה/יציאה ומשוב';b.onclick=()=>{location.href='/operator-report.html?v='+VERSION};actions.appendChild(b)}
  async function cycle(){installButton();await hydrateShared().catch(()=>{});await pullOperator().catch(()=>{});await pushAdmin().catch(()=>{})}
  function boot(){installButton();setTimeout(cycle,1400);setInterval(cycle,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)cycle()});window.addEventListener('storyos-firebase-auth',()=>setTimeout(cycle,300))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSReportingSync={version:VERSION,hydrate:hydrateShared,push:pushAdmin,pull:pullOperator,adminPath:ADMIN_PATH,operatorPath:OP_PATH};
})();
