(() => {
  const $=s=>document.querySelector(s);
  function currentStory(){try{return current||null}catch(_){return null}}
  function openOverlay(story){
    document.getElementById('v22FlipOverlay')?.remove();
    const overlay=document.createElement('div');overlay.id='v22FlipOverlay';overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#111;display:flex;flex-direction:column';
    const bar=document.createElement('div');bar.style.cssText='height:52px;flex:0 0 52px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;background:#0e1015;color:white;border-bottom:1px solid #2b2e38;font-family:Arial,sans-serif';
    const title=document.createElement('b');title.textContent='📖 '+(story?.title||'ספר')+' · פליפ דו־עמודי';
    const close=document.createElement('button');close.type='button';close.textContent='✕ חזרה להפעלה';close.style.cssText='border:1px solid #4a4f5f;background:#242936;color:white;border-radius:10px;padding:8px 12px;font:inherit;cursor:pointer';close.onclick=()=>overlay.remove();
    bar.append(title,close);
    const frame=document.createElement('iframe');frame.allow='fullscreen';frame.style.cssText='border:0;width:100%;height:calc(100dvh - 52px);flex:1;background:#17191f';
    const url=new URL('/book-flip.html',location.origin);url.searchParams.set('v','22.5.0');if(story?.id)url.searchParams.set('story',story.id);if(story?.title)url.searchParams.set('title',story.title);frame.src=url.toString();
    overlay.append(bar,frame);document.body.appendChild(overlay);
  }
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;const txt=(btn.textContent||'').trim();if(!txt.includes('פליפ'))return;
    const story=currentStory();if(!story||story.program!=='שעת סיפור והמחשה')return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openOverlay(story);
  },true);
  window.v22OpenFlipOverlay=openOverlay;
})();
