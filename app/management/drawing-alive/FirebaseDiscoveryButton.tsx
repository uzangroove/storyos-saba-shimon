"use client";

import { useState } from "react";

type Match = {
  name: string;
  contentType?: string;
  size?: string;
};

export default function FirebaseDiscoveryButton({ childSlug }: { childSlug: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  async function discover() {
    setLoading(true);
    setMessage(null);
    setMatches([]);

    try {
      const response = await fetch(`/api/media/firebase/discover?child=${encodeURIComponent(childSlug)}`);
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.message ?? body.error ?? "החיבור ל-Firebase עדיין לא הושלם");
        return;
      }

      const nextMatches = Array.isArray(body.matches) ? body.matches : [];
      setMatches(nextMatches);
      setMessage(
        nextMatches.length
          ? `נמצאו ${nextMatches.length} קבצים מתאימים ב-Firebase`
          : "החיבור הצליח, אבל לא נמצאו קבצים תואמים לשמות של הילד/ה.",
      );
    } catch {
      setMessage("לא ניתן לבצע כרגע סריקת Firebase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button type="button" onClick={discover} disabled={loading}>
        {loading ? "סורק Firebase..." : "מצא מדיה ב-Firebase"}
      </button>
      {message ? <small>{message}</small> : null}
      {matches.length ? (
        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
          {matches.slice(0, 8).map((match) => (
            <li key={match.name}>
              <code>{match.name}</code>
              {match.contentType ? ` · ${match.contentType}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
