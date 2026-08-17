(() => {
  const frame = document.getElementById('storyosFrame');
  const scannedBtn = document.getElementById('scannedBookViewerBtn');
  const PROGRAM = 'שיר נולד בגן';

  const ACTIVITY_GRAPHICS = [
    { program: 'שעת סיפור והמחשה', src: '/activity-buttons/story-illustrated.png', alt: 'שעת סיפור בהמחשה' },
    { program: 'כשהציור קם לתחייה', src: '/activity-buttons/drawing-comes-alive.png', alt: 'כשהציור קם לתחייה' },
    { program: 'תיאטרון בובות', src: '/activity-buttons/puppet-theater.png', alt: 'תיאטרון בובות אינטימי לגן' },
    { program: 'עולם קטן, קסם גדול', src: '/activity-buttons/small-world-big-magic.png', alt: 'עולם קטן, קסם גדול' },
    { program: PROGRAM, src: '/activity-buttons/song-is-born.png', alt: 'שיר נולד בגן' }
  ];

  const MUSIC_MEETINGS = [
    ['שלום, אנחנו הלהקה של הגן','ספטמבר','היכרות · שמות · קצב','יצירת תחושת שייכות, היכרות עם כלי ההקשה ובניית טקס פתיחה מוזיקלי קבוע.','ג׳ינגל פתיחה של הגן'],
    ['שיר הגן שלנו','ספטמבר','שייכות · קבוצה · זהות','הילדים מספרים מה מיוחד בגן, מה הם אוהבים לעשות ומה מאפיין את הקבוצה.','שיר הגן שלנו'],
    ['מתחילים שנה חדשה','ספטמבר / תשרי','התחלות · רצונות · ציפיות','אוספים משפטים של הילדים על השנה החדשה ולומדים להבחין בין בית לפזמון.','טיוטת שיר שנה חדשה'],
    ['שנה מתוקה','ראש השנה','חריזה · חג · דימויים','המצאת חרוזים ומשפטי חג, בניית פזמון קליט והוספת מקצב בשייקרים.','שיר שנה מתוקה'],
    ['הסוכה שלנו שרה','סוכות','צבעים · טבע · אירוח','הילדים מתארים את הסוכה, הקישוטים והאורחים והופכים את התיאורים לשיר.','שיר הסוכה שלנו'],
    ['חבר שלי','אוקטובר','חברות · הקשבה · אמפתיה','מה עושה חבר טוב, איך עוזרים ואיך מקשיבים? אוספים מילים ורעיונות לשיר חברות.','מילים לשיר חברות'],
    ['ביחד זה יותר כיף','אוקטובר–נובמבר','חברות · עבודת צוות · שאלה ותשובה','בניית שיר במבנה שאלה–תשובה: סבא שמעון שר משפט והילדים עונים בפזמון.','שיר ביחד זה יותר כיף'],
    ['הסתיו הגיע','נובמבר','סתיו · טבע · צלילים','קולות רוח ועלים, מקצבי טבע ומילים עונתיות הופכים לשיר סתיו.','שיר הסתיו הגיע'],
    ['גשם, גשם, מה אתה אומר?','נובמבר–דצמבר','גשם · אונומטופיאה · קצב','יוצרים תזמורת גשם באמצעות טיפ־טיפ, פששש, מחיאות וכלי הקשה.','קטע קצבי מוקלט'],
    ['שיר הגשם','דצמבר','חורף · קצב · מבנה שיר','מחברים את תזמורת הגשם מהמפגש הקודם לבית ופזמון ומקליטים.','שיר הגשם'],
    ['אור קטן','חנוכה','אור · רגש · דינמיקה','מה עושה לנו אור בלב? מתנסים בחזק/שקט, איטי/מהיר ובונים פזמון לחג.','פזמון חנוכה'],
    ['מאירים את הגן','חנוכה','חג · שירה · הקלטה','חזרה על הפזמון, הוספת כלי הקשה והקלטת גרסת הגן.','שיר מאירים את הגן'],
    ['ספר הופך לשיר','ינואר','סיפור · דמויות · רעיון מרכזי','בוחרים ספר ילדים קצר, משוחחים על הנושא והדמויות ויוצרים מילים מקוריות בהשראה.','מבנה לשיר בהשראת ספר'],
    ['שרים את הסיפור','ינואר–פברואר','סיפור · מוזיקה · יצירה','הופכים את הרעיונות מהספר לשיר חדש של הקבוצה – בלי להעתיק את הטקסט המקורי.','שיר בהשראת סיפור'],
    ['איזה מצחיק!','אדר / פורים','הומור · קולות · תחפושות','ממציאים דמויות, חרוזים וקולות מצחיקים ובונים שיר הומוריסטי.','טיוטת שיר פורים'],
    ['אם הייתי...','פורים','דמיון · פנטזיה · זהות','הילדים משלימים: אם הייתי חיה, גיבור, ענן או כלי נגינה – והמשפטים הופכים לשיר.','שיר אם הייתי'],
    ['האביב מתעורר','מרץ–אפריל','אביב · צבע · טבע · תנועה','מילים המתארות פריחה, צבעים וצלילים מתחברות למקצב קליל ולשיר אביב.','שיר האביב הגיע'],
    ['שיר של חירות','פסח','חופש · בחירה · רגש','מה זה חופש בשבילי? הילדים מציעים רעיונות, תנועה ומשפטים לשיר.','שיר חופש'],
    ['המקום שלנו','אפריל–מאי','בית · גן · קהילה · שייכות','הילדים מתארים את הבית, הגן, הרחוב והמקום שהם אוהבים והופכים אותם לשיר.','שיר המקום שלנו'],
    ['אני חולם','מאי','חלומות · דמיון · המצאה','מה הייתי רוצה להיות, לאן הייתי רוצה לעוף ומה הייתי ממציא? אין תשובה נכונה.','שיר אני חולם'],
    ['השנה שלנו','מאי–יוני','זיכרונות · סיכום · שייכות','נזכרים בחברים, חגים, טיולים ורגעים מצחיקים ובונים יחד שיר סיום.','כתיבת שיר סיום'],
    ['הגן שלנו שר','יוני','סיום שנה · חגיגה · אלבום','שרים משירי השנה, מקליטים את שיר הסיום ובוחרים קטעים לאלבום הדיגיטלי.','שיר סיום + אלבום שירי הגן']
  ];

  function musicItems() {
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
    return MUSIC_MEETINGS.map((m,i) => ({
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
  }

  function ensureStyle(doc) {
    if (doc.getElementById('storyOSEnhancementStyles')) return;
    const style = doc.createElement('style');
    style.id = 'storyOSEnhancementStyles';
    style.textContent = `
      @media(min-width:1001px){.activity-tiles{grid-template-columns:repeat(5,1fr)!important}}
      .activity-tile.activity-graphic{
        position:relative!important;
        overflow:hidden!important;
        padding:0!important;
      }
      .activity-tile.activity-graphic .activity-icon{
        position:absolute!important;
        inset:8px!important;
        width:auto!important;
        height:auto!important;
        margin:0!important;
        padding:0!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        border-radius:18px!important;
        background:transparent!important;
        overflow:hidden!important;
      }
      .activity-tile.activity-graphic .activity-icon img{
        display:block!important;
        width:100%!important;
        height:100%!important;
        max-width:100%!important;
        max-height:100%!important;
        object-fit:contain!important;
        object-position:center center!important;
      }
      .activity-tile.activity-graphic > strong,
      .activity-tile.activity-graphic > small{display:none!important}
    `;
    doc.head.appendChild(style);
  }

  function ensureMusicProgram() {
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    if (!win || !doc) return;

    if (!win.__storyOSMusicProgramAdded) {
      try {
        const items = musicItems();
        win.eval('STORIES.push(...'+JSON.stringify(items)+');');
        win.__storyOSMusicProgramAdded = true;
      } catch (err) {
        console.error('Story OS music data injection failed', err);
      }
    }

    const tiles = doc.querySelector('.activity-tiles');
    if (tiles && !doc.getElementById('musicProgramTile')) {
      const tile = doc.createElement('button');
      tile.id = 'musicProgramTile';
      tile.className = 'activity-tile music-program';
      tile.dataset.program = PROGRAM;
      tile.innerHTML = '<span class="activity-icon" aria-hidden="true">🎵</span><strong>שיר נולד בגן</strong><small>22 מפגשים: מרעיון ומילים ועד לחן, הקלטה ואלבום</small>';
      tile.addEventListener('click', () => win.eval('showProgram('+JSON.stringify(PROGRAM)+')'));
      tiles.appendChild(tile);
    }

    const addOption = (selectId,label) => {
      const sel = doc.getElementById(selectId);
      if (sel && !Array.from(sel.options).some(o => o.value === PROGRAM)) {
        const opt = doc.createElement('option');
        opt.value = PROGRAM;
        opt.textContent = label;
        sel.appendChild(opt);
      }
    };
    addOption('pProgram','שיר נולד בגן – מוזיקה');
    addOption('program','שיר נולד בגן');

    const brandMeta = doc.querySelector('.brand p');
    if (brandMeta) brandMeta.textContent = 'מערכת הפעלה לסל תרבות · גיל הרך · גרסה 17 · חמישה מסלולי פעילות';
    const dashboardText = doc.querySelector('#dashboard .section-title p');
    if (dashboardText) dashboardText.textContent = 'שעת סיפור, ציור קם לתחייה, תיאטרון בובות, עולם קטן קסם גדול ושיר נולד בגן — הכול במקום אחד.';
    const statBlocks = doc.querySelectorAll('#dashboard .stats div');
    if (statBlocks[2]) {
      const b = statBlocks[2].querySelector('b');
      const s = statBlocks[2].querySelector('span');
      if (b) b.textContent = '5';
      if (s) s.textContent = 'מסלולי פעילות';
    }
  }

  function applyActivityGraphics() {
    const doc = frame.contentDocument;
    if (!doc) return;
    const container = doc.querySelector('.activity-tiles');
    if (!container) return;

    const orderedTiles = [];
    ACTIVITY_GRAPHICS.forEach(cfg => {
      const tile = container.querySelector(`.activity-tile[data-program="${cfg.program}"]`);
      if (!tile) return;
      orderedTiles.push(tile);
      tile.classList.add('activity-graphic');
      const icon = tile.querySelector('.activity-icon');
      if (icon) {
        icon.innerHTML = '';
        const img = doc.createElement('img');
        img.src = cfg.src;
        img.alt = cfg.alt;
        img.draggable = false;
        icon.appendChild(img);
      }
    });
    orderedTiles.forEach(tile => container.appendChild(tile));
  }

  function applyHomeLayout() {
    const doc = frame.contentDocument;
    if (!doc) return;

    ensureStyle(doc);
    ensureMusicProgram();
    applyActivityGraphics();

    const hero = doc.querySelector('.hero-banner');
    if (hero) hero.remove();

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
      else brandCopy.prepend(slogan);
    }

    const main = doc.querySelector('main');
    if (main) main.style.paddingTop = '14px';
    const hub = doc.getElementById('activityHub');
    if (hub) hub.style.marginTop = '0';

    const homeBtn = doc.getElementById('homeBtn');
    if (homeBtn && !homeBtn.dataset.layoutHooked) {
      homeBtn.dataset.layoutHooked = '1';
      homeBtn.addEventListener('click', () => {
        setTimeout(applyHomeLayout, 0);
        setTimeout(applyHomeLayout, 100);
      });
    }

    try { frame.contentWindow.eval('render();'); } catch (_) {}
  }

  if (scannedBtn) {
    scannedBtn.addEventListener('click', () => {
      window.location.href = '/book-viewer.html?v=20260817-1609';
    });
  }

  frame.addEventListener('load', () => {
    applyHomeLayout();
    setTimeout(applyHomeLayout, 80);
    setTimeout(applyHomeLayout, 350);
  });
})();
