import institutions from "../../../../data/karmiel-institutions-seed.json";

const field = (value: string | number | null | undefined) => value ?? "—";

export default async function InstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = institutions.find((x) => x.legacySourceId === id);

  if (!item) {
    return <main className="management-page" dir="rtl"><section className="management-card"><h1>המסגרת לא נמצאה</h1><a href="/management">חזרה לרשימה</a></section></main>;
  }

  return (
    <main className="management-page" dir="rtl">
      <header className="management-header">
        <div><p className="eyebrow">StoryOS V21 · כרטיס מסגרת</p><h1>{item.name}</h1><p>{field(item.typeRaw)} · {field(item.neighborhood)} · כרמיאל</p></div>
        <a className="back-button" href="/management">חזרה לכל המסגרות</a>
      </header>

      <section className="institution-summary-grid">
        <article className="management-card"><h2>פרטי המסגרת</h2><dl className="detail-list">
          <div><dt>כתובת</dt><dd>{field(item.address)}</dd></div><div><dt>שכונה</dt><dd>{field(item.neighborhood)}</dd></div>
          <div><dt>גילאים</dt><dd>{field(item.ages)}</dd></div><div><dt>בעלות</dt><dd>{field(item.ownership)}</dd></div>
          <div><dt>טלפון</dt><dd>{field(item.phone)}</dd></div><div><dt>מקור / אימות</dt><dd>{field(item.verificationRaw)}</dd></div>
        </dl></article>
        <article className="management-card"><h2>איש קשר ראשי</h2><p className="empty-state">עדיין לא הוזנו גננת/מנהלת, טלפון אישי, WhatsApp, מייל או תמונה.</p><button disabled>+ הוספת איש קשר</button></article>
        <article className="management-card"><h2>CRM</h2><dl className="detail-list"><div><dt>סטטוס</dt><dd><span className="crm-chip">פוטנציאלי</span></dd></div><div><dt>פעולה הבאה</dt><dd>טרם נקבעה</dd></div></dl><button disabled>עדכון CRM</button></article>
      </section>

      <section className="management-card"><div className="table-toolbar"><div><h2>התקשרות ופעילות שנתית</h2><p>שנת לימודים תשפ״ז · 01.09.2026–30.06.2027</p></div><button disabled>+ התקשרות חדשה</button></div>
        <div className="empty-state large"><strong>אין עדיין התקשרות פעילה למסגרת זו.</strong><span>לאחר חיבור Supabase ניתן יהיה להגדיר פעילות, מחיר, יום קבוע, שעה, מפעיל ולוח חופשות.</span></div>
      </section>

      <section className="institution-summary-grid">
        <article className="management-card"><h2>מפגשים</h2><p className="metric-placeholder">0</p><span>מתוכננים / בוצעו / בוטלו</span></article>
        <article className="management-card"><h2>דיווח נוכחות</h2><p className="empty-state">כניסה ויציאה של מפעילים יוצגו כאן.</p></article>
        <article className="management-card"><h2>כספים</h2><p className="empty-state">מחיר מוסכם, חיובים ותשלומים יוצגו כאן.</p></article>
      </section>

      <section className="management-card"><h2>יומן פעילות</h2><div className="table-wrap"><table><thead><tr><th>תאריך</th><th>פעילות</th><th>תכנון</th><th>בפועל</th><th>מפעיל</th><th>סטטוס</th><th>דוח</th></tr></thead><tbody><tr><td colSpan={7} className="empty-table">אין עדיין מפגשים למסגרת זו.</td></tr></tbody></table></div></section>
    </main>
  );
}
