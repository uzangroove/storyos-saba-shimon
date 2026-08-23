export default async (_req: Request) => {
  const clientEmail = Netlify.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKey = Netlify.env.get("FIREBASE_PRIVATE_KEY");
  const bucket = Netlify.env.get("FIREBASE_STORAGE_BUCKET") || "saba-ganim-arava.firebasestorage.app";

  return Response.json({
    ok: true,
    configured: Boolean(clientEmail && privateKey),
    bucket,
  });
};

export const config = {
  path: "/api/v21-firebase-status",
};
