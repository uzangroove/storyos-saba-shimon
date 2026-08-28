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

## Production content baseline — v22 real runtime

The production baseline is aligned to the actual StoryOS runtime dataset currently present on the v22 branch. No content is to be silently removed during release preparation.

1. שעת סיפור בהמחשה — **30 books** in the runtime dataset.
2. כשהציור קם לתחייה — **22 meetings**.
3. תיאטרון בובות — **5 selected shows**.
4. עולם קטן, קסם גדול — **9 activities**.
5. שיר נולד בגן — **22 meetings**.

Expected total runtime items: **88**.

The previous draft note referring to 16 active Story Hour books is superseded for v22 release preparation because the branch runtime currently exposes all 30 books. If a future curated 16-book subset is desired, it must be implemented as an explicit filter/configuration and must not delete the 30-book master dataset.

## Preserve from tested releases

- five-program StoryOS home
- live-operation flow
- scanned-book/PDF/presentation support
- unified controls
- music program data
- activity graphics/assets
- existing Netlify static publish configuration
- existing demo/management infrastructure that has already passed user testing
- complete 30-book Story Hour master dataset

## Release blockers to verify

- identify exactly where the tested kindergarten/drawing demo integrations live (repository vs external service/config)
- confirm Supabase/Firebase integration points before changing production wiring
- verify the 30-book Story Hour runtime without deleting or hiding master content
- run smoke tests after integration
- verify all five activity entry points and live operation
- verify Netlify deploy preview

## Smoke-test matrix

### Home
- [ ] five activity cards visible
- [ ] each activity opens correct content
- [ ] RTL layout intact
- [ ] graphics load without broken assets
- [ ] total runtime count resolves to 88 items

### Story Hour
- [ ] 30-book program behavior confirmed
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
- [ ] visible shell identifies itself as StoryOS v22
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
