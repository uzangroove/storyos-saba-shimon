# StoryOS V21 — Supabase setup

## Architecture

StoryOS remains a Web application. Netlify serves the application UI; Supabase provides PostgreSQL, Auth and Storage. Large video content should normally be referenced from a video provider rather than served from Netlify.

## Required server environment

- `DATABASE_URL` — PostgreSQL connection string used for schema migrations.
- `SUPABASE_URL` — Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only credential for trusted StoryOS server operations.

The service-role key must never be exposed in browser JavaScript or committed to GitHub.

## Runtime access

`db/index.ts` contains the server-side REST adapter. It intentionally has no new npm dependency so V21 can move away from the old Cloudflare D1 runtime without creating a package-lock mismatch during this migration step.

The Drizzle schema in `db/schema.ts` remains the source of truth for PostgreSQL structure and migrations.

## Deployment sequence

1. Create the Supabase project.
2. Add the three server environment variables locally and in the deployment environment.
3. Generate and apply the PostgreSQL migration from `db/schema.ts`.
4. Verify the schema and basic read/write operations.
5. Import institution seed data.
6. Build the Management UI.
7. Add Supabase Auth/RLS before operator accounts are enabled.

## Security rule

Until authentication and Row Level Security are configured, management writes must remain server-side only. Do not expose the service-role key or direct privileged write access to the client.
