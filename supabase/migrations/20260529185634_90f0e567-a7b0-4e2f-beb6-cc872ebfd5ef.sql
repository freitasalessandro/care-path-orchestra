-- Drop existing restrictive policies
DROP POLICY IF EXISTS "admin_manage_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "authenticated_view_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "admin_manage_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "authenticated_view_sectors" ON public.sisapi_sectors;

-- Create simpler policies for departments
CREATE POLICY "allow_all_authenticated_departments"
ON public.sisapi_departments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create simpler policies for sectors
CREATE POLICY "allow_all_authenticated_sectors"
ON public.sisapi_sectors
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure grants are correct
GRANT ALL ON public.sisapi_departments TO authenticated;
GRANT ALL ON public.sisapi_sectors TO authenticated;
GRANT ALL ON public.sisapi_departments TO service_role;
GRANT ALL ON public.sisapi_sectors TO service_role;
