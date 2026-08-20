import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import institutions from "../../../../data/karmiel-institutions-seed.json";
import { supabaseRest } from "../../../../db";

function normalizeType(raw: string | null | undefined) {
  const value = raw ?? "";
  if (value.includes("משפחתון")) return "FAMILY_DAYCARE";
  if (value.includes("פעוטון")) return "NURSERY";
  if (value.includes("מעון")) return "DAYCARE";
  if (value.includes("גן") || value.includes("חובה") || value.includes("טרום")) return "MUNICIPAL_KINDERGARTEN";
  return "OTHER";
}

function verificationStatus(raw: string | null | undefined) {
  const value = raw ?? "";
  if (value.includes("✅") || value.includes("רשמי") || value.includes("התאחדות")) return "VERIFIED";
  if (value.includes("דורש אימות")) return "NEEDS_VERIFICATION";
  if (value) return "PARTIAL";
  return "UNVERIFIED";
}

export async function POST() {
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
      return NextResponse.json({ error: "רק מנהל רשאי לייבא את מאגר המסגרות" }, { status: 403 });
    }

    const payload = institutions.map((item) => ({
      legacy_source_id: item.legacySourceId,
      name: item.name,
      type: normalizeType(item.typeRaw),
      ownership: item.ownership ?? null,
      age_range_text: item.ages ?? null,
      address: item.address ?? null,
      neighborhood: item.neighborhood ?? null,
      city: "כרמיאל",
      phone: item.phone ?? null,
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      verification_status: verificationStatus(item.verificationRaw),
      source_name: item.verificationRaw ?? "Seed imported from Karmiel PDF",
      source_url: item.sourceUrl ?? null,
      crm_status: "PROSPECT",
      metadata: {
        typeRaw: item.typeRaw,
        verificationRaw: item.verificationRaw,
        importedFrom: "karmiel-institutions-seed.json",
      },
    }));

    const rows = await supabaseRest<any[]>(
      "institutions",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(payload),
      },
      "on_conflict=legacy_source_id",
    );

    return NextResponse.json({ imported: rows.length, institutions: rows });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "שגיאה בייבוא המסגרות" }, { status: 500 });
  }
}
