type SupabaseEnv = {
  url: string;
  serviceRoleKey: string;
};

function readServerEnv(): SupabaseEnv {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "StoryOS v21 Supabase environment is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server. Never expose the service-role key to browser code.",
    );
  }

  return { url, serviceRoleKey };
}

export function getSupabaseServerConfig() {
  return readServerEnv();
}

export async function supabaseRest<T>(
  table: string,
  init: RequestInit = {},
  query = "",
): Promise<T> {
  const { url, serviceRoleKey } = readServerEnv();
  const suffix = query ? `?${query}` : "";
  const response = await fetch(`${url}/rest/v1/${table}${suffix}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase REST ${response.status}: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export * as schema from "./schema";
