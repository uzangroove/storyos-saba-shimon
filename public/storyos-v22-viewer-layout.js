(() => {
  const $=s=>document.querySelector(s);
  const VERSION='22.10.0';
  let dragPct=50;

  function addStyles(){
    if($('#v2210ViewerStyle'))return;
    const s=document.createElement('style');s.id='v2210ViewerStyle';s.textContent=`
      body.v2210-child-view{overflow:hidden!important}
      body.v2210-child-view header,body.v2210-child-view #activityHub,body.v2210-child-view #todayPlanner,body.v2210-child-view #dashboard,body.v2210-child-view #v20UnifiedControls{display:none!important}
      body.v2210-child-view main{padding:0!important;max-width:none!important;width:100%!important;height:100dvh!important;overflow:hidden!important}
      body.v2210-child-view #detail{padding:0!important;margin:0!important;max-width:none!important;width:100%!important;height:100dvh!important;overflow:hidden!important}
      body.v2210-child-view #detail>.back,body.v2210-child-view #detail>.hero,body.v2210-child-view #detail>.panel:not(#v229ChildViewer){display:none!important}

      #v229ChildViewer.v2210-layout{position:fixed!important;inset:0!important;z-index:999999;background:#f8f4ed!important;margin:0!important;border-radius:0!important;padding:10px!important;display:grid!important;grid-template-columns:168px minmax(0,1fr)!important;grid-template-rows:auto auto minmax(0,1fr) auto!important;gap:8px!important;overflow:hidden!important;box-shadow:none!important}
      #v229ChildViewer.v2210-layout>.v229-viewer-head{grid-column:2!important;margin:0!important;min-height:0!important}
      #v229ChildViewer.v2210-layout>.v229-viewer-head:first-child{grid-row:1!important}
      #v229ChildViewer.v2210-layout>.v229-viewer-head:nth-of-type(2){grid-row:2!important;background:#fff;border:1px solid var(--line);border-radius:14px;padding:6px 10px}
      #v229ChildViewer.v2210-layout>.v229-source-note{display:none!important}
      #v229ChildViewer.v2210-layout #v229OverviewToggle{display:none!important}
      #v229ChildViewer.v2210-layout #v229Overview{display:none!important}
      #v229ChildViewer.v2210-layout #v229ChildBanner{grid-column:1!important;grid-row:1 / 5!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:6px!important;overflow-y:auto!important;overflow-x:hidden!important;padding:8px!important;border-radius:14px!important;background:#f4efff!important;scrollbar-width:thin}
      #v229ChildViewer.v2210-layout .v229-child-btn{width:100%!important;text-align:right!important;white-space:nowrap!important;padding:7px 9px!important;border-radius:10px!important;font-size:.9rem!important}
      #v229ChildViewer.v2210-layout .v229-main-grid{grid-column:2!important;grid-row:3!important;min-height:0!important;height:100%!important;display:grid!important;grid-template-columns:minmax(0,1.22fr) minmax(0,1fr)!important;gap:8px!important;overflow:hidden!important}
      #v229ChildViewer.v2210-layout .v229-media-grid{min-height:0!important;height:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;overflow:hidden!important}
      #v229ChildViewer.v2210-layout .v229-card{min-height:0!important;height:100%!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:9px!important;border-radius:14px!important}
      #v229ChildViewer.v2210-layout .v229-card h3{font-size:1rem!important;margin:0 0 5px!important;flex:0 0 auto}
      #v229ChildViewer.v2210-layout #v229CompareHost,#v229ChildViewer.v2210-layout #v229VideoHost,#v229ChildViewer.v2210-layout #v229ModelHost{flex:1 1 auto!important;min-height:0!important;height:auto!important;overflow:hidden!important}
      #v229ChildViewer.v2210-layout .v229-compare{width:100%!important;height:100%!important;aspect-ratio:auto!important;touch-action:none!important;cursor:ew-resize!important;background:#111!important;position:relative!important}
      #v229ChildViewer.v2210-layout .v229-compare>img{object-fit:contain!important;background:#111!important}
      #v229ChildViewer.v2210-layout .v229-after-wrap{inset:0 auto 0 0!important;height:100%!important;width:50%;overflow:hidden!important;border:0!important;box-shadow:none!important;background-position:center!important;background-repeat:no-repeat!important;background-size:contain!important;background-color:transparent!important}
      #v229ChildViewer.v2210-layout .v229-after-wrap>img{display:none!important}
      #v229ChildViewer.v2210-layout .v229-slider,#v229ChildViewer.v2210-layout .v229-labels{display:none!important}
      .v2210-divider{position:absolute!important;top:0!important;bottom:0!important;width:4px!important;background:#fff!important;box-shadow:0 0 0 1px rgba(0,0,0,.35),0 0 12px rgba(0,0,0,.5)!important;z-index:20!important;transform:translateX(-2px)!important;pointer-events:none!important}
      .v2210-divider::before{content:'↔';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#2b3550;border:1px solid #bbb;font-weight:900;font-size:20px;box-shadow:0 3px 12px rgba(0,0,0,.25)}
      #v229ChildViewer.v2210-layout .v229-video{width:100%!important;height:100%!important;aspect-ratio:auto!important;object-fit:contain!important;background:#111!important;border-radius:10px!important}
      #v229ChildViewer.v2210-layout .v229-model-wrap{height:auto!important;min-height:0!important;border-radius:10px!important}
      #v229ChildViewer.v2210-layout .v229-model-toolbar{flex:0 0 auto!important;margin-top:5px!important;gap:4px!important}
      #v229ChildViewer.v2210-layout .v229-model-toolbar .btn,#v229ChildViewer.v2210-layout .v229-model-toolbar label{padding:5px 7px!important;font-size:.78rem!important}
      #v229ChildViewer.v2210-layout #v229MediaStatus{grid-column:2!important;grid-row:4!important;margin:0!important;min-height:0!important;overflow:hidden!important;white-space:nowrap!important}
      #v229ChildViewer.v2210-layout .v229-chip{padding:3px 7px!important;font-size:.75rem!important}
      .v2210-close{background:#26324c!important;color:#fff!important;border-color:#26324c!important}
      @media(max-width:1050px){#v229ChildViewer.v2210-layout{grid-template-columns:138px minmax(0,1fr)!important}.v229-media-grid{grid-template-columns:1fr 1fr!important}.v229-model-toolbar .btn,.v229-model-toolbar label{font-size:.72rem!important;padding:4px 5px!important}}
      @media(max-width:760px){#v229ChildViewer.v2210-layout{grid-template-columns:1fr!important;grid-template-rows:auto 56px auto minmax(0,1fr) auto!important}#v229ChildViewer.v2210-layout #v229ChildBanner{grid-column:1!important;grid-row:2!important;flex-direction:row!important;overflow-x:auto!important;overflow-y:hidden!important}#v229ChildViewer.v2210-layout .v229-child-btn{width:auto!important;text-align:center!important}#v229ChildViewer.v2210-layout>.v229-viewer-head:first-child{grid-column:1!important;grid-row:1!important}#v229ChildViewer.v2210-layout>.v229-viewer-head:nth-of-type(2){grid-column:1!important;grid-row:3!important}#v229ChildViewer.v2210-layout .v229-main-grid{grid-column:1!important;grid-row:4!important;grid-template-columns:1fr!important;overflow:auto!important}#v229ChildViewer.v2210-layout #v229MediaStatus{grid-column:1!important;grid-row:5!important}.v229-media-grid{grid-template-columns:1fr 1fr!important;min-height:340px!important}}
    `;document.head.appendChild(s);
  }

  function exitViewer(){
    document.body.classList.remove('v2210-child-view');
    const root=$('#v229ChildViewer');if(root)root.classList.remove('v2210-layout');
    if(typeof window.goHome==='function')window.goHome();
  }

  function ensureCloseButton(root){
    const head=root.querySelector('.v229-viewer-head');if(!head||head.querySelector('.v2210-close'))return;
    const btn=document.createElement('button');btn.className='btn v2210-close';btn.type='button';btn.textContent='← חזרה למרכז הפעילויות';btn.onclick=exitViewer;head.appendChild(btn);
  }

  function setComparison(pct){
    dragPct=Math.max(0,Math.min(100,pct));
    const wrap=$('#v229AfterWrap'),line=$('#v2210Divider');if(wrap)wrap.style.width=dragPct+'%';if(line)line.style.left=dragPct+'%';
  }

  function enhanceCompare(){
    const box=$('#v229CompareBox'),wrap=$('#v229AfterWrap');if(!box||!wrap)return;
    const afterImg=wrap.querySelector('img');if(afterImg?.src){wrap.style.backgroundImage=`url("${afterImg.src.replace(/"/g,'%22')}")`;}
    let line=$('#v2210Divider');if(!line){line=document.createElement('div');line.id='v2210Divider';line.className='v2210-divider';box.appendChild(line)}
    if(box.dataset.v2210Drag!=='1'){
      box.dataset.v2210Drag='1';
      const move=e=>{const r=box.getBoundingClientRect();const x=(e.clientX-r.left)/Math.max(1,r.width)*100;setComparison(x)};
      box.addEventListener('pointerdown',e=>{box.setPointerCapture?.(e.pointerId);move(e)});
      box.addEventListener('pointermove',e=>{if(e.buttons||box.hasPointerCapture?.(e.pointerId))move(e)});
      box.addEventListener('dblclick',()=>setComparison(50));
    }
    setComparison(dragPct);
  }

  function activate(){
    const root=$('#v229ChildViewer');if(!root)return;
    addStyles();document.body.classList.add('v2210-child-view');root.classList.add('v2210-layout');ensureCloseButton(root);enhanceCompare();
  }

  const observer=new MutationObserver(()=>{if($('#v229ChildViewer')){activate();enhanceCompare();}});
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','src','style']});
  setTimeout(activate,500);
  window.StoryOSViewerLayout={version:VERSION,activate,exit:exitViewer};
})();
