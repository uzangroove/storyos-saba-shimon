(() => {
  const VERSION='22.12.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const ARAVA='גן ערבה';
  const LEGACY_STEM_ALIAS={'איילון':'אילון','טובה':'וובה'};
  const FIXED_NAME={original:'original.jpg',after:'after.png',video:'video.mp4',model:'model.glb'};
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function loadAdmin(){try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]}}catch(_){return {gardens:[],teachers:[],events:[]}}}
  function safePart(v){return String(v||'').trim().replace(/[\\/]+/g,'-').replace(/\s+/g,' ').slice(0,120)}
  function gardenSlug(name){const g=loadAdmin().gardens.find(x=>x.name===name);return safePart(g?.slug||name)}
  function artPath(garden,child,type){return `storyos/gardens/${gardenSlug(garden)}/drawing-alive/activity-01/children/${safePart(child)}/${FIXED_NAME[type]||safePart(type)}`}
  function proxied(url){try{return window.StoryOSCORSHotfix?.proxied?.(url)||url}catch(_){return url}}

  async function ensureAuth(interactive=true){const fb=window.StoryOSFirebase;if(!fb)throw new Error('Firebase עדיין לא נטען.');await fb.ready();let user=await fb.currentUser();if(!user&&interactive)user=await fb.signInWithPrompt();if(!user)throw new Error('נדרשת התחברות ל-Firebase.');return {fb,user};}
  async function fetchBlobFromFirebase(pathOrRef){const {fb}=await ensureAuth(false);const raw=await fb.getUrl(pathOrRef);const r=await fetch(proxied(raw));if(!r.ok)throw new Error(`הורדת קובץ נכשלה (${r.status})`);return await r.blob()}
  async function uploadCanonical(garden,child,type,blob,originalName=''){
    const {fb}=await ensureAuth(true);const path=artPath(garden,child,type);const metadata={contentType:blob.type||undefined,customMetadata:{storyosVersion:VERSION,gardenName:garden,childName:child,activityId:'drawing-alive-01',mediaType:type,originalName:originalName||'',canonical:'true'}};const out=await fb.upload(path,blob,metadata);return {path,url:out.url};
  }
  async function downloadCanonical(garden,child,type){const path=artPath(garden,child,type);try{const blob=await fetchBlobFromFirebase(path);return {blob,name:FIXED_NAME[type],cloudPath:path,source:'firebase-canonical'}}catch(_){return null}}

  function patchMediaHub(){
    const hub=window.StoryOSMediaHub;if(!hub||hub.__cloudPatched)return false;
    const localPut=hub.putArtAsset.bind(hub),localGet=hub.getArtAsset.bind(hub);
    hub.putArtAsset=async(garden,child,type,blob,name='')=>{
      const local=await localPut(garden,child,type,blob,name);
      try{const cloud=await uploadCanonical(garden,child,type,blob,name);window.dispatchEvent(new CustomEvent('storyos-cloud-upload',{detail:{garden,child,type,...cloud}}));return {...local,cloudSynced:true,cloudPath:cloud.path,cloudUrl:cloud.url}}catch(err){window.dispatchEvent(new CustomEvent('storyos-cloud-upload-error',{detail:{garden,child,type,error:String(err?.message||err)}}));return {...local,cloudSynced:false,cloudError:String(err?.message||err)}};
    };
    hub.getArtAsset=async(garden,child,type)=>{
      try{const fb=window.StoryOSFirebase;if(fb&&await fb.currentUser().catch(()=>null)){const cloud=await downloadCanonical(garden,child,type);if(cloud){try{await localPut(garden,child,type,cloud.blob,cloud.name)}catch(_){}return cloud;}}}catch(_){}
      return localGet(garden,child,type);
    };
    hub.cloud={version:VERSION,artPath,uploadCanonical,downloadCanonical};hub.__cloudPatched=true;return true;
  }

  async function getLocalArtRecords(){return new Promise(resolve=>{let r;try{r=indexedDB.open('StoryOS_MediaHub')}catch(_){resolve([]);return}r.onsuccess=()=>{const db=r.result;if(!db.objectStoreNames.contains('media')){resolve([]);return}const q=db.transaction('media','readonly').objectStore('media').getAll();q.onsuccess=()=>resolve((q.result||[]).filter(x=>x.scope==='art'&&x.blob));q.onerror=()=>resolve([])};r.onerror=()=>resolve([])});}
  async function syncLocalArt(progress){await ensureAuth(true);const rows=await getLocalArtRecords();let done=0,failed=0;for(const row of rows){try{await uploadCanonical(row.garden,row.child,row.type,row.blob,row.name||'');done++;}catch(_){failed++;}progress?.({done,failed,total:rows.length,label:`${row.garden} · ${row.child} · ${row.type}`});}return {done,failed,total:rows.length};}

  function basename(p){return String(p||'').split('/').pop()||''}
  function legacyNames(child,row){const stem=LEGACY_STEM_ALIAS[child]||child;return {original:`${stem}.jpg`,after:`${stem} תלת מימד.png`,video:`${stem}.mp4`,model:row?.model||''}}
  async function migrateArava(progress){
    const {fb}=await ensureAuth(true);const manifest=window.StoryOSChildViewer?.manifest||[];if(!manifest.length)throw new Error('לא נמצא Manifest של ילדי גן ערבה.');
    const all=[];for(const prefix of ['MEDIA','gardens/gan-arava/models']){try{all.push(...await fb.listFiles(prefix))}catch(_){}}
    let done=0,missing=0,failed=0,total=manifest.length*4;
    for(const row of manifest){const names=legacyNames(row.name,row);for(const type of ['original','after','video','model']){const wanted=names[type];const hit=all.find(x=>basename(x.fullPath||x.name)===wanted);if(!hit){missing++;progress?.({done,missing,failed,total,label:`חסר: ${row.name} · ${type}`});continue;}try{const blob=await fetchBlobFromFirebase(hit.ref||hit.fullPath||hit.name);await uploadCanonical(ARAVA,row.name,type,blob,wanted);done++;}catch(_){failed++;}progress?.({done,missing,failed,total,label:`${row.name} · ${type}`});}}
    return {done,missing,failed,total};
  }

  async function cloudStats(){const {fb,user}=await ensureAuth(false);let canonical=[],legacy=[];try{canonical=await fb.listFiles('storyos')}catch(_){}try{legacy=await fb.listFiles('MEDIA')}catch(_){}return {email:user.email||user.uid,canonical:canonical.length,legacy:legacy.length};}

  function addStyles(){if($('#v2212CloudStyle'))return;const s=document.createElement('style');s.id='v2212CloudStyle';s.textContent=`
    .v2212-cloud-modal{position:fixed;inset:0;z-index:4000;background:rgba(24,31,48,.58);display:grid;place-items:center;padding:16px}.v2212-cloud-box{width:min(920px,96vw);max-height:92dvh;overflow:auto;background:#fff;border-radius:22px;border:1px solid var(--line);box-shadow:0 28px 80px rgba(0,0,0,.28);padding:20px}.v2212-cloud-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.v2212-cloud-head h2{margin:0}.v2212-cloud-head p{margin:5px 0 0;color:var(--muted)}.v2212-cloud-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.v2212-cloud-card{border:1px solid var(--line);border-radius:16px;padding:14px;background:#fffdf8}.v2212-cloud-card h3{margin:0 0 8px}.v2212-cloud-actions{display:flex;gap:8px;flex-wrap:wrap}.v2212-progress{height:12px;border-radius:999px;background:#eee9df;overflow:hidden;margin:10px 0}.v2212-progress>i{display:block;height:100%;width:0;background:#6c50e0;transition:width .2s}.v2212-log{font-family:monospace;direction:ltr;text-align:left;white-space:pre-wrap;background:#151922;color:#dfe5f3;border-radius:12px;padding:10px;max-height:180px;overflow:auto;font-size:.82rem}.v2212-badge{display:inline-block;border-radius:999px;padding:4px 8px;background:#eef3ff;color:#34507a;font-size:.85rem}.v2212-ok{background:#eaf8ee;color:#23693c}.v2212-warn{background:#fff4e3;color:#8c5c18}@media(max-width:760px){.v2212-cloud-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}

  function closeModal(){document.querySelector('.v2212-cloud-modal')?.remove()}
  async function openModal(){
    addStyles();closeModal();const modal=document.createElement('div');modal.className='v2212-cloud-modal';modal.innerHTML=`<div class="v2212-cloud-box"><div class="v2212-cloud-head"><div><h2>☁ StoryOS Media Cloud · v22.12</h2><p>Firebase Storage הוא מקור האמת למדיה. MediaHub נשאר Cache מקומי.</p></div><button class="btn" data-close>✕ סגור</button></div><div class="v2212-cloud-grid"><section class="v2212-cloud-card"><h3>חיבור Firebase</h3><div id="v2212Auth">בודק חיבור…</div><div class="v2212-cloud-actions" style="margin-top:10px"><button class="btn primary" id="v2212Login">התחבר</button><button class="btn" id="v2212Logout">התנתק</button><button class="btn" id="v2212Refresh">רענן מצב</button></div></section><section class="v2212-cloud-card"><h3>מקור אמת אחד</h3><div id="v2212Stats">—</div><p style="color:var(--muted)">נתיב קבוע לתוצר: גן → פעילות 1 → ילד → לפני/אחרי/סרטון/מודל. העלאה חדשה דורסת את אותו נכס במקום ליצור עותקים.</p></section><section class="v2212-cloud-card"><h3>סנכרון התוכן שכבר העלית במכשיר</h3><p>מעלה את כל תוצרי „כשהציור קם לתחייה” מה־MediaHub המקומי לנתיבים הקבועים ב־Firebase.</p><button class="btn primary" id="v2212SyncLocal">סנכרן מדיה מקומית לענן</button></section><section class="v2212-cloud-card"><h3>העברת גן ערבה למבנה החדש</h3><p>קורא את MEDIA ואת models הקיימים, ומעתיק אותם ל־storyos/gardens/gan-arava/... בלי למחוק את המקור.</p><button class="btn" id="v2212MigrateArava">העבר את גן ערבה למאגר המאוחד</button></section></div><div class="v2212-progress"><i id="v2212Bar"></i></div><div id="v2212ProgressText" style="color:var(--muted);margin-bottom:8px">מוכן.</div><div id="v2212Log" class="v2212-log">StoryOS Media Cloud ready.</div></div>`;document.body.appendChild(modal);modal.querySelector('[data-close]').onclick=closeModal;modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
    const log=(t)=>{const el=$('#v2212Log');if(el){el.textContent+=`\n${new Date().toLocaleTimeString()} ${t}`;el.scrollTop=el.scrollHeight}};const progress=o=>{const total=Math.max(1,o.total||1),count=(o.done||0)+(o.missing||0)+(o.failed||0);$('#v2212Bar').style.width=Math.min(100,Math.round(count/total*100))+'%';$('#v2212ProgressText').textContent=`${count}/${total} · הצליח ${o.done||0} · חסר ${o.missing||0} · נכשל ${o.failed||0} · ${o.label||''}`;};
    async function refresh(){const fb=window.StoryOSFirebase;if(!fb){$('#v2212Auth').innerHTML='<span class="v2212-badge v2212-warn">Firebase לא נטען</span>';return;}try{await fb.ready();const user=await fb.currentUser();if(!user){$('#v2212Auth').innerHTML='<span class="v2212-badge v2212-warn">לא מחובר</span>';$('#v2212Stats').textContent='יש להתחבר כדי לקרוא את המאגר.';return;}$('#v2212Auth').innerHTML=`<span class="v2212-badge v2212-ok">מחובר</span> ${esc(user.email||user.uid)}`;const st=await cloudStats();$('#v2212Stats').innerHTML=`<b>${st.canonical}</b> קבצים במבנה המאוחד · <b>${st.legacy}</b> קבצים ב־MEDIA הישן`; }catch(err){$('#v2212Auth').textContent='שגיאה: '+(err.code||err.message||err)}}
    $('#v2212Login').onclick=async()=>{try{await window.StoryOSFirebase.signInWithPrompt();log('Firebase login succeeded');await refresh()}catch(e){log('Login: '+(e.message||e))}};
    $('#v2212Logout').onclick=async()=>{try{await window.StoryOSFirebase.signOut();log('Signed out');await refresh()}catch(e){log('Logout: '+(e.message||e))}};$('#v2212Refresh').onclick=refresh;
    $('#v2212SyncLocal').onclick=async()=>{if(!confirm('להעלות עכשיו את כל המדיה המקומית של פעילות הציור ל-Firebase?'))return;$('#v2212Bar').style.width='0';try{const r=await syncLocalArt(progress);log(`Local sync complete: ${JSON.stringify(r)}`);await refresh()}catch(e){log('Local sync failed: '+(e.message||e))}};
    $('#v2212MigrateArava').onclick=async()=>{if(!confirm('הפעולה תעתיק את קבצי גן ערבה למבנה המאוחד בלי למחוק את המקור. להמשיך?'))return;$('#v2212Bar').style.width='0';try{const r=await migrateArava(progress);log(`Arava migration complete: ${JSON.stringify(r)}`);await refresh();window.StoryOSAravaMediaFix?.reload?.()}catch(e){log('Arava migration failed: '+(e.message||e))}};
    refresh();
  }

  function installButton(){const actions=$('.head-actions');if(!actions||$('#v2212CloudBtn'))return;const b=document.createElement('button');b.id='v2212CloudBtn';b.className='btn';b.textContent='☁ מדיה';b.onclick=openModal;actions.prepend(b)}
  function init(){patchMediaHub();installButton();new MutationObserver(()=>{patchMediaHub();installButton()}).observe(document.documentElement,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,100),{once:true});else setTimeout(init,100);
  window.StoryOSCloudMedia={version:VERSION,artPath,uploadCanonical,downloadCanonical,migrateArava,syncLocalArt,open:openModal};
})();
