import { createHash, createSign } from "node:crypto";

function encodePath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function dateParts(now: Date) {
  const iso = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return { timestamp: iso, date: iso.slice(0, 8) };
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createFirebaseSignedUrl(options: {
  bucket: string;
  path: string;
  clientEmail: string;
  privateKey: string;
  expiresSeconds?: number;
  now?: Date;
}) {
  const now = options.now ?? new Date();
  const expiresSeconds = Math.min(Math.max(options.expiresSeconds ?? 600, 60), 3600);
  const bucket = options.bucket.replace(/^gs:\/\//, "").replace(/\/$/, "");
  const objectPath = encodePath(options.path);
  const { timestamp, date } = dateParts(now);
  const host = "storage.googleapis.com";
  const scope = `${date}/auto/storage/goog4_request`;
  const credential = `${options.clientEmail}/${scope}`;
  const canonicalUri = `/${encodeURIComponent(bucket)}/${objectPath}`;

  const query = new URLSearchParams({
    "X-Goog-Algorithm": "GOOG4-RSA-SHA256",
    "X-Goog-Credential": credential,
    "X-Goog-Date": timestamp,
    "X-Goog-Expires": String(expiresSeconds),
    "X-Goog-SignedHeaders": "host",
  });
  query.sort();

  const canonicalQuery = query.toString();
  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "GOOG4-RSA-SHA256",
    timestamp,
    scope,
    sha256(canonicalRequest),
  ].join("\n");

  const signer = createSign("RSA-SHA256");
  signer.update(stringToSign);
  signer.end();
  const privateKey = options.privateKey.replace(/\\n/g, "\n");
  const signature = signer.sign(privateKey).toString("hex");

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Goog-Signature=${signature}`;
}
