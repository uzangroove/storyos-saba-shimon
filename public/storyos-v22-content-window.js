(() => {
  const VERSION='22.33.0';
  const DRAW='כשהציור קם לתחייה';
  const PUPPET='תיאטרון בובות';
  const LITTLE='עולם קטן, קסם גדול';
  const MUSIC='שיר נולד בגן';
  const MEETING_COUNT=37;
  const CONTENT_LIMITS={
    [DRAW]:6,
    [PUPPET]:5,
    [LITTLE]:5,
    [MUSIC]:5
  };

  function getStories(){try{return Array.isArray(STORIES)?STORIES:[]}catch(_){return[]}}

  function blankTemplate(program,num,id){
    return {
      id,
      num,
      title:`מפגש ${num}`,
      author:'',
      age:'',
      duration:'',
      score:0,
      themes:[],
      season:'',
      summary:'',
      message:'',
      puppets:[],
      props:[],
      wow:'',
      questions:[],
      purchase:'',
      timeline:[],
      attention:{},
      inclusion:[],
      packing:[],
      cover:'',
      cover_source:'placeholder',
      category:'',
      program,
      __v2228Blank:true
    };
  }

  function clearToBlank(item,program,num){
    const id=item?.id||`blank-${program}-${num}`;
    const blank=blankTemplate(program,num,id);
    for(const k of Object.keys(item||{}))delete item[k];
    Object.assign(item,blank);
    return item;
  }

  function ensureProgram(program){
    const stories=getStories();
    let rows=stories.filter(x=>x?.program===program);
    const keep=CONTENT_LIMITS[program]||0;

    // Normalize visible numbering to 1..37 regardless of legacy source numbering.
    rows.forEach((item,i)=>{item.num=i+1;});

    // Keep content only through the approved range; all later meetings remain empty shells.
    rows.forEach((item,i)=>{
      const num=i+1;
      if(num>keep)clearToBlank(item,program,num);
    });

    // Add missing empty meetings until meeting 37 exists.
    rows=stories.filter(x=>x?.program===program);
    for(let num=rows.length+1;num<=MEETING_COUNT;num++){
      const id=`${program===DRAW?'art':program===PUPPET?'puppet':program===LITTLE?'little':'music'}-blank-${String(num).padStart(2,'0')}`;
      stories.push(blankTemplate(program,num,id));
    }
  }

  function installFilter(){
    if(window.__v2228ContentFilter||typeof window.filtered!=='function')return;
    const base=window.filtered;
    window.filtered=function(){
      const rows=base();
      const seen={};
      return rows.filter(item=>{
        const p=item?.program||'';
        if(!(p in CONTENT_LIMITS))return true;
        seen[p]=(seen[p]||0)+1;
        return seen[p]<=MEETING_COUNT;
      });
    };
    window.__v2228ContentFilter=true;
  }

  function structure(){
    const stories=getStories();
    const out={};
    for(const program of [DRAW,PUPPET,LITTLE,MUSIC]){
      const rows=stories.filter(x=>x?.program===program).slice(0,MEETING_COUNT);
      out[program]={
        program,
        meetingCount:MEETING_COUNT,
        contentThrough:CONTENT_LIMITS[program],
        meetings:rows.map((item,i)=>({
          meetingNo:i+1,
          id:item.id,
          title:item.title||`מפגש ${i+1}`,
          blank:!!item.__v2228Blank
        }))
      };
    }
    return out;
  }

  function apply(){
    ensureProgram(DRAW);
    ensureProgram(PUPPET);
    ensureProgram(LITTLE);
    ensureProgram(MUSIC);
    installFilter();
    window.StoryOSProgramStructure=structure();
    try{if(typeof window.render==='function')window.render()}catch(_){}
    return window.StoryOSProgramStructure;
  }

  function boot(){
    apply();
    setTimeout(apply,450);
    setTimeout(apply,1400);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSContentWindow={version:VERSION,meetingCount:MEETING_COUNT,contentLimits:CONTENT_LIMITS,apply,getStructure:()=>window.StoryOSProgramStructure||structure()};
})();
