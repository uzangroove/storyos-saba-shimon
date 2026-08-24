# StoryOS v22 — Production Release Plan

Branch: `release/storyos-v22-production`
Date: 2026-08-24

## Goal

Produce one stable StoryOS production release from the latest tested release line, without deleting or overwriting v20, v21, or main history.

## Current branch lineage

- `main`
- `release/storyos-v20`
- `release/storyos-v21-management`
- `release/storyos-v22-production` (current)

v21 is one commit ahead of v20 and carries the management/data-model documentation. v22 was created from v21.

## Netlify

Project: `storyos-saba-shimon`
Site ID: `beab9c9f-5e81-46e5-a7bd-a1bb7a5f3a6c`
Publish directory: `public`

Production promotion must happen only after branch QA and explicit final approval.

## Production content baseline

1. שעת סיפור בהמחשה — 16 active books in the current program definition. The repository still contains the older 30-book expansion dataset; do not delete it during v22. Production UI behavior must be verified before merge.
2. כשהציור קם לתחייה — 22 meetings.
3. תיאטרון בובות — 5 selected shows.
4. עולם קטן, קסם גדול — 9 activities.
5. שיר נולד בגן — 22 meetings.

## Preserve from tested releases

- five-program StoryOS home
- live-operation flow
- scanned-book/PDF/presentation support
- unified controls
- music program data
- activity graphics/assets
- existing Netlify static publish configuration
- existing demo/management infrastructure that has already passed user testing

## Release blockers to verify

- identify exactly where the tested kindergarten/drawing demo integrations live (repository vs external service/config)
- confirm Supabase/Firebase integration points before changing production wiring
- reconcile the active 16-book Story Hour program with the legacy 30-book repository dataset without deleting expansion content
- run smoke tests after integration
- verify all five activity entry points and live operation
- verify Netlify deploy preview

## Smoke-test matrix

### Home
- [ ] five activity cards visible
- [ ] each activity opens correct content
- [ ] RTL layout intact
- [ ] graphics load without broken assets

### Story Hour
- [ ] active 16-book program behavior confirmed
- [ ] book detail cards work
- [ ] live 45-minute operation works
- [ ] PDF/presentation/book viewer works where configured

### Drawing Comes Alive
- [ ] 22 meetings available
- [ ] tested kindergarten example opens
- [ ] gallery/data persistence works
- [ ] external backend/storage connection verified

### Puppet Theater
- [ ] five selected shows available
- [ ] details and operation flow work

### Little World, Big Magic
- [ ] nine activities available
- [ ] age group data and operation flow work

### A Song Is Born in Kindergarten
- [ ] 22 meetings available
- [ ] music data loads
- [ ] live operation controls work

### Deployment
- [ ] Netlify branch deploy ready
- [ ] no console-blocking errors
- [ ] main remains untouched until approval
- [ ] rollback path documented

## Promotion sequence

1. Complete integration on `release/storyos-v22-production`.
2. Run local/static smoke tests.
3. Run Netlify branch/deploy preview.
4. User performs visual/functional check.
5. Fix only release blockers.
6. Merge v22 to `main`.
7. Confirm production deploy.
8. Tag/document final release state.

## Rollback

If production has a regression, restore `main` to its pre-v22 release commit or redeploy the previous known-good Netlify deploy. v20 and v21 branches remain available as preserved checkpoints.
