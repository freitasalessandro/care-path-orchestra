-- Update the is_sisapi_admin function to be more reliable
CREATE OR REPLACE FUNCTION public.is_sisapi_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_flag boolean;
BEGIN
  -- Check if the current user is an admin in sisapi_profiles
  SELECT is_admin INTO is_admin_flag
  FROM public.sisapi_profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin_flag, false);
END;
$function$;

-- Ensure the function is accessible
GRANT EXECUTE ON FUNCTION public.is_sisapi_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_sisapi_admin() TO service_role;

-- Re-apply policies for sisapi_departments
DROP POLICY IF EXISTS "Admins can manage departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Anyone authenticated can view departments" ON public.sisapi_departments;

CREATE POLICY "Anyone authenticated can view departments"
ON public.sisapi_departments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage departments"
ON public.sisapi_departments
FOR ALL
TO authenticated
USING (is_sisapi_admin())
WITH CHECK (is_sisapi_admin());

-- Re-apply policies for sisapi_sectors
DROP POLICY IF EXISTS "Admins can manage sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "Anyone authenticated can view sectors" ON public.sisapi_sectors;

CREATE POLICY "Anyone authenticated can view sectors"
ON public.sisapi_sectors
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage sectors"
ON public.sisapi_sectors
FOR ALL
TO authenticated
USING (is_sisapi_admin())
WITH CHECK (is_sisapi_admin());
