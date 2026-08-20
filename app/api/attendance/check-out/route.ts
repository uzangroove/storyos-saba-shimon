import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseRest } from "../../../../db";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("storyos_access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    const body = await request.json();
    const sessionId = String(body.sessionId ?? "");
    if (!sessionId) return NextResponse.json({ error: "חסר מזהה מפגש" }, { status: 400 });

    const user = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${accessToken}` } }).then(r => r.ok ? r.json() : null);
    if (!user?.id) return NextResponse.json({ error: "ההתחברות אינה תקפה" }, { status: 401 });
    const operators = await supabaseRest<any[]>("operators", {}, `auth_user_id=eq.${user.id}&select=id&limit=1`);
    if (!operators[0]) return NextResponse.json({ error: "לא נמצא מפעיל לחשבון זה" }, { status: 403 });

    const existing = await supabaseRest<any[]>("attendance_reports", {}, `session_id=eq.${sessionId}&operator_id=eq.${operators[0].id}&select=id,check_in_at,status&limit=1`);
    if (!existing[0]?.check_in_at) return NextResponse.json({ error: "לא נמצא דיווח כניסה פתוח" }, { status: 409 });

    const checkoutAt = new Date();
    const minutes = Math.max(0, Math.round((checkoutAt.getTime() - new Date(existing[0].check_in_at).getTime()) / 60000));
    const rows = await supabaseRest<any[]>("attendance_reports", {
      method: "PATCH",
      body: JSON.stringify({ status: "CHECKED_OUT", check_out_at: checkoutAt.toISOString(), actual_minutes: minutes, check_out_latitude: body.latitude ?? null, check_out_longitude: body.longitude ?? null }),
    }, `id=eq.${existing[0].id}`);
    return NextResponse.json({ attendance: rows[0] ?? null, actualMinutes: minutes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "שגיאה בדיווח יציאה" }, { status: 500 });
  }
}
