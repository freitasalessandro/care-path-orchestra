-- Adicionar colunas para fluxos avançados em sisapi_documents
ALTER TABLE public.sisapi_documents 
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS budget_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS creditor_info JSONB DEFAULT '{}'::jsonb;

-- Adicionar configuração de módulos aos modelos
ALTER TABLE public.sisapi_document_templates
ADD COLUMN IF NOT EXISTS modules_config JSONB DEFAULT '{"items": false, "budget": false, "creditor": false}'::jsonb;

-- Vincular arquivos a documentos
ALTER TABLE public.sisapi_archive_files
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.sisapi_documents(id) ON DELETE CASCADE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sisapi_docs_assigned_to ON public.sisapi_documents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sisapi_archive_doc_id ON public.sisapi_archive_files(document_id);

-- Atualizar políticas de RLS para permitir que usuários atribuídos vejam documentos
CREATE POLICY "Assigned users can view documents" 
ON public.sisapi_documents 
FOR SELECT 
USING (auth.uid() = assigned_to OR auth.uid() = author_id);

-- Garantir permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_archive_files TO authenticated;
GRANT SELECT ON public.sisapi_document_templates TO authenticated;
GRANT ALL ON public.sisapi_documents TO service_role;
GRANT ALL ON public.sisapi_archive_files TO service_role;
