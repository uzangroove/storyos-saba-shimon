CREATE TYPE app_user_role AS ENUM ('ADMIN','OPERATOR');

CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(240) NOT NULL UNIQUE,
  display_name varchar(240),
  role app_user_role NOT NULL DEFAULT 'OPERATOR',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE operators
  ADD CONSTRAINT operators_auth_user_fk
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS app_user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.app_users WHERE auth_user_id = auth.uid() AND active = true LIMIT 1;
$$;

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

CREATE POLICY app_users_self_or_admin_select ON app_users FOR SELECT TO authenticated
USING (auth_user_id = auth.uid() OR public.current_app_role() = 'ADMIN');

CREATE POLICY admin_institutions_all ON institutions FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
CREATE POLICY admin_contacts_all ON contacts FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
CREATE POLICY admin_institution_contacts_all ON institution_contacts FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
CREATE POLICY admin_contracts_all ON contracts FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
CREATE POLICY admin_schedules_all ON schedules FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
CREATE POLICY admin_sessions_all ON sessions FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
CREATE POLICY admin_operators_all ON operators FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
CREATE POLICY admin_assignments_all ON operator_assignments FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
CREATE POLICY admin_attendance_all ON attendance_reports FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
CREATE POLICY admin_session_reports_all ON session_reports FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');
CREATE POLICY admin_payments_all ON payments FOR ALL TO authenticated USING (public.current_app_role() = 'ADMIN') WITH CHECK (public.current_app_role() = 'ADMIN');

CREATE POLICY operator_self_select ON operators FOR SELECT TO authenticated
USING (auth_user_id = auth.uid() OR public.current_app_role() = 'ADMIN');

CREATE POLICY operator_assigned_sessions_select ON sessions FOR SELECT TO authenticated
USING (
  public.current_app_role() = 'ADMIN' OR EXISTS (
    SELECT 1 FROM operators o
    WHERE o.id = sessions.operator_id AND o.auth_user_id = auth.uid() AND o.active = true
  ) OR EXISTS (
    SELECT 1 FROM operator_assignments oa JOIN operators o ON o.id = oa.operator_id
    WHERE oa.session_id = sessions.id AND o.auth_user_id = auth.uid() AND o.active = true
  )
);

CREATE POLICY operator_attendance_select ON attendance_reports FOR SELECT TO authenticated
USING (public.current_app_role() = 'ADMIN' OR EXISTS (SELECT 1 FROM operators o WHERE o.id = attendance_reports.operator_id AND o.auth_user_id = auth.uid()));
CREATE POLICY operator_attendance_insert ON attendance_reports FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM operators o WHERE o.id = attendance_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true));
CREATE POLICY operator_attendance_update ON attendance_reports FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM operators o WHERE o.id = attendance_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true))
WITH CHECK (EXISTS (SELECT 1 FROM operators o WHERE o.id = attendance_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true));

CREATE POLICY operator_session_reports_select ON session_reports FOR SELECT TO authenticated
USING (public.current_app_role() = 'ADMIN' OR EXISTS (SELECT 1 FROM operators o WHERE o.id = session_reports.operator_id AND o.auth_user_id = auth.uid()));
CREATE POLICY operator_session_reports_insert ON session_reports FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM operators o WHERE o.id = session_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true));
CREATE POLICY operator_session_reports_update ON session_reports FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM operators o WHERE o.id = session_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true))
WITH CHECK (EXISTS (SELECT 1 FROM operators o WHERE o.id = session_reports.operator_id AND o.auth_user_id = auth.uid() AND o.active = true));
