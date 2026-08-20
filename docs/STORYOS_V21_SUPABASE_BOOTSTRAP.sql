-- StoryOS V21 — Supabase Bootstrap
-- Purpose: one-shot setup for a fresh Supabase project.
-- Run in Supabase SQL Editor as a single script.

create extension if not exists pgcrypto;

-- ENUMS
DO $$ BEGIN
  CREATE TYPE institution_type AS ENUM ('MUNICIPAL_KINDERGARTEN','PRIVATE_KINDERGARTEN','DAYCARE','NURSERY','FAMILY_DAYCARE','SCHOOL','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('OFFICIAL','VERIFIED','PARTIAL','NEEDS_VERIFICATION','UNVERIFIED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE crm_status AS ENUM ('PROSPECT','CONTACTED','MEETING','QUOTE_SENT','WON','ACTIVE','LOST','INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('PLANNED','COMPLETED','CANCELLED','POSTPONED','HOLIDAY','NO_SCHOOL','PENDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('NOT_STARTED','CHECKED_IN','CHECKED_OUT','REVIEW_REQUIRED','APPROVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE app_user_role AS ENUM ('ADMIN','OPERATOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CORE TABLES
CREATE TABLE IF NOT EXISTS institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_source_id varchar(80),
  name varchar(240) NOT NULL,
  type institution_type NOT NULL DEFAULT 'OTHER',
  ownership varchar(240),
  age_range_text varchar(120),
  address varchar(320),
  neighborhood varchar(180),
  city varchar(160) NOT NULL DEFAULT 'כרמיאל',
  phone varchar(80),
  email varchar(240),
  website text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  education_stream varchar(160),
  child_count integer,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  source_name varchar(240),
  source_url text,
  source_checked_at timestamptz,
  crm_status crm_status NOT NULL DEFAULT 'PROSPECT',
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS institutions_city_idx ON institutions(city);
CREATE INDEX IF NOT EXISTS institutions_crm_status_idx ON institutions(crm_status);
CREATE INDEX IF NOT EXISTS institutions_verification_idx ON institutions(verification_status);
CREATE UNIQUE INDEX IF NOT EXISTS institutions_legacy_source_id_unique ON institutions(legacy_source_id) WHERE legacy_source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name varchar(160), last_name varchar(160), phone varchar(80), whatsapp varchar(80),
  email varchar(240), photo_url text, notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS institution_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role varchar(160), is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(institution_id, contact_id)
);

CREATE TABLE IF NOT EXISTS school_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS holiday_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_id uuid NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  name varchar(180) NOT NULL, sector varchar(120), source_url text, verified_at timestamptz
);

CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES holiday_calendars(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL, start_date date NOT NULL, end_date date NOT NULL,
  no_activity boolean NOT NULL DEFAULT true, notes text
);

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(160) NOT NULL UNIQUE,
  name varchar(240) NOT NULL,
  category varchar(160), description text, default_minutes integer,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(300) NOT NULL, author varchar(240), publisher varchar(240), isbn varchar(40),
  notes text, metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider varchar(80) NOT NULL, media_type varchar(80) NOT NULL,
  title varchar(300), url text NOT NULL, storage_path text,
  book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid,
  first_name varchar(160) NOT NULL,
  last_name varchar(160), phone varchar(80), email varchar(240), photo_url text,
  active boolean NOT NULL DEFAULT true,
  pay_rate numeric(10,2), pay_model varchar(40),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id),
  school_year_id uuid REFERENCES school_years(id),
  activity_id uuid REFERENCES activities(id),
  title varchar(300) NOT NULL,
  pricing_model varchar(80), agreed_price numeric(12,2), currency varchar(3) NOT NULL DEFAULT 'ILS',
  start_date date, end_date date, status varchar(80) NOT NULL DEFAULT 'ACTIVE', notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES institutions(id),
  activity_id uuid REFERENCES activities(id), operator_id uuid REFERENCES operators(id),
  holiday_calendar_id uuid REFERENCES holiday_calendars(id),
  weekday integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL, end_time time NOT NULL,
  valid_from date NOT NULL, valid_to date NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES schedules(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES contracts(id),
  institution_id uuid NOT NULL REFERENCES institutions(id),
  activity_id uuid REFERENCES activities(id), operator_id uuid REFERENCES operators(id),
  session_date date NOT NULL, planned_start time NOT NULL, planned_end time NOT NULL,
  sequence_number integer, status session_status NOT NULL DEFAULT 'PLANNED',
  storyos_content_ref text, cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, session_date)
);
CREATE INDEX IF NOT EXISTS sessions_date_idx ON sessions(session_date);
CREATE INDEX IF NOT EXISTS sessions_institution_idx ON sessions(institution_id);

CREATE TABLE IF NOT EXISTS operator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES operators(id),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  role varchar(120) NOT NULL DEFAULT 'LEAD',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES operators(id),
  status attendance_status NOT NULL DEFAULT 'NOT_STARTED',
  check_in_at timestamptz, check_out_at timestamptz, actual_minutes integer,
  check_in_latitude numeric(10,7), check_in_longitude numeric(10,7),
  check_out_latitude numeric(10,7), check_out_longitude numeric(10,7),
  device_info jsonb DEFAULT '{}'::jsonb, notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, operator_id)
);

CREATE TABLE IF NOT EXISTS session_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  operator_id uuid REFERENCES operators(id),
  summary text, content_done text, next_session_notes text, feedback text, child_count integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES institutions(id),
  contract_id uuid REFERENCES contracts(id),
  amount numeric(12,2) NOT NULL, currency varchar(3) NOT NULL DEFAULT 'ILS',
  due_date date, paid_at timestamptz, method varchar(80), reference varchar(200), notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(240) NOT NULL UNIQUE,
  display_name varchar(240),
  role app_user_role NOT NULL DEFAULT 'OPERATOR',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_users_role_idx ON app_users(role);
CREATE INDEX IF NOT EXISTS operators_auth_user_idx ON operators(auth_user_id);

DO $$ BEGIN
  ALTER TABLE operators ADD CONSTRAINT operators_auth_user_fk FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SCHOOL YEAR SEED
INSERT INTO school_years (name,start_date,end_date,is_active)
SELECT 'תשפ״ז 2026–2027','2026-09-01','2027-06-30',true
WHERE NOT EXISTS (SELECT 1 FROM school_years WHERE name='תשפ״ז 2026–2027');

-- ACTIVITY SEED
INSERT INTO activities (slug,name,default_minutes) VALUES
('story-hour','שעת סיפור',45),
('toddler-story','סיפור פעוטות',45),
('drawing-alive','כשהציור קם לתחייה',45),
('puppet-theater','תיאטרון בובות',45),
('song-born-kindergarten','שיר נולד בגן',45)
ON CONFLICT (slug) DO NOTHING;

-- ROLE HELPER
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS app_user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.app_users WHERE auth_user_id = auth.uid() AND active = true LIMIT 1;
$$;

-- RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_users_self_or_admin_select ON app_users;
CREATE POLICY app_users_self_or_admin_select ON app_users FOR SELECT TO authenticated
USING (auth_user_id = auth.uid() OR public.current_app_role() = 'ADMIN');

DROP POLICY IF EXISTS admin_institutions_all ON institutions;
CREATE POLICY admin_institutions_all ON institutions FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
DROP POLICY IF EXISTS admin_contacts_all ON contacts;
CREATE POLICY admin_contacts_all ON contacts FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
DROP POLICY IF EXISTS admin_institution_contacts_all ON institution_contacts;
CREATE POLICY admin_institution_contacts_all ON institution_contacts FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
DROP POLICY IF EXISTS admin_contracts_all ON contracts;
CREATE POLICY admin_contracts_all ON contracts FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
DROP POLICY IF EXISTS admin_schedules_all ON schedules;
CREATE POLICY admin_schedules_all ON schedules FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
DROP POLICY IF EXISTS admin_sessions_all ON sessions;
CREATE POLICY admin_sessions_all ON sessions FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
DROP POLICY IF EXISTS admin_operators_all ON operators;
CREATE POLICY admin_operators_all ON operators FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
DROP POLICY IF EXISTS admin_assignments_all ON operator_assignments;
CREATE POLICY admin_assignments_all ON operator_assignments FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
DROP POLICY IF EXISTS admin_attendance_all ON attendance_reports;
CREATE POLICY admin_attendance_all ON attendance_reports FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
DROP POLICY IF EXISTS admin_session_reports_all ON session_reports;
CREATE POLICY admin_session_reports_all ON session_reports FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
DROP POLICY IF EXISTS admin_payments_all ON payments;
CREATE POLICY admin_payments_all ON payments FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');

DROP POLICY IF EXISTS operator_self_select ON operators;
CREATE POLICY operator_self_select ON operators FOR SELECT TO authenticated
USING (auth_user_id = auth.uid() OR public.current_app_role() = 'ADMIN');

DROP POLICY IF EXISTS operator_assigned_sessions_select ON sessions;
CREATE POLICY operator_assigned_sessions_select ON sessions FOR SELECT TO authenticated
USING (
  public.current_app_role() = 'ADMIN' OR EXISTS (
    SELECT 1 FROM operators o WHERE o.id = sessions.operator_id AND o.auth_user_id = auth.uid() AND o.active = true
  ) OR EXISTS (
    SELECT 1 FROM operator_assignments oa JOIN operators o ON o.id = oa.operator_id
    WHERE oa.session_id = sessions.id AND o.auth_user_id = auth.uid() AND o.active = true
  )
);

DROP POLICY IF EXISTS operator_attendance_select ON attendance_reports;
CREATE POLICY operator_attendance_select ON attendance_reports FOR SELECT TO authenticated
USING (public.current_app_role() = 'ADMIN' OR EXISTS (SELECT 1 FROM operators o WHERE o.id = attendance_reports.operator_id AND o.auth_user_id = auth.uid()));
DROP POLICY IF EXISTS operator_attendance_insert ON attendance_reports;
CREATE POLICY operator_attendance_insert ON attendance_reports FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM operators o WHERE o.id = attendance_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true));
DROP POLICY IF EXISTS operator_attendance_update ON attendance_reports;
CREATE POLICY operator_attendance_update ON attendance_reports FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM operators o WHERE o.id = attendance_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true))
WITH CHECK (EXISTS (SELECT 1 FROM operators o WHERE o.id = attendance_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true));

DROP POLICY IF EXISTS operator_session_reports_select ON session_reports;
CREATE POLICY operator_session_reports_select ON session_reports FOR SELECT TO authenticated
USING (public.current_app_role() = 'ADMIN' OR EXISTS (SELECT 1 FROM operators o WHERE o.id = session_reports.operator_id AND o.auth_user_id = auth.uid()));
DROP POLICY IF EXISTS operator_session_reports_insert ON session_reports;
CREATE POLICY operator_session_reports_insert ON session_reports FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM operators o WHERE o.id = session_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true));
DROP POLICY IF EXISTS operator_session_reports_update ON session_reports;
CREATE POLICY operator_session_reports_update ON session_reports FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM operators o WHERE o.id = session_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true))
WITH CHECK (EXISTS (SELECT 1 FROM operators o WHERE o.id = session_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true));

-- SANITY CHECK
SELECT
  (SELECT count(*) FROM school_years) AS school_years,
  (SELECT count(*) FROM activities) AS activities,
  (SELECT count(*) FROM institutions) AS institutions,
  (SELECT count(*) FROM app_users) AS app_users;
