(() => {
  const VERSION='22.30.0';

  function addStyles(){
    if(document.getElementById('v2230NoSideMenuStyle'))return;
    const s=document.createElement('style');
    s.id='v2230NoSideMenuStyle';
    s.textContent=`
      /* Keep the filter controls in the DOM for program navigation logic,
         but never show the right-side chooser UI. */
      #v20UnifiedControls{display:none!important}
      #todayPlanner{display:none!important}
      .dashboard-wrap>.controls{display:none!important}
      .v20-main-layout{display:block!important;width:100%!important;margin-top:18px!important}
      .v20-main-layout>.dashboard-wrap{width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;flex:none!important}
      main{max-width:1800px!important;width:100%!important}
      #dashboard,.dashboard-wrap{max-width:none!important;width:100%!important}
      .cards{width:100%!important}
    `;
    document.head.appendChild(s);
  }

  function hideSideMenuAndExpand(){
    addStyles();
    const aside=document.getElementById('v20UnifiedControls');
    if(aside){
      aside.hidden=true;
      aside.setAttribute('aria-hidden','true');
    }

    const planner=document.getElementById('todayPlanner');
    if(planner)planner.style.display='none';
    const controls=document.querySelector('.dashboard-wrap>.controls');
    if(controls)controls.style.display='none';
  }

  function boot(){
    hideSideMenuAndExpand();
    setTimeout(hideSideMenuAndExpand,250);
    setTimeout(hideSideMenuAndExpand,900);
    document.addEventListener('click',()=>setTimeout(hideSideMenuAndExpand,40),true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSNoSideMenu={version:VERSION,apply:hideSideMenuAndExpand};
})();
