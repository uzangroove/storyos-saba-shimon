"use client";

import type { SyntheticEvent } from "react";

export default function Home() {
  function customizeStoryOS(event: SyntheticEvent<HTMLIFrameElement>) {
    const frame = event.currentTarget;
    const doc = frame.contentDocument;
    if (!doc) return;

    // מסך ראשי נקי: מסירים את הבאנר הגדול כך שארבעת מסלולי הפעילות
    // יהיו התוכן הראשון שמופיע מיד מתחת לכותרת העליונה.
    doc.querySelector(".hero-banner")?.remove();

    // מעבירים את הסלוגן מהבאנר אל אזור המיתוג העליון.
    const brandCopy = doc.querySelector(".brand > div");
    if (brandCopy && !doc.getElementById("storyosBrandSlogan")) {
      const slogan = doc.createElement("p");
      slogan.id = "storyosBrandSlogan";
      slogan.textContent = "סבא שמעון – חכמה של פעם, מצחיק ומלא ב‑AI";
      slogan.style.margin = "3px 0 0";
      slogan.style.color = "var(--ink)";
      slogan.style.fontSize = "1rem";
      slogan.style.fontWeight = "700";
      slogan.style.lineHeight = "1.35";

      const title = brandCopy.querySelector("h1");
      if (title) title.insertAdjacentElement("afterend", slogan);
      else brandCopy.prepend(slogan);
    }

    // מצמצמים מעט את הרווח העליון ומבטיחים שהכפתורים נראים מיד בפתיחה.
    const main = doc.querySelector("main");
    if (main instanceof HTMLElement) main.style.paddingTop = "14px";

    const activityHub = doc.getElementById("activityHub");
    if (activityHub instanceof HTMLElement) {
      activityHub.style.marginTop = "0";
    }
  }

  return (
    <main className="app-shell">
      <iframe
        className="story-frame"
        src="/storyos.html"
        title="StoryOS – מרכז ההפעלה של סבא שמעון"
        allow="fullscreen"
        onLoad={customizeStoryOS}
      />
    </main>
  );
}
