import { readFile, writeFile } from "node:fs/promises";

const files = ["public/storyos.html", "public/index.html"];
const sharedAttention = {
  green: "הקבוצה קשובה ומעורבת: ממשיכים ברצף המלא ומשאירים זמן לבחירות, שאלות ותגובות של הילדים.",
  yellow: "הקשב יורד: מקצרים הסבר, עוברים לפעולה ברורה עם חפץ, תנועה או בובה, ואז חוזרים לרצף.",
  red: "יש עומס או אי־שקט: עוצרים, מורידים גירויים, נותנים משימה קבוצתית קצרה וברורה ומחליטים אם להמשיך או לסיים בטקס קבוע."
};
const sharedInclusion = [
  "אפשר להשתתף בדיבור, בהצבעה, בתנועה או בצפייה בלבד — אין חובה להופיע מול הקבוצה.",
  "מציגים מראש את סדר הפעילות ומתריעים לפני שינוי בתאורה, במוזיקה או ברקע.",
  "משתמשים במשפטים קצרים ובבחירה בין שתי אפשרויות לילדים הזקוקים לתמיכה בשפה.",
  "מתאמים מראש עם צוות המסגרת התאמות נקודתיות לקבוצה."
];

const newPrograms = [
  {
    id: "art01", num: 40, title: "כשהציור קם לתחייה", author: "סבא שמעון",
    age: "3–6", duration: "2 מפגשים · 45–60 דקות", score: 98,
    themes: ["ציור", "דמיון", "סיפור", "תלת־ממד", "טכנולוגיה יצירתית"],
    season: "כל השנה",
    summary: "תוכנית יצירה בשני מפגשים: הילדים מציירים דמות מקורית, מעניקים לה שם וסיפור, ובמפגש הבא פוגשים אותה מחדש כדמות תלת־ממדית מונפשת על המסך.",
    message: "היצירה המקורית של הילד נשארת במרכז, והטכנולוגיה מרחיבה אותה לעולם חדש של תנועה וסיפור.",
    puppets: ["דמויות שיצרו הילדים", "מוריס העכבר – מנחה אורח אופציונלי"],
    props: ["דפי ציור", "טושים וצבעים", "טלפון או מצלמה לתיעוד", "מחשב ומקרן", "רמקול", "מדפסת תלת־ממד – אופציונלי"],
    wow: "הציור המקורי מופיע על המסך כדמות תלת־ממדית שזזה ומצטרפת לסיפור שהקבוצה יוצרת.",
    questions: ["איך קוראים לדמות שלכם?", "איך היא זזה ומה היא אוהבת לעשות?", "איפה היא גרה ומה קורה לה בסיפור?"],
    purchase: "",
    timeline: [
      {m:"מפגש 1 · 0–8", title:"פתיחת עולם הדמויות", cue:"מציגים דוגמה מקורית ומזמינים כל ילד לדמיין דמות משלו.", type:"פתיחה"},
      {m:"8–30", title:"מציירים דמות", cue:"כל ילד מצייר בקצב שלו; מסייעים בשם, תכונה או פרט אחד בלי לשנות את הרעיון המקורי.", type:"יצירה"},
      {m:"30–42", title:"הדמות מספרת", cue:"משתפים בקבוצות קטנות: שם, תנועה, קול ומקום מגורים. מתעדים את הציורים באור אחיד.", type:"סיפור"},
      {m:"42–45", title:"הבטחה למפגש הבא", cue:"מסבירים שהציורים יעברו עיבוד ויחזרו כדמויות מונפשות.", type:"סיום"},
      {m:"בין המפגשים", title:"עיבוד דיגיטלי", cue:"שומרים את המקור, יוצרים מודל או הנפשה ומארגנים את הקבצים לפי שמות הילדים.", type:"הכנה"},
      {m:"מפגש 2 · 0–12", title:"רגע החשיפה", cue:"מציגים ציור לצד הדמות המונפשת ומאפשרים לילד לזהות ולהציג אותה.", type:"WOW"},
      {m:"12–40", title:"בונים סיפור משותף", cue:"מחברים כמה דמויות לעלילה קצרה עם מקום, בעיה ופתרון שהילדים בוחרים.", type:"השתתפות"},
      {m:"40–55", title:"גלריה ותנועה", cue:"צופים בדמויות, מחקים את התנועות וחוגגים את ההבדלים בין היצירות.", type:"גלריה"},
      {m:"55–60", title:"סיכום ושמירה", cue:"שומרים ציור, מודל וסרטון; מזכירים שכל תוצאה התחילה ברעיון של ילד.", type:"סיום"}
    ],
    attention: sharedAttention, inclusion: sharedInclusion,
    packing: ["דפי ציור", "טושים וצבעים", "מדבקות שם", "טלפון/מצלמה טעונים", "חצובה קטנה", "מחשב", "מקרן ומתאמים", "רמקול", "תיקיות דיגיטליות לפי שמות"],
    cover: "", cover_source: "placeholder", category: "יצירה וטכנולוגיה", program: "כשהציור קם לתחייה"
  },
  {
    id: "puppet01", num: 41, title: "תיאטרון בובות – סיפורי ילדים קמים לתחייה", author: "סבא שמעון",
    age: "3–6", duration: "30–45 דקות", score: 98,
    themes: ["תיאטרון בובות", "דמיון", "השתתפות", "סיפור", "תקשורת"],
    season: "כל השנה · מותאם לעונה ולחגים",
    summary: "מופע חי, צבעוני ומשתף בתיאטרון בובות נייד. בובות יד, מוזיקה, אפקטים ורקעים חזותיים מעירים סיפור חדש לחיים ומזמינים את הילדים להשפיע על המתרחש.",
    message: "הילדים אינם רק קהל: הם שותפים פעילים שעוזרים לדמויות, מקבלים החלטות ומניעים את העלילה.",
    puppets: ["מוריס העכבר", "בובות יד מתחלפות לפי הסיפור", "דמות הפתעה"],
    props: ["תיאטרון בובות מתקפל", "רקעים מתחלפים", "מערכת שמע", "מוזיקה ואפקטים", "אביזרי עלילה גדולים ובטיחותיים"],
    wow: "דמות הפתעה יוצאת מן הבמה, פונה לקהל ומבקשת מהילדים פעולה משותפת שמשנה את המשך הסיפור.",
    questions: ["מה כדאי לדמות לעשות עכשיו?", "איזה קול יעזור לה?", "מי יכול לתת לה רעיון לפתרון?"],
    purchase: "",
    timeline: [
      {m:"0–5", title:"הבמה מתעוררת", cue:"מוזיקת פתיחה, שלום קצר ובובה ראשונה שמגלה את הקהל.", type:"פתיחה"},
      {m:"5–10", title:"הבעיה מגיעה", cue:"הדמות מציגה צורך פשוט וברור ומבקשת מן הילדים עזרה.", type:"בובה"},
      {m:"10–18", title:"הקהל בוחר", cue:"נותנים שתי אפשרויות, משלבים קול או תנועה וממשיכים לפי בחירת הקבוצה.", type:"השתתפות"},
      {m:"18–27", title:"הסיפור מסתבך", cue:"רקע או אפקט משתנים, דמות נוספת מצטרפת ונוצר אתגר חדש.", type:"סיפור"},
      {m:"27–33", title:"רגע ההפתעה", cue:"דמות יוצאת מן הבמה והקבוצה מבצעת יחד פעולה שמקדמת את הפתרון.", type:"WOW"},
      {m:"33–40", title:"פותרים יחד", cue:"הדמויות מיישמות את רעיונות הילדים ומגיעות לפתרון שמחובר למסר.", type:"פתרון"},
      {m:"40–45", title:"השתחוויה ופרידה", cue:"משפט סיכום קצר, מחיאת כף משותפת ופרידה מכל הדמויות.", type:"סיום"}
    ],
    attention: sharedAttention, inclusion: sharedInclusion,
    packing: ["תיאטרון בובות מתקפל", "בובות לפי הסיפור", "דמות הפתעה", "רקעים", "אביזרי עלילה", "רמקול טעון", "טלפון/מחשב", "כבלים ומתאמים", "כרטיס הפעלה"],
    cover: "", cover_source: "placeholder", category: "מופע משתף", program: "תיאטרון בובות"
  }
];

const hubCss = `
/* ===== V13: four activity entrances + image placeholders ===== */
.activity-hub{margin:0 0 18px}
.activity-hub-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:12px}
.activity-hub-head h2{margin:0;font-size:1.45rem}.activity-hub-head p{margin:4px 0 0;color:var(--muted)}
.activity-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.activity-tile{min-height:178px;border:1px solid var(--line);border-radius:24px;padding:18px;text-align:right;color:var(--ink);background:var(--paper);box-shadow:var(--shadow);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.activity-tile:hover,.activity-tile:focus-visible{transform:translateY(-4px);box-shadow:0 16px 35px rgba(49,42,78,.14);border-color:#b9aaf8;outline:none}
.activity-tile.active{border:2px solid var(--primary2);background:linear-gradient(150deg,#fff,#f1edff)}
.activity-tile .activity-icon{display:grid;place-items:center;width:68px;height:68px;border-radius:20px;font-size:2.15rem;margin-bottom:14px;background:#f1edff}
.activity-tile:nth-child(2) .activity-icon{background:#e7f7ff}.activity-tile:nth-child(3) .activity-icon{background:#fff1dc}.activity-tile:nth-child(4) .activity-icon{background:#ffe8ed}
.activity-tile strong{display:block;font-size:1.18rem}.activity-tile small{display:block;color:var(--muted);margin-top:6px;line-height:1.45}
.image-placeholder{width:100%;height:100%;min-height:190px;border:2px dashed #cfc4df;border-radius:16px;background:linear-gradient(145deg,#fbf8ff,#fff9ed);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:7px;padding:16px;color:#5d5371}
.image-placeholder .placeholder-icon{font-size:3rem;line-height:1}.image-placeholder b{font-size:1rem}.image-placeholder small{color:var(--muted)}
.hero-main .image-placeholder{width:190px;max-width:38vw;height:250px;min-height:250px;flex:0 0 auto}
.audit-card .image-placeholder{height:180px;min-height:180px}.audit-card .image-placeholder .placeholder-icon{font-size:2.2rem}
@media (max-width:1000px){.activity-tiles{grid-template-columns:repeat(2,1fr)}}
@media (max-width:760px){.activity-hub-head{align-items:flex-start;flex-direction:column}.activity-tiles{grid-template-columns:1fr 1fr}.activity-tile{min-height:155px;padding:14px}.hero-main .image-placeholder{width:100%;max-width:none;height:290px}}
@media (max-width:480px){.activity-tiles{grid-template-columns:1fr}.activity-tile{min-height:132px}.activity-tile .activity-icon{width:58px;height:58px;font-size:1.8rem;margin-bottom:10px}}
`;

const hubMarkup = `
  <section id="activityHub" class="activity-hub" aria-labelledby="activityHubTitle">
    <div class="activity-hub-head">
      <div><h2 id="activityHubTitle">בוחרים סוג פעילות</h2><p>לחיצה פותחת מיד את כל התוכן המתאים במרכז ההפעלה.</p></div>
      <button class="btn" onclick="showProgram('')">כל הפעילויות</button>
    </div>
    <div class="activity-tiles">
      <button class="activity-tile" data-program="שעת סיפור והמחשה" onclick="showProgram('שעת סיפור והמחשה')"><span class="activity-icon" aria-hidden="true">📖</span><strong>שעת סיפור</strong><small>ספרים, המחשה ותסריטי הפעלה</small></button>
      <button class="activity-tile" data-program="כשהציור קם לתחייה" onclick="showProgram('כשהציור קם לתחייה')"><span class="activity-icon" aria-hidden="true">🎨</span><strong>ציור קם לתחייה</strong><small>יצירה שהופכת לדמות ולסיפור</small></button>
      <button class="activity-tile" data-program="עולם קטן, קסם גדול" onclick="showProgram('עולם קטן, קסם גדול')"><span class="activity-icon" aria-hidden="true">🧸</span><strong>סיפור פעוטות</strong><small>מפגשים קצרים לגילאי 6–24 חודשים</small></button>
      <button class="activity-tile" data-program="תיאטרון בובות" onclick="showProgram('תיאטרון בובות')"><span class="activity-icon" aria-hidden="true">🎭</span><strong>תיאטרון בובות</strong><small>מופע חי, נייד ומשתף</small></button>
    </div>
  </section>
`;

const helpers = `
function itemKind(story){
  if(story.program === "שעת סיפור והמחשה") return "סיפור";
  if(story.program === "עולם קטן, קסם גדול") return "פעילות פעוטות";
  return "תוכנית";
}
function activityEmoji(program){
  return ({"שעת סיפור והמחשה":"📖","כשהציור קם לתחייה":"🎨","עולם קטן, קסם גדול":"🧸","תיאטרון בובות":"🎭"})[program] || "✨";
}
function coverMarkup(story, className=""){
  if(story.cover) return '<img class="' + className + '" src="' + story.cover + '" alt="תמונה עבור ' + story.title + '">';
  return '<div class="image-placeholder ' + className + '" role="img" aria-label="פלייסהולדר לתמונה שתתווסף בהמשך"><span class="placeholder-icon" aria-hidden="true">' + activityEmoji(story.program) + '</span><b>תמונה תתווסף בהמשך</b><small>' + story.title + '</small></div>';
}
function imageDownloadAction(story, sizeClass=""){
  if(!story.cover) return "";
  const imageType = story.program === "שעת סיפור והמחשה" ? "כריכת הספר" : "פוסטר הפעילות";
  return '<a class="btn good ' + sizeClass + '" href="' + story.cover + '" download="' + safeImageFilename(imageType + ' - ' + story.title + '.png') + '" onclick="event.stopPropagation()">' + imageDownloadLabel(story) + '</a>';
}
function setActiveActivity(program){
  document.querySelectorAll(".activity-tile").forEach(tile => tile.classList.toggle("active", tile.dataset.program === program));
}
window.showProgram = program => {
  onlyFav = false;
  $("#program").value = program;
  setActiveActivity(program);
  dashboard.classList.remove("hidden");
  detail.classList.add("hidden");
  live.classList.add("hidden");
  audit.classList.add("hidden");
  render();
  dashboard.scrollIntoView({behavior:"smooth", block:"start"});
};
`;

function replaceRequired(html, from, to, label){
  if(!html.includes(from)) throw new Error("Missing " + label);
  return html.replace(from, to);
}

function upgrade(html){
  html = html.replace("<title>Story OS · סבא שמעון · גרסה 12</title>", "<title>Story OS · סבא שמעון · גרסה 13</title>");
  html = html.replace("גרסה 12 · ייצוא רשימת ספרים", "גרסה 13 · ארבעה מסלולי פעילות");
  html = html.replace('<button id="homeBtn">כל הסיפורים</button>', '<button id="homeBtn">מסך ראשי</button>');
  html = html.replace("כאן נמצאים הכרטיסים, מצב ההפעלה החיה, חלון מצגת הספר, חיפוש וסינון, ובדיקת כל 30 הכריכות.", "ארבעה מסלולי פעילות במקום אחד: שעת סיפור, ציור קם לתחייה, סיפור פעוטות ותיאטרון בובות — עם כרטיסי הפעלה ומצב חי.");
  html = html.replace('<span class="chip">30 ספרים</span>', '<span class="chip">41 תכנים</span>');
  html = html.replace('<span class="chip">מצב חי ל־45 דקות</span>', '<span class="chip">4 סוגי פעילות</span>');
  html = html.replace('<span class="chip">חלון מצגת לספר סרוק</span>', '<span class="chip">מצב הפעלה חי</span>');
  if(!html.includes("V13: four activity entrances")) html = html.replace("</style>", hubCss + "\n</style>");
  if(!html.includes('id="activityHub"')) html = html.replace('  <section id="todayPlanner"', hubMarkup + '\n  <section id="todayPlanner"');
  html = html.replace(
    '<option value="שעת סיפור והמחשה">שעת סיפור והמחשה</option>',
    '<option value="שעת סיפור והמחשה">שעת סיפור והמחשה</option>\n          <option value="כשהציור קם לתחייה">כשהציור קם לתחייה</option>\n          <option value="תיאטרון בובות">תיאטרון בובות</option>'
  );
  html = html.replace("שעת סיפור, סל תרבות ו״עולם קטן, קסם גדול״ לפעוטות – הכול במקום אחד.", "שעת סיפור, ציור קם לתחייה, סיפור פעוטות ותיאטרון בובות — הכול במקום אחד.");
  html = html.replace('<div><b id="count">39</b><span>פריטים מסוננים</span></div>', '<div><b id="count">41</b><span>פריטים מסוננים</span></div>');
  html = html.replace('<div><b>8–45</b><span>דקות למפגש</span></div>', '<div><b>8–60</b><span>דקות למפגש</span></div>');
  html = html.replace('<div><b>30+9</b><span>סיפורים + פעילויות פעוטות</span></div>', '<div><b>4</b><span>מסלולי פעילות</span></div>');

  const storiesStart = html.indexOf("const STORIES = ") + "const STORIES = ".length;
  const storiesEnd = html.indexOf(";\nconst APP_LOGO", storiesStart);
  if(storiesStart < "const STORIES = ".length || storiesEnd < 0) throw new Error("Could not locate STORIES");
  const stories = JSON.parse(html.slice(storiesStart, storiesEnd));
  for(const program of newPrograms){ if(!stories.some(item => item.id === program.id)) stories.push(program); }
  html = html.slice(0, storiesStart) + JSON.stringify(stories) + html.slice(storiesEnd);

  if(!html.includes("function itemKind(story)")) html = html.replace("function filtered(){", helpers + "\nfunction filtered(){");
  html = replaceRequired(html, '<div class="cover-wrap"><img class="cover-thumb" src="${s.cover}" alt="כריכת ${s.title}"></div>', '<div class="cover-wrap">${coverMarkup(s,"cover-thumb")}</div>', "card cover");
  html = replaceRequired(html, '${s.program === "עולם קטן, קסם גדול" ? "פעילות" : "סיפור"} ${s.num}', '${itemKind(s)} ${s.num}', "item kind");
  html = replaceRequired(html, '<a class="btn good small" href="${s.cover}" download="${safeImageFilename(`${s.program === "שעת סיפור והמחשה" ? "כריכת הספר" : "פוסטר הפעילות"} - ${s.title}.png`)}" onclick="event.stopPropagation()">${imageDownloadLabel(s)}</a>', '${imageDownloadAction(s,"small")}', "card image action");
  html = replaceRequired(html, '<img class="hero-cover" src="${current.cover}" alt="כריכת ${current.title}">', '${coverMarkup(current,"hero-cover")}', "detail cover");
  html = replaceRequired(html, '<a class="btn good" href="${current.cover}" download="${safeImageFilename(`${current.program === "שעת סיפור והמחשה" ? "כריכת הספר" : "פוסטר הפעילות"} - ${current.title}.png`)}">${imageDownloadLabel(current)}</a>', '${imageDownloadAction(current)}', "detail image action");
  html = html.replace('<img class="rec-cover" src="${r.s.cover}" alt="כריכת ${r.s.title}">', '${coverMarkup(r.s,"rec-cover")}');
  html = html.replace('$("#homeBtn").onclick = () => { onlyFav = false; goHome(); };', '$("#homeBtn").onclick = () => { onlyFav = false; $("#program").value = ""; setActiveActivity(""); goHome(); };');
  html = html.replace('$("#program").onchange = render;', '$("#program").onchange = () => { setActiveActivity($("#program").value); render(); };');
  return html;
}

for(const file of files){
  const html = await readFile(file, "utf8");
  await writeFile(file, upgrade(html), "utf8");
  console.log("Updated " + file);
}
