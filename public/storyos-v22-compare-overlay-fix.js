(() => {
  const $=s=>document.querySelector(s);
  const VERSION='22.10.3';
  let pct=50;
  let hostObserver=null;
  let rootObserver=null;
  let scheduled=false;

  function addStyles(){
    if($('#v22103CompareStyle'))return;
    const s=document.createElement('style');s.id='v22103CompareStyle';s.textContent=`
      #v229CompareBox{position:relative!important;overflow:hidden!important;background:#111!important;touch-action:none!important;cursor:ew-resize!important;user-select:none!important;-webkit-user-select:none!important}
      #v229CompareBox>:scope:not(.v229-after-wrap):not(#v22103AfterOverlay):not(#v2210Divider):not(#v2210HitArea){z-index:1!important}
      #v229CompareBox>.v229-after-wrap{display:none!important}
      #v22103AfterOverlay{display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain!important;object-position:center!important;background:transparent!important;z-index:8!important;pointer-events:none!important;clip-path:polygon(0 0,50% 0,50% 100%,0 100%)!important}
      #v2210Divider{position:absolute!important;top:0!important;bottom:0!important;width:5px!important;background:#fff!important;box-shadow:0 0 0 1px rgba(0,0,0,.35),0 0 12px rgba(0,0,0,.5)!important;z-index:20!important;transform:translateX(-2px)!important;pointer-events:auto!important;cursor:ew-resize!important;touch-action:none!important}
      #v2210Divider::before{content:'↔';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#2b3550;border:1px solid #bbb;font-weight:900;font-size:21px;box-shadow:0 3px 12px rgba(0,0,0,.25);pointer-events:auto!important;cursor:ew-resize!important}
      #v2210HitArea{position:absolute!important;top:0!important;bottom:0!important;width:60px!important;transform:translateX(-30px)!important;z-index:25!important;cursor:ew-resize!important;touch-action:none!important;background:transparent!important}
    `;document.head.appendChild(s);
  }

  function setPct(value){
    pct=Math.max(0,Math.min(100,value));
    const img=$('#v22103AfterOverlay'),line=$('#v2210Divider');
    if(img)img.style.setProperty('clip-path',`polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`,'important');
    if(line)line.style.left=pct+'%';
  }

  function wireDrag(box){
    if(box.dataset.v22103Drag==='1')return;
    box.dataset.v22103Drag='1';
    const move=e=>{const r=box.getBoundingClientRect();setPct(((e.clientX-r.left)/Math.max(1,r.width))*100)};
    box.addEventListener('pointerdown',e=>{box.setPointerCapture?.(e.pointerId);move(e)},true);
    box.addEventListener('pointermove',e=>{if(e.buttons||box.hasPointerCapture?.(e.pointerId))move(e)},true);
    box.addEventListener('dblclick',()=>setPct(50),true);
  }

  function refresh(){
    scheduled=false;addStyles();
    const box=$('#v229CompareBox'),wrap=$('#v229AfterWrap');if(!box||!wrap)return;
    const source=wrap.querySelector('img');if(!source?.src)return;
    let overlay=$('#v22103AfterOverlay');
    if(!overlay){overlay=document.createElement('img');overlay.id='v22103AfterOverlay';overlay.alt='אחרי';box.appendChild(overlay)}
    if(overlay.src!==source.src)overlay.src=source.src;
    const before=box.querySelector(':scope > img:not(#v22103AfterOverlay)');if(before){before.style.objectFit='contain';before.style.objectPosition='center';before.style.width='100%';before.style.height='100%';}
    if(!$('#v2210Divider')){const line=document.createElement('div');line.id='v2210Divider';box.appendChild(line)}
    if(!$('#v2210HitArea')){const hit=document.createElement('div');hit.id='v2210HitArea';box.appendChild(hit)}
    wireDrag(box);setPct(pct);
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(refresh)}

  function watchHost(){
    const host=$('#v229CompareHost');if(!host)return false;
    hostObserver?.disconnect();hostObserver=new MutationObserver(schedule);hostObserver.observe(host,{childList:true,subtree:true});schedule();return true;
  }

  function start(){
    addStyles();if(watchHost())return;
    rootObserver=new MutationObserver(()=>{if(watchHost()){rootObserver?.disconnect();rootObserver=null}});
    rootObserver.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-child-index],#v229PrevChild,#v229NextChild'))setTimeout(schedule,150)},true);
  // owns the full before/after compare feature end-to-end: creates the overlay image,
  // the draggable divider handle and its hit-area, and all drag interaction --
  // consolidated here from storyos-v22-compare-fix.js (removed) and the compare-
  // specific logic that used to live in storyos-v22-viewer-layout.js (trimmed).
  window.StoryOSCompareOverlayFix={version:VERSION,refresh:schedule,setPct};
})();
