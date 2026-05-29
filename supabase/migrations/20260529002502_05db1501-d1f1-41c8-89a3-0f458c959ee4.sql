-- Permite exclusão para anon também (necessário para o login admin local)
CREATE POLICY "Profiles_Delete_Admin"
ON public.sisapi_profiles
FOR DELETE
TO anon, authenticated
USING (true);

GRANT DELETE ON public.sisapi_profiles TO anon;