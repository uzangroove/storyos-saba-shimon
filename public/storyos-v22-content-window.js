(() => {
  const VERSION='22.27.0';
  const DRAW='כשהציור קם לתחייה';
  const PUPPET='תיאטרון בובות';
  const LITTLE='עולם קטן, קסם גדול';
  const MUSIC='שיר נולד בגן';
  const MEETING_COUNT=22;
  const ACTIVITY_LIMITS={
    [PUPPET]:5,
    [LITTLE]:5,
    [MUSIC]:5
  };

  function getStories(){try{return Array.isArray(STORIES)?STORIES:[]}catch(_){return[]}}

  function normalizeLittleWorld(){
    const rows=getStories().filter(x=>x?.program===LITTLE);
    rows.forEach((item,i)=>{
      if(i<5){item.num=i+1;item.__v2227ActivityNo=i+1;}
    });
  }

  function buildProgramStructure(){
    const stories=getStories();
    const structure={};
    for(const program of [DRAW,PUPPET,LITTLE,MUSIC]){
      const rows=stories.filter(x=>x?.program===program);
      const visibleLimit=program===DRAW?22:(ACTIVITY_LIMITS[program]||rows.length);
      const activities=rows.slice(0,visibleLimit).map((item,i)=>({activityNo:i+1,id:item.id,title:item.title||'',sourceNum:item.num}));
      const meetings=Array.from({length:MEETING_COUNT},(_,i)=>{
        const no=i+1;
        const activity=program===DRAW?activities[i]:(no<=activities.length?activities[no-1]:null);
        return {meetingNo:no,activityNo:activity?.activityNo||null,activityId:activity?.id||null,title:activity?.title||'',blank:!activity};
      });
      structure[program]={program,meetingCount:MEETING_COUNT,activityCount:activities.length,activities,meetings};
    }
    return structure;
  }

  function installFilter(){
    if(window.__v2227ContentFilter||typeof window.filtered!=='function')return false;
    const base=window.filtered;
    window.filtered=function(){
      const rows=base();
      const seen={};
      return rows.filter(item=>{
        const p=item?.program||'';
        if(p===DRAW)return true;
        if(!(p in ACTIVITY_LIMITS))return true;
        seen[p]=(seen[p]||0)+1;
        return seen[p]<=ACTIVITY_LIMITS[p];
      });
    };
    window.__v2227ContentFilter=true;
    return true;
  }

  function apply(){
    normalizeLittleWorld();
    installFilter();
    window.StoryOSProgramStructure=buildProgramStructure();
    try{if(typeof window.render==='function')window.render()}catch(_){}
    return window.StoryOSProgramStructure;
  }

  function boot(){
    apply();
    setTimeout(apply,450);
    setTimeout(apply,1400);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSContentWindow={version:VERSION,meetingCount:MEETING_COUNT,activityLimits:ACTIVITY_LIMITS,apply,getStructure:()=>window.StoryOSProgramStructure||buildProgramStructure()};
})();
