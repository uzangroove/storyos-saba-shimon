# StoryOS V21 — Go-Live Checklist

מטרה: להגיע ל-Preview עובד ומאומת של מערכת הניהול עוד היום, בלי לפגוע ב-V20 היציב.

## A. ניתן להשלים ללא גישה לחשבונות
- [x] מודל נתונים PostgreSQL/Supabase
- [x] Seed מסגרות כרמיאל
- [x] Import API
- [x] Management UI
- [x] כרטיס מסגרת
- [x] Contract/Schedule model
- [x] Session generator
- [x] Persist Sessions API
- [x] Operator UI
- [x] Login/Auth scaffolding
- [x] Attendance check-in/out API
- [x] MASTER specification
- [x] Go-live checklist

## B. בדיקות קוד לפני Preview
- [ ] Build מלא
- [ ] TypeScript
- [ ] בדיקת imports/paths
- [ ] בדיקת Next.js server/client boundaries
- [ ] בדיקת schema מול migrations
- [ ] בדיקת enums ושמות שדות
- [ ] בדיקת API error handling
- [ ] בדיקת RTL/responsive

## C. דורש גישה מהמחשב / חשבונות
- [ ] יצירת/בחירת Supabase project
- [ ] העתקת DATABASE_URL
- [ ] העתקת SUPABASE_URL
- [ ] העתקת SUPABASE_SERVICE_ROLE_KEY ל-Server environment בלבד
- [ ] הרצת migrations
- [ ] יצירת משתמש ADMIN ראשון
- [ ] Import 95 institutions
- [ ] בדיקת RLS
- [ ] יצירת/אימות גן קרן
- [ ] יצירת התקשרות ראשונה
- [ ] יצירת Sessions
- [ ] Login כמנהל
- [ ] Login כמפעיל
- [ ] Check-in / Check-out
- [ ] Session report

## D. Netlify Preview
- [ ] Environment variables ב-Preview
- [ ] Deploy branch feature/v21-supabase-schema או branch release מתאים
- [ ] בדיקת /login
- [ ] בדיקת /management
- [ ] בדיקת /management/calendar
- [ ] בדיקת כרטיס מסגרת
- [ ] בדיקת /operator בטלפון
- [ ] בדיקת RTL ורספונסיביות
- [ ] אין Merge ל-V20 לפני אישור

## E. Definition of Done לערב
V21 נחשבת Preview עובד כאשר:
1. האתר עולה ללא Build error.
2. ADMIN יכול להתחבר.
3. רשימת המסגרות מוצגת מתוך Supabase.
4. ניתן לפתוח כרטיס מסגרת.
5. ניתן ליצור התקשרות ולוח מפגשים.
6. מפעיל יכול להתחבר ולראות מפגש שלו.
7. Check-in ו-Check-out נשמרים.
8. אין חשיפת Service Role Key בדפדפן.
9. V20 לא נפגע.

## F. לא חוסם Go-Live Preview
הפריטים הבאים יכולים להגיע אחרי ה-Preview הראשון:
- כספים מלאים
- Upload manager מלא
- Excel/CSV export מתקדם
- CRM מתקדם
- WhatsApp/Email
- מפה וניווט חכם
- Offline/PWA
- מערכת Template כללית
- לוח חופשות מלא, כל עוד המערכת מסמנת בבירור שהוא טרם אומת ולא מבטלת מפגשים בטעות

## G. רעיון עתידי — Template Platform
הרעיון למערכת כללית מבוססת StoryOS נשמר ככיוון עתידי נפרד: ישויות כגון Institution/Activity/Operator יוכלו להפוך ל-Entity Types הניתנים להגדרה. לדוגמה "גן" יכול להיות "כיתה", "חוג", "סניף", "לקוח" או יחידה אחרת. אין לבצע Refactor כזה לפני ש-V21 של StoryOS עובדת ונבדקה; כן חשוב להימנע מתלות עסקית מיותרת בקוד כאשר ניתן להשתמש בשמות כלליים במודל הנתונים.
