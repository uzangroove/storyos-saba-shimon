const DATA_ROOT = "/v21-preview/data";

const state = {
  program: null,
  children: [],
  mediaIndex: null,
  statusByChild: {},
  meetingIndex: 0,
  childIndex: 0,
  requestId: 0,
};

const el = {};

function cacheElements() {
  [
    "headerSub","firebaseState","childrenCount","meetingsCount","readyCount","currentCount",
    "meetingSelect","meetingStrip","meetingBadge","meetingNotice","childSelect","prevBtn","nextBtn",
    "viewerNote","compareBox","compareSlider","videoBox","modelBox","metaBox","rows"
  ].forEach((id) => { el[id] = document.getElementById(id); });
}

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function mark(value) {
  return value ? '<span class="okmark">✓</span>' : '<span class="missmark">—</span>';
}

function mediaKeyMatches(files, needle) {
  return Object.keys(files || {}).some((name) => name.includes(needle) && files[name]);
}

function currentMeeting() {
  return state.program.meetings[state.meetingIndex];
}

function currentChild() {
  return state.children[state.childIndex];
}

function meetingRecord(meetingId, childId) {
  return (state.mediaIndex.meetingChildRecords || []).find(
    (record) => record.meetingId === meetingId && record.childId === childId,
  ) || null;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`DATA_LOAD_FAILED:${response.status}:${url}`);
  return response.json();
}

async function bootstrap() {
  cacheElements();
  try {
    const [program, roster, mediaIndex] = await Promise.all([
      fetchJson(`${DATA_ROOT}/gan-arava-program.json`),
      fetchJson(`${DATA_ROOT}/gan-arava-children.json`),
      fetchJson(`${DATA_ROOT}/gan-arava-media-index.json`),
    ]);

    state.program = program;
    state.children = (roster.children || [])
      .filter((child) => child.active !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    state.mediaIndex = mediaIndex;

    applyUrlSelection();
    renderSelectors();
    bindEvents();
    renderStaticCounts();
    await refreshMeeting();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    el.firebaseState.innerHTML = `<b>שגיאת נתונים:</b> ${escapeAttr(message)}`;
    el.viewerNote.textContent = "לא ניתן לטעון את מבנה המפגשים";
  }
}

function applyUrlSelection() {
  const url = new URL(window.location.href);
  const meetingParam = Number(url.searchParams.get("meeting") || "1");
  const childParam = url.searchParams.get("child");

  const meetingIndex = state.program.meetings.findIndex((meeting) => meeting.sequence === meetingParam);
  if (meetingIndex >= 0) state.meetingIndex = meetingIndex;

  const childIndex = state.children.findIndex((child) => child.slug === childParam);
  if (childIndex >= 0) state.childIndex = childIndex;
}

function updateUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("meeting", String(currentMeeting().sequence));
  url.searchParams.set("child", currentChild().slug);
  history.replaceState({}, "", url);
}

function renderSelectors() {
  el.meetingSelect.innerHTML = state.program.meetings.map((meeting) => {
    const suffix = meeting.status === "ACTIVE" ? " · פעיל" : "";
    return `<option value="${meeting.id}">מפגש ${meeting.sequence} · ${escapeAttr(meeting.title)}${suffix}</option>`;
  }).join("");

  el.childSelect.innerHTML = state.children.map((child) =>
    `<option value="${escapeAttr(child.slug)}">${escapeAttr(child.displayName)}</option>`
  ).join("");

  el.meetingStrip.innerHTML = state.program.meetings.map((meeting) =>
    `<button type="button" class="meeting-chip ${meeting.status === "ACTIVE" ? "ready" : ""}" data-meeting-id="${meeting.id}" title="${escapeAttr(meeting.title)}">${meeting.sequence}</button>`
  ).join("");
}

function bindEvents() {
  el.meetingSelect.addEventListener("change", async () => {
    const index = state.program.meetings.findIndex((meeting) => meeting.id === el.meetingSelect.value);
    if (index >= 0) {
      state.meetingIndex = index;
      await refreshMeeting();
    }
  });

  el.meetingStrip.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-meeting-id]");
    if (!button) return;
    const index = state.program.meetings.findIndex((meeting) => meeting.id === button.dataset.meetingId);
    if (index >= 0) {
      state.meetingIndex = index;
      await refreshMeeting();
      button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  });

  el.childSelect.addEventListener("change", async () => {
    const index = state.children.findIndex((child) => child.slug === el.childSelect.value);
    if (index >= 0) {
      state.childIndex = index;
      await openCurrentChild();
    }
  });

  el.prevBtn.addEventListener("click", async () => {
    state.childIndex = (state.childIndex - 1 + state.children.length) % state.children.length;
    await openCurrentChild();
  });

  el.nextBtn.addEventListener("click", async () => {
    state.childIndex = (state.childIndex + 1) % state.children.length;
    await openCurrentChild();
  });

  el.compareSlider.addEventListener("input", updateSlider);
  el.rows.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-child-slug]");
    if (!button) return;
    const index = state.children.findIndex((child) => child.slug === button.dataset.childSlug);
    if (index >= 0) {
      state.childIndex = index;
      await openCurrentChild();
      document.querySelector(".viewer-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function renderStaticCounts() {
  el.childrenCount.textContent = String(state.children.length);
  el.meetingsCount.textContent = String(state.program.meetings.length);
}

async function refreshMeeting() {
  const meeting = currentMeeting();
  state.statusByChild = {};
  el.readyCount.textContent = "—";
  el.meetingSelect.value = meeting.id;
  el.meetingBadge.textContent = meeting.status === "ACTIVE" ? "מפגש פעיל" : "מתוכנן";
  el.headerSub.textContent = `מפגש ${meeting.sequence} · ${meeting.title} · גננת: ${state.program.institution.teacherDisplayName}`;

  [...el.meetingStrip.querySelectorAll(".meeting-chip")].forEach((button) => {
    button.classList.toggle("active", button.dataset.meetingId === meeting.id);
  });

  if (meeting.mediaResolver === "FIREBASE_CHILD_ALIAS_V1") {
    el.meetingNotice.hidden = true;
    await loadFirebaseStatus();
  } else {
    el.firebaseState.innerHTML = `<b>מפגש ${meeting.sequence}:</b> מבנה הנתונים מוכן; המדיה עדיין לא חוברה.`;
    el.meetingNotice.hidden = false;
    el.meetingNotice.textContent = `מפגש ${meeting.sequence} — ${meeting.title} — נמצא בסטטוס ${meeting.status}. הילדים כבר משויכים דרך אותו roster, אך אין עדיין קובצי מדיה למפגש זה.`;
    renderRows();
  }

  await openCurrentChild();
}

async function loadFirebaseStatus() {
  el.firebaseState.textContent = "בודק חיבור Firebase…";
  try {
    const response = await fetch("/api/v21-firebase-discover?child=all", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "FIREBASE_DISCOVER_FAILED");
    state.statusByChild = Object.fromEntries((data.children || []).map((item) => [item.child, item]));
    el.readyCount.textContent = String((data.children || []).filter((item) => item.ready).length);
    el.firebaseState.innerHTML = "<b>Firebase מחובר:</b> מפגש 1 משתמש במדיה הפרטית הקיימת.";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    el.firebaseState.innerHTML = `<b>שגיאת Firebase:</b> ${escapeAttr(message)}`;
  }
  renderRows();
}

function renderRows() {
  const meeting = currentMeeting();
  el.rows.innerHTML = state.children.map((child, index) => {
    const discovered = state.statusByChild[child.slug] || { matchedCount: 0, files: {} };
    const files = discovered.files || {};
    const record = meetingRecord(meeting.id, child.id);
    const connected = Boolean(record) && meeting.mediaResolver === "FIREBASE_CHILD_ALIAS_V1";
    const count = connected ? (discovered.matchedCount || 0) : 0;
    return `<tr>
      <td>${index + 1}</td>
      <td><b>${escapeAttr(child.displayName)}</b></td>
      <td><b>${count}/4</b></td>
      <td>${connected ? mark(mediaKeyMatches(files, "_before")) : mark(false)}</td>
      <td>${connected ? mark(mediaKeyMatches(files, "_after")) : mark(false)}</td>
      <td>${connected ? mark(mediaKeyMatches(files, "_video")) : mark(false)}</td>
      <td>${connected ? mark(mediaKeyMatches(files, "_3dmodel")) : mark(false)}</td>
      <td><button class="child-row-btn" data-child-slug="${escapeAttr(child.slug)}" type="button">הצג</button></td>
    </tr>`;
  }).join("");
}

async function openCurrentChild() {
  const meeting = currentMeeting();
  const child = currentChild();
  el.childSelect.value = child.slug;
  updateUrl();

  [...el.rows.querySelectorAll("[data-child-slug]")].forEach((button) => {
    button.classList.toggle("active", button.dataset.childSlug === child.slug);
  });

  const record = meetingRecord(meeting.id, child.id);
  const canResolve = meeting.mediaResolver === "FIREBASE_CHILD_ALIAS_V1" && record?.status === "AUTO_DISCOVER";

  if (!canResolve) {
    renderPlannedPlaceholder(meeting, child);
    return;
  }

  const requestId = ++state.requestId;
  el.viewerNote.textContent = `טוען ${child.displayName}…`;
  el.currentCount.textContent = "—";
  el.metaBox.textContent = "טוען קישורים מוגנים…";
  el.compareBox.innerHTML = '<div class="empty-stage">טוען…</div>';
  el.videoBox.innerHTML = '<div class="empty-stage">טוען…</div>';
  el.modelBox.innerHTML = '<div class="empty-stage">טוען…</div>';

  try {
    const response = await fetch(`/api/v21-firebase-media?child=${encodeURIComponent(child.slug)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "FIREBASE_MEDIA_FAILED");
    if (requestId !== state.requestId) return;

    const media = data.media || {};
    renderComparison(media.before, media.after);
    renderVideo(media.video);
    renderModel(media.model);

    const count = Object.values(media).filter(Boolean).length;
    el.currentCount.textContent = `${count}/4`;
    el.metaBox.innerHTML = `<b>${escapeAttr(child.displayName)}</b> · מפגש ${meeting.sequence} · ${count}/4 קבצים · קישורים זמניים לכ־${Math.round((data.expiresSeconds || 600) / 60)} דקות`;
    el.viewerNote.textContent = `${child.displayName} · מפגש ${meeting.sequence}`;
  } catch (error) {
    if (requestId !== state.requestId) return;
    const message = error instanceof Error ? error.message : String(error);
    el.viewerNote.textContent = `שגיאה בטעינת ${child.displayName}`;
    el.metaBox.textContent = message;
    el.currentCount.textContent = "0/4";
    el.compareBox.innerHTML = '<div class="empty-stage">לא נטען</div>';
    el.videoBox.innerHTML = '<div class="empty-stage">לא נטען</div>';
    el.modelBox.innerHTML = '<div class="empty-stage">לא נטען</div>';
  }
}

function renderPlannedPlaceholder(meeting, child) {
  state.requestId += 1;
  el.viewerNote.textContent = `${child.displayName} · מפגש ${meeting.sequence} עדיין ללא מדיה`;
  el.currentCount.textContent = "0/4";
  el.metaBox.innerHTML = `<b>${escapeAttr(child.displayName)}</b> · מפגש ${meeting.sequence} · record טרם נוצר למדיה`;
  el.compareSlider.disabled = true;
  el.compareBox.innerHTML = '<div class="empty-stage">כאן יוצגו ציור המקור ותמונת התוצאה לאחר חיבור המדיה למפגש</div>';
  el.videoBox.innerHTML = '<div class="empty-stage">אין וידאו למפגש זה עדיין</div>';
  el.modelBox.innerHTML = '<div class="empty-stage">אין מודל תלת־ממד למפגש זה עדיין</div>';
}

function renderComparison(before, after) {
  if (before && after && before.url !== after.url && before.name !== after.name) {
    el.compareBox.innerHTML = `<img src="${escapeAttr(before.url)}" alt="ציור מקורי"><img id="compareAfter" class="compare-after" src="${escapeAttr(after.url)}" alt="תמונה אחרי"><span class="compare-label before">לפני</span><span class="compare-label after">אחרי</span><div id="compareDivider" class="compare-divider"></div><div id="compareHandle" class="compare-handle">↔</div>`;
    el.compareSlider.disabled = false;
    el.compareSlider.value = "50";
    updateSlider();
    return;
  }
  if (before) {
    el.compareBox.innerHTML = `<img src="${escapeAttr(before.url)}" alt="ציור מקורי"><span class="compare-label before">לפני</span><span class="compare-label after">אין תמונת אחרי</span>`;
  } else if (after) {
    el.compareBox.innerHTML = `<img src="${escapeAttr(after.url)}" alt="תמונה אחרי"><span class="compare-label after">אחרי</span><span class="compare-label before">אין ציור מקור</span>`;
  } else {
    el.compareBox.innerHTML = '<div class="empty-stage">לא נמצאו תמונות להשוואה</div>';
  }
  el.compareSlider.disabled = true;
}

function updateSlider() {
  const value = Number(el.compareSlider.value);
  const after = document.getElementById("compareAfter");
  const divider = document.getElementById("compareDivider");
  const handle = document.getElementById("compareHandle");
  if (after) after.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
  if (divider) divider.style.left = `${value}%`;
  if (handle) handle.style.left = `${value}%`;
}

function renderVideo(video) {
  el.videoBox.innerHTML = video
    ? `<video src="${escapeAttr(video.url)}" controls playsinline preload="metadata"></video>`
    : '<div class="empty-stage">אין וידאו</div>';
}

function renderModel(model) {
  if (!model) {
    el.modelBox.innerHTML = '<div class="empty-stage">אין מודל GLB</div>';
    return;
  }
  el.modelBox.innerHTML = `<model-viewer id="activeModelViewer" src="${escapeAttr(model.url)}" alt="מודל תלת־ממד של יצירת הילד" camera-controls auto-rotate rotation-per-second="18deg" shadow-intensity="1" shadow-softness="0.8" environment-image="neutral" exposure="1" touch-action="pan-y" interaction-prompt="auto" loading="eager"></model-viewer><div id="modelStatus" class="model-status">טוען מודל…</div>`;
  const viewer = document.getElementById("activeModelViewer");
  const status = document.getElementById("modelStatus");
  viewer?.addEventListener("load", () => { if (status) status.textContent = "מודל מוכן · אפשר לסובב ולזום"; });
  viewer?.addEventListener("error", () => { if (status) status.textContent = "שגיאה בטעינת המודל"; });
}

bootstrap();
