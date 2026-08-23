import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseRest } from "../../../../db";
import { generateSessions } from "../../../../lib/scheduling/generate-sessions";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("storyos_access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });

    const user = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((r) => (r.ok ? r.json() : null));
    if (!user?.id) return NextResponse.json({ error: "ההתחברות אינה תקפה" }, { status: 401 });

    const appUsers = await supabaseRest<any[]>("app_users", {}, `auth_user_id=eq.${user.id}&select=role,active&limit=1`);
    if (!appUsers[0]?.active || appUsers[0]?.role !== "ADMIN") {
      return NextResponse.json({ error: "רק מנהל רשאי ליצור מפגשים שנתיים" }, { status: 403 });
    }

    const body = await request.json();
    const { scheduleId } = body;
    if (!scheduleId) return NextResponse.json({ error: "חסר scheduleId" }, { status: 400 });

    const schedules = await supabaseRest<any[]>(
      "schedules",
      {},
      `id=eq.${scheduleId}&select=id,contract_id,institution_id,activity_id,operator_id,weekday,start_time,end_time,valid_from,valid_to,holiday_calendar_id&limit=1`,
    );
    const schedule = schedules[0];
    if (!schedule) return NextResponse.json({ error: "לוח הפעילות לא נמצא" }, { status: 404 });

    let holidays: any[] = [];
    if (schedule.holiday_calendar_id) {
      holidays = await supabaseRest<any[]>(
        "holidays",
        {},
        `calendar_id=eq.${schedule.holiday_calendar_id}&select=name,start_date,end_date,no_activity&order=start_date.asc`,
      );
    }

    const generated = generateSessions(
      {
        weekday: schedule.weekday,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        validFrom: schedule.valid_from,
        validTo: schedule.valid_to,
      },
      holidays.map((h) => ({ name: h.name, startDate: h.start_date, endDate: h.end_date, noActivity: h.no_activity })),
    );

    const payload = generated.map((session) => ({
      schedule_id: schedule.id,
      contract_id: schedule.contract_id,
      institution_id: schedule.institution_id,
      activity_id: schedule.activity_id,
      operator_id: schedule.operator_id,
      session_date: session.sessionDate,
      planned_start: session.plannedStart,
      planned_end: session.plannedEnd,
      sequence_number: session.sequenceNumber,
      status: session.status,
      cancellation_reason: session.holidayName,
    }));

    const rows = await supabaseRest<any[]>(
      "sessions",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(payload),
      },
      "on_conflict=schedule_id,session_date",
    );

    return NextResponse.json({ count: rows.length, sessions: rows });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "שגיאה ביצירת המפגשים" }, { status: 500 });
  }
}
