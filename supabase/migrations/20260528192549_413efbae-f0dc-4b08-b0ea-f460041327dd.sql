-- Adicionar assinatura aos perfis se não existir (estava em sisapi_authorities, mas perfis é mais central)
ALTER TABLE public.sisapi_profiles 
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Adicionar campo para rastrear se o documento foi assinado pelo atual responsável
ALTER TABLE public.sisapi_documents
ADD COLUMN IF NOT EXISTS is_signed BOOLEAN DEFAULT false;

-- Adicionar campo para setor na tabela de acervo
ALTER TABLE public.sisapi_archive_files
ADD COLUMN IF NOT EXISTS department TEXT;

-- Garantir que notificações funcionem corretamente
GRANT SELECT, INSERT, UPDATE ON public.sisapi_notifications TO authenticated;
GRANT ALL ON public.sisapi_notifications TO service_role;
