import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase Auth עדיין לא הוגדר בשרת" }, { status: 503 });
  }

  const authResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const auth = await authResponse.json();
  if (!authResponse.ok) {
    return NextResponse.json({ error: "דוא״ל או סיסמה אינם נכונים" }, { status: 401 });
  }

  const profileResponse = await fetch(`${url}/rest/v1/app_users?auth_user_id=eq.${auth.user.id}&select=role,active&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${auth.access_token}` },
  });
  const profiles = profileResponse.ok ? await profileResponse.json() : [];
  const profile = profiles[0];
  if (!profile?.active) {
    return NextResponse.json({ error: "המשתמש אינו פעיל ב־StoryOS" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, role: profile.role, redirectTo: profile.role === "ADMIN" ? "/management" : "/operator" });
  response.cookies.set("storyos_access_token", auth.access_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: auth.expires_in, path: "/" });
  response.cookies.set("storyos_refresh_token", auth.refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return response;
}
