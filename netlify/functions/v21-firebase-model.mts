import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const STORAGE_SCOPE = "https://www.googleapis.com/auth/devstorage.read_only";
const DEFAULT_BUCKET = "saba-ganim-arava.firebasestorage.app";

const CHILDREN: Record<string, string[]> = {
  ben: ["ben", "בן"], eylon: ["eylon", "איילון", "אילון"], guy: ["guy", "גיא"], dori: ["dori", "דורי"],
  odaya: ["odaya", "הודיה"], vova: ["vova", "וובה", "טובה"], jera: ["jera", "ז'רה", "זרה"], tomy: ["tomy", "tomi", "טומי"],
  yoav: ["yoav", "יואב"], liav: ["liav", "ליאב"], leny: ["leny", "lenny", "לני"], mariane: ["mariane", "marian", "מריאן"],
  nely: ["nely", "nelly", "נלי"], "omer-b": ["omer_b", "omer-b", "עומר ב"], "omer-vav": ["omer_vav", "omer-vav", "עומר ו"],
  tsofia: ["tsofia", "tzofia", "צופיה"], rom: ["rom", "רום"], ron: ["ron", "רון"], rafael: ["rafael", "רפאל"],
  shir: ["shir", "שיר"], tom: ["tom", "תום"], tamar: ["tamar", "תמר"],
};

function base64Url(value: string | Buffer) {
  const b = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return b.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function getConfig() {
  const clientEmail = Netlify.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKey = Netlify.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  const bucket = (Netlify.env.get("FIREBASE_STORAGE_BUCKET") || DEFAULT_BUCKET).replace(/^gs:\/\//, "").replace(/\/$/, "");
  if (!clientEmail || !privateKey) throw new Error("FIREBASE_SERVER_CONFIG_MISSING");
  return { clientEmail, privateKey, bucket };
}

async function accessToken() {
  const { clientEmail, privateKey } = getConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({ iss: clientEmail, scope: STORAGE_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;

  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!r.ok) throw new Error(`FIREBASE_TOKEN_EXCHANGE_FAILED:${r.status}`);
  const body = await r.json() as { access_token?: string };
  if (!body.access_token) throw new Error("FIREBASE_ACCESS_TOKEN_MISSING");
  return body.access_token;
}

async function listObjects(token: string) {
  const { bucket } = getConfig();
  const params = new URLSearchParams({ maxResults: "1000", fields: "items(name,contentType,size)" });
  const r = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`FIREBASE_STORAGE_LIST_FAILED:${r.status}`);
  const body = await r.json() as { items?: Array<{ name: string; contentType?: string; size?: string }> };
  return body.items ?? [];
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[\\/_\-.]+/g, " ").replace(/[()\[\]{}]+/g, " ").replace(/\s+/g, " ").trim();
}

function belongsToChild(path: string, aliases: string[]) {
  const normalizedPath = ` ${normalize(path)} `;
  if (aliases.some(alias => normalizedPath.includes(` ${normalize(alias)} `))) return true;
  const raw = path.toLocaleLowerCase();
  return aliases.some(alias => raw.includes(alias.toLocaleLowerCase()));
}

function isModel(name: string) {
  return /\.(glb|gltf)$/i.test(name);
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const child = (url.searchParams.get("child") || "").toLowerCase();
    const aliases = CHILDREN[child];
    if (!aliases) return Response.json({ error: "UNKNOWN_CHILD" }, { status: 400 });

    const token = await accessToken();
    const objects = await listObjects(token);
    const candidates = objects.filter(o => belongsToChild(o.name, aliases) && isModel(o.name));
    const model = candidates.find(o => /\.glb$/i.test(o.name)) || candidates[0] || null;
    if (!model) return Response.json({ error: "MODEL_NOT_FOUND" }, { status: 404 });

    const { bucket } = getConfig();
    const mediaUrl = `https://storage.googleapis.com/download/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(model.name)}?alt=media`;
    const mediaResponse = await fetch(mediaUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!mediaResponse.ok) throw new Error(`FIREBASE_MODEL_DOWNLOAD_FAILED:${mediaResponse.status}`);

    const headers = new Headers();
    headers.set("Content-Type", model.contentType || (/\.glb$/i.test(model.name) ? "model/gltf-binary" : "model/gltf+json"));
    headers.set("Cache-Control", "private, max-age=300");
    headers.set("Content-Disposition", `inline; filename="${model.name.split("/").pop() || "model.glb"}"`);
    const length = mediaResponse.headers.get("content-length") || model.size;
    if (length) headers.set("Content-Length", length);

    return new Response(mediaResponse.body, { status: 200, headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, { status: 500 });
  }
};

export const config = { path: "/api/v21-firebase-model" };
