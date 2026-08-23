# StoryOS V21 — מבנה נתונים מדויק: מפגשים + ילדים + קבצים

סטטוס: V21 Preview בלבד. אין שינוי ב־V20 ואין Merge ל־main.

## 1. העיקרון
המודול "כשהציור קם לתחייה" בנוי מארבע שכבות נפרדות:

1. **Program** — התוכנית השנתית של גן ערבה.
2. **Meeting** — מפגש יחיד מתוך 22 המפגשים.
3. **Child** — ילד קבוע ברשימת הגן.
4. **MeetingChildRecord** — החיבור בין ילד למפגש, ובתוכו ארבעת נכסי המדיה שלו.

כך ילד נשמר פעם אחת בלבד, מפגש נשמר פעם אחת בלבד, והקבצים מקושרים לשילוב המדויק של ילד + מפגש.

## 2. מזהים קבועים

- Program: `gan-arava-drawing-alive-2026-2027`
- Roster: `gan-arava-2026-2027`
- Meeting: `ga-da-2026-2027-s01` … `ga-da-2026-2027-s22`
- Child: `ga-child-001` … `ga-child-022`
- MeetingChildRecord לדוגמה: `ga-da-s01-ben`

המזהים אינם תלויים בשם התצוגה ולכן אפשר לתקן שם ילד בלי לשבור קישורים לקבצים.

## 3. מבנה מפגש

```json
{
  "id": "ga-da-2026-2027-s01",
  "sequence": 1,
  "slug": "session-01",
  "title": "ציור חופשי",
  "status": "ACTIVE",
  "plannedDate": null,
  "startTime": null,
  "endTime": null,
  "rosterId": "gan-arava-2026-2027",
  "mediaResolver": "FIREBASE_CHILD_ALIAS_V1",
  "notes": "פיילוט פעיל ומחובר למדיה"
}
```

### סטטוסים למפגש
- `PLANNED` — קיים בתוכנית אך טרם בוצע.
- `ACTIVE` — המפגש הפעיל כרגע.
- `COMPLETED` — הסתיים.
- `CANCELLED` — בוטל.

## 4. מבנה ילד

```json
{
  "id": "ga-child-001",
  "slug": "ben",
  "displayName": "בן",
  "sortOrder": 1,
  "active": true,
  "aliases": ["ben", "בן"],
  "privacy": {
    "publicDisplay": false,
    "displayMode": "FIRST_NAME_ONLY"
  }
}
```

`slug` הוא המפתח שבו ה־Firebase resolver משתמש כיום. `aliases` מאפשרים לזהות וריאציות קיימות בשמות הקבצים בלי לשנות את מזהה הילד.

## 5. ארבעת סוגי הקבצים לכל ילד בכל מפגש

| סוג | מזהה | API key | פורמטים |
|---|---|---|---|
| ציור מקורי | `BEFORE_IMAGE` | `before` | JPG / JPEG / PNG / WEBP |
| תמונת תוצאה | `AFTER_IMAGE` | `after` | JPG / JPEG / PNG / WEBP |
| וידאו | `VIDEO` | `video` | MP4 / WEBM / MOV |
| מודל תלת־ממד | `MODEL_3D` | `model` | GLB / GLTF |

## 6. החיבור המדויק: ילד + מפגש + קבצים

```json
{
  "id": "ga-da-s01-ben",
  "meetingId": "ga-da-2026-2027-s01",
  "childId": "ga-child-001",
  "childSlug": "ben",
  "status": "AUTO_DISCOVER",
  "assets": {
    "BEFORE_IMAGE": { "state": "DISCOVER", "objectPath": null },
    "AFTER_IMAGE": { "state": "DISCOVER", "objectPath": null },
    "VIDEO": { "state": "DISCOVER", "objectPath": null },
    "MODEL_3D": { "state": "DISCOVER", "objectPath": null }
  },
  "notes": null
}
```

### מצב קובץ
- `DISCOVER` — המערכת צריכה לאתר את הקובץ ב־Firebase לפי aliases.
- `READY` — נמצא objectPath קבוע ומאומת.
- `MISSING` — הקובץ עדיין חסר.
- `ERROR` — נמצא אך לא ניתן לטעינה.

## 7. כללי Firebase

- נשמר **objectPath** בלבד, לא Signed URL.
- Signed URL נוצר בזמן הצפייה בלבד.
- זמן תפוגה נוכחי: 600 שניות.
- אין לשמור Signed URL במסד נתונים או בקובץ JSON קבוע.
- מפגש 1 משתמש כרגע ב־`FIREBASE_CHILD_ALIAS_V1`.
- מפגשים 2–22 מוגדרים `NOT_CONNECTED` עד שיועלו אליהם קבצים.

## 8. שלושת קובצי הנתונים הקנוניים ב־Preview

- `preview-v21/data/gan-arava-program.json` — תוכנית + 22 מפגשים.
- `preview-v21/data/gan-arava-children.json` — רשימת 22 הילדים.
- `preview-v21/data/gan-arava-media-index.json` — חיבור ילד/מפגש/ארבעת הקבצים.

## 9. למה המבנה הזה נכון להמשך

הוא מאפשר להוסיף בהמשך בלי לשנות את היסודות:

- תאריך ושעת מפגש.
- נוכחות.
- מפעיל.
- הערות מפגש.
- דיווח ביצוע.
- משוב גננת.
- יותר מילד אחד בעל אותו שם.
- יותר מגן אחד.
- יותר מפעילות אחת.
- מעבר עתידי מ־JSON ל־Supabase בלי לשנות את המזהים העסקיים.

## 10. השלב הבא ב־V21

לאחר שמבנה הנתונים הזה קיים, מסך גן ערבה צריך לצרוך את הקבצים הקנוניים במקום להחזיק את רשימת הילדים והמפגשים בקוד. בורר המפגש יקבל את 22 המפגשים מ־`gan-arava-program.json`, ובחירת ילד תיטען מ־`gan-arava-children.json`.
