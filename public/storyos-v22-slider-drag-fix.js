(() => {
  const VERSION='22.14.0';
  let pct=50;
  const $=s=>document.querySelector(s);

  function addStyles(){
    if($('#v2214SliderStyle'))return;
    const s=document.createElement('style');s.id='v2214SliderStyle';s.textContent=`
      #v229CompareBox{touch-action:none!important;cursor:ew-resize!important;user-select:none!important}
      #v2210Divider{pointer-events:auto!important;cursor:ew-resize!important;width:5px!important;touch-action:none!important}
      #v2210Divider::before{pointer-events:auto!important;cursor:ew-resize!important;width:38px!important;height:38px!important}
      #v2214HitArea{position:absolute;top:0;bottom:0;width:54px;transform:translateX(-27px);z-index:25;cursor:ew-resize;touch-action:none;background:transparent}
    `;document.head.appendChild(s);
  }

  function setPct(v){
    pct=Math.max(0,Math.min(100,v));
    const overlay=$('#v22103AfterOverlay'),wrap=$('#v229AfterWrap'),line=$('#v2210Divider'),hit=$('#v2214HitArea');
    if(overlay)overlay.style.setProperty('clip-path',`polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`,'important');
    if(wrap){wrap.style.setProperty('width','100%','important');wrap.style.setProperty('clip-path',`inset(0 ${100-pct}% 0 0)`,'important');}
    if(line)line.style.left=pct+'%';if(hit)hit.style.left=pct+'%';
  }

  function bind(){
    addStyles();const box=$('#v229CompareBox'),line=$('#v2210Divider');if(!box||!line)return;
    let hit=$('#v2214HitArea');if(!hit){hit=document.createElement('div');hit.id='v2214HitArea';box.appendChild(hit)}
    if(box.dataset.v2214Drag==='1'){setPct(pct);return}box.dataset.v2214Drag='1';
    let dragging=false,pointerId=null;
    const move=(clientX)=>{const r=box.getBoundingClientRect();setPct((clientX-r.left)/Math.max(1,r.width)*100)};
    const down=e=>{dragging=true;pointerId=e.pointerId;e.preventDefault();e.stopPropagation();try{box.setPointerCapture(pointerId)}catch(_){}move(e.clientX)};
    const drag=e=>{if(!dragging)return;e.preventDefault();e.stopPropagation();move(e.clientX)};
    const up=e=>{if(!dragging)return;dragging=false;e.preventDefault();e.stopPropagation();try{box.releasePointerCapture(pointerId)}catch(_){}pointerId=null};
    box.addEventListener('pointerdown',down,true);box.addEventListener('pointermove',drag,true);box.addEventListener('pointerup',up,true);box.addEventListener('pointercancel',up,true);
    line.addEventListener('pointerdown',down,true);hit.addEventListener('pointerdown',down,true);
    box.addEventListener('click',e=>{if(e.target===line||e.target===hit)return;move(e.clientX)},true);
    box.addEventListener('dblclick',e=>{e.preventDefault();setPct(50)},true);
    setPct(50);
  }

  const obs=new MutationObserver(()=>requestAnimationFrame(bind));obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-child-index],#v229PrevChild,#v229NextChild'))setTimeout(bind,180)},true);
  setTimeout(bind,700);
  window.StoryOSSliderDragFix={version:VERSION,refresh:bind,setPct};
})();
