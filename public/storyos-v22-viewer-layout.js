(() => {
  const $=s=>document.querySelector(s);
  const VERSION='22.24.0';
  let activeRoot=null;
  let rootObserver=null;

  function addStyles(){
    if($('#v2210ViewerStyle'))return;
    const s=document.createElement('style');s.id='v2210ViewerStyle';s.textContent=`
      body.v2210-child-view{overflow:hidden!important}
      body.v2210-child-view header,body.v2210-child-view #activityHub,body.v2210-child-view #todayPlanner,body.v2210-child-view #dashboard,body.v2210-child-view #v20UnifiedControls{display:none!important}
      body.v2210-child-view main{padding:0!important;max-width:none!important;width:100%!important;height:100dvh!important;overflow:hidden!important}
      body.v2210-child-view #detail{padding:0!important;margin:0!important;max-width:none!important;width:100%!important;height:100dvh!important;overflow:hidden!important}
      body.v2210-child-view #detail>.back,body.v2210-child-view #detail>.hero,body.v2210-child-view #detail>.panel:not(#v229ChildViewer){display:none!important}
      #v229ChildViewer.v2210-layout{position:fixed!important;inset:0!important;z-index:999999;background:#f8f4ed!important;margin:0!important;border-radius:0!important;padding:10px!important;display:grid!important;grid-template-columns:1fr!important;grid-template-rows:auto auto auto minmax(0,1fr) auto!important;gap:6px!important;overflow:hidden!important;box-shadow:none!important}
      #v229ChildViewer.v2210-layout.v2210-hidden-for-admin{display:none!important}
      #v229ChildViewer.v2210-layout>.v229-viewer-head{grid-column:1!important;margin:0!important;min-height:0!important}
      #v229ChildViewer.v2210-layout #v229TopMenu{grid-row:1!important;background:#fff;border:1px solid var(--line);border-radius:12px;padding:6px 8px}
      #v229ChildViewer.v2210-layout .v229-garden-mgmt{display:flex!important;gap:8px!important;align-items:center!important;flex-wrap:wrap!important}
      #v229ChildViewer.v2210-layout .v229-garden-mgmt label{font-size:.82rem!important}
      #v229ChildViewer.v2210-layout #v229ChildNav{grid-row:3!important;background:#fff;border:1px solid var(--line);border-radius:14px;padding:5px 10px}
      #v229ChildViewer.v2210-layout #v229OverviewToggle,#v229ChildViewer.v2210-layout #v229Overview{display:none!important}
      #v229ChildViewer.v2210-layout #v229ChildBanner{grid-row:2!important;display:flex!important;flex-direction:row!important;align-items:center!important;gap:6px!important;overflow-x:auto!important;overflow-y:hidden!important;padding:6px 8px!important;border-radius:12px!important;background:#f4efff!important;scrollbar-width:thin}
      #v229ChildViewer.v2210-layout .v229-child-btn{flex:0 0 auto!important;white-space:nowrap!important;padding:6px 12px!important;border-radius:999px!important;font-size:.85rem!important}
      #v229ChildViewer.v2210-layout .v229-main-grid{grid-row:4!important;min-height:0!important;height:100%!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;overflow:hidden!important}
      #v229ChildViewer.v2210-layout .v229-card{min-height:0!important;height:100%!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:8px!important;border-radius:14px!important}
      #v229ChildViewer.v2210-layout .v229-card h3{font-size:.9rem!important;margin:0 0 4px!important;flex:0 0 auto}
      #v229ChildViewer.v2210-layout #v229CompareHost,#v229ChildViewer.v2210-layout #v229VideoHost,#v229ChildViewer.v2210-layout #v229ModelHost{flex:1 1 auto!important;min-height:0!important;height:auto!important;overflow:hidden!important}
      #v229ChildViewer.v2210-layout .v229-compare{width:100%!important;height:100%!important;aspect-ratio:auto!important;touch-action:none!important;cursor:ew-resize!important;background:#111!important;position:relative!important}
      #v229ChildViewer.v2210-layout .v229-compare>img{object-fit:contain!important;background:#111!important}
      #v229ChildViewer.v2210-layout .v229-after-wrap{inset:0 auto 0 0!important;height:100%!important;width:50%;overflow:hidden!important;border:0!important;box-shadow:none!important;background-position:center!important;background-repeat:no-repeat!important;background-size:contain!important;background-color:transparent!important}
      #v229ChildViewer.v2210-layout .v229-after-wrap>img{display:none!important}
      #v229ChildViewer.v2210-layout .v229-slider,#v229ChildViewer.v2210-layout .v229-labels{display:none!important}
      #v229ChildViewer.v2210-layout .v229-video{width:100%!important;height:100%!important;aspect-ratio:auto!important;object-fit:contain!important;background:#111!important;border-radius:10px!important}
      #v229ChildViewer.v2210-layout .v229-model-wrap{height:auto!important;min-height:0!important;border-radius:10px!important}
      #v229ChildViewer.v2210-layout .v229-model-toolbar{flex:0 0 auto!important;margin-top:4px!important;gap:3px!important}
      #v229ChildViewer.v2210-layout .v229-model-toolbar .btn,#v229ChildViewer.v2210-layout .v229-model-toolbar label{padding:4px 6px!important;font-size:.72rem!important}
      #v229ChildViewer.v2210-layout #v229MediaStatus{grid-row:5!important;margin:0!important;min-height:0!important;overflow:hidden!important;white-space:nowrap!important}
      #v229ChildViewer.v2210-layout .v229-chip{padding:3px 7px!important;font-size:.72rem!important}
      .v2210-close{background:#26324c!important;color:#fff!important;border-color:#26324c!important}
      @media(max-width:820px){
        #v229ChildViewer.v2210-layout .v229-main-grid{grid-template-columns:1fr!important;grid-template-rows:repeat(3,minmax(0,1fr))!important}
        #v229ChildViewer.v2210-layout .v229-card h3{font-size:.78rem!important}
        #v229ChildViewer.v2210-layout .v229-model-toolbar .btn,#v229ChildViewer.v2210-layout .v229-model-toolbar label{font-size:.65rem!important;padding:3px 5px!important}
        #v229ChildViewer.v2210-layout .v229-garden-mgmt{font-size:.75rem!important}
        #v229ChildViewer.v2210-layout .v229-garden-mgmt select{max-width:110px!important}
      }
    `;document.head.appendChild(s);
  }

  function exitViewer(){
    document.body.classList.remove('v2210-child-view');
    if(activeRoot)activeRoot.classList.remove('v2210-layout');
    activeRoot=null;
    if(typeof window.goHome==='function')window.goHome();
  }

  function ensureCloseButton(root){
    const head=root.querySelector('.v229-viewer-head');if(!head||head.querySelector('.v2210-close'))return;
    const btn=document.createElement('button');btn.className='btn v2210-close';btn.type='button';btn.textContent='← חזרה למרכז הפעילויות';btn.onclick=exitViewer;head.appendChild(btn);
  }

  function activate(){
    const root=$('#v229ChildViewer');if(!root)return false;
    addStyles();
    if(activeRoot!==root){
      activeRoot=root;
      document.body.classList.add('v2210-child-view');
      root.classList.add('v2210-layout');
      ensureCloseButton(root);
    }else if(!root.classList.contains('v2210-layout')){
      root.classList.add('v2210-layout');document.body.classList.add('v2210-child-view');
    }
    return true;
  }

  function watchForRoot(){
    activate();
    rootObserver=new MutationObserver(()=>requestAnimationFrame(activate));
    rootObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    setInterval(activate,900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchForRoot,{once:true});else watchForRoot();
  // compare-slider ownership moved entirely to storyos-v22-compare-overlay-fix.js
  // (see that file's header comment); this file now only owns the surrounding
  // full-screen viewer layout/grid and the close button.
  window.StoryOSViewerLayout={version:VERSION,activate,exit:exitViewer};
})();
