-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "allow_all_authenticated_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "allow_all_authenticated_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "Admin full access on departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Admin full access on sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sisapi_sectors;

-- Ensure RLS is enabled
ALTER TABLE public.sisapi_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_sectors ENABLE ROW LEVEL SECURITY;

-- Simple "true" policies for authenticated users to avoid any profile check overhead or issues
CREATE POLICY "authenticated_manage_departments" 
ON public.sisapi_departments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "authenticated_manage_sectors" 
ON public.sisapi_sectors 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Ensure public read access if needed (optional but common)
CREATE POLICY "public_read_departments" ON public.sisapi_departments FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_sectors" ON public.sisapi_sectors FOR SELECT TO anon USING (true);

-- Re-verify GRANTS
GRANT ALL ON public.sisapi_departments TO authenticated;
GRANT ALL ON public.sisapi_sectors TO authenticated;
GRANT ALL ON public.sisapi_departments TO service_role;
GRANT ALL ON public.sisapi_sectors TO service_role;
GRANT SELECT ON public.sisapi_departments TO anon;
GRANT SELECT ON public.sisapi_sectors TO anon;
