(() => {
  const ADMIN_KEY='storyos_v22_admin_v1';
  const ARAVA='גן ערבה';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let adminObserver=null;
  let adminBody=null;
  let gardenEditor=null;

  function load(){
    try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');return {gardens:Array.isArray(d.gardens)?d.gardens:[],teachers:Array.isArray(d.teachers)?d.teachers:[],events:Array.isArray(d.events)?d.events:[]}}catch(_){return {gardens:[],teachers:[],events:[]}}
  }
  function save(d){localStorage.setItem(ADMIN_KEY,JSON.stringify(d))}
  function aravaChildren(){return window.StoryOSChildViewer?.manifest?.map(x=>x.name)||[]}

  function addStyles(){
    if($('#v2211GardenTemplateStyle'))return;
    const s=document.createElement('style');s.id='v2211GardenTemplateStyle';s.textContent=`
      .v2211-mini{padding:6px 8px!important;font-size:.82rem!important}
      .v2211-children-modal{position:fixed;inset:0;z-index:3000;background:rgba(25,34,51,.55);display:grid;place-items:center;padding:16px}
      .v2211-children-box{width:min(720px,96vw);max-height:90dvh;overflow:auto;background:#fff;border-radius:20px;border:1px solid var(--line);box-shadow:0 24px 70px rgba(0,0,0,.25);padding:18px}
      .v2211-children-box h3{margin:0 0 6px}.v2211-children-box p{margin:0 0 12px;color:var(--muted)}
      .v2211-children-box textarea{width:100%;min-height:320px;border:1px solid var(--line);border-radius:12px;padding:12px;font:inherit;line-height:1.55;resize:vertical}
      .v2211-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .v2211-count{display:inline-block;margin-top:8px;padding:4px 9px;border-radius:999px;background:#f2eefc;color:#5b43b8;font-weight:700}
    `;document.head.appendChild(s)
  }

  function closeEditor(){gardenEditor?.remove();gardenEditor=null}
  function openChildrenEditor(gardenName){
    addStyles();closeEditor();const d=load();const g=d.gardens.find(x=>x.name===gardenName);if(!g)return;
    let kids=Array.isArray(g.children)?g.children.filter(Boolean):[];
    if(gardenName===ARAVA&&!kids.length)kids=aravaChildren();
    const modal=document.createElement('div');modal.className='v2211-children-modal';modal.innerHTML=`<div class="v2211-children-box"><h3>ילדי ${esc(gardenName)}</h3><p>שם אחד בכל שורה. רשימה זו משמשת את פעילות 1 של „כשהציור קם לתחייה”. התוכן נשמר בנפרד לכל גן ולכל ילד.</p><textarea id="v2211KidsText">${esc(kids.join('\n'))}</textarea><div><span id="v2211KidsCount" class="v2211-count">${kids.length} ילדים</span></div><div class="v2211-actions"><button id="v2211SaveKids" class="btn primary">שמור רשימת ילדים</button>${gardenName===ARAVA?'<button id="v2211RestoreArava" class="btn">שחזר 22 ילדי גן ערבה</button>':''}<button id="v2211OpenActivity" class="btn">פתח פעילות 1</button><button id="v2211CloseKids" class="btn">סגור</button></div></div>`;
    document.body.appendChild(modal);gardenEditor=modal;
    const ta=$('#v2211KidsText'),count=$('#v2211KidsCount');const refresh=()=>{const arr=ta.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);count.textContent=`${arr.length} ילדים`};ta.oninput=refresh;
    $('#v2211CloseKids').onclick=closeEditor;modal.addEventListener('click',e=>{if(e.target===modal)closeEditor()});
    $('#v2211SaveKids').onclick=()=>{const data=load();const garden=data.gardens.find(x=>x.name===gardenName);if(!garden)return;const arr=ta.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);garden.children=arr;garden.childrenCount=arr.length;garden.activityTemplate='drawing-alive-v1';save(data);count.textContent=`${arr.length} ילדים`;alert('רשימת הילדים נשמרה.');augmentAdmin()};
    if(gardenName===ARAVA)$('#v2211RestoreArava').onclick=()=>{ta.value=aravaChildren().join('\n');refresh()};
    $('#v2211OpenActivity').onclick=()=>{closeEditor();document.querySelector('.v22-admin-modal')?.remove();openGardenActivity(gardenName)};
  }

  function firstArt(){try{return STORIES.filter(s=>s.program==='כשהציור קם לתחייה').sort((a,b)=>(a.num||0)-(b.num||0))[0]||null}catch(_){return null}}
  function openGardenActivity(gardenName){
    const art=firstArt();if(!art)return;
    if(typeof window.openStory==='function')window.openStory(art.id);
    let tries=0;const timer=setInterval(()=>{tries++;const sel=$('#v22ArtGarden');const btn=$('#v22ArtOpen');if(sel&&btn){clearInterval(timer);if([...sel.options].some(o=>o.value===gardenName||o.textContent===gardenName)){sel.value=gardenName;sel.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>btn.click(),80)}}else if(tries>25)clearInterval(timer)},80);
  }

  function augmentAdmin(){
    const body=$('#v22AdminBody');if(!body)return;
    if(!body.textContent.includes('רשימת גנים'))return;
    const data=load();
    body.querySelectorAll('.v22-admin-row').forEach(row=>{
      const name=row.querySelector('b')?.textContent?.trim();const g=data.gardens.find(x=>x.name===name);if(!g)return;
      const actions=row.querySelector('.v22-admin-row-actions');if(!actions||actions.querySelector('[data-v2211]'))return;
      const kids=document.createElement('button');kids.type='button';kids.className='btn small v2211-mini';kids.dataset.v2211='kids';kids.textContent=`ילדים${Array.isArray(g.children)&&g.children.length?` (${g.children.length})`:''}`;kids.onclick=()=>openChildrenEditor(g.name);
      const open=document.createElement('button');open.type='button';open.className='btn small v2211-mini';open.dataset.v2211='open';open.textContent='פעילות 1';open.onclick=()=>{document.querySelector('.v22-admin-modal')?.remove();openGardenActivity(g.name)};
      actions.prepend(open);actions.prepend(kids);
    });
  }

  function preserveGardenMetadata(){
    document.addEventListener('submit',e=>{
      if(e.target?.id!=='v22GardenForm')return;
      const before=load();
      setTimeout(()=>{
        const after=load();let changed=false;
        for(const ng of after.gardens){const old=before.gardens.find(x=>x.id&&ng.id&&x.id===ng.id)||before.gardens.find(x=>x.name===ng.name);if(!old)continue;for(const key of ['children','childrenCount','activityTemplate','mediaManifest','projectId','storageBucket','slug','active']){if(ng[key]==null&&old[key]!=null){ng[key]=old[key];changed=true}}}
        if(changed)save(after);setTimeout(augmentAdmin,30)
      },20)
    },true)
  }

  async function enforceGardenIsolation(){
    const sel=$('#v22ArtGarden');const root=$('#v229ChildViewer');if(!sel||!root||sel.value===ARAVA)return;
    const garden=sel.value,child=$('#v229ChildName')?.textContent?.trim();if(!child)return;const hub=window.StoryOSMediaHub;if(!hub)return;
    const [original,after,video,model]=await Promise.all(['original','after','video','model'].map(t=>hub.getArtAsset(garden,child,t).catch(()=>null)));
    if(!original&&!after){const h=$('#v229CompareHost');if(h)h.innerHTML='<div class="v229-empty">אין עדיין תמונות לפני/אחרי לילד הזה.</div>'}
    if(!video){const h=$('#v229VideoHost');if(h)h.innerHTML='<div class="v229-empty">אין עדיין סרטון.</div>'}
    if(!model){const h=$('#v229ModelHost');if(h)h.innerHTML='<div class="v229-empty">אין עדיין מודל GLB.</div>'}
  }
  function scheduleIsolation(){setTimeout(()=>enforceGardenIsolation().catch(()=>{}),700)}

  function watchAdmin(){
    adminObserver=new MutationObserver(()=>augmentAdmin());adminObserver.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',e=>{const t=e.target.closest?.('button');if(!t)return;if(t.id==='v22AdminBtn'||t.dataset?.tab==='gardens')setTimeout(augmentAdmin,60);if(t.matches('[data-child-index],#v229PrevChild,#v229NextChild,#v22ArtOpen'))scheduleIsolation()},true);
    document.addEventListener('change',e=>{if(e.target?.id==='v22ArtGarden')scheduleIsolation()},true)
  }

  addStyles();preserveGardenMetadata();watchAdmin();setTimeout(augmentAdmin,300);
  window.StoryOSGardenTemplate={version:'22.11.0',openGardenActivity,editChildren:openChildrenEditor};
})();
