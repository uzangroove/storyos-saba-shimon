import fs from 'node:fs';

const htmlPath = 'public/storyos.html';
const dataPath = 'public/storyos-v20-music-data.json';
let html = fs.readFileSync(htmlPath, 'utf8');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const PROGRAM = data.program;

const commonAttention = {
  green:'הקבוצה מעורבת: ממשיכים ביצירה, מאפשרים יותר הצעות, חזרות ואלתור.',
  yellow:'הקשב יורד: מקצרים את השיחה, עוברים מיד לקצב, מחיאות או נגינה משותפת.',
  red:'יש עומס: מפסיקים את ההקלטה, מצמצמים גירויים, עוברים לפזמון מוכר ומסיימים בטקס קצר.'
};
const commonInclusion = [
  'אין חובה לשיר סולו; אפשר להשתתף גם בקצב, מחיאת כף, זמזום, מילה או הצבעה.',
  'ילדים ביישנים יכולים להשתתף כחלק מהקבוצה ללא חשיפה אישית.',
  'לרגישות לרעש: מפחיתים עוצמה ומספר כלי הקשה ומאפשרים צפייה בלבד.',
  'לקשיי שפה: מציעים בחירה בין שתי מילים, חזרה קולית ומשפטים קצרים.',
  'הצלחת המפגש נמדדת בשותפות ובחוויה, לא בביצוע מוזיקלי מקצועי.'
];

const musicItems = data.meetings.map((m,i) => ({
  id:'music'+String(i+1).padStart(2,'0'), num:i+1,
  title:'מפגש '+(i+1)+' · '+m[0], author:'סבא שמעון', age:'3–6', duration:'35–40 דקות', score:98,
  themes:m[2].split(' · '), season:m[1], summary:m[3],
  message:'הילדים אינם רק מבצעים שיר קיים – הם שותפים ביצירתו, מרעיון ומילים ועד קצב, לחן והקלטה.',
  puppets:['סבא שמעון','מוריס העכבר – אופציונלי'],
  props:['גיטרה אקוסטית','שייקרים ומרקסים','כלי הקשה פשוטים','מחשב נייד','סמארטפון','מיקרופון דש איכותי','דף/לוח לרישום רעיונות'],
  wow:m[4],
  questions:['איזו מילה או רעיון נוסיף לשיר?','איזה קצב מתאים למילים שלנו?','איך נרצה שהפזמון יישמע?'],
  purchase:'',
  timeline:[
    {m:'0–5',title:'פתיחה מוזיקלית',cue:'ג׳ינגל קבוע, שלום מוזיקלי וחימום קצבי.',type:'פתיחה'},
    {m:'5–10',title:'הנושא של היום',cue:m[3],type:'שיחה'},
    {m:'10–18',title:'מילים וחריזה',cue:'אוספים מילים, משפטים וחרוזים של הילדים ובונים פזמון פשוט.',type:'שפה'},
    {m:'18–25',title:'הלחנה חיה',cue:'מתאימים לחן ומהלך אקורדים קליט בעזרת הגיטרה וכלי העזר במחשב.',type:'הלחנה'},
    {m:'25–32',title:'קצב ושירה',cue:'הילדים מצטרפים בכלי הקשה, מחיאות, זמזום ושירת הפזמון.',type:'מוזיקה'},
    {m:'32–37',title:'חזרה קבוצתית',cue:'מחברים את חלקי השיר ומבצעים יחד ברצף.',type:'חזרה'},
    {m:'37–40',title:'הקלטה וסיום',cue:'מקליטים גרסת גן קצרה ומסיימים בטקס קבוע. תוצר: '+m[4]+'.',type:'הקלטה'}
  ],
  attention:commonAttention, inclusion:commonInclusion,
  packing:['גיטרה אקוסטית','שייקרים','מרקסים','כלי הקשה','מחשב נייד טעון','סמארטפון טעון','מיקרופון דש','כבל/מטען','דף או לוח','כרטיס הפעלה למפגש '+(i+1)],
  cover:'', cover_source:'placeholder', category:'שיר נולד בגן · מפגש '+(i+1), program:PROGRAM
}));

function findArrayEnd(source, arrayStart) {
  let depth = 0, quote = null, escaped = false;
  for (let i = arrayStart; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '[') depth++;
    if (c === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error('Could not find end of STORIES array');
}

const marker = 'const STORIES = [';
const start = html.indexOf(marker);
if (start < 0) throw new Error('STORIES marker not found');
const arrayStart = start + marker.length - 1;
const arrayEnd = findArrayEnd(html, arrayStart);
const currentArray = html.slice(arrayStart, arrayEnd + 1);
if (currentArray.includes('"id":"music01"')) {
  console.log('Music items already inlined; skipping data insertion.');
} else {
  const payload = JSON.stringify(musicItems).slice(1,-1);
  html = html.slice(0,arrayEnd) + ',' + payload + html.slice(arrayEnd);
}

html = html.replaceAll('גרסה 15', 'גרסה 20');
html = html.replace('ארבעה מסלולי פעילות', 'חמישה מסלולי פעילות');
html = html.replace('ארבעה מסלולי פעילות במקום אחד: שעת סיפור, ציור קם לתחייה, סיפור פעוטות ותיאטרון בובות', 'חמישה מסלולי פעילות במקום אחד: שעת סיפור, ציור קם לתחייה, סיפור פעוטות, תיאטרון בובות ושיר נולד בגן');
html = html.replace('<span class="chip">66 תכנים</span>', '<span class="chip">88 תכנים</span>');
html = html.replace('<span class="chip">4 סוגי פעילות</span>', '<span class="chip">5 סוגי פעילות</span>');
html = html.replace('.activity-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}', '.activity-tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}');

const puppetTile = '<button class="activity-tile" data-program="תיאטרון בובות" onclick="showProgram(\'תיאטרון בובות\')"><span class="activity-icon" aria-hidden="true">🎭</span><strong>תיאטרון בובות</strong><small>5 הצגות בובות מקוריות ומשתפות</small></button>';
const musicTile = '<button class="activity-tile" data-program="שיר נולד בגן" onclick="showProgram(\'שיר נולד בגן\')"><span class="activity-icon" aria-hidden="true">🎵</span><strong>שיר נולד בגן</strong><small>22 מפגשים: מרעיון ומילים ועד לחן, הקלטה ואלבום</small></button>';
if (!html.includes('data-program="שיר נולד בגן"')) html = html.replace(puppetTile, puppetTile + '\n      ' + musicTile);

const plannerPuppet = '<option value="תיאטרון בובות">תיאטרון בובות</option>';
if (!html.includes('<option value="שיר נולד בגן">')) html = html.replace(plannerPuppet, plannerPuppet + '\n          <option value="שיר נולד בגן">שיר נולד בגן – מוזיקה</option>');

html = html.replace('שעת סיפור, ציור קם לתחייה, סיפור פעוטות ותיאטרון בובות — הכול במקום אחד.', 'שעת סיפור, ציור קם לתחייה, סיפור פעוטות, תיאטרון בובות ושיר נולד בגן — הכול במקום אחד.');
html = html.replace('<div><b id="count">66</b><span>פריטים מסוננים</span></div>', '<div><b id="count">88</b><span>פריטים מסוננים</span></div>');
html = html.replace('<div><b>4</b><span>מסלולי פעילות</span></div>', '<div><b>5</b><span>מסלולי פעילות</span></div>');

// Preserve the latest UX decision: route cards are immediately visible, without the old hero banner.
html = html.replace(/\n\s*<section class="hero-banner">[\s\S]*?<\/section>\n/, '\n');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`StoryOS v20 core written: ${musicItems.length} music items inlined.`);
