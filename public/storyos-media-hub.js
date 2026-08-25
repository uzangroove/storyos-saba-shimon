(() => {
  const DB_NAME='StoryOS_MediaHub';
  const DB_VERSION=1;
  const STORE='media';
  const META='meta';
  const API_VERSION='1.0.0';

  function openHub(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'});if(!db.objectStoreNames.contains(META))db.createObjectStore(META,{keyPath:'key'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  function txGet(db,store,key){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),r=tx.objectStore(store).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
  function txPut(db,store,value){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);});}
  function getAllFrom(dbName,storeName){return new Promise(resolve=>{let req;try{req=indexedDB.open(dbName)}catch(_){resolve([]);return}req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains(storeName)){resolve([]);return}const tx=db.transaction(storeName,'readonly'),r=tx.objectStore(storeName).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>resolve([])};req.onerror=()=>resolve([]);});}
  async function putIfNewer(record){const db=await openHub();const old=await txGet(db,STORE,record.key);const oldTs=Number(old?.updatedAt||0),newTs=Number(record.updatedAt||Date.now());if(!old||newTs>=oldTs)return txPut(db,STORE,{...record,updatedAt:newTs});return old;}

  async function importDecks(){
    const rows=await getAllFrom('StoryOS_SabaShimon_Decks','decks');let n=0;
    for(const d of rows){if(!d?.storyId)continue;const rec={key:`book:${d.storyId}`,scope:'book',storyId:d.storyId,kind:d.kind||'images',updatedAt:d.updatedAt||d.savedAt||Date.now(),source:'legacy-decks'};if(d.kind==='images'&&Array.isArray(d.slides))rec.pages=d.slides.map((s,i)=>({name:s.name||`page-${i+1}`,blob:s.blob})).filter(x=>x.blob);if(d.kind==='pdf'&&d.pdfBlob){rec.pdfBlob=d.pdfBlob;rec.pageCount=d.pageCount||1;}await putIfNewer(rec);n++;}return n;
  }
  async function importScanned(){
    const rows=await getAllFrom('storyos-scanned-books','books');let n=0;
    for(const s of rows){if(!s?.id)continue;const pages=[];if(s.coverBlob)pages.push({name:'cover',blob:s.coverBlob});for(const [i,p] of (s.pages||[]).entries())if(p?.imageBlob)pages.push({name:p.name||`page-${i+1}`,blob:p.imageBlob});if(!pages.length)continue;const ids=[s.id];if(s.id==='ayelet-metayelet')ids.push('s15');for(const id of ids){await putIfNewer({key:`book:${id}`,scope:'book',storyId:id,kind:'images',pages,updatedAt:s.updatedAt||Date.now(),source:'legacy-scanned'});n++;}}return n;
  }
  async function importArt(){
    const rows=await getAllFrom('StoryOS_ArtProjects','assets');let n=0;
    for(const a of rows){if(!a?.garden||!a?.child||!a?.type||!a?.blob)continue;await putIfNewer({key:`art:${a.garden}:${a.child}:${a.type}`,scope:'art',garden:a.garden,child:a.child,type:a.type,name:a.name||'',blob:a.blob,updatedAt:a.updatedAt||Date.now(),source:'legacy-art'});n++;}return n;
  }
  async function syncLegacy(){const [books,scanned,art]=await Promise.all([importDecks(),importScanned(),importArt()]);const db=await openHub();await txPut(db,META,{key:'lastLegacySync',at:Date.now(),books,scanned,art,api:API_VERSION});return {books,scanned,art};}
  async function getBook(storyId){const db=await openHub();return txGet(db,STORE,`book:${storyId}`);}
  async function putBookImages(storyId,pages,extra={}){return putIfNewer({key:`book:${storyId}`,scope:'book',storyId,kind:'images',pages:(pages||[]).map((p,i)=>p?.blob?{name:p.name||`page-${i+1}`,blob:p.blob}:{name:`page-${i+1}`,blob:p}).filter(x=>x.blob),updatedAt:Date.now(),source:'media-hub',...extra});}
  async function putBookPdf(storyId,pdfBlob,pageCount=1,extra={}){return putIfNewer({key:`book:${storyId}`,scope:'book',storyId,kind:'pdf',pdfBlob,pageCount,updatedAt:Date.now(),source:'media-hub',...extra});}
  async function getArtAsset(garden,child,type){const db=await openHub();return txGet(db,STORE,`art:${garden}:${child}:${type}`);}
  async function putArtAsset(garden,child,type,blob,name=''){return putIfNewer({key:`art:${garden}:${child}:${type}`,scope:'art',garden,child,type,name,blob,updatedAt:Date.now(),source:'media-hub'});}
  async function stats(){const db=await openHub();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).getAll();r.onsuccess=()=>{const all=r.result||[];resolve({total:all.length,books:all.filter(x=>x.scope==='book').length,art:all.filter(x=>x.scope==='art').length})};r.onerror=()=>reject(r.error)});}

  window.StoryOSMediaHub={version:API_VERSION,dbName:DB_NAME,syncLegacy,getBook,putBookImages,putBookPdf,getArtAsset,putArtAsset,stats};
  syncLegacy().catch(()=>{});
  document.addEventListener('change',e=>{if(e.target?.matches?.('input[type="file"]'))setTimeout(()=>syncLegacy().catch(()=>{}),700)},true);
})();
