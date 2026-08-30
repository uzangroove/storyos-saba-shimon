(() => {
  'use strict';
  const VERSION='22.42.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const GARDEN='גן ערבה';
  const SLUG='gan-arava';
  const PROXY_PATH='/firebase-media';
  const LEGACY_STEM_ALIAS={'איילון':'אילון','טובה':'וובה'};
  const MANIFEST=[
    {name:'בן',before:'ben_before.jpg',after:'ben_after.png',video:'ben_video.mp4',model:'ben_3dmodel.glb'},
    {name:'איילון',before:'eylon_before.jpg',after:'eylon_after.png',video:'eylon_video.mp4',model:'eylon_3dmodel.glb'},
    {name:'גיא',before:'guy_before.jpg',after:'guy_after.png',video:'guy_video.mp4',model:'guy_3dmodel.glb'},
    {name:'דורי',before:'dori_before.jpg',after:'dori_after.png',video:'dori_video.mp4',model:'dori_3dmodel.glb'},
    {name:'הודיה',before:'odaya_before.jpg',after:'odaya_after.png',video:'odaya_video.mp4',model:'odaya_3dmodel.glb'},
    {name:'טובה',before:'vova_before.jpg',after:'vova_after.png',video:'vova_video.mp4',model:'vova_3dmodel.glb'},
    {name:"ז'רה",before:'jera_before.jpg',after:'jera_after.png',video:'jera_video.mp4',model:'jera_3dmodel.glb'},
    {name:'טומי',before:'tomy_before.jpg',after:'tomy_after.png',video:'tomy_video.mp4',model:'tomy_3dmodel.glb'},
    {name:'יואב',before:'yoav_before.jpg',after:'yoav_after.png',video:'yoav_video.mp4',model:'yoav_3dmodel.glb'},
    {name:'ליאב',before:'liav_before.jpg',after:'liav_after.png',video:'liav_video.mp4',model:'liav_3dmodel.glb'},
    {name:'לני',before:'leny_before.jpg',after:'leny_after.png',video:'leny_video.mp4',model:'leny_3dmodel.glb'},
    {name:'מריאן',before:'mariane_before.jpg',after:'mariane_after.png',video:'mariane_video.mp4',model:'mariane_3dmodel.glb'},
    {name:'נלי',before:'nely_before.jpg',after:'nely_after.png',video:'nely_video.mp4',model:'nely_3dmodel.glb'},
    {name:'עומר ב',before:'omer_b_before.jpg',after:'omer_b_after.png',video:'omer_b_video.mp4',model:'omer_b_3dmodel.glb'},
    {name:'עומר ו',before:'omer_vav_before.jpg',after:'omer_vav_after.png',video:'omer_vav_video.mp4',model:'omer_vav_3dmodel.glb'},
    {name:'צופיה',before:'tsofia_before.jpg',after:'tsofia_after.png',video:'tsofia_video.mp4',model:'tsofia_3dmodel.glb'},
    {name:'רום',before:'rom_before.jpg',after:'rom_after.png',video:'rom_video.mp4',model:'rom_3dmodel.glb'},
    {name:'רון',before:'ron_before.jpg',after:'ron_after.png',video:'ron_video.mp4',model:'ron_3dmodel.glb'},
    {name:'רפאל',before:'rafael_before.jpg',after:'rafael_after.png',video:'rafael_video.mp4',model:'rafael_3dmodel.glb'},
    {name:'שיר',before:'shir_before.jpg',after:'shir_after.png',video:'shir_video.mp4',model:'shir_3dmodel.glb'},
    {name:'תום',before:'tom_before.jpg',after:'tom_after.png',video:'tom_video.mp4',model:'tom_3dmodel.glb'},
    {name:'תמר',before:'tamar_before.jpg',after:'tamar_after.png',video:'tamar_video.mp4',model:'tamar_3dmodel.glb'}
  ];
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let selectedIndex=0;
  let firebaseItems=null;
  let objectUrls=[];
  let activeGarden=GARDEN;

  function syncGardenRecord(){
    let data={gardens:[],teachers:[],events:[]};try{data=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}')}catch(_){}
    data.gardens=Array.isArray(data.gardens)?data.gardens:[];data.teachers=Array.isArray(data.teachers)?data.teachers:[];data.events=Array.isArray(data.events)?data.events:[];
    let g=data.gardens.find(x=>x.name===GARDEN||x.slug===SLUG);
    if(!g){g={id:SLUG,name:GARDEN,slug:SLUG,area:'כרמיאל',projectId:'saba-ganim-arava',storageBucket:'saba-ganim-arava.firebasestorage.app'};data.gardens.unshift(g)}
    g.children=MANIFEST.map(x=>x.name);g.childrenCount=MANIFEST.length;g.mediaManifest=MANIFEST;g.activityTemplate='drawing-alive-v1';g.active=true;
    localStorage.setItem(ADMIN_KEY,JSON.stringify(data));
  }
  syncGardenRecord();

  function ensureStyles(){if($('#v229ChildViewerStyle'))return;const s=document.createElement('style');s.id='v229ChildViewerStyle';s.textContent=`
    #v229ChildViewer{margin-top:14px}.v229-child-banner{display:flex;gap:7px;align-items:center;overflow-x:auto;padding:10px;background:#f5f1ff;border:1px solid #ded4ff;border-radius:18px;scrollbar-width:thin}.v229-child-btn{flex:0 0 auto;border:1px solid #d9d2e8;background:#fff;border-radius:999px;padding:8px 12px;font-weight:700;color:#34405a}.v229-child-btn.active{background:#6c50e0;color:#fff;border-color:#5e45d7}.v229-viewer-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0}.v229-viewer-head h2{margin:0}.v229-main-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(360px,.85fr);gap:12px;align-items:stretch}.v229-card{background:#fffdf8;border:1px solid var(--line);border-radius:18px;padding:12px;box-shadow:var(--shadow);min-width:0}.v229-card h3{margin:0 0 8px}.v229-compare{position:relative;aspect-ratio:4/3;overflow:hidden;border-radius:14px;background:#eee;border:1px solid #ddd}.v229-compare img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#faf8f3}.v229-after-wrap{position:absolute;inset:0;overflow:hidden;width:50%;border-left:2px solid #fff;box-shadow:2px 0 0 rgba(0,0,0,.15)}.v229-after-wrap img{width:100vw;max-width:none;height:100%;object-fit:contain;object-position:left center}.v229-slider{width:100%;margin-top:9px}.v229-labels{display:flex;justify-content:space-between;color:var(--muted);font-size:.9rem}.v229-video{width:100%;aspect-ratio:16/9;background:#111;border-radius:14px;object-fit:contain}.v229-model-wrap{height:420px;border:1px solid #e5ded1;border-radius:14px;background:linear-gradient(180deg,#f9f7f2,#ece8df);overflow:hidden;position:relative}.v229-model-wrap model-viewer{width:100%;height:100%;background:transparent}.v229-model-toolbar{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.v229-empty{height:100%;min-height:180px;display:grid;place-items:center;text-align:center;color:var(--muted);padding:18px;border:1px dashed #d9d1c4;border-radius:12px}.v229-status{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.v229-chip{border-radius:999px;padding:5px 9px;background:#f3f0e9;color:#6d6d6d;font-size:.85rem}.v229-chip.ok{background:#eaf8ee;color:#23693c}.v229-media-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.v229-upload{display:none}.v229-source-note{color:var(--muted);font-size:.9rem;line-height:1.45}.v229-overview-toggle{margin-right:auto}.v229-overview{display:none;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:12px}.v229-overview.open{display:grid}.v229-overview button{border:1px solid var(--line);border-radius:12px;background:#fff;padding:9px;text-align:right}.v229-overview button b{display:block}.v229-overview button small{color:var(--muted)}
    @media(max-width:1050px){.v229-main-grid,.v229-media-grid{grid-template-columns:1fr}.v229-model-wrap{height:360px}}
  `;document.head.appendChild(s)}

  function ensureModelViewer(){if(customElements.get('model-viewer')||$('#v229ModelViewerScript'))return;const s=document.createElement('script');s.id='v229ModelViewerScript';s.type='module';s.src='https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js';document.head.appendChild(s)}

  function releaseUrls(){
    if(objectUrls.length<48)return;
    const old=objectUrls.splice(0,Math.max(0,objectUrls.length-24));
    setTimeout(()=>{for(const u of old){try{URL.revokeObjectURL(u)}catch(_){}}},15000);
  }
  function blobUrl(blob){const u=URL.createObjectURL(blob);objectUrls.push(u);return u}
  function isFirebaseMedia(url){try{const u=new URL(url,location.href);return u.hostname==='firebasestorage.googleapis.com'||u.hostname==='storage.googleapis.com'}catch(_){return false}}
  function proxyMedia(url){if(!url||String(url).startsWith(PROXY_PATH)||!isFirebaseMedia(url))return url;return `${PROXY_PATH}?url=${encodeURIComponent(url)}`}

  async function localAsset(child,type){
    try{const hub=window.StoryOSMediaHub;if(hub){const rec=await hub.getArtAsset(activeGarden,child,type);if(rec?.blob)return {url:blobUrl(rec.blob),source:'local',name:rec.name||''}}}catch(_){}
    return null;
  }
  function basename(path){return String(path||'').split('/').pop()?.toLowerCase()||''}
  function manifestRow(child){return MANIFEST.find(x=>x.name===child)||null}
  function fileFor(row,type){return type==='original'?row?.before:type==='after'?row?.after:type==='video'?row?.video:row?.model}
  function legacyFileFor(child,type){const stem=LEGACY_STEM_ALIAS[child]||child;return type==='original'?`${stem}.jpg`:type==='after'?`${stem} תלת מימד.png`:type==='video'?`${stem}.mp4`:''}
  function candidateNames(child,type){const names=[];const modern=fileFor(manifestRow(child),type);const legacy=legacyFileFor(child,type);for(const n of [modern,legacy]){const v=String(n||'').toLowerCase();if(v&&!names.includes(v))names.push(v)}return names}

  async function ensureFirebaseItems(interactive=false){
    if(firebaseItems)return firebaseItems;
    const fb=window.StoryOSFirebase;if(!fb)return null;
    try{let user=await fb.currentUser();if(!user&&interactive)user=await fb.signInWithPrompt();if(!user)return null;let items=[];for(const prefix of ['gardens/gan-arava','MEDIA']){try{items.push(...await fb.listFiles(prefix))}catch(_){}}if(!items.length){try{items=await fb.listFiles('')}catch(_){}}firebaseItems=items;return items}catch(_){return null}
  }
  async function firebaseAsset(child,type,interactive=false){
    const wanted=candidateNames(child,type);if(!wanted.length)return null;
    const items=await ensureFirebaseItems(interactive);if(!items?.length)return null;
    const hit=items.find(x=>wanted.includes(basename(x.fullPath||x.name)));if(!hit)return null;
    try{const url=await window.StoryOSFirebase.getUrl(hit.ref||hit.fullPath||hit.name);return {url:proxyMedia(url),source:'firebase',name:basename(hit.fullPath||hit.name),path:hit.fullPath||hit.name}}catch(_){return null}
  }
  async function resolveAsset(child,type,interactive=false){
    if(activeGarden===GARDEN){const firebase=await firebaseAsset(child,type,interactive);if(firebase)return firebase;return await localAsset(child,type)}
    return await localAsset(child,type)||await firebaseAsset(child,type,interactive)
  }

  async function saveUpload(child,type,file){try{if(window.StoryOSMediaHub){await window.StoryOSMediaHub.putArtAsset(activeGarden,child,type,file,file.name);return true}}catch(_){}return false}

  function renderShell(){
    const detail=$('#detail');if(!detail)return null;let root=$('#v229ChildViewer');if(root)return root;
    ensureStyles();ensureModelViewer();
    root=document.createElement('section');root.id='v229ChildViewer';root.className='panel';root.innerHTML=`
      <div class="v229-viewer-head" id="v229TopMenu"><div class="v229-garden-mgmt" id="v229GardenMgmt"></div><div style="display:flex;gap:7px;flex-wrap:wrap"><button id="v229ConnectFirebase" class="btn">☁ התחבר למדיה</button><button id="v229OverviewToggle" class="btn">כל הילדים</button></div></div>
      <div id="v229ChildBanner" class="v229-child-banner"></div><div id="v229Overview" class="v229-overview"></div>
      <div class="v229-viewer-head" id="v229ChildNav"><button id="v229PrevChild" class="btn">→ ילד קודם</button><h2 id="v229ChildName"></h2><button id="v229NextChild" class="btn primary">ילד הבא ←</button></div>
      <div class="v229-main-grid">
        <div class="v229-card"><h3>לפני / אחרי</h3><div id="v229CompareHost"></div><div class="v229-model-toolbar"><label class="btn small">העלה לפני<input class="v229-upload" id="v229UploadOriginal" type="file" accept="image/*"></label><label class="btn small">העלה אחרי<input class="v229-upload" id="v229UploadAfter" type="file" accept="image/*"></label><button class="btn small" id="v229FullCompare">⛶ מסך מלא</button></div></div>
        <div class="v229-card"><h3>סרטון</h3><div id="v229VideoHost"></div><div class="v229-model-toolbar"><label class="btn small">העלה סרטון<input class="v229-upload" id="v229UploadVideo" type="file" accept="video/*"></label><button class="btn small" id="v229FullVideo">⛶ מסך מלא</button></div></div>
        <div class="v229-card"><h3>מודל 3D</h3><div id="v229ModelHost" class="v229-model-wrap"></div><div class="v229-model-toolbar"><label class="btn small">העלה GLB<input class="v229-upload" id="v229UploadModel" type="file" accept=".glb,.gltf,model/gltf-binary"></label><button class="btn small" id="v229AutoRotate">סיבוב אוטומטי</button><button class="btn small" id="v229ResetModel">איפוס תצוגה</button><button class="btn small" id="v229FullModel">⛶ מסך מלא</button></div></div>
      </div><div id="v229MediaStatus" class="v229-status"></div>`;
    const childrenPanel=[...detail.querySelectorAll('.panel')].find(p=>p.querySelector('#v22ArtChildren'));
    const gardenRow=detail.querySelector('#v22ArtGarden')?.closest('div')||null;
    const mgmtHost=root.querySelector('#v229GardenMgmt');
    if(gardenRow&&mgmtHost)mgmtHost.appendChild(gardenRow);
    if(childrenPanel){childrenPanel.style.display='none';childrenPanel.parentNode.insertBefore(root,childrenPanel)}else detail.appendChild(root);
    return root;
  }

  function childrenForGarden(){
    if(activeGarden===GARDEN)return MANIFEST.map(x=>x.name);
    try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');const g=(d.gardens||[]).find(x=>x.name===activeGarden);if(Array.isArray(g?.children)&&g.children.length)return g.children;return Array.from({length:Number(g?.childrenCount)||22},(_,i)=>`ילד/ה ${i+1}`)}catch(_){return Array.from({length:22},(_,i)=>`ילד/ה ${i+1}`)}
  }

  function renderBanner(){const kids=childrenForGarden(),banner=$('#v229ChildBanner'),overview=$('#v229Overview');if(!banner)return;banner.innerHTML=kids.map((n,i)=>`<button class="v229-child-btn ${i===selectedIndex?'active':''}" data-child-index="${i}">${esc(n)}</button>`).join('');overview.innerHTML=kids.map((n,i)=>`<button data-child-index="${i}"><b>${esc(n)}</b><small>פתח תצוגת תוצרים</small></button>`).join('');[...document.querySelectorAll('[data-child-index]')].forEach(b=>b.onclick=()=>{selectedIndex=Number(b.dataset.childIndex)||0;renderChild()});const active=banner.querySelector('.active');active?.scrollIntoView({inline:'center',block:'nearest'});}

  function statusChip(label,ok){return `<span class="v229-chip ${ok?'ok':''}">${ok?'✓':'—'} ${label}</span>`}
  async function renderChild(interactiveFirebase=false){
    releaseUrls();const root=renderShell();if(!root)return;const kids=childrenForGarden();selectedIndex=Math.max(0,Math.min(kids.length-1,selectedIndex));const child=kids[selectedIndex];$('#v229ChildName').textContent=child;renderBanner();
    const [before,after,video,model]=await Promise.all([resolveAsset(child,'original',interactiveFirebase),resolveAsset(child,'after',interactiveFirebase),resolveAsset(child,'video',interactiveFirebase),resolveAsset(child,'model',interactiveFirebase)]);
    const compare=$('#v229CompareHost');if(before||after){const b=before?.url||after?.url,a=after?.url||before?.url;compare.innerHTML=`<div class="v229-compare" id="v229CompareBox"><img src="${esc(b)}" alt="לפני"><div class="v229-after-wrap" id="v229AfterWrap"><img src="${esc(a)}" alt="אחרי"></div></div><input id="v229Slider" class="v229-slider" type="range" min="0" max="100" value="50"><div class="v229-labels"><span>לפני</span><span>אחרי</span></div>`;$('#v229Slider').oninput=e=>$('#v229AfterWrap').style.width=e.target.value+'%';}else compare.innerHTML='<div class="v229-empty">אין עדיין תמונות לפני/אחרי לילד הזה.</div>';
    const vh=$('#v229VideoHost');vh.innerHTML=video?`<video id="v229Video" class="v229-video" src="${esc(video.url)}" controls playsinline preload="metadata"></video>`:'<div class="v229-empty">אין עדיין סרטון.</div>';
    const mh=$('#v229ModelHost');mh.innerHTML=model?`<model-viewer id="v229Model" src="${esc(model.url)}" camera-controls touch-action="pan-y" shadow-intensity="1" environment-image="neutral" interaction-prompt="auto" min-camera-orbit="auto auto 20%" max-camera-orbit="auto auto 500%" style="width:100%;height:100%"></model-viewer>`:'<div class="v229-empty">אין עדיין מודל GLB.</div>';
    $('#v229MediaStatus').innerHTML=statusChip('ציור מקורי',!!before)+statusChip('תלת־ממד',!!after)+statusChip('סרטון',!!video)+statusChip('מודל',!!model)+`<span class="v229-chip">מקור: ${[before,after,video,model].some(x=>x?.source==='firebase')?'Firebase + מקומי':'אחסון מקומי'}</span>`;
    $('#v229PrevChild').disabled=selectedIndex===0;$('#v229NextChild').disabled=selectedIndex===kids.length-1;
  }

  function full(el){try{el?.requestFullscreen?.()}catch(_){}}
  function wireControls(){
    $('#v229PrevChild').onclick=()=>{if(selectedIndex>0){selectedIndex--;renderChild()}};$('#v229NextChild').onclick=()=>{if(selectedIndex<childrenForGarden().length-1){selectedIndex++;renderChild()}};
    $('#v229OverviewToggle').onclick=()=>$('#v229Overview').classList.toggle('open');
    $('#v229ConnectFirebase').onclick=async()=>{firebaseItems=null;const b=$('#v229ConnectFirebase');b.disabled=true;b.textContent='מתחבר…';try{await ensureFirebaseItems(true);await renderChild(true);b.textContent='✓ Firebase מחובר'}catch(_){b.textContent='☁ התחבר למדיה'}finally{b.disabled=false}};
    $('#v229FullCompare').onclick=()=>full($('#v229CompareBox')||$('#v229CompareHost'));$('#v229FullVideo').onclick=()=>full($('#v229Video')||$('#v229VideoHost'));$('#v229FullModel').onclick=()=>full($('#v229ModelHost'));
    $('#v229AutoRotate').onclick=()=>{const m=$('#v229Model');if(!m)return;m.toggleAttribute('auto-rotate');$('#v229AutoRotate').textContent=m.hasAttribute('auto-rotate')?'עצור סיבוב':'סיבוב אוטומטי'};
    $('#v229ResetModel').onclick=()=>{const m=$('#v229Model');if(!m)return;m.cameraOrbit='0deg 75deg 105%';m.cameraTarget='auto auto auto';m.fieldOfView='auto'};
    const map=[['v229UploadOriginal','original'],['v229UploadAfter','after'],['v229UploadVideo','video'],['v229UploadModel','model']];for(const [id,type] of map){const inp=$('#'+id);inp.onchange=async()=>{const f=inp.files?.[0];if(!f)return;await saveUpload(childrenForGarden()[selectedIndex],type,f);await renderChild();}};
  }

  function activateIfArava(){
    const detail=$('#detail');if(!detail||detail.classList.contains('hidden'))return;if(!detail.textContent.includes('כשהציור קם לתחייה'))return;
    const select=$('#v22ArtGarden');activeGarden=select?.value||GARDEN;if(activeGarden===GARDEN)syncGardenRecord();
    if($('#v229ChildViewer'))return;renderShell();wireControls();renderChild();
    if(select&&!select.dataset.v229Bound){select.dataset.v229Bound='1';select.addEventListener('change',()=>{activeGarden=select.value;selectedIndex=0;firebaseItems=null;$('#v229ChildViewer')?.remove();activateIfArava()})}
  }

  const observer=new MutationObserver(()=>activateIfArava());observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});setTimeout(activateIfArava,250);
  window.StoryOSChildViewer={manifest:MANIFEST,open:activateIfArava,proxyMedia,version:VERSION};
})();