-- Habilitar RLS na tabela sisapi_settings (caso não esteja habilitado)
ALTER TABLE public.sisapi_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Settings_Admin_All" ON public.sisapi_settings;
DROP POLICY IF EXISTS "Settings_Read_All" ON public.sisapi_settings;

-- Criar política simplificada para leitura (todos os usuários autenticados)
CREATE POLICY "Settings_Read_All" 
ON public.sisapi_settings 
FOR SELECT 
TO authenticated 
USING (true);

-- Criar política robusta para administradores (todas as operações)
CREATE POLICY "Settings_Admin_All" 
ON public.sisapi_settings 
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

-- Corrigir possíveis erros de UUID 'admin-id' em outras políticas conhecidas
-- Buscando e corrigindo na tabela de documentos se existir algo similar
DROP POLICY IF EXISTS "Docs_Read_Authorized" ON public.sisapi_documents;
CREATE POLICY "Docs_Read_Authorized"
ON public.sisapi_documents
FOR SELECT
TO authenticated
USING (
  author_id = auth.uid() 
  OR assigned_to = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.sisapi_profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
  OR id IN (SELECT document_id FROM public.sisapi_archive_files)
);

DROP POLICY IF EXISTS "Docs_Update_Authorized" ON public.sisapi_documents;
CREATE POLICY "Docs_Update_Authorized"
ON public.sisapi_documents
FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid() 
  OR assigned_to = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.sisapi_profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
