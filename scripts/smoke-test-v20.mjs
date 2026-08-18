import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('public/storyos.html','utf8');
const index = fs.readFileSync('public/index.html','utf8');
const viewer = fs.readFileSync('public/book-viewer.html','utf8');

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
check('Music planner option', html.includes('<option value="שיר נולד בגן">שיר נולד בגן – מוזיקה</option>'));
check('Planner program is used', html.includes('program: $("#pProgram").value') && /vals\.program/.test(html));
check('Search control exists', html.includes('id="search"'));
check('Program filter exists', html.includes('id="program"'));
check('Theme filter exists', html.includes('id="theme"'));
check('Season filter exists', html.includes('id="season"'));
check('Age filter exists', html.includes('id="ageFilter"'));
check('Category filter exists', html.includes('id="category"'));
check('Favorites persistence', html.includes('story_favs') && html.includes('localStorage.setItem("story_favs"'));
check('Live mode entry', html.includes('window.startLive'));
check('Timer exists', html.includes('id="timer"') && html.includes('function startTimer'));
check('PDF deck support', html.includes('application/pdf') && html.includes('DECK_DB_NAME'));
check('IndexedDB persistence', html.includes('indexedDB.open'));
check('Scanned book viewer entry', index.includes('/book-viewer.html?v=20.0.0'));
check('Scanned viewer IndexedDB', viewer.includes("const DB_NAME = 'storyos-scanned-books'") && viewer.includes('indexedDB.open'));
check('No runtime v20 adapter', !index.includes('storyos-v20-adapter.js'));
check('No old v19 enhancement runtime', !index.includes('storyos-enhancements.js'));
check('Main iframe points to v20 core', index.includes('/storyos.html?v=20.0.0'));
check('RTL main document', html.includes('<html lang="he" dir="rtl">'));
check('RTL scanned viewer', viewer.includes('<html lang="he" dir="rtl">'));

// Parse every inline script for JavaScript syntax errors.
for(const [fileName,source] of [['storyos.html',html],['index.html',index],['book-viewer.html',viewer]]){
  const scripts=[...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(m=>m[1]).filter(Boolean);
  let syntaxOk=true, syntaxError='';
  try{ scripts.forEach((code,i)=>new vm.Script(code,{filename:`${fileName}:inline-${i+1}`})); }
  catch(err){ syntaxOk=false; syntaxError=err.message; }
  check(`${fileName} inline JS syntax`,syntaxOk,syntaxError);
}

// All required local assets referenced by core story covers must exist.
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
  version:20,
  generatedAt:new Date().toISOString(),
  summary:{total:checks.length,passed:checks.length-failed.length,failed:failed.length,pass:failed.length===0},
  core:{items:stories.length,programs,duplicateIds},
  checks
};
fs.writeFileSync('public/storyos-v20-smoke-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
if(failed.length){
  for(const f of failed) console.error(`FAIL: ${f.name}${f.detail?` — ${f.detail}`:''}`);
  process.exit(1);
}
