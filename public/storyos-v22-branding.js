(() => {
  const VERSION='22.22.0';
  const BRAND_PATH='LOGO/logo_personal.png';
  let resolvedUrl='';
  let lastHomeVisible=null;

  function addStyles(){
    if(document.getElementById('v2222BrandingStyle'))return;
    const s=document.createElement('style');
    s.id='v2222BrandingStyle';
    s.textContent=`
      #v2218Home .v2218-brand{position:relative}
      #v2218Home #v2218BrandLogo{width:min(178px,30vw)!important;height:min(178px,30vw)!important;max-height:178px!important;object-fit:contain!important;margin:0 auto 2px!important;filter:drop-shadow(0 13px 18px rgba(34,38,48,.16))!important;background:transparent!important;border:0!important;box-shadow:none!important}
      #v2220CornerBrand{position:fixed;top:12px;left:14px;z-index:2147481900;width:78px;height:78px;object-fit:contain;pointer-events:none;user-select:none;filter:drop-shadow(0 7px 10px rgba(26,30,40,.22));transition:opacity .15s ease,transform .15s ease}
      body.v22-live #v2220CornerBrand{width:68px;height:68px;top:10px;left:10px}
      #v2220CornerBrand.v2220-hidden{opacity:0!important;transform:scale(.88);visibility:hidden}
      @media(max-width:760px){#v2218Home #v2218BrandLogo{width:min(128px,28vw)!important;height:min(128px,28vw)!important;max-height:128px!important}#v2220CornerBrand{width:58px;height:58px;top:8px;left:8px}}
    `;
    document.head.appendChild(s);
  }

  async function resolveBrand(){
    const api=window.StoryOSFirebase;
    if(!api)return '';
    try{
      await api.ready();
      const user=await api.currentUser();
      if(!user)return '';
      return await api.getUrl(BRAND_PATH);
    }catch(err){
      console.warn('StoryOS branding: cannot load '+BRAND_PATH,err?.code||err?.message||err);
      return '';
    }
  }

  function ensureCorner(){
    let img=document.getElementById('v2220CornerBrand');
    if(!img){img=document.createElement('img');img.id='v2220CornerBrand';img.alt='סבא שמעון ומוריס';document.body.appendChild(img)}
    return img;
  }

  function applyImageSources(){
    const homeLogo=document.getElementById('v2218BrandLogo');
    const corner=ensureCorner();
    if(resolvedUrl){
      if(homeLogo&&homeLogo.src!==resolvedUrl){homeLogo.src=resolvedUrl;homeLogo.style.display='block';homeLogo.classList.remove('v2218-hidden')}
      if(corner.src!==resolvedUrl)corner.src=resolvedUrl;
      if(corner.style.display!=='block')corner.style.display='block';
    }else{
      if(homeLogo&&homeLogo.style.display!=='none')homeLogo.style.display='none';
      if(corner.style.display!=='none')corner.style.display='none';
    }
  }

  function syncVisibility(){
    const home=document.getElementById('v2218Home');
    const visible=!!(home&&!home.classList.contains('v2218-hidden'));
    if(visible===lastHomeVisible)return;
    lastHomeVisible=visible;
    const corner=ensureCorner();
    if(visible)corner.classList.add('v2220-hidden');else corner.classList.remove('v2220-hidden');
  }

  async function refresh(){
    const url=await resolveBrand();
    if(url&&url!==resolvedUrl){resolvedUrl=url;applyImageSources()}
    syncVisibility();
    return resolvedUrl;
  }

  function boot(){
    addStyles();
    applyImageSources();
    syncVisibility();
    setTimeout(refresh,700);
    window.addEventListener('storyos-firebase-auth',()=>setTimeout(refresh,0));
    document.addEventListener('click',()=>setTimeout(syncVisibility,60),true);
    window.addEventListener('hashchange',syncVisibility);
    setInterval(syncVisibility,1200);
    document.querySelectorAll('.v2218-footer').forEach(el=>el.textContent=`גרסה ${VERSION.replace(/\.0$/,'')} · מסך כניסה נקי`);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSBranding={version:VERSION,path:BRAND_PATH,refresh,getUrl:()=>resolvedUrl};
})();
