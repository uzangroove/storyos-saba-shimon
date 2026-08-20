"use client";

import { FormEvent, useState } from "react";

export default function ContractForm({ legacySourceId, institutionName }: { legacySourceId: string; institutionName: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      legacySourceId,
      title: String(form.get("title") ?? `${institutionName} · פעילות שנתית`),
      activitySlug: String(form.get("activitySlug") ?? "") || null,
      pricingModel: String(form.get("pricingModel") ?? "") || null,
      agreedPrice: form.get("agreedPrice") ? Number(form.get("agreedPrice")) : null,
      weekday: Number(form.get("weekday") ?? 2),
      startTime: String(form.get("startTime") ?? "09:00"),
      endTime: String(form.get("endTime") ?? "09:45"),
      validFrom: String(form.get("validFrom") ?? "2026-09-01"),
      validTo: String(form.get("validTo") ?? "2027-06-30"),
      generateSessions: true,
    };

    try {
      const response = await fetch("/api/contracts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "יצירת ההתקשרות נכשלה");
      setMessage(`ההתקשרות נוצרה · ${data.sessionsCreated ?? 0} מפגשים נוצרו.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "שגיאה ביצירת ההתקשרות");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="contract-form" onSubmit={submit}>
      <div className="form-grid">
        <label>שם ההתקשרות<input name="title" defaultValue={`${institutionName} · פעילות שנתית`} required /></label>
        <label>סוג פעילות<select name="activitySlug" defaultValue=""><option value="">טרם נקבע</option><option value="story-hour">שעת סיפור</option><option value="toddler-story">סיפור פעוטות</option><option value="drawing-alive">כשהציור קם לתחייה</option><option value="puppet-theater">תיאטרון בובות</option><option value="song-born-kindergarten">שיר נולד בגן</option></select></label>
        <label>יום קבוע<select name="weekday" defaultValue="2"><option value="0">ראשון</option><option value="1">שני</option><option value="2">שלישי</option><option value="3">רביעי</option><option value="4">חמישי</option><option value="5">שישי</option></select></label>
        <label>שעת התחלה<input name="startTime" type="time" defaultValue="09:00" required /></label>
        <label>שעת סיום<input name="endTime" type="time" defaultValue="09:45" required /></label>
        <label>מתאריך<input name="validFrom" type="date" defaultValue="2026-09-01" required /></label>
        <label>עד תאריך<input name="validTo" type="date" defaultValue="2027-06-30" required /></label>
        <label>מודל מחיר<select name="pricingModel" defaultValue="PER_SESSION"><option value="PER_SESSION">למפגש</option><option value="MONTHLY">חודשי</option><option value="ANNUAL">שנתי</option></select></label>
        <label>מחיר מוסכם<input name="agreedPrice" type="number" min="0" step="0.01" placeholder="₪" /></label>
      </div>
      <div className="form-actions"><button className="primary-action" type="submit" disabled={busy}>{busy ? "יוצר…" : "צור התקשרות ולוח שנתי"}</button></div>
      {message ? <p className="operator-note" role="status">{message}</p> : null}
    </form>
  );
}
