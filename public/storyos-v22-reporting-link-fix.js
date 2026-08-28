(() => {
  const VERSION='22.35.0';
  function wire(){
    const b=document.getElementById('v2234OperatorBtn');
    if(!b)return;
    b.onclick=()=>{location.href='/operator-report-v2235.html?v='+VERSION};
    b.title='פתיחת אפליקציית דיווח מפעיל v22.35';
  }
  function boot(){wire();setTimeout(wire,500);setTimeout(wire,1600);new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
