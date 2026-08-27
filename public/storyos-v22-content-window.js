(() => {
  const VERSION='22.26.0';
  const STORY_PROGRAM='שעת סיפור והמחשה';
  const LIMITED_PROGRAMS=new Set(['תיאטרון בובות','כשהציור קם לתחייה','עולם קטן, קסם גדול','שיר נולד בגן']);
  const KEEP_COUNT=4;
  const STORY_COUNT=16;
  let appliedSignature='';

  function getStories(){try{return Array.isArray(STORIES)?STORIES:[]}catch(_){return[]}}
  function nOf(item,index){const n=Number(item?.num);return Number.isFinite(n)&&n>0?n:index+1}
  function blankValue(v){
    if(Array.isArray(v))return [];
    if(v&&typeof v==='object')return {};
    if(typeof v==='number')return 0;
    if(typeof v==='boolean')return false;
    return '';
  }
  function clearActivity(item,num){
    if(!item||item.__v2226Blank===true)return;
    const keep=new Set(['id','program','num']);
    for(const key of Object.keys(item)){
      if(keep.has(key)||key.startsWith('__'))continue;
      item[key]=blankValue(item[key]);
    }
    item.title=`פעילות ${num}`;
    item.__v2226Blank=true;
  }
  function apply(){
    const stories=getStories();if(!stories.length)return false;
    const perProgram={};
    for(const item of stories){
      const p=item?.program||'';
      perProgram[p]=(perProgram[p]||0)+1;
      const num=nOf(item,perProgram[p]-1);
      if(LIMITED_PROGRAMS.has(p)&&num>KEEP_COUNT)clearActivity(item,num);
    }
    const sig=stories.map(x=>`${x.id}:${x.program}:${x.num}:${x.__v2226Blank?'b':'k'}`).join('|');
    if(sig!==appliedSignature){
      appliedSignature=sig;
      try{if(typeof window.render==='function')window.render()}catch(_){}
    }
    return true;
  }

  function installStoryFilter(){
    if(window.__v2226StoryFilter||typeof window.filtered!=='function')return;
    const base=window.filtered;
    window.filtered=function(){
      const rows=base();let seen=0;
      return rows.filter(item=>{
        if(item?.program!==STORY_PROGRAM)return true;
        const n=Number(item?.num);if(Number.isFinite(n)&&n>0)return n<=STORY_COUNT;
        seen++;return seen<=STORY_COUNT;
      });
    };
    window.__v2226StoryFilter=true;
  }

  function boot(){
    installStoryFilter();apply();
    setTimeout(()=>{installStoryFilter();apply()},450);
    setTimeout(()=>{installStoryFilter();apply()},1400);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSContentWindow={version:VERSION,storyCount:STORY_COUNT,keepCount:KEEP_COUNT,apply};
})();
