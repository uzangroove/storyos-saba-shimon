-- StoryOS V21 — לוח חופשות תשפ״ז לגני ילדים בחינוך הרשמי (חברה יהודית)
-- שנת לימודים: 2026-09-01 עד 2027-06-30
-- מקור משרד החינוך המרכזי:
-- https://pop.education.gov.il/maagal_hashana/vacation-schedule/
-- חוזר מנכ״ל הרלוונטי: 0363 — גני ילדים, יסודי וחטיבות ביניים.
-- הערה: ל״ג בעומר 25.05.2027 אינו מוכנס כחופשה במערכת לפי המקור המבוסס על חוזר 0363.

DO $$
DECLARE
  v_school_year_id uuid;
  v_calendar_id uuid;
  v_schedule_id uuid;
BEGIN
  SELECT id INTO v_school_year_id
  FROM public.school_years
  WHERE name = 'תשפ״ז 2026–2027'
  LIMIT 1;

  IF v_school_year_id IS NULL THEN
    RAISE EXCEPTION 'School year תשפ״ז 2026–2027 not found';
  END IF;

  SELECT id INTO v_calendar_id
  FROM public.holiday_calendars
  WHERE school_year_id = v_school_year_id
    AND name = 'תשפ״ז — חברה יהודית — גני ילדים רשמי'
  LIMIT 1;

  IF v_calendar_id IS NULL THEN
    INSERT INTO public.holiday_calendars
      (school_year_id, name, sector, source_url, verified_at)
    VALUES
      (
        v_school_year_id,
        'תשפ״ז — חברה יהודית — גני ילדים רשמי',
        'JEWISH_OFFICIAL_KINDERGARTEN',
        'https://pop.education.gov.il/maagal_hashana/vacation-schedule/',
        now()
      )
    RETURNING id INTO v_calendar_id;
  ELSE
    UPDATE public.holiday_calendars
    SET source_url = 'https://pop.education.gov.il/maagal_hashana/vacation-schedule/',
        verified_at = now()
    WHERE id = v_calendar_id;

    DELETE FROM public.holidays WHERE calendar_id = v_calendar_id;
  END IF;

  INSERT INTO public.holidays
    (calendar_id, name, start_date, end_date, no_activity, notes)
  VALUES
    (v_calendar_id, 'ראש השנה', '2026-09-11', '2026-09-13', true, 'חזרה ללימודים 14.09.2026'),
    (v_calendar_id, 'יום הכיפורים והימים שבין יום הכיפורים לסוכות', '2026-09-20', '2026-09-24', true, 'רצף חופשה לפני סוכות'),
    (v_calendar_id, 'סוכות', '2026-09-25', '2026-10-03', true, 'חזרה ללימודים 04.10.2026'),
    (v_calendar_id, 'חנוכה', '2026-12-06', '2026-12-12', true, 'חזרה ללימודים 13.12.2026'),
    (v_calendar_id, 'פורים', '2027-03-23', '2027-03-24', true, 'תענית אסתר 22.03.2027 היא יום לימודים'),
    (v_calendar_id, 'פסח', '2027-04-13', '2027-04-28', true, 'אסרו חג פסח 29.04.2027 הוא יום לימודים'),
    (v_calendar_id, 'יום העצמאות', '2027-05-12', '2027-05-12', true, 'יום חופש'),
    (v_calendar_id, 'שבועות', '2027-06-10', '2027-06-11', true, 'חזרה ללימודים 13.06.2027');

  -- שיוך אוטומטי ללוח של גן קרן אם הוא כבר קיים
  SELECT s.id INTO v_schedule_id
  FROM public.schedules s
  JOIN public.institutions i ON i.id = s.institution_id
  WHERE i.legacy_source_id = 'FIRST-CLIENT-KEREN'
    AND s.valid_from = '2026-09-01'
    AND s.valid_to = '2027-06-30'
  ORDER BY s.id
  LIMIT 1;

  IF v_schedule_id IS NOT NULL THEN
    UPDATE public.schedules
    SET holiday_calendar_id = v_calendar_id
    WHERE id = v_schedule_id;
  END IF;
END $$;

-- בדיקה
SELECT
  hc.name AS calendar,
  count(h.id) AS holiday_ranges,
  min(h.start_date) AS first_holiday,
  max(h.end_date) AS last_holiday
FROM public.holiday_calendars hc
JOIN public.holidays h ON h.calendar_id = hc.id
WHERE hc.name = 'תשפ״ז — חברה יהודית — גני ילדים רשמי'
GROUP BY hc.name;
