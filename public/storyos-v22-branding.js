(() => {
  const VERSION='22.23.0';
  const BRAND_PATH='LOGO/logo_personal.png';
  let resolvedUrl='';
  let lastHomeVisible=null;

  function addStyles(){
    if(document.getElementById('v2223BrandingStyle'))return;
    const s=document.createElement('style');
    s.id='v2223BrandingStyle';
    s.textContent=`
      #v2218Home .v2218-brand{position:relative}
      #v2218Home #v2218BrandLogo{display:none!important}
      #v2223HomeBrand{width:min(178px,30vw);height:min(178px,30vw);max-height:178px;object-fit:contain;margin:0 auto 2px;filter:drop-shadow(0 13px 18px rgba(34,38,48,.16));background:transparent;border:0;box-shadow:none}
      #v2220CornerBrand{position:fixed;top:12px;left:14px;z-index:2147481900;width:78px;height:78px;object-fit:contain;pointer-events:none;user-select:none;filter:drop-shadow(0 7px 10px rgba(26,30,40,.22));transition:opacity .15s ease,transform .15s ease}
      body.v22-live #v2220CornerBrand{width:68px;height:68px;top:10px;left:10px}
      #v2220CornerBrand.v2220-hidden{opacity:0!important;transform:scale(.88);visibility:hidden}
      @media(max-width:760px){#v2223HomeBrand{width:min(128px,28vw);height:min(128px,28vw);max-height:128px}#v2220CornerBrand{width:58px;height:58px;top:8px;left:8px}}
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

  function ensureHomeBrand(){
    const brand=document.querySelector('#v2218Home .v2218-brand');
    if(!brand)return null;
    let img=document.getElementById('v2223HomeBrand');
    if(!img){
      img=document.createElement('img');img.id='v2223HomeBrand';img.alt='סבא שמעון ומוריס';
      const h1=brand.querySelector('h1');brand.insertBefore(img,h1||brand.firstChild);
    }
    if(resolvedUrl&&img.src!==resolvedUrl)img.src=resolvedUrl;
    img.style.display=resolvedUrl?'block':'none';
    return img;
  }

  function ensureCorner(){
    let img=document.getElementById('v2220CornerBrand');
    if(!img){img=document.createElement('img');img.id='v2220CornerBrand';img.alt='סבא שמעון ומוריס';document.body.appendChild(img)}
    if(resolvedUrl&&img.src!==resolvedUrl)img.src=resolvedUrl;
    img.style.display=resolvedUrl?'block':'none';
    return img;
  }

  function syncVisibility(){
    ensureHomeBrand();const corner=ensureCorner();
    const home=document.getElementById('v2218Home');
    const visible=!!(home&&!home.classList.contains('v2218-hidden'));
    if(visible!==lastHomeVisible){lastHomeVisible=visible;corner.classList.toggle('v2220-hidden',visible)}
  }

  async function refresh(){
    const u=await resolveBrand();if(u)resolvedUrl=u;
    ensureHomeBrand();ensureCorner();syncVisibility();return resolvedUrl;
  }

  function boot(){
    addStyles();syncVisibility();setTimeout(refresh,600);
    window.addEventListener('storyos-firebase-auth',()=>setTimeout(refresh,0));
    document.addEventListener('click',()=>setTimeout(syncVisibility,80),true);
    setInterval(syncVisibility,1200);
    document.querySelectorAll('.v2218-footer').forEach(el=>el.textContent=`גרסה ${VERSION.replace(/\.0$/,'')} · מסך כניסה נקי`);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSBranding={version:VERSION,path:BRAND_PATH,refresh,getUrl:()=>resolvedUrl};
})();
