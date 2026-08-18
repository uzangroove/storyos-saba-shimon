(() => {
  const frame = document.getElementById('storyosFrame');
  const scannedBtn = document.getElementById('scannedBookViewerBtn');
  const PROGRAM = 'שיר נולד בגן';
  let musicData = null;

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

  async function loadMusicData() {
    if (musicData) return musicData;
    const response = await fetch('/storyos-v20-music-data.json?v=20.0.0', {cache:'no-store'});
    if (!response.ok) throw new Error('Failed loading StoryOS v20 music data');
    musicData = await response.json();
    return musicData;
  }

  function buildMusicItems(meetings) {
    return meetings.map((m,i) => ({
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
      attention:commonAttention,
      inclusion:commonInclusion,
      packing:['גיטרה אקוסטית','שייקרים','מרקסים','כלי הקשה','מחשב נייד טעון','סמארטפון טעון','מיקרופון דש','כבל/מטען','דף או לוח','כרטיס הפעלה למפגש '+(i+1)],
      cover:'', cover_source:'placeholder', category:'שיר נולד בגן · מפגש '+(i+1), program:PROGRAM
    }));
  }

  function addProgramOption(doc, selectId, label) {
    const sel = doc.getElementById(selectId);
    if (!sel || Array.from(sel.options).some(o => o.value === PROGRAM)) return;
    const opt = doc.createElement('option');
    opt.value = PROGRAM;
    opt.textContent = label;
    sel.appendChild(opt);
  }

  function ensureV20Style(doc) {
    if (doc.getElementById('storyOSV20Styles')) return;
    const style = doc.createElement('style');
    style.id = 'storyOSV20Styles';
    style.textContent = '@media(min-width:1001px){.activity-tiles{grid-template-columns:repeat(5,1fr)!important}} .activity-tile.music-program .activity-icon{background:#e9f8ea!important}';
    doc.head.appendChild(style);
  }

  function ensureMusicTile(win, doc) {
    const tiles = doc.querySelector('.activity-tiles');
    if (!tiles || doc.getElementById('musicProgramTile')) return;
    const tile = doc.createElement('button');
    tile.id = 'musicProgramTile';
    tile.className = 'activity-tile music-program';
    tile.dataset.program = PROGRAM;
    tile.innerHTML = '<span class="activity-icon" aria-hidden="true">🎵</span><strong>שיר נולד בגן</strong><small>22 מפגשים: מרעיון ומילים ועד לחן, הקלטה ואלבום</small>';
    tile.addEventListener('click', () => win.eval('showProgram('+JSON.stringify(PROGRAM)+')'));
    tiles.appendChild(tile);
  }

  async function applyV20() {
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    if (!win || !doc) return;

    const data = await loadMusicData();
    if (!win.__storyOSV20MusicAdded) {
      const items = buildMusicItems(data.meetings || []);
      win.eval('STORIES.push(...'+JSON.stringify(items)+');');
      win.__storyOSV20MusicAdded = true;
    }

    ensureV20Style(doc);
    ensureMusicTile(win, doc);
    addProgramOption(doc, 'pProgram', 'שיר נולד בגן – מוזיקה');
    addProgramOption(doc, 'program', 'שיר נולד בגן');

    const hero = doc.querySelector('.hero-banner');
    if (hero) hero.remove();

    const brandMeta = doc.querySelector('.brand p');
    if (brandMeta) brandMeta.textContent = 'מערכת הפעלה לסל תרבות · גיל הרך · גרסה 20 · חמישה מסלולי פעילות';

    const brandCopy = doc.querySelector('.brand > div');
    if (brandCopy && !doc.getElementById('storyosBrandSlogan')) {
      const slogan = doc.createElement('p');
      slogan.id = 'storyosBrandSlogan';
      slogan.textContent = 'סבא שמעון – חכמה של פעם, מצחיק ומלא ב‑AI';
      slogan.style.margin = '2px 0 0';
      slogan.style.color = 'var(--ink)';
      slogan.style.fontSize = '1rem';
      slogan.style.fontWeight = '700';
      slogan.style.lineHeight = '1.3';
      const title = brandCopy.querySelector('h1');
      if (title) title.insertAdjacentElement('afterend', slogan);
    }

    const dashboardText = doc.querySelector('#dashboard .section-title p');
    if (dashboardText) dashboardText.textContent = 'שעת סיפור, ציור קם לתחייה, תיאטרון בובות, עולם קטן קסם גדול ושיר נולד בגן — הכול במקום אחד.';

    const statBlocks = doc.querySelectorAll('#dashboard .stats div');
    if (statBlocks[2]) {
      const b = statBlocks[2].querySelector('b');
      if (b) b.textContent = '5';
    }

    const main = doc.querySelector('main');
    if (main) main.style.paddingTop = '14px';
    const hub = doc.getElementById('activityHub');
    if (hub) hub.style.marginTop = '0';

    try { win.eval('render();'); } catch (_) {}
  }

  if (scannedBtn) {
    scannedBtn.addEventListener('click', () => {
      window.location.href = '/book-viewer.html?v=20.0.0';
    });
  }

  frame.addEventListener('load', () => {
    applyV20().catch(err => console.error('StoryOS v20 adapter failed', err));
  });
})();
