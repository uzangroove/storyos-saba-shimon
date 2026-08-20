import institutions from "../../data/karmiel-institutions-seed.json";

const statusLabel = (raw: string | null) => {
  if (!raw) return "לא אומת";
  if (raw.includes("רשמי") || raw.includes("התאחדות")) return "מאומת/רשמי";
  if (raw.includes("דורש אימות")) return "דורש אימות";
  return "מקור ציבורי";
};

export default function ManagementPage() {
  const total = institutions.length;
  const withPhone = institutions.filter((x) => x.phone).length;
  const needsVerification = institutions.filter((x) => x.verificationRaw?.includes("דורש אימות") || !x.verificationRaw).length;
  const givatRam = institutions.filter((x) => x.neighborhood?.includes("גבעת רם")).length;

  return (
    <main className="management-page" dir="rtl">
      <header className="management-header">
        <div>
          <p className="eyebrow">StoryOS V21</p>
          <h1>ניהול גנים ומסגרות</h1>
          <p>מאגר לקוחות, אנשי קשר, התקשרויות, לוחות פעילות ומעקב.</p>
        </div>
        <div className="header-actions">
          <a className="back-button" href="/management/calendar">לוח תשפ״ז</a>
          <a className="back-button" href="/operator">מסך מפעיל</a>
          <a className="back-button" href="/">חזרה ל־StoryOS</a>
        </div>
      </header>

      <section className="stats-grid" aria-label="סיכום מאגר">
        <article><strong>{total}</strong><span>מסגרות במאגר</span></article>
        <article><strong>{withPhone}</strong><span>עם טלפון</span></article>
        <article><strong>{givatRam}</strong><span>בגבעת רם</span></article>
        <article><strong>{needsVerification}</strong><span>דורשות השלמה/אימות</span></article>
      </section>

      <section className="management-card">
        <div className="table-toolbar">
          <div>
            <h2>רשימת מסגרות</h2>
            <p>לחיצה על שם המסגרת פותחת כרטיס גן מלא.</p>
          </div>
          <div className="toolbar-actions">
            <button disabled>+ גן חדש</button>
            <button disabled>ייבוא / ייצוא</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>שם</th><th>סוג</th><th>שכונה</th><th>כתובת</th><th>טלפון</th><th>מקור</th><th>CRM</th></tr></thead>
            <tbody>
              {institutions.map((item) => (
                <tr key={item.legacySourceId}>
                  <td><a className="institution-link" href={`/management/institutions/${item.legacySourceId}`}><strong>{item.name}</strong><small> #{item.legacySourceId}</small></a></td>
                  <td>{item.typeRaw}</td><td>{item.neighborhood ?? "—"}</td><td>{item.address ?? "—"}</td>
                  <td>{item.phone ?? "—"}</td><td><span className="status-chip">{statusLabel(item.verificationRaw)}</span></td>
                  <td><span className="crm-chip">פוטנציאלי</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
