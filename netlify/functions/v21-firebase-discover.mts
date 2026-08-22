import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const STORAGE_SCOPE = "https://www.googleapis.com/auth/devstorage.read_only";
const DEFAULT_BUCKET = "saba-ganim-arava.firebasestorage.app";

const CHILDREN: Record<string, string> = {
  ben: "ben",
  eylon: "eylon",
  guy: "guy",
  dori: "dori",
  odaya: "odaya",
  vova: "vova",
  jera: "jera",
  tomy: "tomy",
  yoav: "yoav",
  liav: "liav",
  leny: "leny",
  mariane: "mariane",
  nely: "nely",
  "omer-b": "omer_b",
  "omer-vav": "omer_vav",
  tsofia: "tsofia",
  rom: "rom",
  ron: "ron",
  rafael: "rafael",
  shir: "shir",
  tom: "tom",
  tamar: "tamar",
};

function base64Url(value: string | Buffer) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
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

async function getAccessToken() {
  const { clientEmail, privateKey } = getConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({ iss: clientEmail, scope: STORAGE_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) throw new Error(`FIREBASE_TOKEN_EXCHANGE_FAILED:${response.status}`);
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("FIREBASE_ACCESS_TOKEN_MISSING");
  return body.access_token;
}

async function listObjects() {
  const { bucket } = getConfig();
  const token = await getAccessToken();
  const params = new URLSearchParams({ maxResults: "1000", fields: "items(name,contentType,size,updated),nextPageToken" });
  const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`FIREBASE_STORAGE_LIST_FAILED:${response.status}`);
  const body = (await response.json()) as { items?: Array<{ name: string; contentType?: string; size?: string; updated?: string }> };
  return body.items ?? [];
}

function expectedFiles(stem: string) {
  return [`${stem}_before.jpg`, `${stem}_after.png`, `${stem}_video.mp4`, `${stem}_3dmodel.glb`];
}

function statusForChild(slug: string, objects: Array<{ name: string }>) {
  const stem = CHILDREN[slug];
  const expected = expectedFiles(stem);
  const lowerNames = objects.map((object) => object.name.toLowerCase());
  const files = Object.fromEntries(expected.map((name) => [name, lowerNames.some((objectName) => objectName.endsWith(name.toLowerCase()))]));
  const matchedCount = expected.filter((name) => files[name]).length;
  return { child: slug, expectedCount: expected.length, matchedCount, ready: matchedCount === expected.length, files };
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const child = (url.searchParams.get("child") || "all").toLowerCase();
    const objects = await listObjects();

    if (child === "all") {
      return Response.json({
        ok: true,
        children: Object.keys(CHILDREN).map((slug) => statusForChild(slug, objects)),
      });
    }

    if (!CHILDREN[child]) return Response.json({ error: "UNKNOWN_CHILD" }, { status: 400 });
    return Response.json({ ok: true, ...statusForChild(child, objects) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, { status: 500 });
  }
};

export const config = { path: "/api/v21-firebase-discover" };
