-- Permite atualização para anon também (necessário para o login admin local)
DROP POLICY IF EXISTS "Profiles_Update_Admin_Or_Self" ON public.sisapi_profiles;

CREATE POLICY "Profiles_Update_Admin_Or_Self"
ON public.sisapi_profiles
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

GRANT UPDATE ON public.sisapi_profiles TO anon;