export type FirebaseMediaRef = {
  provider: "firebase";
  bucket: string;
  path: string;
  downloadToken?: string | null;
};

export type ResolvedMediaRef = {
  provider: "firebase";
  bucket: string;
  path: string;
  url: string | null;
  requiresAuth: boolean;
};

function normalizeBucket(bucket: string) {
  return bucket.replace(/^gs:\/\//, "").replace(/\/$/, "");
}

export function firebaseObjectUrl(ref: FirebaseMediaRef): ResolvedMediaRef {
  const bucket = normalizeBucket(ref.bucket);
  const encodedPath = encodeURIComponent(ref.path);
  const base = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}`;

  if (ref.downloadToken) {
    return {
      provider: "firebase",
      bucket,
      path: ref.path,
      url: `${base}?alt=media&token=${encodeURIComponent(ref.downloadToken)}`,
      requiresAuth: false,
    };
  }

  return {
    provider: "firebase",
    bucket,
    path: ref.path,
    url: null,
    requiresAuth: true,
  };
}

export function firebaseGsUri(ref: FirebaseMediaRef) {
  return `gs://${normalizeBucket(ref.bucket)}/${ref.path.replace(/^\//, "")}`;
}
