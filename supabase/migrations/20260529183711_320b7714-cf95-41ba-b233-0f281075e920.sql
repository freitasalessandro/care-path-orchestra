-- Drop potentially conflicting old policies
DROP POLICY IF EXISTS "Depts_Admin_All" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Depts_Read_All" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Enable all access for authenticated users on departments" ON public.sisapi_departments;

DROP POLICY IF EXISTS "Sectors_Admin_All" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "Sectors_Read_All" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "Enable all access for authenticated users on sectors" ON public.sisapi_sectors;

-- Create clean policies for departments
CREATE POLICY "Departments are viewable by all authenticated users"
ON public.sisapi_departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Departments are manageable by admins"
ON public.sisapi_departments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles
    WHERE id = auth.uid() AND (is_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles
    WHERE id = auth.uid() AND (is_admin = true)
  )
);

-- Create clean policies for sectors
CREATE POLICY "Sectors are viewable by all authenticated users"
ON public.sisapi_sectors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sectors are manageable by admins"
ON public.sisapi_sectors FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles
    WHERE id = auth.uid() AND (is_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles
    WHERE id = auth.uid() AND (is_admin = true)
  )
);