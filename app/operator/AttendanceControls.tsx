"use client";

import { useState } from "react";

type Props = { sessionId?: string | null };
type State = "READY" | "CHECKED_IN" | "COMPLETED";

export default function AttendanceControls({ sessionId }: Props) {
  const [state, setState] = useState<State>("READY");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function position() {
    if (!navigator.geolocation) return {};
    return new Promise<{ latitude?: number; longitude?: number }>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => resolve({}),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
      );
    });
  }

  async function send(kind: "check-in" | "check-out") {
    if (!sessionId) {
      setMessage("המפגש עדיין אינו מחובר לרשומת Supabase פעילה.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const coords = await position();
      const response = await fetch(`/api/attendance/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ...coords, deviceInfo: { userAgent: navigator.userAgent } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "הדיווח נכשל");
      if (kind === "check-in") {
        setState("CHECKED_IN");
        setMessage("הכניסה נרשמה בהצלחה.");
      } else {
        setState("COMPLETED");
        setMessage(`היציאה נרשמה${data.attendance?.actual_minutes ? ` · ${data.attendance.actual_minutes} דקות` : ""}. עכשיו ניתן למלא דוח פעילות.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "שגיאה בדיווח");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="attendance-controls">
      {state === "READY" && <button className="primary-action" disabled={busy} onClick={() => send("check-in")}>{busy ? "מדווח…" : "כניסה"}</button>}
      {state === "CHECKED_IN" && <button className="primary-action checkout-action" disabled={busy} onClick={() => send("check-out")}>{busy ? "מדווח…" : "יציאה"}</button>}
      {state === "COMPLETED" && <a className="primary-action report-action" href={sessionId ? `/operator/report/${sessionId}` : "#"}>מילוי דוח פעילות</a>}
      {message && <p className="operator-note" role="status">{message}</p>}
    </div>
  );
}
