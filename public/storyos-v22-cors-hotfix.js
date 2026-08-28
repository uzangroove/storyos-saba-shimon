(() => {
  const PROXY_PATH='/firebase-media';
  function isFirebaseMedia(url){
    try{
      const u=new URL(url,location.href);
      return u.hostname==='firebasestorage.googleapis.com'||u.hostname==='storage.googleapis.com';
    }catch(_){return false}
  }
  function proxied(url){
    if(!url||String(url).startsWith(PROXY_PATH))return url;
    if(!isFirebaseMedia(url))return url;
    return `${PROXY_PATH}?url=${encodeURIComponent(url)}`;
  }

  // Patch model-viewer src values before the component fetches the GLB.
  const originalSetAttribute=Element.prototype.setAttribute;
  Element.prototype.setAttribute=function(name,value){
    if(this?.tagName==='MODEL-VIEWER'&&name==='src'&&isFirebaseMedia(value)) value=proxied(value);
    return originalSetAttribute.call(this,name,value);
  };

  function patchNode(node){
    if(!(node instanceof Element))return;
    if(node.tagName==='MODEL-VIEWER'){
      const src=node.getAttribute('src');
      if(src&&isFirebaseMedia(src)) originalSetAttribute.call(node,'src',proxied(src));
    }
    node.querySelectorAll?.('model-viewer[src]').forEach(el=>{
      const src=el.getAttribute('src');
      if(src&&isFirebaseMedia(src)) originalSetAttribute.call(el,'src',proxied(src));
    });
  }

  new MutationObserver(mutations=>{
    for(const m of mutations){
      if(m.type==='attributes') patchNode(m.target);
      for(const n of m.addedNodes||[]) patchNode(n);
    }
  }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});

  document.addEventListener('DOMContentLoaded',()=>patchNode(document.body),{once:true});
  patchNode(document.body);
  window.StoryOSCORSHotfix={proxied,version:'22.9.1'};
})();
