# StoryOS v21 — Management Data Model

## Goal
Turn StoryOS into one operational system for institutions, contacts, contracts, schedules, sessions, operators, attendance, content/media and finance.

## Architecture decision
- Frontend: StoryOS Web
- Production hosting: Netlify
- Primary backend target: Supabase (PostgreSQL + Auth + Storage)
- Video: YouTube/external provider where appropriate; store references in `media`
- Local/home server: backup/archive, not the primary production server
- Mobile operator app: future PWA using the same backend

## Core entities

### institutions
Represents kindergartens, daycare centers, nurseries, family daycare and other education institutions.

Important fields: name, type, ownership, ages, address, neighborhood, city, phone, email, website, map coordinates, education stream, holiday calendar, verification status, source metadata and CRM status.

### contacts / institution_contacts
People connected to an institution: kindergarten teacher, director, assistant, coordinator or other contact. A person can be connected to more than one institution.

### school_years / holidays
School-year definitions and Ministry of Education closure/holiday dates. Holiday calendars are independent so different institutions/sectors can use different calendars.

### activities / books / media
StoryOS content catalog. `media` stores metadata and references, not large video blobs in the relational database. Providers may include Supabase Storage, YouTube, local archive or another external provider.

### contracts
A commercial engagement with an institution for a school year: activity/program, pricing model, agreed price, dates and status.

### schedules
Recurring scheduling rule, e.g. every Tuesday 09:00–09:45. A schedule generates individual `sessions` while respecting the relevant holiday calendar.

### sessions
The source of truth for each planned/actual meeting. Stores planned date/time, institution, contract, activity, operator, status and links to StoryOS content.

### session_reports
Pedagogical/operational report: what was actually done, notes, next-session notes, feedback and attachments.

### operators / operator_assignments
Operators who deliver activities and their assignment to sessions/contracts.

### attendance_reports
Separate from session reports. Stores operator check-in/check-out, actual duration, optional location and reporting metadata. This supports a future mobile/PWA attendance application and later payroll calculations.

### payments
Operational payment tracking tied to contracts/institutions. Full accounting/invoicing integration can be added later.

## Key design rules
1. Planned schedule and actual attendance are never overwritten into one value.
2. Session content report and employee attendance report remain separate.
3. Files live in object/media storage; database rows contain metadata and references.
4. Imported data keeps source and verification status; estimates must not become verified facts.
5. The original Karmiel garden list is seed data, not the permanent schema.
6. Existing StoryOS activity content remains usable; v21 adds the management layer rather than replacing the player/content system.

## CRM lifecycle
`PROSPECT -> CONTACTED -> MEETING -> QUOTE_SENT -> WON -> ACTIVE`

Alternative terminal states: `LOST`, `INACTIVE`.

## Session lifecycle
`PLANNED`, `COMPLETED`, `CANCELLED`, `POSTPONED`, `HOLIDAY`, `NO_SCHOOL`, `PENDING`.

## Attendance lifecycle
`NOT_STARTED`, `CHECKED_IN`, `CHECKED_OUT`, `REVIEW_REQUIRED`, `APPROVED`.

## Seed import notes
The supplied Karmiel list contains roughly 97 institution records and already includes much of: name, institution type, ages, address, neighborhood, ownership/network, phone for some rows, verification/source metadata, latitude and longitude for many rows.

Fields to enrich later include: named teacher/director contacts, mobile/WhatsApp, email, contact photos, institution photos, actual child count, sales status, contract, pricing, schedule, sessions and payments.

Coordinates equal to `0,0`, missing phones, estimated ages and records marked as requiring verification must remain explicitly unverified during import.

## First real operational case
The first confirmed recurring engagement should be represented as an institution + contact + contract + recurring schedule + generated sessions. Do not merge it with a seed-list row until the institution identity is verified.
