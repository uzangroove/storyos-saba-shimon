(() => {
  const GARDEN='גן ערבה';
  const STEM_ALIAS={'איילון':'אילון','טובה':'וובה'};
  const $=s=>document.querySelector(s);
  let mediaItems=null;
  let loadingKey='';

  function proxy(url){
    try{return window.StoryOSCORSHotfix?.proxied?.(url)||url}catch(_){return url}
  }
  function basename(path){return String(path||'').split('/').pop()||''}
  function stemFor(child){return STEM_ALIAS[child]||child}
  function mediaNames(child){const s=stemFor(child);return {original:`${s}.jpg`,after:`${s} תלת מימד.png`,video:`${s}.mp4`}}

  async function ensureItems(){
    if(mediaItems)return mediaItems;
    const fb=window.StoryOSFirebase;if(!fb)return null;
    const user=await fb.currentUser().catch(()=>null);if(!user)return null;
    mediaItems=await fb.listFiles('MEDIA').catch(()=>null);return mediaItems;
  }
  async function urlFor(name){
    const items=await ensureItems();if(!items?.length)return null;
    const hit=items.find(x=>basename(x.fullPath||x.name)===name);if(!hit)return null;
    const raw=await window.StoryOSFirebase.getUrl(hit.ref||hit.fullPath||hit.name).catch(()=>null);return raw?proxy(raw):null;
  }

  function renderCompare(before,after){
    const host=$('#v229CompareHost');if(!host||(!before&&!after))return;
    const b=before||after,a=after||before;
    host.innerHTML=`<div class="v229-compare" id="v229CompareBox"><img src="${b}" alt="לפני"><div class="v229-after-wrap" id="v229AfterWrap"><img src="${a}" alt="אחרי"></div></div><input id="v229Slider" class="v229-slider" type="range" min="0" max="100" value="50"><div class="v229-labels"><span>לפני</span><span>אחרי</span></div>`;
    const slider=$('#v229Slider');if(slider)slider.oninput=e=>{const wrap=$('#v229AfterWrap');if(wrap)wrap.style.width=e.target.value+'%'};
  }
  function renderVideo(url){
    const host=$('#v229VideoHost');if(!host||!url)return;
    host.innerHTML=`<video id="v229Video" class="v229-video" src="${url}" controls playsinline preload="metadata"></video>`;
  }
  function updateStatus(before,after,video){
    const status=$('#v229MediaStatus');if(!status)return;
    let note=$('#v229LegacyMediaStatus');if(!note){note=document.createElement('span');note.id='v229LegacyMediaStatus';note.className='v229-chip';status.appendChild(note)}
    const count=[before,after,video].filter(Boolean).length;note.className='v229-chip '+(count?'ok':'');note.textContent=count?`✓ ${count}/3 תמונות וסרטון נטענו מ-Firebase`:'— לא נמצאו תמונות/סרטון ב-MEDIA';
  }

  async function loadCurrent(){
    const root=$('#v229ChildViewer');const nameEl=$('#v229ChildName');if(!root||!nameEl)return;
    const garden=$('#v22ArtGarden')?.value||GARDEN;if(garden!==GARDEN)return;
    const child=nameEl.textContent.trim();if(!child)return;
    const key=child+'|'+Date.now();loadingKey=key;
    const names=mediaNames(child);
    const [before,after,video]=await Promise.all([urlFor(names.original),urlFor(names.after),urlFor(names.video)]);
    if(loadingKey!==key||$('#v229ChildName')?.textContent.trim()!==child)return;
    renderCompare(before,after);renderVideo(video);updateStatus(before,after,video);
  }

  function schedule(ms=650){setTimeout(()=>loadCurrent().catch(()=>{}),ms)}

  document.addEventListener('click',e=>{
    const t=e.target.closest?.('button');if(!t)return;
    if(t.matches('[data-child-index],#v229PrevChild,#v229NextChild,#v229ConnectFirebase')){if(t.id==='v229ConnectFirebase')mediaItems=null;schedule(t.id==='v229ConnectFirebase'?1400:750)}
  },true);

  const observer=new MutationObserver(()=>{
    if($('#v229ChildViewer')&&!$('#v229ChildViewer').dataset.v229MediaFix){$('#v229ChildViewer').dataset.v229MediaFix='1';schedule(900)}
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});
  schedule(1200);
  window.StoryOSAravaMediaFix={reload:()=>{mediaItems=null;return loadCurrent()},version:'22.9.2'};
})();
