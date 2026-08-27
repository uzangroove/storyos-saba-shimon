(() => {
  const VERSION='22.20.0';
  const BUCKET='saba-ganim-arava.firebasestorage.app';
  const CANDIDATES=[
    'BRANDING/saba-shimon-logo.png',
    'BRANDING/saba-shimon-logo.png.png',
    'BRANDING/saba_shimon_logo.png',
    'BRANDING/logo.png',
    'storyos/ui/home/branding/saba-shimon-logo.png',
    'branding/saba-shimon-logo.png'
  ];
  let resolvedUrl='';

  const escPath=p=>p.split('/').map(encodeURIComponent).join('/');
  const direct=p=>`https://storage.googleapis.com/${BUCKET}/${escPath(p)}`;

  function addStyles(){
    if(document.getElementById('v2220BrandingStyle'))return;
    const s=document.createElement('style');
    s.id='v2220BrandingStyle';
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
        position:fixed;
        top:12px;
        left:14px;
        z-index:2147481900;
        width:78px;
        height:78px;
        object-fit:contain;
        pointer-events:none;
        user-select:none;
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

  function imageLoads(url){
    return new Promise(resolve=>{
      const img=new Image();
      let done=false;
      const finish=ok=>{if(done)return;done=true;resolve(ok)};
      img.onload=()=>finish(true);
      img.onerror=()=>finish(false);
      img.src=url+(url.includes('?')?'&':'?')+'v='+Date.now();
      setTimeout(()=>finish(false),3500);
    });
  }

  async function resolveFromFirebase(){
    const api=window.StoryOSFirebase;
    if(!api)return '';
    try{
      await api.ready();
      const user=await api.currentUser();
      if(!user)return '';
      try{
        const files=await api.listFiles('BRANDING');
        const images=files.filter(f=>/\.(png|jpe?g|webp)$/i.test(f.fullPath||f.name||''));
        const preferred=images.find(f=>/saba.*shimon|shimon.*saba|logo/i.test((f.fullPath||f.name||'').split('/').pop()))||images[0];
        if(preferred)return await api.getUrl(preferred.fullPath||preferred.name);
      }catch(_){}
      for(const p of CANDIDATES){
        try{return await api.getUrl(p)}catch(_){}
      }
    }catch(_){}
    return '';
  }

  async function resolveDirect(){
    for(const p of CANDIDATES){
      const u=direct(p);
      if(await imageLoads(u))return u;
    }
    return '';
  }

  function ensureCorner(){
    let img=document.getElementById('v2220CornerBrand');
    if(!img){
      img=document.createElement('img');
      img.id='v2220CornerBrand';
      img.alt='סבא שמעון ומוריס';
      document.body.appendChild(img);
    }
    if(resolvedUrl)img.src=resolvedUrl;
    return img;
  }

  function applyBrand(){
    addStyles();
    const homeLogo=document.getElementById('v2218BrandLogo');
    if(homeLogo&&resolvedUrl){
      homeLogo.src=resolvedUrl;
      homeLogo.removeAttribute('data-firebase-path');
      homeLogo.classList.remove('v2218-hidden');
      homeLogo.style.display='block';
    }
    const corner=ensureCorner();
    const home=document.getElementById('v2218Home');
    const homeVisible=home&&!home.classList.contains('v2218-hidden');
    corner.classList.toggle('v2220-hidden',!!homeVisible);
    document.querySelectorAll('.v2218-footer').forEach(el=>el.textContent=`גרסה ${VERSION.replace(/\.0$/,'')} · מסך כניסה נקי`);
  }

  async function boot(){
    addStyles();
    resolvedUrl=await resolveFromFirebase();
    if(!resolvedUrl)resolvedUrl=await resolveDirect();
    applyBrand();
    const obs=new MutationObserver(()=>applyBrand());
    obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    window.addEventListener('storyos-firebase-auth',async()=>{
      const u=await resolveFromFirebase();
      if(u){resolvedUrl=u;applyBrand()}
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSBranding={version:VERSION,refresh:boot,getUrl:()=>resolvedUrl};
})();
