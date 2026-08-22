import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const STORAGE_SCOPE = "https://www.googleapis.com/auth/devstorage.read_only";
const DEFAULT_BUCKET = "saba-ganim-arava.firebasestorage.app";

const CHILDREN: Record<string, string> = {
  ben: "ben", eylon: "eylon", guy: "guy", dori: "dori", odaya: "odaya", vova: "vova",
  jera: "jera", tomy: "tomy", yoav: "yoav", liav: "liav", leny: "leny", mariane: "mariane",
  nely: "nely", "omer-b": "omer_b", "omer-vav": "omer_vav", tsofia: "tsofia", rom: "rom",
  ron: "ron", rafael: "rafael", shir: "shir", tom: "tom", tamar: "tamar",
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
  const signer = createSign("RSA-SHA256"); signer.update(unsigned); signer.end();
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

async function listObjects() {
  const { bucket } = getConfig();
  const token = await accessToken();
  const params = new URLSearchParams({ maxResults: "1000", fields: "items(name,contentType,size,updated)" });
  const r = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`FIREBASE_STORAGE_LIST_FAILED:${r.status}`);
  const body = await r.json() as { items?: Array<{ name: string; contentType?: string; size?: string; updated?: string }> };
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
  const now = new Date();
  const timestamp = isoBasic(now);
  const date = timestamp.slice(0, 8);
  const credentialScope = `${date}/auto/storage/goog4_request`;
  const credential = `${clientEmail}/${credentialScope}`;
  const host = "storage.googleapis.com";
  const canonicalUri = `/${encodeURIComponent(bucket)}/${encodePath(path)}`;
  const query = new URLSearchParams({
    "X-Goog-Algorithm": "GOOG4-RSA-SHA256",
    "X-Goog-Credential": credential,
    "X-Goog-Date": timestamp,
    "X-Goog-Expires": String(expiresSeconds),
    "X-Goog-SignedHeaders": "host",
  });
  const canonicalQuery = Array.from(query.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const canonicalRequest = `GET\n${canonicalUri}\n${canonicalQuery}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const crypto = await import("node:crypto");
  const hash = crypto.createHash("sha256").update(canonicalRequest).digest("hex");
  const stringToSign = `GOOG4-RSA-SHA256\n${timestamp}\n${credentialScope}\n${hash}`;
  const signer = createSign("RSA-SHA256"); signer.update(stringToSign); signer.end();
  const signature = signer.sign(privateKey).toString("hex");
  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Goog-Signature=${signature}`;
}

function expected(stem: string) {
  return {
    before: [`${stem}_before.jpg`, `${stem}_before.jpeg`, `${stem}_before.png`],
    after: [`${stem}_after.png`, `${stem}_after.jpg`, `${stem}_after.jpeg`],
    video: [`${stem}_video.mp4`, `${stem}.mp4`],
    model: [`${stem}_3dmodel.glb`, `${stem}.glb`, `${stem}_3dmodel.gltf`],
  };
}

export default async (req: Request) => {
  try {
    const child = new URL(req.url).searchParams.get("child")?.toLowerCase() || "";
    const stem = CHILDREN[child];
    if (!stem) return Response.json({ error: "UNKNOWN_CHILD" }, { status: 400 });

    const objects = await listObjects();
    const byLower = objects.map(o => ({ ...o, lower: o.name.toLowerCase() }));
    const wants = expected(stem);
    const find = (candidates: string[]) => byLower.find(o => candidates.some(c => o.lower.endsWith(c.toLowerCase()))) || null;
    const found = {
      before: find(wants.before),
      after: find(wants.after),
      video: find(wants.video),
      model: find(wants.model),
    };
    const media = Object.fromEntries(Object.entries(found).map(([kind, object]) => [kind, object ? {
      kind,
      name: object.name,
      contentType: object.contentType || null,
      size: object.size || null,
      updated: object.updated || null,
      url: signedUrl(object.name, 600),
    } : null]));

    return Response.json({ ok: true, child, expiresSeconds: 600, media });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, { status: 500 });
  }
};

export const config = { path: "/api/v21-firebase-media" };
