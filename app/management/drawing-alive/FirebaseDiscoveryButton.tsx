"use client";

import { useState } from "react";

type Match = {
  name: string;
  contentType?: string;
  size?: string;
  previewUrl?: string;
};

function mediaKind(match: Match) {
  const type = match.contentType ?? "";
  const name = match.name.toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name)) return "image";
  if (type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(name)) return "video";
  if (/\.(glb|gltf)$/i.test(name)) return "model";
  return "file";
}

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
          ? `נמצאו ${nextMatches.length} קבצים. קישורי התצוגה זמניים ומוגנים.`
          : "החיבור הצליח, אבל לא נמצאו קבצים תואמים לשמות של הילד/ה.",
      );
    } catch {
      setMessage("לא ניתן לבצע כרגע סריקת Firebase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 10, minWidth: 220 }}>
      <button type="button" onClick={discover} disabled={loading}>
        {loading ? "סורק Firebase..." : "מצא והצג מדיה"}
      </button>
      {message ? <small>{message}</small> : null}
      {matches.length ? (
        <div style={{ display: "grid", gap: 12 }}>
          {matches.slice(0, 8).map((match) => {
            const kind = mediaKind(match);
            return (
              <article key={match.name} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 8 }}>
                <div style={{ marginBottom: 6 }}>
                  <strong>{kind === "image" ? "תמונה" : kind === "video" ? "וידאו" : kind === "model" ? "מודל 3D" : "קובץ"}</strong>
                  <br />
                  <code>{match.name}</code>
                </div>
                {match.previewUrl && kind === "image" ? (
                  <img src={match.previewUrl} alt="תוצר מהפעילות" style={{ width: "100%", maxWidth: 320, borderRadius: 8 }} />
                ) : null}
                {match.previewUrl && kind === "video" ? (
                  <video src={match.previewUrl} controls playsInline style={{ width: "100%", maxWidth: 420, borderRadius: 8 }} />
                ) : null}
                {match.previewUrl && kind === "model" ? (
                  <a href={match.previewUrl} target="_blank" rel="noreferrer">פתח קובץ GLB</a>
                ) : null}
                {match.previewUrl && kind === "file" ? (
                  <a href={match.previewUrl} target="_blank" rel="noreferrer">פתח קובץ</a>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
