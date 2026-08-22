import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import manifest from "../../../../../data/gan-arava-drawing-alive.json";
import { supabaseRest } from "../../../../../db";
import {
  findFirebaseObjectsForChild,
  firebaseServerReady,
} from "../../../../../lib/media/firebase-service-account";

async function requireAdmin() {
  const accessToken = (await cookies()).get("storyos_access_token")?.value;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!accessToken || !supabaseUrl || !serverKey) return null;

  const user = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      apikey: serverKey,
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((response) => (response.ok ? response.json() : null));
  if (!user?.id) return null;

  const appUsers = await supabaseRest<any[]>(
    "app_users",
    {},
    `auth_user_id=eq.${user.id}&select=role,active&limit=1`,
  );
  return appUsers[0]?.active && appUsers[0]?.role === "ADMIN" ? user : null;
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "נדרשת הרשאת מנהל" }, { status: 403 });
  }

  if (!firebaseServerReady()) {
    return NextResponse.json(
      {
        ok: false,
        code: "FIREBASE_SERVER_CONFIG_MISSING",
        message: "חיבור Firebase מוכן בקוד אך עדיין חסרים פרטי Service Account בשרת.",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const childSlug = url.searchParams.get("child")?.trim();
  if (!childSlug) {
    return NextResponse.json({ error: "חסר child" }, { status: 400 });
  }

  const child = manifest.children.find((item) => item.slug === childSlug);
  if (!child) {
    return NextResponse.json({ error: "הילד/ה לא נמצא/ה בפיילוט" }, { status: 404 });
  }

  try {
    const fileTerms = [
      child.slug,
      child.before.replace(/\.[^.]+$/, ""),
      child.after.replace(/\.[^.]+$/, ""),
      child.video.replace(/\.[^.]+$/, ""),
      child.model.replace(/\.[^.]+$/, ""),
    ];
    const objects = await findFirebaseObjectsForChild(fileTerms);

    return NextResponse.json({
      ok: true,
      child: { name: child.name, slug: child.slug },
      bucket: manifest.garden.storageBucket,
      expected: {
        before: child.before,
        after: child.after,
        video: child.video,
        model: child.model,
      },
      matches: objects,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "FIREBASE_DISCOVERY_FAILED",
        message: "לא ניתן היה לקרוא כרגע את רשימת הקבצים מ-Firebase Storage.",
      },
      { status: 502 },
    );
  }
}
