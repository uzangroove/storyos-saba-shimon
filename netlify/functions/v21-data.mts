function candidateSupabaseUrls() {
  const urls: string[] = [];
  const add = (value?: string | null) => {
    const normalized = value?.replace(/\/$/, "");
    if (normalized && !urls.includes(normalized)) urls.push(normalized);
  };

  add(Netlify.env.get("SUPABASE_URL"));

  const databaseUrl = Netlify.env.get("DATABASE_URL");
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      const directHostMatch = parsed.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
      if (directHostMatch?.[1]) add(`https://${directHostMatch[1]}.supabase.co`);

      const poolerUserMatch = decodeURIComponent(parsed.username || "").match(/^postgres\.([a-z0-9]+)$/i);
      if (poolerUserMatch?.[1]) add(`https://${poolerUserMatch[1]}.supabase.co`);
    } catch {
      // Keep trying the explicit and known project URLs below.
    }
  }

  add("https://apkkochvspxjopoftpad.supabase.co");
  return urls;
}

function supabaseHeaders(secret: string) {
  const headers: Record<string, string> = {
    apikey: secret,
    Accept: "application/json",
    "User-Agent": "StoryOS-V21-Netlify-Backend/1.1",
  };

  // Opaque sb_secret_* keys belong in `apikey` only.
  // Legacy service_role keys are JWTs and also require Authorization: Bearer.
  if (!secret.startsWith("sb_secret_") && !secret.startsWith("sb_publishable_")) {
    headers.Authorization = `Bearer ${secret}`;
  }
  return headers;
}

async function supabase(path: string) {
  const secret = Netlify.env.get("SUPABASE_SECRET_KEY") || Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) throw new Error("SUPABASE_SERVER_KEY_MISSING");

  const urls = candidateSupabaseUrls();
  const attempts: Array<{ host: string; status: number }> = [];

  for (const url of urls) {
    const response = await fetch(`${url}/rest/v1/${path}`, { headers: supabaseHeaders(secret) });
    if (response.ok) return response.json();

    attempts.push({ host: new URL(url).hostname, status: response.status });
    const body = await response.text();
    console.error("StoryOS Supabase request failed", {
      status: response.status,
      projectHost: new URL(url).hostname,
      body,
    });

    // Only fail over to another project URL for authentication/not-found style failures.
    if (![401, 403, 404].includes(response.status)) {
      throw new Error(`SUPABASE_HTTP_${response.status}`);
    }
  }

  const all401 = attempts.length > 0 && attempts.every((attempt) => attempt.status === 401);
  if (all401) throw new Error("SUPABASE_KEY_PROJECT_MISMATCH_401");
  throw new Error(`SUPABASE_CONNECTION_FAILED_${attempts.map((a) => a.status).join("_") || "UNKNOWN"}`);
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
      ok: true,
      apiVersion: "v21-data-1.1",
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
    return Response.json({
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      apiVersion: "v21-data-1.1",
    }, { status: 500 });
  }
};

export const config = {
  path: "/api/v21-data",
};
