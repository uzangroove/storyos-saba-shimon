(() => {
  const VERSION='22.29.0';

  function addStyles(){
    if(document.getElementById('v2229NoSideMenuStyle'))return;
    const s=document.createElement('style');
    s.id='v2229NoSideMenuStyle';
    s.textContent=`
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

  function removeAsideAndExpand(){
    addStyles();
    const aside=document.getElementById('v20UnifiedControls');
    if(aside)aside.remove();

    const layout=document.querySelector('.v20-main-layout');
    const dashboard=document.querySelector('.dashboard-wrap');
    if(layout&&dashboard&&dashboard.parentElement===layout){
      const parent=layout.parentElement;
      if(parent){
        parent.insertBefore(dashboard,layout);
        layout.remove();
      }
    }

    const planner=document.getElementById('todayPlanner');
    if(planner)planner.style.display='none';
    const controls=document.querySelector('.dashboard-wrap>.controls');
    if(controls)controls.style.display='none';
  }

  function boot(){
    removeAsideAndExpand();
    setTimeout(removeAsideAndExpand,250);
    setTimeout(removeAsideAndExpand,900);
    document.addEventListener('click',()=>setTimeout(removeAsideAndExpand,40),true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSNoSideMenu={version:VERSION,apply:removeAsideAndExpand};
})();
