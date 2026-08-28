(() => {
  const VERSION='22.15.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const PARTS=['/garden-catalog-part1.json','/garden-catalog-part2.json','/garden-catalog-part3.json','/garden-catalog-part4.json'];
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let catalog=[];
  let loadPromise=null;
  let selected=null;

  function loadAdmin(){try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]}}catch(_){return {gardens:[],teachers:[],events:[]}}}
  function saveAdmin(d){localStorage.setItem(ADMIN_KEY,JSON.stringify(d))}
  async function loadCatalog(){
    if(catalog.length)return catalog;
    if(loadPromise)return loadPromise;
    loadPromise=Promise.all(PARTS.map(p=>fetch(p+'?v='+VERSION,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(p+' '+r.status);return r.json()}))).then(parts=>{
      catalog=parts.flat().filter(x=>x&&x.name).sort((a,b)=>String(a.name).localeCompare(String(b.name),'he'));
      return catalog;
    }).catch(err=>{console.error('Garden catalog load failed',err);catalog=[];return catalog});
    return loadPromise;
  }
  function noteFor(r){return [r.notes,r.type&&`סוג מסגרת: ${r.type}`,r.manager&&`גננת/מנהלת: ${r.manager}`,r.staff&&`צוות: ${r.staff}`,r.owner&&`בעלות/מפעיל: ${r.owner}`,r.symbol&&`סמל מוסד: ${r.symbol}`,r.verification&&`אימות: ${r.verification}`,r.checked&&`תאריך בדיקה: ${r.checked}`].filter(Boolean).join('\n')}
  function fillForm(form,r){
    selected=r;
    const set=(name,val)=>{const el=form.elements.namedItem(name);if(el)el.value=val||''};
    set('name',r.name);set('area',r.neighborhood);set('address',r.address);set('age',r.ages);set('phone',r.phone);set('notes',noteFor(r));
    const info=form.querySelector('#v2215CatalogInfo');if(info)info.innerHTML=`<div><b>${esc(r.name)}</b> · ${esc(r.type||'')}</div><div>${esc([r.address,r.neighborhood,r.ages].filter(Boolean).join(' · '))}</div>${r.manager?`<div>גננת/מנהלת: <b>${esc(r.manager)}</b></div>`:''}${r.staff?`<div>צוות: ${esc(r.staff)}</div>`:''}${r.owner?`<div>בעלות/מפעיל: ${esc(r.owner)}</div>`:''}${r.symbol?`<div>סמל מוסד: ${esc(r.symbol)}</div>`:''}<div>${esc(r.verification||'')} ${r.checked?`· נבדק ${esc(r.checked)}`:''}</div>`;
  }
  function clearSelectedIfEdited(form){
    const name=form.elements.namedItem('name');if(name&&selected&&name.value.trim()!==selected.name)selected=null;
  }
  async function inject(){
    const form=$('#v22GardenForm');if(!form||form.dataset.v2215Catalog==='1')return;
    form.dataset.v2215Catalog='1';
    const data=await loadCatalog();
    const wrap=document.createElement('div');wrap.className='wide';wrap.id='v2215CatalogPicker';wrap.style.cssText='display:grid;gap:7px;border:1px solid #d9d1c4;border-radius:14px;padding:11px;background:#f8fbff';
    wrap.innerHTML=`<label style="font-weight:800">בחירת גן ממאגר כרמיאל (${data.length})<select id="v2215CatalogSelect" style="width:100%;margin-top:5px;border:1px solid var(--line);border-radius:12px;padding:10px;background:#fff"><option value="">— בחר גן מהטבלה או הזן ידנית —</option>${data.map(r=>`<option value="${r.id}">${esc(r.name)}${r.neighborhood?` · ${esc(r.neighborhood)}`:''}${r.type?` · ${esc(r.type)}`:''}</option>`).join('')}</select></label><div id="v2215CatalogInfo" style="font-size:.88rem;line-height:1.45;color:#5e6675">בחירה תמלא אוטומטית שם, שכונה, כתובת, גילאים, טלפון והערות.</div>`;
    form.prepend(wrap);
    const sel=wrap.querySelector('#v2215CatalogSelect');sel.onchange=()=>{const r=data.find(x=>String(x.id)===sel.value);if(r)fillForm(form,r);else selected=null};
    const currentName=form.elements.namedItem('name')?.value?.trim();if(currentName){const hit=data.find(r=>r.name===currentName);if(hit){sel.value=String(hit.id);fillForm(form,hit)}}
    form.elements.namedItem('name')?.addEventListener('input',()=>clearSelectedIfEdited(form));
  }
  function patchSavedGarden(record){
    if(!record)return;const d=loadAdmin();const g=[...d.gardens].reverse().find(x=>x.name===record.name);if(!g)return;
    Object.assign(g,{catalogId:record.id,catalogSource:'מאגר_גני_כרמיאל_2026_2027_V2.xlsx',type:record.type||'',age:record.ages||g.age||'',area:record.neighborhood||g.area||'',address:record.address||g.address||'',phone:record.phone||g.phone||'',manager:record.manager||'',staff:record.staff||'',owner:record.owner||'',symbol:record.symbol||'',verification:record.verification||'',sourceUrl:record.source_url||'',checked:record.checked||'',catalogNotes:record.notes||''});
    saveAdmin(d);
  }
  function watch(){
    new MutationObserver(()=>inject()).observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener('submit',e=>{if(e.target?.id!=='v22GardenForm')return;const chosen=selected?{...selected}:null;setTimeout(()=>patchSavedGarden(chosen),80)},true);
    document.addEventListener('click',e=>{const b=e.target.closest?.('[data-tab="gardens"],#v22AdminBtn');if(b)setTimeout(inject,80)},true);
    setTimeout(inject,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
  window.StoryOSGardenCatalog={version:VERSION,load:loadCatalog,getAll:()=>catalog.slice()};
})();
