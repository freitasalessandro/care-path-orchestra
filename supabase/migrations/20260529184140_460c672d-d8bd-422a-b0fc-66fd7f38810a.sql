-- Create helper function for admin check
CREATE OR REPLACE FUNCTION public.is_sisapi_admin()
RETURNS boolean AS $$
DECLARE
  is_admin_flag boolean;
BEGIN
  SELECT is_admin INTO is_admin_flag
  FROM public.sisapi_profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin_flag, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to authenticated role
GRANT EXECUTE ON FUNCTION public.is_sisapi_admin() TO authenticated;

-- Ensure grants are correct (re-granting just in case)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_sectors TO authenticated;
GRANT ALL ON public.sisapi_departments TO service_role;
GRANT ALL ON public.sisapi_sectors TO service_role;

-- Re-enable RLS
ALTER TABLE public.sisapi_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_sectors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Admins can manage sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "Anyone authenticated can view departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Anyone authenticated can view sectors" ON public.sisapi_sectors;

-- Recreate policies using the helper function
CREATE POLICY "Admins can manage departments"
ON public.sisapi_departments
FOR ALL
TO authenticated
USING (public.is_sisapi_admin())
WITH CHECK (public.is_sisapi_admin());

CREATE POLICY "Anyone authenticated can view departments"
ON public.sisapi_departments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage sectors"
ON public.sisapi_sectors
FOR ALL
TO authenticated
USING (public.is_sisapi_admin())
WITH CHECK (public.is_sisapi_admin());

CREATE POLICY "Anyone authenticated can view sectors"
ON public.sisapi_sectors
FOR SELECT
TO authenticated
USING (true);
