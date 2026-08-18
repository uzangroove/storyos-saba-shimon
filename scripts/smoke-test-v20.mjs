import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('public/storyos.html','utf8');
const index = fs.readFileSync('public/index.html','utf8');
const viewer = fs.readFileSync('public/book-viewer.html','utf8');
const unified = fs.readFileSync('public/storyos-unified-controls.js','utf8');

function findArrayEnd(source, arrayStart){
  let depth=0, quote=null, escaped=false;
  for(let i=arrayStart;i<source.length;i++){
    const c=source[i];
    if(quote){
      if(escaped) escaped=false;
      else if(c==='\\') escaped=true;
      else if(c===quote) quote=null;
      continue;
    }
    if(c==='"'||c==="'"||c==='`'){ quote=c; continue; }
    if(c==='[') depth++;
    if(c===']' && --depth===0) return i;
  }
  throw new Error('STORIES array end not found');
}

function extractStories(){
  const marker='const STORIES = [';
  const start=html.indexOf(marker);
  if(start<0) throw new Error('STORIES marker missing');
  const arrayStart=start+marker.length-1;
  const end=findArrayEnd(html,arrayStart);
  return JSON.parse(html.slice(arrayStart,end+1));
}

const stories=extractStories();
const programs=Object.fromEntries([...new Set(stories.map(x=>x.program))].sort().map(p=>[p,stories.filter(x=>x.program===p).length]));
const ids=stories.map(x=>x.id);
const duplicateIds=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
const checks=[];
const check=(name,pass,detail='')=>checks.push({name,pass:Boolean(pass),detail});

check('Version marker v20', html.includes('גרסה 20') && index.includes('גרסה 20'));
check('88 core items', stories.length===88, `found ${stories.length}`);
check('5 programs', Object.keys(programs).length===5, JSON.stringify(programs));
check('Expected program counts', JSON.stringify(programs)===JSON.stringify({
  'כשהציור קם לתחייה':22,
  'עולם קטן, קסם גדול':9,
  'שיר נולד בגן':22,
  'שעת סיפור והמחשה':30,
  'תיאטרון בובות':5
}), JSON.stringify(programs));
check('No duplicate IDs', duplicateIds.length===0, duplicateIds.join(','));
check('music01..music22 present', Array.from({length:22},(_,i)=>`music${String(i+1).padStart(2,'0')}`).every(id=>ids.includes(id)));
check('Five activity tiles', (html.match(/class="activity-tile"/g)||[]).length===5);
check('Music activity tile', html.includes('data-program="שיר נולד בגן"'));

check('Unified controls script loaded', index.includes('/storyos-unified-controls.js?v=20.1.0'));
check('Unified controls panel exists in script', unified.includes("aside.id = 'v20UnifiedControls'"));
check('Approved search field', unified.includes("search: $('#search')") && unified.includes("field('חיפוש חופשי'"));
check('Approved program field', unified.includes("program: $('#program')") && unified.includes("field('סוג פעילות'"));
check('Approved age field', unified.includes("age: $('#ageFilter')") && unified.includes("field('גיל הילדים'"));
check('Approved theme field', unified.includes("theme: $('#theme')") && unified.includes("field('נושא / ערך'"));
check('Approved season field', unified.includes("season: $('#season')") && unified.includes("field('עונה / חג'"));
check('Approved group size field', unified.includes("count: $('#pCount')") && unified.includes("field('מספר ילדים'"));
check('Approved setting field', unified.includes("setting: $('#pSetting')") && unified.includes("field('סוג מסגרת'"));
check('Old planner hidden', unified.includes("#todayPlanner{display:none!important}"));
check('Old category removed from visible controls', !unified.includes("field('קטגור"));
check('Old attention removed from visible controls', !unified.includes("field('רמת קשב"));
check('Desktop right sidebar layout', unified.includes('grid-template-columns:minmax(0,1fr) 390px'));
check('Responsive single-column layout', unified.includes('@media(max-width:1180px)'));
check('Unified clear action exists', unified.includes("clearBtn.textContent = 'נקה הכל'"));
check('Unified show-results action exists', unified.includes("showBtn.textContent = 'הצג פעילויות מתאימות'"));
check('Group size and setting affect relevance order', unified.includes('window.sizeBonus') && unified.includes('window.settingBonus'));

check('Favorites persistence', html.includes('story_favs') && html.includes('localStorage.setItem("story_favs"'));
check('Live mode entry', html.includes('window.startLive'));
check('Timer exists', html.includes('id="timer"') && html.includes('function startTimer'));
check('PDF deck support', html.includes('application/pdf') && html.includes('DECK_DB_NAME'));
check('IndexedDB persistence', html.includes('indexedDB.open'));
check('Scanned book viewer entry', index.includes('/book-viewer.html?v=20.0.0'));
check('Scanned viewer IndexedDB', viewer.includes("const DB_NAME = 'storyos-scanned-books'") && viewer.includes('indexedDB.open'));
check('No runtime v20 adapter', !index.includes('storyos-v20-adapter.js'));
check('No old v19 enhancement runtime', !index.includes('storyos-enhancements.js'));
check('Main iframe points to v20.1 core', index.includes('/storyos.html?v=20.1.0'));
check('RTL main document', html.includes('<html lang="he" dir="rtl">'));
check('RTL scanned viewer', viewer.includes('<html lang="he" dir="rtl">'));

for(const [fileName,source] of [['storyos.html',html],['index.html',index],['book-viewer.html',viewer],['storyos-unified-controls.js',unified]]){
  let syntaxOk=true, syntaxError='';
  try{
    if(fileName.endsWith('.html')){
      const scripts=[...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
      scripts.forEach((code,i)=>new vm.Script(code,{filename:`${fileName}:inline-${i+1}`}));
    } else {
      new vm.Script(source,{filename:fileName});
    }
  } catch(err){ syntaxOk=false; syntaxError=err.message; }
  check(`${fileName} JS syntax`,syntaxOk,syntaxError);
}

const missingAssets=[];
for(const s of stories){
  if(typeof s.cover==='string' && s.cover.startsWith('/')){
    const path='public'+s.cover;
    if(!fs.existsSync(path)) missingAssets.push(path);
  }
}
check('All referenced story cover assets exist', missingAssets.length===0, missingAssets.join(','));
check('Main logo asset exists', fs.existsSync('public/story-assets/image-443bfe2d4996.png'));

const failed=checks.filter(x=>!x.pass);
const report={
  version:'20.1',
  generatedAt:new Date().toISOString(),
  summary:{total:checks.length,passed:checks.length-failed.length,failed:failed.length,pass:failed.length===0},
  core:{items:stories.length,programs,duplicateIds},
  ui:{visibleFields:['חיפוש חופשי','סוג פעילות','גיל הילדים','נושא / ערך','עונה / חג','מספר ילדים','סוג מסגרת']},
  checks
};
fs.writeFileSync('public/storyos-v20-smoke-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
if(failed.length){
  for(const f of failed) console.error(`FAIL: ${f.name}${f.detail?` — ${f.detail}`:''}`);
  process.exit(1);
}
