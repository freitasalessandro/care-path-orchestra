-- Grant permissions for sisapi_departments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_departments TO authenticated;
GRANT ALL ON public.sisapi_departments TO service_role;

-- Grant permissions for sisapi_sectors
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_sectors TO authenticated;
GRANT ALL ON public.sisapi_sectors TO service_role;

-- Ensure RLS is enabled
ALTER TABLE public.sisapi_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_sectors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Departments are manageable by admins" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Departments are viewable by all authenticated users" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Sectors are manageable by admins" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "Sectors are viewable by all authenticated users" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "Admins can manage departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Admins can manage sectors" ON public.sisapi_sectors;

-- Create clean policies for sisapi_departments
CREATE POLICY "Anyone authenticated can view departments"
ON public.sisapi_departments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage departments"
ON public.sisapi_departments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Create clean policies for sisapi_sectors
CREATE POLICY "Anyone authenticated can view sectors"
ON public.sisapi_sectors
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage sectors"
ON public.sisapi_sectors
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
