(() => {
  const ADMIN_KEY='storyos_v22_admin_v1';
  const ART_DB='StoryOS_ArtProjects';
  const ART_STORE='assets';
  const ARAVA_CHILDREN=['אבנר','הודיה','דורי','גיא','בן','אלי','מיכאל','לני','ליאב','יאיר','תומי','זוהר','רון','רום','צופיה','עומרי','עומר ב','נלי','תמר','תום','שיר','רפאל'];
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function normalizeAdmin(data){return {gardens:Array.isArray(data?.gardens)?data.gardens:[],teachers:Array.isArray(data?.teachers)?data.teachers:[],events:Array.isArray(data?.events)?data.events:[]};}
  function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function mergeUnique(target, incoming, fields){for(const item of incoming||[]){if(!item||typeof item!=='object')continue;const exists=target.some(x=>fields.some(f=>x?.[f]&&item?.[f]&&String(x[f]).trim()===String(item[f]).trim()));if(!exists)target.push(item)}}
  function migrateAdmin(){
    const current=normalizeAdmin(readJson(ADMIN_KEY)||{});
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key||key===ADMIN_KEY)continue;
      const value=readJson(key);if(!value||typeof value!=='object')continue;
      if(Array.isArray(value.gardens))mergeUnique(current.gardens,value.gardens,['id','name','slug']);
      if(Array.isArray(value.teachers))mergeUnique(current.teachers,value.teachers,['id','email','phone','name']);
      if(Array.isArray(value.events))mergeUnique(current.events,value.events,['id']);
      if(Array.isArray(value.kindergartens))mergeUnique(current.gardens,value.kindergartens,['id','name','slug']);
      if(Array.isArray(value.contacts))mergeUnique(current.teachers,value.contacts,['id','email','phone','name']);
    }
    if(!current.gardens.some(g=>g.name==='גן ערבה'||g.slug==='gan-arava')) current.gardens.unshift({id:'gan-arava',name:'גן ערבה',slug:'gan-arava',area:'כרמיאל',age:'',phone:'',address:'',notes:'22 ילדים · פרויקט כשהציור קם לתחייה',projectId:'saba-ganim-arava',storageBucket:'saba-ganim-arava.firebasestorage.app',active:true,childrenCount:22});
    localStorage.setItem(ADMIN_KEY,JSON.stringify(current));
    return current;
  }

  let dbPromise=null;
  function openDB(){
    // ממוזמן (memoized): כמה קריאות ל-getAsset/putAsset קורות כמעט תמיד יחד
    // (למשל 4 סוגי קבצים לאותו ילד בבת אחת) — אם כל אחת הייתה פותחת חיבור
    // משלה בנפרד, קריאה אחת יכולה להתחיל שדרוג גרסה (self-heal למטה) בזמן
    // שקריאה מקבילה אחרת עדיין מבקשת את הגרסה הישנה, מה שגורם לשגיאת
    // "requested version is less than existing version". שיתוף אותה
    // Promise בין כל הקוראים פותר את זה לגמרי.
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(ART_DB,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(ART_STORE))db.createObjectStore(ART_STORE,{keyPath:'key'});};
      req.onsuccess=()=>{
        const db=req.result;
        // הגנה: אם המסד כבר קיים בגרסה 1 בלי ה-object store (יכול לקרות אם
        // נוצר פעם על ידי נתיב קוד אחר, או session קודמת שנקטעה), onupgradeneeded
        // למעלה לא ירוץ שוב באותה גרסה — וכל קריאה עתידית ל-transaction() הייתה
        // קורסת עם NotFoundError. כאן מזהים את זה ומתקנים בעצמנו על ידי פתיחה
        // מחדש בגרסה גבוהה יותר, מה שכן מפעיל onupgradeneeded.
        if(!db.objectStoreNames.contains(ART_STORE)){
          const currentVersion=db.version;
          db.close();
          const upgradeReq=indexedDB.open(ART_DB,currentVersion+1);
          upgradeReq.onupgradeneeded=()=>{const udb=upgradeReq.result;if(!udb.objectStoreNames.contains(ART_STORE))udb.createObjectStore(ART_STORE,{keyPath:'key'});};
          upgradeReq.onsuccess=()=>resolve(upgradeReq.result);
          upgradeReq.onerror=()=>{dbPromise=null;reject(upgradeReq.error);};
          return;
        }
        resolve(db);
      };
      req.onerror=()=>{dbPromise=null;reject(req.error);};
    });
    return dbPromise;
  }
  async function putAsset(garden,child,type,file){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(ART_STORE,'readwrite');tx.objectStore(ART_STORE).put({key:`${garden}|${child}|${type}`,garden,child,type,name:file.name,blob:file,updatedAt:Date.now()});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
  async function getAsset(garden,child,type){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(ART_STORE,'readonly');const req=tx.objectStore(ART_STORE).get(`${garden}|${child}|${type}`);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}

  function patchFirstArtActivity(){
    try{
      const art=STORIES.filter(s=>s.program==='כשהציור קם לתחייה').sort((a,b)=>(a.num||0)-(b.num||0))[0];
      if(!art||art.__aravaTemplate)return art;
      art.__aravaTemplate=true;art.title='גן ערבה · כשהציור קם לתחייה';art.author='פעילות דוגמה ותבנית לשכפול';art.category='ציור → תלת־ממד → סרטון → מודל';art.season='כל השנה';art.themes=['יצירה','דמיון','תלת־ממד','אנימציה'];art.summary='פעילות ההדגמה של גן ערבה משמשת כתבנית הראשונה: לכל ילד/ה נשמר ציור מקורי, תוצר תלת־ממדי, סרטון ומודל GLB. בבחירת גן אחר נפתחת אותה תבנית ריקה ומוכנה לקליטת תוצרים חדשים.';art.message='הציור המקורי של הילד נשאר במרכז — והתוצרים הדיגיטליים מרחיבים אותו בלי להחליף אותו.';art.duration='45–60 דקות';art.score=100;art.puppets=[];art.props=['ציורי הילדים','מצלמה/טלפון','מחשב','מסך להצגה'];art.wow='השוואה מיידית: לפני → אחרי → סרטון → מודל תלת־ממדי';art.questions=['מה ציירת?','מה השתנה בגרסת התלת־ממד?','איך היית רוצה שהציור יזוז?'];art.packing=['ציורים מקוריים','טלפון/מצלמה','מחשב','כבלי טעינה','מסך/מקרן'];
      return art;
    }catch(_){return null}
  }

  function assetInput(garden,child,type,label,accept){return `<label class="btn small" style="cursor:pointer">${label}<input type="file" data-art-upload data-garden="${esc(garden)}" data-child="${esc(child)}" data-type="${type}" accept="${accept}" style="display:none"></label>`}
  async function assetPreview(garden,child,type){const rec=await getAsset(garden,child,type);if(!rec)return '<span style="color:var(--muted)">טרם הועלה</span>';if(type==='video'){const u=URL.createObjectURL(rec.blob);return `<video controls style="width:100%;max-height:180px;border-radius:10px" src="${u}"></video>`}if(type==='model')return `<span class="v22-badge active">✓ ${esc(rec.name)}</span>`;const u=URL.createObjectURL(rec.blob);return `<img src="${u}" alt="${esc(rec.name)}" style="width:100%;max-height:180px;object-fit:contain;border-radius:10px;background:#f7f4ec">`}

  async function openArtGardenActivity(defaultGarden='גן ערבה'){
    const admin=migrateAdmin();
    const detail=$('#detail'),dash=$('#dashboard'),live=$('#live'),audit=$('#audit');if(!detail)return;
    dash?.classList.add('hidden');live?.classList.add('hidden');audit?.classList.add('hidden');detail.classList.remove('hidden');document.body.classList.add('v22-focus','v22-detail');
    const gardenNames=admin.gardens.map(g=>g.name).filter(Boolean);const selected=gardenNames.includes(defaultGarden)?defaultGarden:(gardenNames[0]||'גן ערבה');
    const isArava=selected==='גן ערבה';const garden=admin.gardens.find(g=>g.name===selected)||{};const count=Math.max(1,Number(garden.childrenCount)||22);const children=isArava?ARAVA_CHILDREN:Array.from({length:count},(_,i)=>`ילד/ה ${i+1}`);
    detail.innerHTML=`<button class="btn back" onclick="goHome()">← חזרה למרכז ההפעלה</button><section class="hero"><div><h2 style="margin:0">כשהציור קם לתחייה · פעילות 1</h2><p>${isArava?'גן ערבה · פעילות המקור':'תבנית חדשה לגן'} · ציור לפני ואחרי, סרטון ומודל</p></div><div class="score"><b>1</b><br>פעילות ראשונה</div></section><section class="panel" style="margin-top:12px"><div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap"><label style="font-weight:700">בחר גן<br><select id="v22ArtGarden" style="min-width:220px;border:1px solid var(--line);border-radius:12px;padding:10px">${gardenNames.map(n=>`<option ${n===selected?'selected':''}>${esc(n)}</option>`).join('')}</select></label><button id="v22ArtOpen" class="btn primary">פתח פעילות לגן</button><button id="v22ArtAddGarden" class="btn">+ גן חדש בניהול</button></div><p style="color:var(--muted)">${isArava?'גן ערבה הוא דוגמת הייחוס. התוכן שייך לגן הזה בלבד.':'זהו עותק ריק של אותה תבנית. אין בו שום תוכן של גן ערבה והוא מוכן לקלוט את תוצרי הילדים.'}</p></section><section class="panel" style="margin-top:12px"><h3>מהלך הפעילות</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px"><div><b>1. לפני</b><br>הציור המקורי</div><div><b>2. אחרי</b><br>גרסת תלת־ממד</div><div><b>3. סרטון</b><br>הציור קם לתחייה</div><div><b>4. מודל</b><br>קובץ GLB לתצוגה/שמירה</div></div></section><section class="panel" style="margin-top:12px"><h3>תוצרי הילדים · ${esc(selected)}</h3><div id="v22ArtChildren" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">${children.map((c,i)=>`<article class="card" style="min-height:0"><h3 style="margin:0 0 8px">${esc(c)}</h3><div data-art-grid="${i}" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="panel" style="padding:8px"><b>לפני</b><div data-preview="original"></div>${assetInput(selected,c,'original','העלה ציור','image/*')}</div><div class="panel" style="padding:8px"><b>אחרי</b><div data-preview="after"></div>${assetInput(selected,c,'after','העלה תלת־ממד','image/*')}</div><div class="panel" style="padding:8px"><b>סרטון</b><div data-preview="video"></div>${assetInput(selected,c,'video','העלה סרטון','video/*')}</div><div class="panel" style="padding:8px"><b>מודל</b><div data-preview="model"></div>${assetInput(selected,c,'model','העלה GLB','.glb,.gltf,model/gltf-binary')}</div></div></article>`).join('')}</div></section>`;
    $('#v22ArtOpen').onclick=()=>openArtGardenActivity($('#v22ArtGarden').value);
    $('#v22ArtAddGarden').onclick=()=>{
      // כמו בתיקון המקביל למסך הבית (v2218Home): פאנל הניהול הוא z-index:1000,
      // בעוד ש-#v229ChildViewer במצב מסך-מלא הוא z-index:999999 — בלי להסתיר
      // אותו קודם, הפאנל היה נפתח מתחתיו, בלתי-נראה ובלתי-לחיץ. מוסיפים מחלקה
      // שמכבה תצוגה זמנית (לא מסירים v2210-layout עצמה, כדי לא לאבד את מצב
      // התצוגה הפנימי), ומשחזרים ברגע שפאנל הניהול נסגר — בלי קשר לאיך נסגר.
      const viewer=document.getElementById('v229ChildViewer');
      viewer?.classList.add('v2210-hidden-for-admin');
      const btn=document.getElementById('v22AdminBtn');
      if(!btn){viewer?.classList.remove('v2210-hidden-for-admin');return}
      btn.click();
      setTimeout(()=>window.v22AdminGo?.('gardens'),50);
      const restoreObserver=new MutationObserver(()=>{
        if(!document.querySelector('.v22-admin-modal')){viewer?.classList.remove('v2210-hidden-for-admin');restoreObserver.disconnect()}
      });
      restoreObserver.observe(document.body,{childList:true});
    };
    const cards=[...detail.querySelectorAll('#v22ArtChildren article')];
    for(let i=0;i<cards.length;i++){const child=children[i];for(const type of ['original','after','video','model']){const holder=cards[i].querySelector(`[data-preview="${type}"]`);holder.innerHTML=await assetPreview(selected,child,type)}}
    detail.querySelectorAll('[data-art-upload]').forEach(inp=>inp.onchange=async()=>{const file=inp.files?.[0];if(!file)return;await putAsset(inp.dataset.garden,inp.dataset.child,inp.dataset.type,file);openArtGardenActivity(selected)});
    window.scrollTo(0,0);
  }

  function wireArtActivity(){
    const art=patchFirstArtActivity();if(!art)return;
    if(typeof window.render==='function'&&!window.__v22AravaRender){const base=window.render;window.render=function(){base();document.querySelectorAll('.card').forEach(card=>{const h=card.querySelector('h2');if(h&&h.textContent===art.title){card.querySelectorAll('button').forEach(b=>{if(b.textContent.includes('פתח כרטיס')||b.textContent.includes('מצב חי'))b.onclick=()=>openArtGardenActivity('גן ערבה')})}})};window.__v22AravaRender=true;window.render();}
    const baseOpen=window.openStory;if(typeof baseOpen==='function'&&!window.__v22AravaOpen){window.openStory=function(id){if(id===art.id)return openArtGardenActivity('גן ערבה');return baseOpen(id)};window.__v22AravaOpen=true;}
    const baseLive=window.startLive;if(typeof baseLive==='function'&&!window.__v22AravaLive){window.startLive=function(id){if(id===art.id)return openArtGardenActivity('גן ערבה');return baseLive(id)};window.__v22AravaLive=true;}
  }

  migrateAdmin();
  setTimeout(wireArtActivity,80);
})();
