-- Garante que as permissões de acesso (GRANT) existam
GRANT ALL ON public.sisapi_departments TO authenticated;
GRANT ALL ON public.sisapi_sectors TO authenticated;
GRANT ALL ON public.sisapi_departments TO service_role;
GRANT ALL ON public.sisapi_sectors TO service_role;
GRANT SELECT ON public.sisapi_departments TO anon;
GRANT SELECT ON public.sisapi_sectors TO anon;

-- Remove políticas existentes para recriar de forma limpa
DROP POLICY IF EXISTS "authenticated_manage_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "public_read_departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "authenticated_manage_sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "public_read_sectors" ON public.sisapi_sectors;

-- Cria política simplificada para departamentos
-- Permite todas as operações para usuários autenticados
CREATE POLICY "authenticated_manage_departments"
ON public.sisapi_departments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Permite leitura para anon (se necessário pelo app)
CREATE POLICY "public_read_departments"
ON public.sisapi_departments
FOR SELECT
TO anon
USING (true);

-- Cria política simplificada para setores
CREATE POLICY "authenticated_manage_sectors"
ON public.sisapi_sectors
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Permite leitura para anon
CREATE POLICY "public_read_sectors"
ON public.sisapi_sectors
FOR SELECT
TO anon
USING (true);
