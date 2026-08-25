(() => {
  const VERSION='22.4.0';
  function currentStory(){try{return window.current||null}catch(_){return null}}
  function openRealFlip(story){
    if(!story)return;
    const url=new URL('/book-flip.html',location.origin);
    url.searchParams.set('v',VERSION);
    url.searchParams.set('story',story.id);
    url.searchParams.set('title',story.title);
    try{window.top.location.href=url.toString()}catch(_){location.href=url.toString()}
  }
  function patchButton(btn){
    if(!btn||btn.dataset.v224FlipPatched)return;
    btn.dataset.v224FlipPatched='1';
    btn.textContent=btn.dataset.v22LiveFlip!==undefined?'📖 ספר בפליפ · שני עמודים':'📖 פתח ספר בפליפ · שני עמודים';
    btn.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();openRealFlip(currentStory())};
  }
  function patch(){document.querySelectorAll('[data-v22-flip],[data-v22-live-flip]').forEach(patchButton)}
  new MutationObserver(patch).observe(document.documentElement,{childList:true,subtree:true});
  patch();
})();
