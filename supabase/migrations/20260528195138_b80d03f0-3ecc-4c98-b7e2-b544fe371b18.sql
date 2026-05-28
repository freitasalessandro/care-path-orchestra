-- Tabela de configurações da instituição
CREATE TABLE public.sisapi_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_name TEXT NOT NULL,
    institution_logo_url TEXT,
    address TEXT,
    city_state TEXT,
    cnpj TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Permissões
GRANT SELECT ON public.sisapi_settings TO authenticated;
GRANT ALL ON public.sisapi_settings TO service_role;

ALTER TABLE public.sisapi_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer usuário autenticado pode ver as configurações" 
ON public.sisapi_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas administradores podem gerenciar configurações" 
ON public.sisapi_settings FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM sisapi_profiles WHERE id = auth.uid() AND is_admin = true));

-- Inserir dados iniciais (Exemplo Neópolis conforme imagem)
INSERT INTO public.sisapi_settings (institution_name, address, city_state, cnpj)
VALUES (
    'PREFEITURA MUNICIPAL DE NEÓPOLIS',
    'PC GENERAL OLIVEIRA VALADA, 106 - CENTRO',
    'Neópolis - SE',
    '13.111.679/0001-38'
);
