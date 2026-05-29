-- Adiciona coluna header_data para sisapi_document_templates
ALTER TABLE public.sisapi_document_templates 
ADD COLUMN IF NOT EXISTS header_data JSONB DEFAULT '{}'::jsonb;

-- Adiciona coluna header_data para sisapi_documents
ALTER TABLE public.sisapi_documents 
ADD COLUMN IF NOT EXISTS header_data JSONB DEFAULT '{}'::jsonb;
