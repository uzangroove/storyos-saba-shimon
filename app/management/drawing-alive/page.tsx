import manifest from "../../../data/gan-arava-drawing-alive.json";
import { firebaseGsUri } from "../../../lib/media/firebase-storage";

const statusLabel: Record<string, string> = {
  READY: "מוכן",
  PENDING_MEDIA: "ממתין למדיה",
};

export default function DrawingAlivePilotPage() {
  const ready = manifest.children.filter((child) => child.status === "READY").length;

  return (
    <main className="management-page" dir="rtl">
      <header className="management-header">
        <div>
          <p className="eyebrow">StoryOS V21 · כשהציור קם לתחייה</p>
          <h1>{manifest.garden.name} · מפגש {manifest.garden.session.number}</h1>
          <p>
            גננת: {manifest.garden.teacherName} · נושא: {manifest.garden.session.theme}
          </p>
        </div>
        <div className="header-actions">
          <a className="back-button" href="/management">חזרה לניהול</a>
          <a className="back-button" href="/">חזרה ל־StoryOS</a>
        </div>
      </header>

      <section className="stats-grid" aria-label="סיכום פעילות">
        <article><strong>{manifest.children.length}</strong><span>ילדים בגן</span></article>
        <article><strong>{ready}</strong><span>עם מדיה מלאה כרגע</span></article>
        <article><strong>4</strong><span>תוצרים לכל ילד</span></article>
        <article><strong>Firebase</strong><span>אחסון מדיה</span></article>
      </section>

      <section className="management-card">
        <div className="table-toolbar">
          <div>
            <h2>פיילוט גן ערבה</h2>
            <p>
              הרשימה מבוססת על טבלת הילדים שהועלתה. בן מוגדר כפיילוט ראשון עם ארבעת שמות הקבצים המלאים.
            </p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ילד/ה</th>
                <th>סטטוס</th>
                <th>ציור</th>
                <th>תמונה</th>
                <th>וידאו</th>
                <th>מודל</th>
              </tr>
            </thead>
            <tbody>
              {manifest.children.map((child) => {
                const prefix = `drawing-alive/${manifest.garden.slug}/${manifest.garden.session.slug}/${child.slug}`;
                return (
                  <tr key={child.slug}>
                    <td>{child.order}</td>
                    <td><strong>{child.name}</strong></td>
                    <td><span className="status-chip">{statusLabel[child.status] ?? child.status}</span></td>
                    <td><code>{firebaseGsUri({ provider: "firebase", bucket: manifest.garden.storageBucket, path: `${prefix}/${child.before}` })}</code></td>
                    <td><code>{firebaseGsUri({ provider: "firebase", bucket: manifest.garden.storageBucket, path: `${prefix}/${child.after}` })}</code></td>
                    <td><code>{firebaseGsUri({ provider: "firebase", bucket: manifest.garden.storageBucket, path: `${prefix}/${child.video}` })}</code></td>
                    <td><code>{firebaseGsUri({ provider: "firebase", bucket: manifest.garden.storageBucket, path: `${prefix}/${child.model}` })}</code></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="management-card">
        <h2>חיבור מדיה</h2>
        <p>
          כתובות <code>gs://</code> נשמרות כמזהי אחסון בלבד. כדי להציג בפועל תמונה, MP4 או GLB בדפדפן,
          נחבר בשלב הבא הרשאת Firebase או Download URL מאובטח — בלי להפוך את כל ה־Bucket לציבורי.
        </p>
      </section>
    </main>
  );
}
