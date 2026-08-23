import { NextResponse } from "next/server";
import { supabaseRest } from "../../../../db";

export async function GET() {
  const env = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      ok: false,
      env,
      database: { reachable: false, reason: "MISSING_ENV" },
      counts: null,
    });
  }

  try {
    const [institutions, schoolYears, appUsers, operators] = await Promise.all([
      supabaseRest<any[]>("institutions", {}, "select=id&limit=1000"),
      supabaseRest<any[]>("school_years", {}, "select=id,name,is_active&limit=20"),
      supabaseRest<any[]>("app_users", {}, "select=id,role,active&limit=100"),
      supabaseRest<any[]>("operators", {}, "select=id,active&limit=100"),
    ]);

    return NextResponse.json({
      ok: true,
      env,
      database: { reachable: true },
      counts: {
        institutions: institutions.length,
        schoolYears: schoolYears.length,
        activeSchoolYears: schoolYears.filter((x) => x.is_active).length,
        appUsers: appUsers.length,
        admins: appUsers.filter((x) => x.role === "ADMIN" && x.active).length,
        operators: operators.length,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      env,
      database: { reachable: false, reason: error instanceof Error ? error.message : "UNKNOWN" },
      counts: null,
    });
  }
}
