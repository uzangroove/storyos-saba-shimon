(() => {
  'use strict';
  const VERSION='22.41.0';

  function addStyles(){
    if(document.getElementById('v2230NoSideMenuStyle'))return;
    const s=document.createElement('style');
    s.id='v2230NoSideMenuStyle';
    s.textContent=`
      /* Keep legacy controls in the DOM for program/filter logic, but never expose
         the obsolete side-panel UI. Layout is CSS-driven; no timers required. */
      #v20UnifiedControls,#todayPlanner,.dashboard-wrap>.controls{display:none!important}
      .v20-main-layout{display:block!important;width:100%!important;margin-top:18px!important}
      .v20-main-layout>.dashboard-wrap{width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;flex:none!important}
      main{max-width:1800px!important;width:100%!important}
      #dashboard,.dashboard-wrap,.cards{max-width:none!important;width:100%!important}
    `;
    document.head.appendChild(s);
  }

  function applyAccessibilityState(){
    const aside=document.getElementById('v20UnifiedControls');
    if(aside){aside.hidden=true;aside.setAttribute('aria-hidden','true')}
    const planner=document.getElementById('todayPlanner');
    if(planner){planner.hidden=true;planner.setAttribute('aria-hidden','true')}
  }

  function boot(){
    addStyles();
    applyAccessibilityState();
    const observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        if([...mutation.addedNodes].some(n=>n.nodeType===1&&(n.id==='v20UnifiedControls'||n.id==='todayPlanner'||n.querySelector?.('#v20UnifiedControls,#todayPlanner')))){
          applyAccessibilityState();
          break;
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSNoSideMenu={version:VERSION,apply:applyAccessibilityState};
})();