-- Otimizar a função de verificação de admin para evitar problemas de recursão ou cache
CREATE OR REPLACE FUNCTION public.is_sisapi_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.sisapi_profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$function$;

-- Recriar as políticas com uma abordagem mais direta
DROP POLICY IF EXISTS "Admins can manage departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Admins can manage sectors" ON public.sisapi_sectors;

CREATE POLICY "Admins can manage departments"
ON public.sisapi_departments
FOR ALL
TO authenticated
USING (
  (SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "Admins can manage sectors"
ON public.sisapi_sectors
FOR ALL
TO authenticated
USING (
  (SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true
);

-- Garantir GRANTs para authenticated
GRANT ALL ON public.sisapi_departments TO authenticated;
GRANT ALL ON public.sisapi_sectors TO authenticated;
GRANT ALL ON public.sisapi_departments TO service_role;
GRANT ALL ON public.sisapi_sectors TO service_role;
