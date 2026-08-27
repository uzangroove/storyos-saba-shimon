(() => {
  const VERSION='22.21.0';
  const BRAND_PATH='LOGO/logo_personal.png';
  let resolvedUrl='';

  function addStyles(){
    if(document.getElementById('v2221BrandingStyle'))return;
    const s=document.createElement('style');
    s.id='v2221BrandingStyle';
    s.textContent=`
      #v2218Home .v2218-brand{position:relative}
      #v2218Home #v2218BrandLogo{
        width:min(178px,30vw)!important;
        height:min(178px,30vw)!important;
        max-height:178px!important;
        object-fit:contain!important;
        margin:0 auto 2px!important;
        filter:drop-shadow(0 13px 18px rgba(34,38,48,.16))!important;
        background:transparent!important;
        border:0!important;
        box-shadow:none!important;
      }
      #v2220CornerBrand{
        position:fixed;top:12px;left:14px;z-index:2147481900;
        width:78px;height:78px;object-fit:contain;pointer-events:none;user-select:none;
        filter:drop-shadow(0 7px 10px rgba(26,30,40,.22));
        transition:opacity .15s ease,transform .15s ease;
      }
      body.v22-live #v2220CornerBrand{width:68px;height:68px;top:10px;left:10px}
      #v2220CornerBrand.v2220-hidden{opacity:0!important;transform:scale(.88);visibility:hidden}
      @media(max-width:760px){
        #v2218Home #v2218BrandLogo{width:min(128px,28vw)!important;height:min(128px,28vw)!important;max-height:128px!important}
        #v2220CornerBrand{width:58px;height:58px;top:8px;left:8px}
      }
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
    if(resolvedUrl)img.src=resolvedUrl;
    return img;
  }

  function applyBrand(){
    addStyles();
    const homeLogo=document.getElementById('v2218BrandLogo');
    if(homeLogo){
      if(resolvedUrl){homeLogo.src=resolvedUrl;homeLogo.style.display='block';homeLogo.classList.remove('v2218-hidden')}
      else{homeLogo.removeAttribute('src');homeLogo.style.display='none'}
    }
    const corner=ensureCorner();
    if(!resolvedUrl){corner.removeAttribute('src');corner.style.display='none'}else corner.style.display='block';
    const home=document.getElementById('v2218Home');
    const homeVisible=home&&!home.classList.contains('v2218-hidden');
    corner.classList.toggle('v2220-hidden',!!homeVisible);
    document.querySelectorAll('.v2218-footer').forEach(el=>el.textContent=`גרסה ${VERSION.replace(/\.0$/,'')} · מסך כניסה נקי`);
  }

  async function refresh(){resolvedUrl=await resolveBrand();applyBrand();return resolvedUrl}
  async function boot(){
    addStyles();applyBrand();await refresh();
    new MutationObserver(()=>applyBrand()).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    window.addEventListener('storyos-firebase-auth',refresh);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSBranding={version:VERSION,path:BRAND_PATH,refresh,getUrl:()=>resolvedUrl};
})();
