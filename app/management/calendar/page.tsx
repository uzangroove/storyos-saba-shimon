import contracts from "../../../data/contracts-seed.json";
import { generateSessions } from "../../../lib/scheduling/generate-sessions";

const monthNames = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

const firstContract = contracts[0];
const sessions = generateSessions({
  weekday: firstContract.weekday,
  startTime: firstContract.startTime,
  endTime: firstContract.endTime,
  validFrom: firstContract.validFrom,
  validTo: firstContract.validTo,
});

const grouped = sessions.reduce<Record<string, typeof sessions>>((acc, session) => {
  const key = session.sessionDate.slice(0, 7);
  (acc[key] ??= []).push(session);
  return acc;
}, {});

export default function ManagementCalendarPage() {
  return (
    <main className="management-page" dir="rtl">
      <header className="management-header">
        <div>
          <p className="eyebrow">StoryOS V21 · לוח שנת לימודים</p>
          <h1>תשפ״ז 2026–2027</h1>
          <p>תצוגת מפגשים שנתית · {firstContract.institutionName} · {firstContract.weekdayLabel} {firstContract.startTime}–{firstContract.endTime}</p>
        </div>
        <div className="header-actions"><a className="back-button" href="/management">ניהול מסגרות</a><a className="back-button" href="/">StoryOS</a></div>
      </header>

      <section className="calendar-summary-grid">
        <article className="management-card"><strong>{sessions.length}</strong><span>ימי שלישי בטווח ההתקשרות</span></article>
        <article className="management-card"><strong>{sessions.filter(x => x.status === "PLANNED").length}</strong><span>מפגשים לפני סנכרון חופשות</span></article>
        <article className="management-card"><strong>{firstContract.startTime}</strong><span>שעת התחלה</span></article>
        <article className="management-card"><strong>45 דק׳</strong><span>משך מתוכנן</span></article>
      </section>

      <section className="management-card holiday-warning">
        <strong>סנכרון חופשות משרד החינוך ממתין לנתוני הלוח המפורטים.</strong>
        <span>משרד החינוך מפרסם את תשפ״ז ומאשר פתיחה ב־1.9.2026. עד שנשתול את מועדי החופשות המדויקים, כל ימי שלישי מוצגים כמתוכננים ולא נמחקים אוטומטית.</span>
      </section>

      <section className="calendar-months">
        {Object.entries(grouped).map(([key, monthSessions]) => {
          const [year, month] = key.split("-").map(Number);
          return (
            <article key={key} className="management-card month-card">
              <div className="month-title"><h2>{monthNames[month - 1]} {year}</h2><span>{monthSessions.length} מועדים</span></div>
              <div className="session-list">
                {monthSessions.map((session) => (
                  <div className="session-row" key={session.sessionDate}>
                    <div><strong>{new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${session.sessionDate}T12:00:00Z`))}</strong><span>יום שלישי</span></div>
                    <div><strong>{session.plannedStart}–{session.plannedEnd}</strong><span>{firstContract.institutionName}</span></div>
                    <span className="crm-chip">מתוכנן</span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
