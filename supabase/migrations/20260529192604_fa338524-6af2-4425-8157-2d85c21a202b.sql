
-- Grant full access to public (includes anon and authenticated)
GRANT ALL ON public.sisapi_departments TO public;
GRANT ALL ON public.sisapi_sectors TO public;
GRANT ALL ON public.sisapi_roles TO public;
GRANT ALL ON public.positions TO public;

-- Ensure RLS is enabled but policies are wide open
ALTER TABLE public.sisapi_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Re-create policies for the 'public' role to allow everything
DROP POLICY IF EXISTS "departments_public_all" ON public.sisapi_departments;
CREATE POLICY "departments_public_all" ON public.sisapi_departments FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sectors_public_all" ON public.sisapi_sectors;
CREATE POLICY "sectors_public_all" ON public.sisapi_sectors FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "roles_public_all" ON public.sisapi_roles;
CREATE POLICY "roles_public_all" ON public.sisapi_roles FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "positions_public_all" ON public.positions;
CREATE POLICY "positions_public_all" ON public.positions FOR ALL TO public USING (true) WITH CHECK (true);

-- Also fix any other sisapi tables that might be hit
GRANT ALL ON public.sisapi_profiles TO public;
DROP POLICY IF EXISTS "profiles_public_all" ON public.sisapi_profiles;
CREATE POLICY "profiles_public_all" ON public.sisapi_profiles FOR ALL TO public USING (true) WITH CHECK (true);
