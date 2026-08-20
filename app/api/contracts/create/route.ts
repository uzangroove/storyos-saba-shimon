import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseRest } from "../../../../db";
import { generateSessions } from "../../../../lib/scheduling/generate-sessions";

async function requireAdmin() {
  const accessToken = (await cookies()).get("storyos_access_token")?.value;
  if (!accessToken) return null;
  const user = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${accessToken}` } }).then(r => r.ok ? r.json() : null);
  if (!user?.id) return null;
  const appUsers = await supabaseRest<any[]>("app_users", {}, `auth_user_id=eq.${user.id}&select=role,active&limit=1`);
  return appUsers[0]?.active && appUsers[0]?.role === "ADMIN" ? user : null;
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "נדרשת הרשאת מנהל" }, { status: 403 });
    const body = await request.json();
    const institutions = await supabaseRest<any[]>("institutions", {}, `legacy_source_id=eq.${encodeURIComponent(body.legacySourceId)}&select=id,name&limit=1`);
    const institution = institutions[0];
    if (!institution) return NextResponse.json({ error: "המסגרת עדיין לא יובאה ל-Supabase" }, { status: 404 });

    const years = await supabaseRest<any[]>("school_years", {}, "is_active=eq.true&select=id&limit=1");
    const year = years[0];
    if (!year) return NextResponse.json({ error: "לא הוגדרה שנת לימודים פעילה" }, { status: 400 });

    let activityId = null;
    if (body.activitySlug) {
      const activities = await supabaseRest<any[]>("activities", {}, `slug=eq.${encodeURIComponent(body.activitySlug)}&select=id&limit=1`);
      activityId = activities[0]?.id ?? null;
    }

    const contracts = await supabaseRest<any[]>("contracts", { method: "POST", body: JSON.stringify({ institution_id: institution.id, school_year_id: year.id, activity_id: activityId, title: body.title, pricing_model: body.pricingModel, agreed_price: body.agreedPrice, start_date: body.validFrom, end_date: body.validTo, status: "ACTIVE" }) });
    const contract = contracts[0];

    const calendars = await supabaseRest<any[]>("holiday_calendars", {}, `school_year_id=eq.${year.id}&select=id&limit=1`);
    const calendarId = calendars[0]?.id ?? null;
    const schedules = await supabaseRest<any[]>("schedules", { method: "POST", body: JSON.stringify({ contract_id: contract.id, institution_id: institution.id, activity_id: activityId, holiday_calendar_id: calendarId, weekday: body.weekday, start_time: body.startTime, end_time: body.endTime, valid_from: body.validFrom, valid_to: body.validTo, active: true }) });
    const schedule = schedules[0];

    let holidays: any[] = [];
    if (calendarId) holidays = await supabaseRest<any[]>("holidays", {}, `calendar_id=eq.${calendarId}&select=name,start_date,end_date,no_activity`);
    const generated = generateSessions({ weekday: body.weekday, startTime: body.startTime, endTime: body.endTime, validFrom: body.validFrom, validTo: body.validTo }, holidays.map(h => ({ name: h.name, startDate: h.start_date, endDate: h.end_date, noActivity: h.no_activity })));
    const payload = generated.map(s => ({ schedule_id: schedule.id, contract_id: contract.id, institution_id: institution.id, activity_id: activityId, session_date: s.sessionDate, planned_start: s.plannedStart, planned_end: s.plannedEnd, sequence_number: s.sequenceNumber, status: s.status, cancellation_reason: s.holidayName }));
    const sessions = body.generateSessions ? await supabaseRest<any[]>("sessions", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(payload) }, "on_conflict=schedule_id,session_date") : [];
    return NextResponse.json({ contract, schedule, sessionsCreated: sessions.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "שגיאה ביצירת התקשרות" }, { status: 500 });
  }
}
