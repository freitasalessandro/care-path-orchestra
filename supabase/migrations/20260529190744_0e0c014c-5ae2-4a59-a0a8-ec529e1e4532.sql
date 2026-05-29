
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Ensure all tables in public are accessible
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Explicitly grant to departments and sectors
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_departments TO authenticated, service_role;
GRANT SELECT ON public.sisapi_departments TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_sectors TO authenticated, service_role;
GRANT SELECT ON public.sisapi_sectors TO anon;

-- Re-create policies for departments - SPLIT BY COMMAND
DROP POLICY IF EXISTS "allow_all_auth_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "allow_all_service_role_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "allow_read_anon_departments" ON public.sisapi_departments;

-- Authenticated
CREATE POLICY "auth_select_departments" ON public.sisapi_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_departments" ON public.sisapi_departments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_departments" ON public.sisapi_departments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_departments" ON public.sisapi_departments FOR DELETE TO authenticated USING (true);

-- Service Role
CREATE POLICY "service_select_departments" ON public.sisapi_departments FOR SELECT TO service_role USING (true);
CREATE POLICY "service_insert_departments" ON public.sisapi_departments FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_update_departments" ON public.sisapi_departments FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_delete_departments" ON public.sisapi_departments FOR DELETE TO service_role USING (true);

-- Anon
CREATE POLICY "anon_select_departments" ON public.sisapi_departments FOR SELECT TO anon USING (true);

-- Re-create policies for sectors - SPLIT BY COMMAND
DROP POLICY IF EXISTS "allow_all_auth_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "allow_all_service_role_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "allow_read_anon_sectors" ON public.sisapi_sectors;

-- Authenticated
CREATE POLICY "auth_select_sectors" ON public.sisapi_sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sectors" ON public.sisapi_sectors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sectors" ON public.sisapi_sectors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_sectors" ON public.sisapi_sectors FOR DELETE TO authenticated USING (true);

-- Service Role
CREATE POLICY "service_select_sectors" ON public.sisapi_sectors FOR SELECT TO service_role USING (true);
CREATE POLICY "service_insert_sectors" ON public.sisapi_sectors FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_update_sectors" ON public.sisapi_sectors FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_delete_sectors" ON public.sisapi_sectors FOR DELETE TO service_role USING (true);

-- Anon
CREATE POLICY "anon_select_sectors" ON public.sisapi_sectors FOR SELECT TO anon USING (true);
