# StoryOS V22 — Controlled V21 Integration Plan

Status: staged integration only. No merge to `main` and no production deployment without explicit approval.

## Goal

Bring the proven V21 management/data work into the V22 release line without destabilizing the existing 88-item StoryOS runtime.

## Integration order

1. PostgreSQL/Supabase server data layer.
2. Auth schema and server-only credentials contract.
3. Management APIs.
4. Management / login / operator UI.
5. Drawing Alive canonical data model.
6. Firebase server-side media discovery and signed URLs.
7. Preview build, smoke tests, responsive/RTL QA.
8. Draft PR only after preview passes.

## Guardrails

- Keep the existing static StoryOS runtime intact during data-layer integration.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or Firebase private credentials to browser code.
- Do not commit real secrets.
- Do not migrate or import production data until the preview environment is isolated and verified.
- Do not deploy to the primary Netlify production URL during this integration stage.

## Current gap confirmed

The V22 release branch currently still has the legacy/empty database scaffold while `feature/v21-supabase-schema` contains the PostgreSQL/Supabase schema, server adapter, management APIs, management UI, Drawing Alive model, and Firebase media integration.

## First implementation checkpoint

Create an isolated integration branch from V22 and move only the server data foundation first:

- `.env.example`
- `db/schema.ts`
- `db/auth-schema.ts`
- `db/index.ts`
- `drizzle.config.ts`

Then run code/build checks before moving any UI or API route.
