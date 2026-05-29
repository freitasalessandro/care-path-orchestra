-- Permite leitura para anon também (necessário para o login admin local que não cria sessão Supabase real)
DROP POLICY IF EXISTS "Profiles_Public_Read" ON public.sisapi_profiles;

CREATE POLICY "Profiles_Read_Anyone"
ON public.sisapi_profiles
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.sisapi_profiles TO anon;
