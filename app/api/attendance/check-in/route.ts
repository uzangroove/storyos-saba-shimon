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

    const user = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((r) => (r.ok ? r.json() : null));
    if (!user?.id) return NextResponse.json({ error: "ההתחברות אינה תקפה" }, { status: 401 });

    const operators = await supabaseRest<any[]>("operators", {}, `auth_user_id=eq.${user.id}&select=id,active&limit=1`);
    const operator = operators[0];
    if (!operator?.active) return NextResponse.json({ error: "לא נמצא מפעיל פעיל לחשבון זה" }, { status: 403 });

    const sessions = await supabaseRest<any[]>(
      "sessions",
      {},
      `id=eq.${encodeURIComponent(sessionId)}&select=id,operator_id,status,session_date&limit=1`,
    );
    const session = sessions[0];
    if (!session) return NextResponse.json({ error: "המפגש לא נמצא" }, { status: 404 });
    if (["CANCELLED", "HOLIDAY", "NO_SCHOOL"].includes(session.status)) {
      return NextResponse.json({ error: "לא ניתן לדווח כניסה למפגש שאינו פעיל" }, { status: 409 });
    }

    let assigned = session.operator_id === operator.id;
    if (!assigned) {
      const assignments = await supabaseRest<any[]>(
        "operator_assignments",
        {},
        `session_id=eq.${encodeURIComponent(sessionId)}&operator_id=eq.${operator.id}&select=id&limit=1`,
      );
      assigned = Boolean(assignments[0]);
    }
    if (!assigned) return NextResponse.json({ error: "המפגש אינו משויך למפעיל זה" }, { status: 403 });

    const existing = await supabaseRest<any[]>(
      "attendance_reports",
      {},
      `session_id=eq.${encodeURIComponent(sessionId)}&operator_id=eq.${operator.id}&select=id,status,check_in_at,check_out_at&limit=1`,
    );
    if (existing[0]?.check_out_at || existing[0]?.status === "CHECKED_OUT") {
      return NextResponse.json({ error: "המפגש כבר דווח והסתיים" }, { status: 409 });
    }
    if (existing[0]?.check_in_at) {
      return NextResponse.json({ error: "כבר קיים דיווח כניסה פתוח למפגש זה" }, { status: 409 });
    }

    const rows = await supabaseRest<any[]>(
      "attendance_reports",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          session_id: sessionId,
          operator_id: operator.id,
          status: "CHECKED_IN",
          check_in_at: new Date().toISOString(),
          check_in_latitude: body.latitude ?? null,
          check_in_longitude: body.longitude ?? null,
          device_info: body.deviceInfo ?? {},
        }),
      },
      "on_conflict=session_id,operator_id",
    );

    return NextResponse.json({ attendance: rows[0] ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "שגיאה בדיווח כניסה" }, { status: 500 });
  }
}
