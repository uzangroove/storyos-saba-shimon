(() => {
  const VERSION='22.25.0';
  const $=s=>document.querySelector(s);

  function drawingDetailVisible(){
    const detail=$('#detail');
    if(!detail||detail.classList.contains('hidden'))return false;
    return /כשהציור קם לתחייה/.test(detail.textContent||'');
  }

  function cleanupDrawingOverlay(){
    if(drawingDetailVisible())return;
    document.body.classList.remove('v2210-child-view');
    const root=$('#v229ChildViewer');
    if(root)root.classList.remove('v2210-layout');
  }

  function preNavigationCleanup(e){
    const tile=e.target.closest?.('[data-home-id]');
    if(tile&&tile.dataset.homeId!=='drawing-alive')cleanupDrawingOverlay();
    if(e.target.closest?.('#homeBtn,.v2210-close'))cleanupDrawingOverlay();
    setTimeout(cleanupDrawingOverlay,50);
    setTimeout(cleanupDrawingOverlay,180);
  }

  document.addEventListener('click',preNavigationCleanup,true);

  function bindDetailObserver(){
    const detail=$('#detail');if(!detail)return false;
    const obs=new MutationObserver(()=>cleanupDrawingOverlay());
    obs.observe(detail,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});
    return true;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bindDetailObserver,300),{once:true});else setTimeout(bindDetailObserver,300);
  setInterval(cleanupDrawingOverlay,1200);
  window.StoryOSNavigationHotfix={version:VERSION,cleanup:cleanupDrawingOverlay};
})();
