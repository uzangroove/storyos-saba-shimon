(() => {
  const VERSION='22.13.0';
  const ADMIN_KEY='storyos_v22_admin_v1';
  const TYPE_DIR={original:'before',after:'after',video:'videos',model:'3dmodel'};
  const TYPE_SUFFIX={original:'before',after:'after',video:'video',model:'3dmodel'};
  const TYPE_EXT={original:'jpg',after:'png',video:'mp4',model:'glb'};
  const NAME_SLUGS={
    'בן':'ben','איילון':'eylon','אילון':'eylon','גיא':'guy','דורי':'dori','הודיה':'odaya','טובה':'vova','וובה':'vova',"ז'רה":'jera','טומי':'tomy','יואב':'yoav','ליאב':'liav','לני':'leny','מריאן':'mariane','נלי':'nely','עומר ב':'omer_b','עומר ו':'omer_vav','צופיה':'tsofia','רום':'rom','רון':'ron','רפאל':'rafael','שיר':'shir','תום':'tom','תמר':'tamar'
  };

  function loadAdmin(){try{const d=JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');return {gardens:Array.isArray(d.gardens)?d.gardens:[]}}catch(_){return {gardens:[]}}}
  function safe(v){return String(v||'').trim().replace(/[\\/]+/g,'-').replace(/\s+/g,'-').replace(/[^a-zA-Z0-9_-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase()}
  function gardenSlug(name){const g=loadAdmin().gardens.find(x=>x.name===name);return safe(g?.slug)||safe(name)||'garden'}
  function childSlug(child){return NAME_SLUGS[child]||safe(child)||'child'}
  function filename(child,type){const slug=childSlug(child);return `${slug}_${TYPE_SUFFIX[type]}.${TYPE_EXT[type]}`}
  function path(garden,child,type){return `storyos/gardens/${gardenSlug(garden)}/${TYPE_DIR[type]}/${filename(child,type)}`}
  function proxy(url){try{return window.StoryOSCORSHotfix?.proxied?.(url)||url}catch(_){return url}}

  async function ensureAuth(interactive=true){const fb=window.StoryOSFirebase;if(!fb)throw new Error('Firebase לא נטען.');await fb.ready();let user=await fb.currentUser();if(!user&&interactive)user=await fb.signInWithPrompt();if(!user)throw new Error('נדרשת התחברות ל-Firebase.');return fb}
  async function upload(garden,child,type,blob,originalName=''){
    const fb=await ensureAuth(true);const p=path(garden,child,type);const meta={contentType:blob.type||undefined,customMetadata:{storyosVersion:VERSION,gardenName:garden,gardenSlug:gardenSlug(garden),childName:child,childSlug:childSlug(child),mediaType:type,originalName:originalName||'',layout:'flat-v1'}};const out=await fb.upload(p,blob,meta);return {path:p,url:out.url};
  }
  async function download(garden,child,type){
    const fb=await ensureAuth(false);const p=path(garden,child,type);try{const raw=await fb.getUrl(p);const r=await fetch(proxy(raw));if(!r.ok)return null;return {blob:await r.blob(),name:filename(child,type),cloudPath:p,source:'firebase-flat-v1'}}catch(_){return null}
  }

  function patchHub(){
    const hub=window.StoryOSMediaHub;if(!hub||hub.__flatMediaPatched)return false;
    const basePut=hub.putArtAsset.bind(hub),baseGet=hub.getArtAsset.bind(hub);
    hub.putArtAsset=async(garden,child,type,blob,name='')=>{
      const local=await basePut(garden,child,type,blob,name);
      try{const cloud=await upload(garden,child,type,blob,name);return {...local,cloudSynced:true,cloudPath:cloud.path,cloudUrl:cloud.url}}catch(err){return {...local,cloudSynced:false,cloudError:String(err?.message||err)}};
    };
    hub.getArtAsset=async(garden,child,type)=>{
      try{if(window.StoryOSFirebase&&await window.StoryOSFirebase.currentUser().catch(()=>null)){const cloud=await download(garden,child,type);if(cloud){try{await basePut(garden,child,type,cloud.blob,cloud.name)}catch(_){}return cloud}}}catch(_){}
      return baseGet(garden,child,type);
    };
    hub.flatMedia={version:VERSION,path,filename,gardenSlug,childSlug,upload,download};hub.__flatMediaPatched=true;return true;
  }

  async function inspectGarden(garden){
    const fb=await ensureAuth(true),slug=gardenSlug(garden),prefix=`storyos/gardens/${slug}`;let items=[];try{items=await fb.listFiles(prefix)}catch(_){}
    const byChild={};for(const item of items){const base=String(item.fullPath||item.name||'').split('/').pop()||'';for(const type of Object.keys(TYPE_SUFFIX)){const re=new RegExp(`^(.+)_${TYPE_SUFFIX[type]}\\.${TYPE_EXT[type]}$`,'i');const m=base.match(re);if(!m)continue;const child=m[1];(byChild[child]||=( {original:false,after:false,video:false,model:false} ))[type]=true;}}
    return {garden,slug,prefix,total:items.length,children:byChild};
  }

  function install(){patchHub();const obs=new MutationObserver(()=>patchHub());obs.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('storyos-firebase-auth',()=>patchHub());}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,120),{once:true});else setTimeout(install,120);
  window.StoryOSFlatMedia={version:VERSION,path,filename,gardenSlug,childSlug,upload,download,inspectGarden};
})();
