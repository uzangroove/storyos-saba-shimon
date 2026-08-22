import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const STORAGE_SCOPE = "https://www.googleapis.com/auth/devstorage.read_only";
const DEFAULT_FIREBASE_STORAGE_BUCKET = "saba-ganim-arava.firebasestorage.app";

function base64Url(value: string | Buffer) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function readFirebaseServerEnv() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const bucket = process.env.FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_STORAGE_BUCKET;

  if (!clientEmail || !privateKey) {
    throw new Error("FIREBASE_SERVER_CONFIG_MISSING");
  }

  return { clientEmail, privateKey, bucket: bucket.replace(/^gs:\/\//, "").replace(/\/$/, "") };
}

async function getAccessToken() {
  const { clientEmail, privateKey } = readFirebaseServerEnv();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: STORAGE_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = base64Url(signer.sign(privateKey));
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) throw new Error("FIREBASE_TOKEN_EXCHANGE_FAILED");
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("FIREBASE_ACCESS_TOKEN_MISSING");
  return body.access_token;
}

export type FirebaseStorageObject = {
  name: string;
  bucket?: string;
  contentType?: string;
  size?: string;
  updated?: string;
};

export async function listFirebaseObjects(options: { prefix?: string; maxResults?: number } = {}) {
  const { bucket } = readFirebaseServerEnv();
  const accessToken = await getAccessToken();
  const params = new URLSearchParams({
    maxResults: String(Math.min(Math.max(options.maxResults ?? 1000, 1), 1000)),
    fields: "items(name,bucket,contentType,size,updated),nextPageToken",
  });
  if (options.prefix) params.set("prefix", options.prefix);

  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) throw new Error("FIREBASE_STORAGE_LIST_FAILED");
  const body = (await response.json()) as {
    items?: FirebaseStorageObject[];
    nextPageToken?: string;
  };
  return body.items ?? [];
}

export async function findFirebaseObjectsForChild(terms: string[]) {
  const objects = await listFirebaseObjects({ maxResults: 1000 });
  const normalizedTerms = terms
    .map((term) => term.trim().toLocaleLowerCase())
    .filter(Boolean);

  return objects.filter((object) => {
    const name = object.name.toLocaleLowerCase();
    return normalizedTerms.some((term) => name.includes(term));
  });
}

export function firebaseServerReady() {
  return Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}
