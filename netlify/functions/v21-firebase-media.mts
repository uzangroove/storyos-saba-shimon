import { createHash, createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const STORAGE_SCOPE = "https://www.googleapis.com/auth/devstorage.read_only";
const DEFAULT_BUCKET = "saba-ganim-arava.firebasestorage.app";

const CHILDREN: Record<string, string[]> = {
  ben: ["ben", "בן"],
  eylon: ["eylon", "איילון", "אילון"],
  guy: ["guy", "גיא"],
  dori: ["dori", "דורי"],
  odaya: ["odaya", "הודיה"],
  vova: ["vova", "וובה", "טובה"],
  jera: ["jera", "ז'רה", "זרה"],
  tomy: ["tomy", "tomi", "טומי"],
  yoav: ["yoav", "יואב"],
  liav: ["liav", "ליאב"],
  leny: ["leny", "lenny", "לני"],
  mariane: ["mariane", "marian", "מריאן"],
  nely: ["nely", "nelly", "נלי"],
  "omer-b": ["omer_b", "omer-b", "עומר ב"],
  "omer-vav": ["omer_vav", "omer-vav", "עומר ו"],
  tsofia: ["tsofia", "tzofia", "צופיה"],
  rom: ["rom", "רום"],
  ron: ["ron", "רון"],
  rafael: ["rafael", "רפאל"],
  shir: ["shir", "שיר"],
  tom: ["tom", "תום"],
  tamar: ["tamar", "תמר"],
};

function base64Url(value: string | Buffer) {
  const b = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return b.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function getConfig() {
  const clientEmail = Netlify.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKey = Netlify.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  const bucket = (Netlify.env.get("FIREBASE_STORAGE_BUCKET") || DEFAULT_BUCKET)
    .replace(/^gs:\/\//, "")
    .replace(/\/$/, "");
  if (!clientEmail || !privateKey) throw new Error("FIREBASE_SERVER_CONFIG_MISSING");
  return { clientEmail, privateKey, bucket };
}

async function accessToken() {
  const { clientEmail, privateKey } = getConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: STORAGE_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;

  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!r.ok) throw new Error(`FIREBASE_TOKEN_EXCHANGE_FAILED:${r.status}`);
  const body = await r.json() as { access_token?: string };
  if (!body.access_token) throw new Error("FIREBASE_ACCESS_TOKEN_MISSING");
  return body.access_token;
}

async function listObjects() {
  const { bucket } = getConfig();
  const token = await accessToken();
  const params = new URLSearchParams({
    maxResults: "1000",
    fields: "items(name,contentType,size,updated)",
  });
  const r = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`FIREBASE_STORAGE_LIST_FAILED:${r.status}`);
  const body = await r.json() as {
    items?: Array<{ name: string; contentType?: string; size?: string; updated?: string }>;
  };
  return body.items ?? [];
}

function isoBasic(d: Date) {
  return d.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function signedUrl(path: string, expiresSeconds = 600) {
  const { clientEmail, privateKey, bucket } = getConfig();
  const timestamp = isoBasic(new Date());
  const date = timestamp.slice(0, 8);
  const credentialScope = `${date}/auto/storage/goog4_request`;
  const credential = `${clientEmail}/${credentialScope}`;
  const host = "storage.googleapis.com";
  const canonicalUri = `/${encodeURIComponent(bucket)}/${encodePath(path)}`;
  const queryPairs: Array<[string, string]> = [
    ["X-Goog-Algorithm", "GOOG4-RSA-SHA256"],
    ["X-Goog-Credential", credential],
    ["X-Goog-Date", timestamp],
    ["X-Goog-Expires", String(expiresSeconds)],
    ["X-Goog-SignedHeaders", "host"],
  ];
  const canonicalQuery = queryPairs
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const canonicalRequest = `GET\n${canonicalUri}\n${canonicalQuery}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const hash = createHash("sha256").update(canonicalRequest).digest("hex");
  const stringToSign = `GOOG4-RSA-SHA256\n${timestamp}\n${credentialScope}\n${hash}`;
  const signer = createSign("RSA-SHA256");
  signer.update(stringToSign);
  signer.end();
  const signature = signer.sign(privateKey).toString("hex");
  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Goog-Signature=${signature}`;
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[\\/_\-.]+/g, " ")
    .replace(/[()\[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function belongsToChild(path: string, aliases: string[]) {
  const normalizedPath = ` ${normalize(path)} `;
  return aliases.some(alias => normalizedPath.includes(` ${normalize(alias)} `));
}

function isImage(name: string) {
  return /\.(png|jpe?g|webp)$/i.test(name);
}
function isVideo(name: string) {
  return /\.(mp4|webm|mov)$/i.test(name);
}
function isModel(name: string) {
  return /\.(glb|gltf)$/i.test(name);
}
function hasAny(name: string, terms: string[]) {
  const n = normalize(name);
  return terms.some(term => n.includes(normalize(term)));
}

function classifyMedia(objects: Array<{ name: string; contentType?: string; size?: string; updated?: string }>) {
  const images = objects.filter(o => isImage(o.name));
  const beforeTerms = ["before", "original", "orig", "drawing", "sketch", "source", "ציור", "מקור"];
  const afterTerms = ["after", "render", "result", "final", "3d", "ai", "תלת", "תוצאה"];

  let before = images.find(o => hasAny(o.name, beforeTerms)) || null;
  let after = images.find(o => hasAny(o.name, afterTerms) && o.name !== before?.name) || null;

  if (!before && images.length >= 2) before = images[0];
  if (!after && images.length >= 2) after = images.find(o => o.name !== before?.name) || null;
  if (!after && images.length === 1) after = images[0];

  return {
    before,
    after,
    video: objects.find(o => isVideo(o.name)) || null,
    model: objects.find(o => isModel(o.name)) || null,
  };
}

export default async (req: Request) => {
  try {
    const child = new URL(req.url).searchParams.get("child")?.toLowerCase() || "";
    const aliases = CHILDREN[child];
    if (!aliases) return Response.json({ error: "UNKNOWN_CHILD" }, { status: 400 });

    const objects = await listObjects();
    const candidates = objects.filter(o => belongsToChild(o.name, aliases));
    const found = classifyMedia(candidates);
    const media = Object.fromEntries(
      Object.entries(found).map(([kind, object]) => [kind, object ? {
        kind,
        name: object.name,
        contentType: object.contentType || null,
        size: object.size || null,
        updated: object.updated || null,
        url: signedUrl(object.name, 600),
      } : null]),
    );

    return Response.json({
      ok: true,
      child,
      expiresSeconds: 600,
      candidateCount: candidates.length,
      media,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, { status: 500 });
  }
};

export const config = { path: "/api/v21-firebase-media" };
