"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "ההתחברות נכשלה");
      window.location.href = data.redirectTo ?? "/operator";
    } catch (err) {
      setError(err instanceof Error ? err.message : "ההתחברות נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page" dir="rtl">
      <section className="login-card">
        <p className="eyebrow">StoryOS V21</p>
        <h1>כניסה למערכת</h1>
        <p>מנהל ומפעילים נכנסים עם החשבון האישי שלהם.</p>
        <form onSubmit={submit} className="login-form">
          <label>דוא״ל<input name="email" type="email" autoComplete="email" required /></label>
          <label>סיסמה<input name="password" type="password" autoComplete="current-password" required /></label>
          {error ? <div className="login-error">{error}</div> : null}
          <button type="submit" disabled={loading}>{loading ? "מתחבר…" : "כניסה"}</button>
        </form>
        <small>לאחר החיבור ל־Supabase Auth, התפקיד יקבע אוטומטית אם להיכנס לניהול או למסך מפעיל.</small>
      </section>
    </main>
  );
}
