(() => {
  const ADMIN_KEY='storyos_v22_admin_v1';
  const BUCKET='saba-ganim-arava.firebasestorage.app';
  const ARAVA=['אבנר','הודיה','דורי','גיא','בן','אלי','מיכאל','לני','ליאב','יאיר','תומי','זוהר','רון','רום','צופיה','עומרי','עומר ב','נלי','תמר','תום','שיר','רפאל'];
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readAdmin(){try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]}}catch(_){return {gardens:[],teachers:[],events:[]}}}
  function saveAdmin(d){localStorage.setItem(ADMIN_KEY,JSON.stringify(d))}
  function ensureArava(){const d=readAdmin();let g=d.gardens.find(x=>x.name==='גן ערבה'||x.slug==='gan-arava');if(!g){g={id:'gan-arava',name:'גן ערבה',slug:'gan-arava',area:'כרמיאל',childrenCount:ARAVA.length,children:[...ARAVA],projectId:'saba-ganim-arava',storageBucket:BUCKET,notes:'פעילות מקור · כשהציור קם לתחייה'};d.gardens.unshift(g)}else{g.childrenCount=ARAVA.length;if(!Array.isArray(g.children)||!g.children.length)g.children=[...ARAVA];g.projectId=g.projectId||'saba-ganim-arava';g.storageBucket=g.storageBucket||BUCKET}saveAdmin(d);return g}
  ensureArava();

  function norm(s){return String(s||'').toLowerCase().replace(/[\s_\-–—()]+/g,'').replace(/[^\p{L}\p{N}]/gu,'')}
  function classify(name){const n=String(name).toLowerCase();if(/\.(glb|gltf)(\?|$)/i.test(n)||/(model|מודל)/i.test(n))return'model';if(/\.(mp4|webm|mov)(\?|$)/i.test(n)||/(video|movie|animation|סרט)/i.test(n))return'video';if(/(after|3d|render|תלת|אחרי)/i.test(n))return'after';if(/(before|original|drawing|scan|ציור|מקור|לפני)/i.test(n))return'original';if(/\.(png|jpe?g|webp)(\?|$)/i.test(n))return'original';return null}
  function itemUrl(item){if(item.downloadTokens){const t=String(item.downloadTokens).split(',')[0];return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(item.name)}?alt=media&token=${encodeURIComponent(t)}`}return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(item.name)}?alt=media`}
  async function listAll(prefix=''){let token='',items=[];do{const u=new URL(`https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o`);u.searchParams.set('maxResults','1000');if(prefix)u.searchParams.set('prefix',prefix);if(token)u.searchParams.set('pageToken',token);const r=await fetch(u);if(!r.ok)throw new Error('Firebase Storage החזיר '+r.status);const j=await r.json();items.push(...(j.items||[]));token=j.nextPageToken||''}while(token);return items}
  function matchChild(path,child){const p=norm(decodeURIComponent(path)),c=norm(child);return c&&p.includes(c)}
  function findAsset(items,child,type){const candidates=items.filter(it=>matchChild(it.name,child)).map(it=>({it,type:classify(it.name)})).filter(x=>x.type===type);return candidates[0]?.it||null}

  async function syncFirebase(button){
    button.disabled=true;const old=button.textContent;button.textContent='מסנכרן Firebase…';
    try{
      const items=await listAll();
      const detail=$('#detail');if(!detail)throw new Error('מסך הפעילות לא פתוח');
      const cards=[...detail.querySelectorAll('#v22ArtChildren article')];let loaded=0;
      cards.forEach(card=>{const child=card.querySelector('h3')?.textContent?.trim();if(!child)return;for(const type of ['original','after','video','model']){const input=card.querySelector(`[data-type="${type}"]`);const holder=input?.closest('.panel')?.querySelector('[data-preview]');if(!holder)continue;const item=findAsset(items,child,type);if(!item)continue;const url=itemUrl(item);if(type==='video')holder.innerHTML=`<video controls playsinline style="width:100%;max-height:190px;border-radius:10px" src="${url}"></video>`;else if(type==='model')holder.innerHTML=`<div style="display:grid;gap:6px"><span class="v22-badge active">✓ מודל קיים ב-Firebase</span><a class="btn small" target="_blank" rel="noopener" href="${url}">פתח מודל</a></div>`;else holder.innerHTML=`<img src="${url}" alt="${esc(child)}" style="width:100%;max-height:190px;object-fit:contain;border-radius:10px;background:#f7f4ec">`;loaded++}});
      const note=$('#v224FirebaseStatus');if(note)note.innerHTML=`✓ נמצאו ${items.length} קבצים ב-Firebase והותאמו ${loaded} תוצרים לילדי גן ערבה.`;
    }catch(err){const note=$('#v224FirebaseStatus');if(note)note.innerHTML=`לא ניתן לקרוא כרגע את רשימת הקבצים מה-Firebase: ${esc(err.message||err)}. אם ה-Storage דורש הרשאה, צריך לחבר את הרשאות הפרויקט/SDK ולא להסתמך על רשימה ציבורית.`}
    finally{button.disabled=false;button.textContent=old}
  }

  function patchAravaActivity(){
    const detail=$('#detail');if(!detail||!detail.textContent.includes('כשהציור קם לתחייה')||!detail.textContent.includes('גן ערבה'))return;
    if(detail.querySelector('#v224FirebaseSync'))return;
    const firstPanel=detail.querySelector('.panel');if(!firstPanel)return;
    const wrap=document.createElement('div');wrap.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px';wrap.innerHTML=`<button id="v224FirebaseSync" class="btn primary">☁ סנכרן תוכן גן ערבה מ-Firebase</button><span id="v224FirebaseStatus" style="color:var(--muted)">מקור: ${BUCKET}</span>`;firstPanel.appendChild(wrap);$('#v224FirebaseSync').onclick=()=>syncFirebase($('#v224FirebaseSync'));setTimeout(()=>syncFirebase($('#v224FirebaseSync')),120);
  }

  function patchAdminChildren(){
    const body=$('#v22AdminBody');if(!body||!document.querySelector('.v22-admin-modal'))return;
    const tab=[...document.querySelectorAll('.v22-admin-tabs button')].find(b=>b.classList.contains('active'))?.dataset.tab;if(tab!=='gardens')return;
    if(body.querySelector('#v224AravaChildrenAdmin'))return;
    const d=readAdmin(),g=d.gardens.find(x=>x.name==='גן ערבה'||x.slug==='gan-arava');if(!g)return;
    const panel=document.createElement('section');panel.id='v224AravaChildrenAdmin';panel.className='v22-admin-panel';panel.style.marginTop='14px';panel.innerHTML=`<h3>ילדי גן ערבה (${ARAVA.length})</h3><p style="color:var(--muted)">רשימת הדוגמה הקבועה של פעילות 1. הרשימה נשמרת עם הגן ואינה מועתקת לגנים חדשים.</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:7px">${ARAVA.map((n,i)=>`<label style="display:flex;flex-direction:column;gap:4px;font-weight:700">ילד/ה ${i+1}<input data-arava-child="${i}" value="${esc((g.children||ARAVA)[i]||n)}" style="border:1px solid var(--line);border-radius:10px;padding:8px"></label>`).join('')}</div><div style="margin-top:10px"><button id="v224SaveAravaChildren" class="btn primary">שמור רשימת ילדים</button></div>`;body.appendChild(panel);$('#v224SaveAravaChildren').onclick=()=>{const d2=readAdmin(),g2=d2.gardens.find(x=>x.name==='גן ערבה'||x.slug==='gan-arava');if(!g2)return;g2.children=[...panel.querySelectorAll('[data-arava-child]')].map(i=>i.value.trim()).filter(Boolean);g2.childrenCount=g2.children.length;saveAdmin(d2);alert('רשימת ילדי גן ערבה נשמרה.');};
  }

  const obs=new MutationObserver(()=>{patchAravaActivity();patchAdminChildren()});obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  setTimeout(()=>{patchAravaActivity();patchAdminChildren()},200);
})();
