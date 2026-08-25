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
      #v229CompareBox{position:relative!important;overflow:hidden!important;background:#111!important;touch-action:none!important;cursor:ew-resize!important}
      #v229CompareBox>:scope:not(.v229-after-wrap):not(#v22103AfterOverlay):not(#v2210Divider){z-index:1!important}
      #v229CompareBox>.v229-after-wrap{display:none!important}
      #v22103AfterOverlay{display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain!important;object-position:center!important;background:transparent!important;z-index:8!important;pointer-events:none!important;clip-path:polygon(0 0,50% 0,50% 100%,0 100%)!important}
      #v2210Divider{z-index:20!important}
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
  window.StoryOSCompareOverlayFix={version:VERSION,refresh:schedule};
})();
