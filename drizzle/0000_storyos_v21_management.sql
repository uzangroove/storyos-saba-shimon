CREATE TYPE institution_type AS ENUM ('MUNICIPAL_KINDERGARTEN','PRIVATE_KINDERGARTEN','DAYCARE','NURSERY','FAMILY_DAYCARE','SCHOOL','OTHER');
CREATE TYPE verification_status AS ENUM ('OFFICIAL','VERIFIED','PARTIAL','NEEDS_VERIFICATION','UNVERIFIED');
CREATE TYPE crm_status AS ENUM ('PROSPECT','CONTACTED','MEETING','QUOTE_SENT','WON','ACTIVE','LOST','INACTIVE');
CREATE TYPE session_status AS ENUM ('PLANNED','COMPLETED','CANCELLED','POSTPONED','HOLIDAY','NO_SCHOOL','PENDING');
CREATE TYPE attendance_status AS ENUM ('NOT_STARTED','CHECKED_IN','CHECKED_OUT','REVIEW_REQUIRED','APPROVED');

CREATE TABLE institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_source_id varchar(80), name varchar(240) NOT NULL,
  type institution_type NOT NULL DEFAULT 'OTHER', ownership varchar(240), age_range_text varchar(120),
  address varchar(320), neighborhood varchar(180), city varchar(160) NOT NULL DEFAULT 'כרמיאל',
  phone varchar(80), email varchar(240), website text,
  latitude numeric(10,7), longitude numeric(10,7), education_stream varchar(160), child_count integer,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  source_name varchar(240), source_url text, source_checked_at timestamptz,
  crm_status crm_status NOT NULL DEFAULT 'PROSPECT', notes text, metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX institutions_city_idx ON institutions(city);
CREATE INDEX institutions_crm_status_idx ON institutions(crm_status);
CREATE INDEX institutions_verification_idx ON institutions(verification_status);

CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), first_name varchar(160), last_name varchar(160),
  phone varchar(80), whatsapp varchar(80), email varchar(240), photo_url text, notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE institution_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE, role varchar(160), is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(institution_id, contact_id)
);
CREATE TABLE school_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(80) NOT NULL, start_date date NOT NULL, end_date date NOT NULL, is_active boolean NOT NULL DEFAULT false
);
CREATE TABLE holiday_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_year_id uuid NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  name varchar(180) NOT NULL, sector varchar(120), source_url text, verified_at timestamptz
);
CREATE TABLE holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), calendar_id uuid NOT NULL REFERENCES holiday_calendars(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL, start_date date NOT NULL, end_date date NOT NULL, no_activity boolean NOT NULL DEFAULT true, notes text
);
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug varchar(160) NOT NULL UNIQUE, name varchar(240) NOT NULL,
  category varchar(160), description text, default_minutes integer, is_active boolean NOT NULL DEFAULT true, metadata jsonb DEFAULT '{}'::jsonb
);
CREATE TABLE books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(300) NOT NULL, author varchar(240), publisher varchar(240), isbn varchar(40), notes text, metadata jsonb DEFAULT '{}'::jsonb
);
CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider varchar(80) NOT NULL, media_type varchar(80) NOT NULL,
  title varchar(300), url text NOT NULL, storage_path text, book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL, is_public boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), auth_user_id uuid, first_name varchar(160) NOT NULL, last_name varchar(160),
  phone varchar(80), email varchar(240), photo_url text, active boolean NOT NULL DEFAULT true,
  pay_rate numeric(10,2), pay_model varchar(40), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), institution_id uuid NOT NULL REFERENCES institutions(id),
  school_year_id uuid REFERENCES school_years(id), activity_id uuid REFERENCES activities(id), title varchar(300) NOT NULL,
  pricing_model varchar(80), agreed_price numeric(12,2), currency varchar(3) NOT NULL DEFAULT 'ILS',
  start_date date, end_date date, status varchar(80) NOT NULL DEFAULT 'ACTIVE', notes text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES institutions(id), activity_id uuid REFERENCES activities(id), operator_id uuid REFERENCES operators(id),
  holiday_calendar_id uuid REFERENCES holiday_calendars(id), weekday integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL, end_time time NOT NULL, valid_from date NOT NULL, valid_to date NOT NULL, active boolean NOT NULL DEFAULT true
);
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), schedule_id uuid REFERENCES schedules(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES contracts(id), institution_id uuid NOT NULL REFERENCES institutions(id), activity_id uuid REFERENCES activities(id),
  operator_id uuid REFERENCES operators(id), session_date date NOT NULL, planned_start time NOT NULL, planned_end time NOT NULL,
  sequence_number integer, status session_status NOT NULL DEFAULT 'PLANNED', storyos_content_ref text, cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(schedule_id, session_date)
);
CREATE INDEX sessions_date_idx ON sessions(session_date);
CREATE INDEX sessions_institution_idx ON sessions(institution_id);
CREATE TABLE operator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), operator_id uuid NOT NULL REFERENCES operators(id),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE, session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  role varchar(120) NOT NULL DEFAULT 'LEAD', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE attendance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES operators(id), status attendance_status NOT NULL DEFAULT 'NOT_STARTED',
  check_in_at timestamptz, check_out_at timestamptz, actual_minutes integer,
  check_in_latitude numeric(10,7), check_in_longitude numeric(10,7), check_out_latitude numeric(10,7), check_out_longitude numeric(10,7),
  device_info jsonb DEFAULT '{}'::jsonb, notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, operator_id)
);
CREATE TABLE session_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  operator_id uuid REFERENCES operators(id), summary text, content_done text, next_session_notes text, feedback text, child_count integer,
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), institution_id uuid NOT NULL REFERENCES institutions(id), contract_id uuid REFERENCES contracts(id),
  amount numeric(12,2) NOT NULL, currency varchar(3) NOT NULL DEFAULT 'ILS', due_date date, paid_at timestamptz,
  method varchar(80), reference varchar(200), notes text, created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO school_years (name,start_date,end_date,is_active)
VALUES ('תשפ״ז 2026–2027','2026-09-01','2027-06-30',true)
ON CONFLICT DO NOTHING;
