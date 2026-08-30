(() => {
  'use strict';

  const VERSION='22.38.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function rows(){
    return [
      ...(window.STORYOS_KARMIEL_GARDENS_1||[]),
      ...(window.STORYOS_KARMIEL_GARDENS_2||[]),
      ...(window.STORYOS_KARMIEL_GARDENS_3||[])
    ].map(r=>({id:r[0],name:r[1],type:r[2],age:r[3],address:r[4],area:r[5],phone:r[6],owner:r[7],verification:r[8],notes:r[9]}));
  }

  function loadAdmin(){
    try{
      const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');
      return {gardens:Array.isArray(d.gardens)?d.gardens:[]};
    }catch(_){return {gardens:[]}}
  }

  function addStyles(){
    if($('#v2238PickerStyle'))return;
    const s=document.createElement('style');s.id='v2238PickerStyle';s.textContent=`
      .v2238-picker{grid-column:1/-1;border:1px solid #dbe7f5;background:#f4f9ff;border-radius:15px;padding:12px;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end}
      .v2238-picker label{display:flex;flex-direction:column;gap:5px;font-weight:800}.v2238-picker input{border:1px solid var(--line);border-radius:12px;padding:10px;background:#fff;font:inherit}
      .v2238-picker-note{grid-column:1/-1;color:#49647e;font-size:.88rem;line-height:1.45}
      .v2238-source{grid-column:1/-1;border:1px solid #e5ded2;background:#fffdf8;border-radius:12px;padding:9px 11px;display:none}.v2238-source.show{display:block}.v2238-source b{display:block;margin-bottom:3px}.v2238-source small{color:var(--muted)}
      @media(max-width:760px){.v2238-picker{grid-template-columns:1fr}.v2238-picker button{width:100%}}
    `;document.head.appendChild(s)
  }

  function optionLabel(g){return `${g.name} — ${g.address||'ללא כתובת'}${g.area?` · ${g.area}`:''}`}

  function fillForm(form,g){
    const set=(name,value)=>{const el=form.querySelector(`[name="${name}"]`);if(el){el.value=value||'';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}};
    set('name',g.name);set('area',g.area);set('address',g.address);set('age',g.age);set('phone',g.phone);
    const notes=form.querySelector('[name="notes"]');
    if(notes){
      const sourceLine=`מאגר גני כרמיאל #${g.id} · ${g.type||''} · ${g.owner||''} · ${g.verification||''}`;
      notes.value=[g.notes,sourceLine].filter(Boolean).join('\n');
    }
    form.dataset.karmielGardenId=g.id;
    const source=form.querySelector('#v2238GardenSource');
    if(source){
      source.classList.add('show');
      source.innerHTML=`<b>${esc(g.name)} · ${esc(g.type)}</b><small>${esc(g.address)}${g.area?` · ${esc(g.area)}`:''}${g.phone?` · ${esc(g.phone)}`:''}<br>${esc(g.verification||'')}</small>`;
    }
  }

  function injectPicker(){
    const form=$('#v22GardenForm');
    if(!form||form.querySelector('[data-v2238-picker]'))return;
    addStyles();
    const catalog=rows();if(!catalog.length)return;

    const firstLabel=form.querySelector('label');if(!firstLabel)return;
    const wrap=document.createElement('div');wrap.className='v2238-picker';wrap.dataset.v2238Picker='1';
    wrap.innerHTML=`
      <label>בחירה ממאגר גני כרמיאל
        <input id="v2238GardenSearch" list="v2238GardenList" placeholder="הקלד שם גן, כתובת או שכונה…" autocomplete="off">
        <datalist id="v2238GardenList">${catalog.map(g=>`<option value="${esc(optionLabel(g))}"></option>`).join('')}</datalist>
      </label>
      <button type="button" class="btn" id="v2238ClearPicker">נקה בחירה</button>
      <div class="v2238-picker-note">בחירה מהרשימה ממלאת אוטומטית שם, כתובת, שכונה, גיל וטלפון כשקיים. אפשר גם להמשיך ולהקליד גן ידנית.</div>
      <div id="v2238GardenSource" class="v2238-source"></div>`;
    form.insertBefore(wrap,firstLabel);

    const input=wrap.querySelector('#v2238GardenSearch');
    const choose=()=>{
      const q=input.value.trim();
      if(!q)return;
      const g=catalog.find(x=>optionLabel(x)===q)||catalog.find(x=>x.name===q)||catalog.find(x=>q.startsWith(x.name+' — '));
      if(!g)return;
      const existing=loadAdmin().gardens.find(x=>x.name===g.name);
      const currentName=form.querySelector('[name="name"]')?.value?.trim();
      if(existing && currentName!==g.name){alert(`הגן ${g.name} כבר קיים במערכת.`);return}
      fillForm(form,g);
    };
    input.addEventListener('change',choose);
    input.addEventListener('blur',choose);
    wrap.querySelector('#v2238ClearPicker').onclick=()=>{input.value='';delete form.dataset.karmielGardenId;const source=wrap.querySelector('#v2238GardenSource');source.classList.remove('show');source.innerHTML=''};

    // בעריכה: מציג את התאמת המאגר אם קיימת, בלי לשנות את נתוני הגן שנשמרו.
    const current=form.querySelector('[name="name"]')?.value?.trim();
    const matched=catalog.find(x=>x.name===current);
    if(matched){input.value=optionLabel(matched);const source=wrap.querySelector('#v2238GardenSource');source.classList.add('show');source.innerHTML=`<b>${esc(matched.name)} · ${esc(matched.type)}</b><small>${esc(matched.address)}${matched.area?` · ${esc(matched.area)}`:''}<br>${esc(matched.verification||'')}</small>`}
  }

  const observer=new MutationObserver(()=>injectPicker());
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{const t=e.target.closest?.('button');if(t&&(t.id==='v22AdminBtn'||t.dataset?.tab==='gardens'||/עריכה/.test(t.textContent||'')))setTimeout(injectPicker,60)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectPicker,{once:true});else injectPicker();

  window.StoryOSKarmielGardenPicker={version:VERSION,count:rows().length,rows};
  console.info(`[StoryOS] Karmiel garden picker loaded v${VERSION} (${rows().length} records)`);
})();
