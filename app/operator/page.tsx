import contracts from "../../data/contracts-seed.json";
import { generateSessions } from "../../lib/scheduling/generate-sessions";

const contract = contracts[0];
const sessions = generateSessions({
  weekday: contract.weekday,
  startTime: contract.startTime,
  endTime: contract.endTime,
  validFrom: contract.validFrom,
  validTo: contract.validTo,
});

const now = new Date();
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const nextSession = sessions.find((session) => session.sessionDate >= today) ?? sessions[0];

export default function OperatorPage() {
  return (
    <main className="operator-page" dir="rtl">
      <header className="operator-header">
        <div>
          <p className="eyebrow">StoryOS Operator</p>
          <h1>הפעילות הבאה שלי</h1>
          <p>מסך מפעיל מותאם לטלפון</p>
        </div>
        <a className="back-button" href="/management">ניהול</a>
      </header>

      <section className="operator-next-card">
        <div className="operator-date">{nextSession?.sessionDate ?? "—"}</div>
        <h2>{contract.institutionName}</h2>
        <p>{contract.neighborhood}</p>
        <div className="operator-time">{contract.startTime}–{contract.endTime}</div>
        <div className="operator-meta">
          <span>{contract.weekdayLabel}</span>
          <span>{contract.activityName ?? "סוג פעילות טרם הוגדר"}</span>
          <span>{contract.operatorName}</span>
        </div>
        <div className="operator-actions">
          <button disabled className="primary-action">כניסה</button>
          <button disabled>פרטי הגן</button>
          <button disabled>ניווט</button>
        </div>
        <p className="operator-note">הכפתורים יופעלו לאחר חיבור Supabase והרשאת משתמש מפעיל.</p>
      </section>

      <section className="operator-grid">
        <article className="management-card"><h2>דיווח נוכחות</h2><p className="empty-state">כניסה, יציאה, משך בפועל ומיקום אופציונלי.</p></article>
        <article className="management-card"><h2>דוח פעילות</h2><p className="empty-state">מה בוצע, הערות, משוב ומה מתוכנן למפגש הבא.</p></article>
        <article className="management-card"><h2>המשך היום</h2><p className="empty-state">פעילויות נוספות של המפעיל יוצגו כאן לפי השיבוץ האישי.</p></article>
      </section>
    </main>
  );
}
