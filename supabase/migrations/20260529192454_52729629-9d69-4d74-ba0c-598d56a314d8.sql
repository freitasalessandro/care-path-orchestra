
-- Grant permissions for all management tables
GRANT ALL ON public.sisapi_departments TO authenticated, service_role;
GRANT ALL ON public.sisapi_sectors TO authenticated, service_role;
GRANT ALL ON public.sisapi_roles TO authenticated, service_role;
GRANT ALL ON public.sisapi_profiles TO authenticated, service_role;
GRANT ALL ON public.sisapi_settings TO authenticated, service_role;
GRANT ALL ON public.positions TO authenticated, service_role;

GRANT SELECT ON public.sisapi_departments TO anon;
GRANT SELECT ON public.sisapi_sectors TO anon;
GRANT SELECT ON public.sisapi_roles TO anon;
GRANT SELECT ON public.sisapi_profiles TO anon;
GRANT SELECT ON public.sisapi_settings TO anon;
GRANT SELECT ON public.positions TO anon;

-- Enable RLS on core tables
ALTER TABLE public.sisapi_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Re-create policies for authenticated users to be simple 'true'
-- Departments
DROP POLICY IF EXISTS "departments_allow_all_authenticated" ON public.sisapi_departments;
CREATE POLICY "departments_allow_all_authenticated" ON public.sisapi_departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "departments_allow_select_anon" ON public.sisapi_departments;
CREATE POLICY "departments_allow_select_anon" ON public.sisapi_departments FOR SELECT TO anon USING (true);

-- Sectors
DROP POLICY IF EXISTS "sectors_allow_all_authenticated" ON public.sisapi_sectors;
CREATE POLICY "sectors_allow_all_authenticated" ON public.sisapi_sectors FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sectors_allow_select_anon" ON public.sisapi_sectors;
CREATE POLICY "sectors_allow_select_anon" ON public.sisapi_sectors FOR SELECT TO anon USING (true);

-- Roles
DROP POLICY IF EXISTS "roles_allow_all_authenticated" ON public.sisapi_roles;
CREATE POLICY "roles_allow_all_authenticated" ON public.sisapi_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "roles_allow_select_anon" ON public.sisapi_roles;
CREATE POLICY "roles_allow_select_anon" ON public.sisapi_roles FOR SELECT TO anon USING (true);

-- Positions
DROP POLICY IF EXISTS "positions_allow_all_authenticated" ON public.positions;
CREATE POLICY "positions_allow_all_authenticated" ON public.positions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "positions_allow_select_anon" ON public.positions;
CREATE POLICY "positions_allow_select_anon" ON public.positions FOR SELECT TO anon USING (true);
