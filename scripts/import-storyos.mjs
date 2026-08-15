import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";

const sourcePath = resolve(process.argv[2] || "");
const csvPath = process.argv[3] ? resolve(process.argv[3]) : null;
const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), "..");
const publicDir = resolve(projectRoot, "public");
const assetsDir = resolve(publicDir, "story-assets");

if (!process.argv[2]) {
  throw new Error("Usage: node scripts/import-storyos.mjs <source.html> [books.csv]");
}

await mkdir(assetsDir, { recursive: true });
let html = await readFile(sourcePath, "utf8");
const imagePattern = /data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)/g;
const extracted = new Map();

html = html.replace(imagePattern, (full, rawExtension, base64) => {
  if (extracted.has(full)) return extracted.get(full).url;
  const extension = rawExtension === "jpeg" ? "jpg" : rawExtension;
  const hash = createHash("sha256").update(base64).digest("hex").slice(0, 12);
  const filename = `image-${hash}.${extension}`;
  const url = `/story-assets/${filename}`;
  extracted.set(full, { filename, url, base64 });
  return url;
});

for (const item of extracted.values()) {
  await writeFile(resolve(assetsDir, item.filename), Buffer.from(item.base64, "base64"));
}

const downloadHelpers = `
function safeImageFilename(value){
  return String(value || "StoryOS")
    .replace(/[\\\\/:*?"<>|]/g, "-")
    .replace(/\\s+/g, " ")
    .trim();
}

window.downloadStoryImage = id => {
  const story = STORIES.find(s => s.id === id);
  if(!story || !story.cover){
    alert("לא נמצאה תמונה להורדה עבור פריט זה.");
    return;
  }
  const imageType = story.program === "שעת סיפור והמחשה" ? "כריכת הספר" : "פוסטר הפעילות";
  const sourceExtension = (String(story.cover).match(/\\.(png|jpe?g|webp|gif)(?:[?#]|$)/i) || [])[1] || "png";
  const link = document.createElement("a");
  link.href = story.cover;
  link.download = safeImageFilename(\`\${imageType} - \${story.title}.\${sourceExtension.replace("jpeg", "jpg")}\`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

function imageDownloadLabel(story){
  return story.program === "שעת סיפור והמחשה" ? "⬇ הורדת כריכה" : "⬇ הורדת פוסטר";
}
`;

if (!html.includes("window.downloadStoryImage")) {
  html = html.replace("function filtered(){", `${downloadHelpers}\nfunction filtered(){`);
}

html = html.replace(
  '<button class="btn secondary small" onclick="startLive(\'${s.id}\')">▶ מצב חי</button>',
  '<button class="btn secondary small" onclick="startLive(\'${s.id}\')">▶ מצב חי</button>\n        <a class="btn good small" href="${s.cover}" download="${safeImageFilename(`${s.program === "שעת סיפור והמחשה" ? "כריכת הספר" : "פוסטר הפעילות"} - ${s.title}.png`)}" onclick="event.stopPropagation()">${imageDownloadLabel(s)}</a>'
);

html = html.replace(
  '<button class="btn primary" onclick="startLive(\'${id}\')">▶ מצב הפעלה חיה</button>',
  '<button class="btn primary" onclick="startLive(\'${id}\')">▶ מצב הפעלה חיה</button>\n      <a class="btn good" href="${current.cover}" download="${safeImageFilename(`${current.program === "שעת סיפור והמחשה" ? "כריכת הספר" : "פוסטר הפעילות"} - ${current.title}.png`)}">${imageDownloadLabel(current)}</a>'
);

html = html
  .replace("Story OS · סבא שמעון · גרסה 11", "Story OS · סבא שמעון · גרסה 12")
  .replace("גרסה 11", "גרסה 12");

await writeFile(resolve(publicDir, "storyos.html"), html);
await writeFile(resolve(publicDir, "index.html"), html);

if (csvPath) {
  const csv = await readFile(csvPath);
  const csvExtension = extname(csvPath) || ".csv";
  await writeFile(resolve(publicDir, `StoryOS-books${csvExtension}`), csv);
}

console.log(`Imported ${basename(sourcePath)} with ${extracted.size} unique images.`);
