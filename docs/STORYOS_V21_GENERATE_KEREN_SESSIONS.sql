-- StoryOS V21 — יצירת כל מפגשי גן קרן לתשפ״ז
-- יום שלישי 09:00–09:45, 01.09.2026–30.06.2027
-- כל ימי שלישי נוצרים; מועדים בתוך חופשה נשמרים כ-HOLIDAY ולא נמחקים.
-- כך נשמרת היסטוריה מלאה וניתן לחשב מחדש את הלוח בעתיד.

DO $$
DECLARE
  v_schedule_id uuid;
  v_contract_id uuid;
  v_institution_id uuid;
  v_activity_id uuid;
  v_operator_id uuid;
  v_calendar_id uuid;
BEGIN
  SELECT
    s.id,
    s.contract_id,
    s.institution_id,
    s.activity_id,
    s.operator_id,
    s.holiday_calendar_id
  INTO
    v_schedule_id,
    v_contract_id,
    v_institution_id,
    v_activity_id,
    v_operator_id,
    v_calendar_id
  FROM public.schedules s
  JOIN public.institutions i ON i.id = s.institution_id
  WHERE i.legacy_source_id = 'FIRST-CLIENT-KEREN'
    AND s.valid_from = '2026-09-01'
    AND s.valid_to = '2027-06-30'
    AND s.active = true
  ORDER BY s.id
  LIMIT 1;

  IF v_schedule_id IS NULL THEN
    RAISE EXCEPTION 'Active Keren schedule not found';
  END IF;

  IF v_calendar_id IS NULL THEN
    RAISE EXCEPTION 'Keren schedule has no holiday calendar assigned';
  END IF;

  WITH tuesdays AS (
    SELECT gs::date AS session_date
    FROM generate_series('2026-09-01'::date, '2027-06-30'::date, interval '1 day') gs
    WHERE extract(dow FROM gs) = 2
  ),
  classified AS (
    SELECT
      t.session_date,
      h.name AS holiday_name,
      CASE WHEN h.id IS NULL THEN 'PLANNED'::session_status ELSE 'HOLIDAY'::session_status END AS status
    FROM tuesdays t
    LEFT JOIN LATERAL (
      SELECT h.id, h.name
      FROM public.holidays h
      WHERE h.calendar_id = v_calendar_id
        AND h.no_activity = true
        AND t.session_date BETWEEN h.start_date AND h.end_date
      ORDER BY h.start_date
      LIMIT 1
    ) h ON true
  ),
  numbered AS (
    SELECT
      session_date,
      holiday_name,
      status,
      CASE
        WHEN status = 'PLANNED'::session_status THEN
          count(*) FILTER (WHERE status = 'PLANNED'::session_status)
          OVER (ORDER BY session_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
        ELSE NULL
      END::integer AS sequence_number
    FROM classified
  )
  INSERT INTO public.sessions
  (
    schedule_id,
    contract_id,
    institution_id,
    activity_id,
    operator_id,
    session_date,
    planned_start,
    planned_end,
    sequence_number,
    status,
    cancellation_reason
  )
  SELECT
    v_schedule_id,
    v_contract_id,
    v_institution_id,
    v_activity_id,
    v_operator_id,
    n.session_date,
    '09:00'::time,
    '09:45'::time,
    n.sequence_number,
    n.status,
    n.holiday_name
  FROM numbered n
  ON CONFLICT (schedule_id, session_date)
  DO UPDATE SET
    contract_id = EXCLUDED.contract_id,
    institution_id = EXCLUDED.institution_id,
    activity_id = EXCLUDED.activity_id,
    operator_id = EXCLUDED.operator_id,
    planned_start = EXCLUDED.planned_start,
    planned_end = EXCLUDED.planned_end,
    sequence_number = EXCLUDED.sequence_number,
    status = EXCLUDED.status,
    cancellation_reason = EXCLUDED.cancellation_reason,
    updated_at = now();
END $$;

-- סיכום
SELECT
  count(*) AS total_tuesdays,
  count(*) FILTER (WHERE status = 'PLANNED') AS planned_sessions,
  count(*) FILTER (WHERE status = 'HOLIDAY') AS holiday_tuesdays,
  min(session_date) AS first_date,
  max(session_date) AS last_date
FROM public.sessions s
JOIN public.institutions i ON i.id = s.institution_id
WHERE i.legacy_source_id = 'FIRST-CLIENT-KEREN';

-- פירוט ימי שלישי שנפלו בחופשה
SELECT
  session_date,
  status,
  cancellation_reason
FROM public.sessions s
JOIN public.institutions i ON i.id = s.institution_id
WHERE i.legacy_source_id = 'FIRST-CLIENT-KEREN'
  AND s.status = 'HOLIDAY'
ORDER BY session_date;
