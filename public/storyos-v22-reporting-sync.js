(() => {
  const VERSION='22.34.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const ADMIN_PATH='storyos/data/admin-state.json';
  const OP_PATH='storyos/data/operator-state.json';
  let lastAdminSig='';
  let syncing=false;
  const $=s=>document.querySelector(s);
  function loadAdmin(){try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]}}catch(_){return {gardens:[],teachers:[],events:[]}}}
  function saveAdmin(d){localStorage.setItem(ADMIN_KEY,JSON.stringify(d))}
  async function readCloud(path){const fb=window.StoryOSFirebase;if(!fb)return null;await fb.ready();const user=await fb.currentUser();if(!user)return null;try{const url=await fb.getUrl(path);const r=await fetch(url,{cache:'no-store'});if(!r.ok)return null;return await r.json()}catch(_){return null}}
  async function uploadJson(path,data){const fb=window.StoryOSFirebase;if(!fb)return false;await fb.ready();const user=await fb.currentUser();if(!user)return false;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});await fb.upload(path,blob,{contentType:'application/json',customMetadata:{storyosVersion:VERSION,updatedAt:new Date().toISOString()}});return true}
  async function pushAdmin(){if(syncing)return;const fb=window.StoryOSFirebase;if(!fb)return;try{await fb.ready();if(!await fb.currentUser())return;const admin=loadAdmin();const payload={version:VERSION,updatedAt:new Date().toISOString(),...admin};const sig=JSON.stringify(admin);if(sig===lastAdminSig)return;syncing=true;await uploadJson(ADMIN_PATH,payload);lastAdminSig=sig;window.dispatchEvent(new CustomEvent('storyos-reporting-sync',{detail:{type:'admin-pushed'}}))}catch(err){console.warn('StoryOS reporting push failed',err)}finally{syncing=false}}
  async function pullOperator(){const cloud=await readCloud(OP_PATH);if(!cloud||!Array.isArray(cloud.reports))return;const admin=loadAdmin();let changed=false;for(const rep of cloud.reports){const ev=admin.events.find(e=>String(e.id)===String(rep.eventId));if(!ev)continue;const patch={reportStatus:rep.status||'',checkInAt:rep.checkInAt||'',checkOutAt:rep.checkOutAt||'',actualMinutes:rep.actualMinutes??'',operatorNotes:rep.operatorNotes||'',childrenCount:rep.childrenCount??'',completed:rep.completed??'',feedbackStatus:rep.feedbackStatus||'',feedbackSentAt:rep.feedbackSentAt||''};for(const [k,v] of Object.entries(patch)){if(ev[k]!==v){ev[k]=v;changed=true}}if(rep.status==='completed'&&ev.status!=='done'){ev.status='done';changed=true}else if(rep.status==='in-progress'&&ev.status==='planned'){ev.status='in-progress';changed=true}}
    if(changed){saveAdmin(admin);lastAdminSig='';setTimeout(pushAdmin,100)}
  }
  function installButton(){if($('#v2234OperatorBtn'))return;const actions=$('.head-actions');if(!actions)return;const b=document.createElement('button');b.id='v2234OperatorBtn';b.type='button';b.className='btn';b.textContent='📱 דיווח מפעיל';b.title='פתיחת אפליקציית דיווח כניסה/יציאה ומשוב';b.onclick=()=>{location.href='/operator-report.html?v='+VERSION};actions.appendChild(b)}
  async function cycle(){installButton();await pullOperator().catch(()=>{});await pushAdmin().catch(()=>{})}
  function boot(){installButton();setTimeout(cycle,1200);setInterval(cycle,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)cycle()});window.addEventListener('storyos-firebase-auth',()=>setTimeout(cycle,300))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSReportingSync={version:VERSION,push:pushAdmin,pull:pullOperator,adminPath:ADMIN_PATH,operatorPath:OP_PATH};
})();
