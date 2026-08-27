(() => {
  const VERSION='22.31.0';
  const XLSX_URL='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';

  const $=s=>document.querySelector(s);
  const toText=v=>{
    if(v==null)return '';
    if(Array.isArray(v))return v.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' | ');
    if(typeof v==='object')return JSON.stringify(v);
    return String(v);
  };
  const safeJson=v=>{try{return JSON.stringify(v)}catch(_){return String(v)}};
  const getStories=()=>{try{return Array.isArray(STORIES)?STORIES:[]}catch(_){return[]}};

  function loadXLSX(){
    if(window.XLSX)return Promise.resolve(window.XLSX);
    return new Promise((resolve,reject)=>{
      const existing=$('script[data-storyos-xlsx]');
      if(existing){
        existing.addEventListener('load',()=>resolve(window.XLSX),{once:true});
        existing.addEventListener('error',()=>reject(new Error('טעינת מנוע Excel נכשלה')),{once:true});
        return;
      }
      const s=document.createElement('script');
      s.src=XLSX_URL;s.async=true;s.dataset.storyosXlsx='1';
      s.onload=()=>window.XLSX?resolve(window.XLSX):reject(new Error('מנוע Excel לא זמין'));
      s.onerror=()=>reject(new Error('טעינת מנוע Excel נכשלה'));
      document.head.appendChild(s);
    });
  }

  function makeSheet(XLSX,rows,widths){
    const ws=XLSX.utils.json_to_sheet(rows.length?rows:[{'מידע':'אין נתונים'}]);
    ws['!autofilter']={ref:ws['!ref']||'A1:A1'};
    if(widths)ws['!cols']=widths.map(w=>({wch:w}));
    return ws;
  }

  function allItemsRows(items){
    return items.map((x,i)=>({
      'מספר שורה':i+1,
      'מסלול / פעילות':x.program||'',
      'מספר מפגש / פעילות':x.num??'',
      'מזהה':x.id||'',
      'שם / כותרת':x.title||'',
      'מחבר':x.author||'',
      'גיל':x.age||'',
      'משך':x.duration||'',
      'ציון':x.score??'',
      'קטגוריה':x.category||'',
      'נושאים / ערכים':toText(x.themes),
      'עונה / חג':x.season||'',
      'תקציר':x.summary||'',
      'מסר / מטרה':x.message||'',
      'בובות':toText(x.puppets),
      'ציוד / אביזרים':toText(x.props),
      'רגע WOW':x.wow||'',
      'שאלות':toText(x.questions),
      'התאמות / הכלה':toText(x.inclusion),
      'ציוד לאריזה':toText(x.packing),
      'קישור רכישה / מקור':x.purchase||'',
      'כריכה / תמונה':x.cover||'',
      'מקור כריכה':x.cover_source||'',
      'מצב ריק':x.__v2228Blank===true?'כן':'לא',
      'JSON מלא':safeJson(x)
    }));
  }

  function timelineRows(items){
    const rows=[];
    items.forEach(x=>(Array.isArray(x.timeline)?x.timeline:[]).forEach((t,i)=>rows.push({
      'מסלול':x.program||'', 'מספר מפגש':x.num??'', 'מזהה':x.id||'', 'שם':x.title||'',
      'שלב':i+1, 'זמן':t?.m||t?.time||'', 'כותרת שלב':t?.title||'', 'הנחיה / Cue':t?.cue||'', 'סוג':t?.type||'', 'JSON מלא':safeJson(t)
    })));
    return rows;
  }

  function listRows(items){
    const fields=[['themes','נושאים / ערכים'],['puppets','בובות'],['props','ציוד / אביזרים'],['questions','שאלות'],['inclusion','התאמות / הכלה'],['packing','ציוד לאריזה']];
    const rows=[];
    items.forEach(x=>fields.forEach(([key,label])=>{
      const arr=Array.isArray(x[key])?x[key]:[];
      arr.forEach((v,i)=>rows.push({'מסלול':x.program||'','מספר מפגש':x.num??'','מזהה':x.id||'','שם':x.title||'','סוג מידע':label,'מספר פריט':i+1,'תוכן':toText(v)}));
    }));
    return rows;
  }

  function rawFieldRows(items){
    const rows=[];
    items.forEach((x,i)=>Object.keys(x).sort().forEach(key=>rows.push({
      'מספר שורה':i+1,'מסלול':x.program||'','מספר מפגש':x.num??'','מזהה':x.id||'','שם':x.title||'',
      'שם שדה':key,'סוג נתון':Array.isArray(x[key])?'מערך':(x[key]===null?'null':typeof x[key]),'ערך מלא':toText(x[key])
    })));
    return rows;
  }

  function meetingRows(items){
    const rows=[];
    const structure=window.StoryOSProgramStructure;
    if(structure&&typeof structure==='object'){
      Object.values(structure).forEach(p=>(p?.meetings||[]).forEach(m=>rows.push({
        'מסלול':p.program||'', 'מספר מפגש':m.meetingNo??'', 'מזהה פעילות':m.id||m.activityId||'',
        'שם':m.title||'', 'ריק':m.blank?'כן':'לא', 'תוכן עד מפגש':p.contentThrough??'', 'סה״כ מפגשים':p.meetingCount??''
      })));
      return rows;
    }
    const programs=[...new Set(items.map(x=>x.program).filter(Boolean))];
    programs.forEach(program=>items.filter(x=>x.program===program).forEach((x,i)=>rows.push({'מסלול':program,'מספר מפגש':x.num??i+1,'מזהה פעילות':x.id||'','שם':x.title||'','ריק':x.__v2228Blank?'כן':'לא'})));
    return rows;
  }

  function storageRows(){
    const rows=[];
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i)||'';
        if(!/storyos|saba|garden|favorite|note|deck/i.test(key))continue;
        rows.push({'מפתח':key,'ערך':localStorage.getItem(key)||''});
      }
    }catch(_){}
    return rows;
  }

  async function exportExcel(){
    const btn=$('#v2231FullExcelBtn');
    const old=btn?.textContent||'';
    try{
      if(btn){btn.disabled=true;btn.textContent='⏳ מכין Excel מלא...'}
      const XLSX=await loadXLSX();
      const items=getStories();
      if(!items.length)throw new Error('לא נמצאו נתוני מערכת לייצוא');

      const wb=XLSX.utils.book_new();
      wb.Props={Title:'StoryOS - ייצוא מלא',Subject:'כל נתוני מערכת StoryOS',Author:'StoryOS · סבא שמעון',CreatedDate:new Date()};
      wb.Workbook={Views:[{RTL:true}]};

      const meta=[
        {'שדה':'גרסת ייצוא','ערך':VERSION},
        {'שדה':'תאריך ושעה','ערך':new Date().toLocaleString('he-IL')},
        {'שדה':'מספר פריטי מערכת','ערך':items.length},
        {'שדה':'מספר מסלולים','ערך':new Set(items.map(x=>x.program).filter(Boolean)).size},
        {'שדה':'מסלולים','ערך':[...new Set(items.map(x=>x.program).filter(Boolean))].join(' | ')},
        {'שדה':'הערה','ערך':'הגיליון JSON/שדות מלאים נועד לשמר גם שדות שלא קיבלו עמודה ייעודית.'}
      ];

      const sheets=[
        ['סיכום מערכת',meta,[24,90]],
        ['כל המידע',allItemsRows(items),[10,24,15,18,30,22,12,14,10,18,34,28,70,70,35,45,45,55,55,55,45,45,18,12,90]],
        ['22 מפגשים',meetingRows(items),[28,14,22,38,10,16,16]],
        ['ציר זמן',timelineRows(items),[26,13,18,30,9,14,32,75,18,90]],
        ['ציוד שאלות וערכים',listRows(items),[26,13,18,30,22,12,90]],
        ['כל השדות המלאים',rawFieldRows(items),[10,26,13,18,30,24,14,100]],
        ['אחסון מקומי',storageRows(),[38,110]]
      ];

      sheets.forEach(([name,rows,widths])=>XLSX.utils.book_append_sheet(wb,makeSheet(XLSX,rows,widths),name));

      const d=new Date();
      const stamp=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
      XLSX.writeFile(wb,`StoryOS_ייצוא_מלא_${stamp}.xlsx`,{compression:true});
    }catch(err){
      console.error('StoryOS full Excel export failed',err);
      alert('ייצוא Excel נכשל: '+(err?.message||err));
    }finally{
      if(btn){btn.disabled=false;btn.textContent=old||'📥 ייצוא Excel מלא'}
    }
  }

  function installButton(){
    if($('#v2231FullExcelBtn'))return;
    const actions=$('.head-actions');if(!actions)return;
    const b=document.createElement('button');
    b.id='v2231FullExcelBtn';b.type='button';b.className='btn good';b.textContent='📥 ייצוא Excel מלא';
    b.title='ייצוא כל נתוני StoryOS לקובץ Excel מלא עם מספר גיליונות';
    b.addEventListener('click',exportExcel);
    actions.appendChild(b);
  }

  function boot(){installButton();setTimeout(installButton,500);setTimeout(installButton,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.StoryOSFullExcelExport={version:VERSION,export:exportExcel};
})();
