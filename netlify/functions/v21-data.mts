async function supabase(path: string) {
  const url = Netlify.env.get("SUPABASE_URL") || "https://apkkochvspxjopoftpad.supabase.co";
  const secret = Netlify.env.get("SUPABASE_SECRET_KEY") || Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) throw new Error("Supabase secret key is not configured");

  const headers: Record<string, string> = {
    apikey: secret,
    Accept: "application/json",
  };

  // Supabase's current sb_secret_* keys are opaque API keys, not JWTs.
  // Sending them as Authorization: Bearer makes PostgREST try to parse them
  // as a JWT and can produce PGRST303 / JWT validation errors.
  // Legacy service_role keys are JWTs and still require the Bearer header.
  if (!secret.startsWith("sb_secret_") && !secret.startsWith("sb_publishable_")) {
    headers.Authorization = `Bearer ${secret}`;
  }

  const response = await fetch(`${url}/rest/v1/${path}`, { headers });
  if (!response.ok) {
    const body = await response.text();
    console.error("StoryOS Supabase request failed", response.status, body);
    throw new Error(`Supabase request failed: ${response.status}`);
  }
  return response.json();
}

export default async (_req: Request) => {
  try {
    const [institutions, keren, sessions] = await Promise.all([
      supabase("institutions?select=id,name,neighborhood,phone,crm_status,verification_status&order=name.asc&limit=120"),
      supabase("institutions?legacy_source_id=eq.FIRST-CLIENT-KEREN&select=id,name,neighborhood,crm_status,contracts(id,title,agreed_price,start_date,end_date,schedules(id,weekday,start_time,end_time,valid_from,valid_to,operators(first_name,last_name)))&limit=1"),
      supabase("sessions?select=id,session_date,planned_start,planned_end,status,cancellation_reason,institutions(name),operators(first_name,last_name)&order=session_date.asc&limit=120"),
    ]);

    const rows = Array.isArray(institutions) ? institutions : [];
    const sessionRows = Array.isArray(sessions) ? sessions : [];
    return Response.json({
      institutions: rows,
      stats: {
        institutions: rows.length,
        withPhone: rows.filter((x: any) => x.phone).length,
        givatRam: rows.filter((x: any) => String(x.neighborhood || "").includes("גבעת רם")).length,
        needsVerification: rows.filter((x: any) => ["NEEDS_VERIFICATION", "UNVERIFIED"].includes(x.verification_status)).length,
      },
      keren: Array.isArray(keren) ? keren[0] ?? null : null,
      sessions: sessionRows,
      sessionStats: {
        total: sessionRows.length,
        planned: sessionRows.filter((x: any) => x.status === "PLANNED").length,
        holiday: sessionRows.filter((x: any) => x.status === "HOLIDAY").length,
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
};

export const config = {
  path: "/api/v21-data",
};
