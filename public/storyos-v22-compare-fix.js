(() => {
  const $=s=>document.querySelector(s);
  let pct=50;
  let currentBox=null;

  function addStyles(){
    if($('#v22102CompareStyle'))return;
    const s=document.createElement('style');s.id='v22102CompareStyle';s.textContent=`
      #v229ChildViewer.v2210-layout .v229-compare{position:relative!important;overflow:hidden!important;background:#111!important}
      #v229ChildViewer.v2210-layout .v229-compare>img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;background:#111!important}
      #v229ChildViewer.v2210-layout .v229-after-wrap{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;overflow:hidden!important;background:none!important;border:0!important;box-shadow:none!important;clip-path:inset(0 50% 0 0)!important;pointer-events:none!important}
      #v229ChildViewer.v2210-layout .v229-after-wrap>img{display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;background:transparent!important;max-width:none!important}
      #v229ChildViewer.v2210-layout .v229-slider,#v229ChildViewer.v2210-layout .v229-labels{display:none!important}
    `;document.head.appendChild(s);
  }

  function apply(p){
    pct=Math.max(0,Math.min(100,p));
    const wrap=$('#v229AfterWrap'),line=$('#v2210Divider');
    if(wrap){wrap.style.width='100%';wrap.style.clipPath=`inset(0 ${100-pct}% 0 0)`;wrap.style.backgroundImage='none';}
    if(line)line.style.left=pct+'%';
  }

  function bind(){
    addStyles();
    const box=$('#v229CompareBox'),wrap=$('#v229AfterWrap');if(!box||!wrap)return;
    if(currentBox===box){apply(pct);return}
    currentBox=box;
    const after=wrap.querySelector('img');if(after){after.style.display='block';after.style.width='100%';after.style.height='100%';after.style.objectFit='contain';after.style.objectPosition='center';}
    const before=box.querySelector(':scope > img');if(before){before.style.width='100%';before.style.height='100%';before.style.objectFit='contain';before.style.objectPosition='center';}
    wrap.style.backgroundImage='none';
    const move=e=>{const r=box.getBoundingClientRect();apply(((e.clientX-r.left)/Math.max(1,r.width))*100)};
    box.addEventListener('pointerdown',e=>{box.setPointerCapture?.(e.pointerId);move(e)},true);
    box.addEventListener('pointermove',e=>{if(e.buttons||box.hasPointerCapture?.(e.pointerId))move(e)},true);
    box.addEventListener('dblclick',()=>apply(50),true);
    apply(50);
  }

  const obs=new MutationObserver(()=>requestAnimationFrame(bind));
  obs.observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(bind,500);
  window.StoryOSCompareFix={version:'22.10.2',refresh:bind};
})();
