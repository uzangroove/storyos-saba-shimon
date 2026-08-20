import contracts from "../../data/contracts-seed.json";
import { generateSessions } from "../../lib/scheduling/generate-sessions";
import AttendanceControls from "./AttendanceControls";

const contract = contracts[0];
const sessions = generateSessions({ weekday: contract.weekday, startTime: contract.startTime, endTime: contract.endTime, validFrom: contract.validFrom, validTo: contract.validTo });
const now = new Date();
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const nextSession = sessions.find((session) => session.sessionDate >= today) ?? sessions[0];

export default function OperatorPage() {
  // Until the generated schedule is persisted to Supabase there is no UUID yet.
  // Once persisted, the real session id will be supplied here by the operator query.
  const persistedSessionId: string | null = null;

  return (
    <main className="operator-page" dir="rtl">
      <header className="operator-header">
        <div><p className="eyebrow">StoryOS Operator</p><h1>הפעילות הבאה שלי</h1><p>מסך מפעיל מותאם לטלפון</p></div>
        <a className="back-button" href="/management">ניהול</a>
      </header>

      <section className="operator-next-card">
        <div className="operator-date">{nextSession?.sessionDate ?? "—"}</div>
        <h2>{contract.institutionName}</h2><p>{contract.neighborhood}</p>
        <div className="operator-time">{contract.startTime}–{contract.endTime}</div>
        <div className="operator-meta"><span>{contract.weekdayLabel}</span><span>{contract.activityName ?? "סוג פעילות טרם הוגדר"}</span><span>{contract.operatorName}</span></div>
        <AttendanceControls sessionId={persistedSessionId} />
        <div className="operator-actions secondary-actions"><button disabled>פרטי הגן</button><button disabled>ניווט</button></div>
        {!persistedSessionId && <p className="operator-note">הממשק מוכן. כפתור הכניסה יופעל אוטומטית לאחר שמפגשי השנה יישמרו ב־Supabase ויקבלו מזהי UUID.</p>}
      </section>

      <section className="operator-grid">
        <article className="management-card"><h2>דיווח נוכחות</h2><p className="empty-state">כניסה → פעילות פעילה → יציאה → חישוב משך בפועל.</p></article>
        <article className="management-card"><h2>דוח פעילות</h2><p className="empty-state">לאחר היציאה המערכת תעביר ישירות למילוי הדוח.</p></article>
        <article className="management-card"><h2>המשך היום</h2><p className="empty-state">פעילויות נוספות יוצגו כאן לפי השיבוץ האישי.</p></article>
      </section>
    </main>
  );
}
