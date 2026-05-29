
-- Grant permissions to authenticated users and service_role
GRANT ALL ON public.sisapi_departments TO authenticated, service_role;
GRANT ALL ON public.sisapi_sectors TO authenticated, service_role;
GRANT ALL ON public.sisapi_roles TO authenticated, service_role;
GRANT ALL ON public.sisapi_profiles TO authenticated, service_role;

-- Grant SELECT to anon for tables that might be read during login/setup
GRANT SELECT ON public.sisapi_departments TO anon;
GRANT SELECT ON public.sisapi_sectors TO anon;
GRANT SELECT ON public.sisapi_roles TO anon;
GRANT SELECT ON public.sisapi_profiles TO anon;

-- Fix RLS for sisapi_departments
ALTER TABLE public.sisapi_departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_insert_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "auth_select_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "auth_update_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "auth_delete_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "service_insert_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "service_select_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "service_update_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "service_delete_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "anon_select_departments" ON public.sisapi_departments;

CREATE POLICY "departments_allow_all_authenticated" ON public.sisapi_departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "departments_allow_select_anon" ON public.sisapi_departments FOR SELECT TO anon USING (true);
CREATE POLICY "departments_allow_all_service_role" ON public.sisapi_departments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix RLS for sisapi_sectors
ALTER TABLE public.sisapi_sectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_insert_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "auth_select_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "auth_update_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "auth_delete_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "service_insert_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "service_select_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "service_update_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "service_delete_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "anon_select_sectors" ON public.sisapi_sectors;

CREATE POLICY "sectors_allow_all_authenticated" ON public.sisapi_sectors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sectors_allow_select_anon" ON public.sisapi_sectors FOR SELECT TO anon USING (true);
CREATE POLICY "sectors_allow_all_service_role" ON public.sisapi_sectors FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix RLS for sisapi_roles
ALTER TABLE public.sisapi_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Roles_Admin_All" ON public.sisapi_roles;
DROP POLICY IF EXISTS "Roles_Read_All" ON public.sisapi_roles;

CREATE POLICY "roles_allow_all_authenticated" ON public.sisapi_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roles_allow_select_anon" ON public.sisapi_roles FOR SELECT TO anon USING (true);
CREATE POLICY "roles_allow_all_service_role" ON public.sisapi_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix RLS for sisapi_profiles
ALTER TABLE public.sisapi_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles_Delete_Admin" ON public.sisapi_profiles;
DROP POLICY IF EXISTS "Profiles_Insert_Self" ON public.sisapi_profiles;
DROP POLICY IF EXISTS "Profiles_Read_Anyone" ON public.sisapi_profiles;
DROP POLICY IF EXISTS "Profiles_Update_Admin_Or_Self" ON public.sisapi_profiles;

CREATE POLICY "profiles_allow_all_authenticated" ON public.sisapi_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "profiles_allow_select_anon" ON public.sisapi_profiles FOR SELECT TO anon USING (true);
CREATE POLICY "profiles_allow_all_service_role" ON public.sisapi_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
