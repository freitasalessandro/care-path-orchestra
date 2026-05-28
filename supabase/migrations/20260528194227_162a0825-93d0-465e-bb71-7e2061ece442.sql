-- Adicionar coluna de permissões na tabela de cargos
ALTER TABLE public.sisapi_roles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- Garantir que a tabela de perfis tenha as colunas necessárias para admin e assinaturas (já existem, mas reforçando)
-- ALTER TABLE public.sisapi_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
-- ALTER TABLE public.sisapi_profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Políticas de RLS para sisapi_roles
ALTER TABLE public.sisapi_roles ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas já existem antes de criar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sisapi_roles' AND policyname = 'Admins podem gerenciar cargos') THEN
        CREATE POLICY "Admins podem gerenciar cargos" ON public.sisapi_roles
        FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM sisapi_profiles WHERE id = auth.uid() AND is_admin = true));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sisapi_roles' AND policyname = 'Todos podem ver cargos') THEN
        CREATE POLICY "Todos podem ver cargos" ON public.sisapi_roles
        FOR SELECT TO authenticated
        USING (true);
    END IF;
END $$;

-- Garantir acesso ao bucket de logos (ou criar um específico para assinaturas)
-- Aqui assumimos que o bucket 'logos' já existe e é público para leitura.

GRANT ALL ON public.sisapi_roles TO authenticated;
GRANT ALL ON public.sisapi_roles TO service_role;
