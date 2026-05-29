-- Enum para status de perfil
DO $$ BEGIN
    CREATE TYPE public.sisapi_user_status AS ENUM ('pending', 'active', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de Perfis (ligada ao auth.users)
CREATE TABLE IF NOT EXISTS public.sisapi_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    status public.sisapi_user_status DEFAULT 'pending',
    is_admin BOOLEAN DEFAULT false,
    allowed_modules TEXT[] DEFAULT ARRAY['sisapi'],
    department_id UUID,
    sector_id UUID,
    signature_url TEXT,
    must_change_password BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.sisapi_profiles TO authenticated;
GRANT ALL ON public.sisapi_profiles TO service_role;
ALTER TABLE public.sisapi_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis visíveis por usuários autenticados" ON public.sisapi_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem atualizar o próprio perfil" ON public.sisapi_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Tabela de Configurações da Instituição
CREATE TABLE IF NOT EXISTS public.sisapi_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_name TEXT NOT NULL,
    institution_logo_url TEXT,
    address TEXT,
    city_state TEXT,
    cnpj TEXT,
    general_settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES public.sisapi_profiles(id)
);

GRANT SELECT ON public.sisapi_settings TO authenticated;
GRANT ALL ON public.sisapi_settings TO service_role;
ALTER TABLE public.sisapi_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configurações visíveis por todos" ON public.sisapi_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Apenas admins editam configurações" ON public.sisapi_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.sisapi_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Tabela de Modelos de Documento
CREATE TABLE IF NOT EXISTS public.sisapi_document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT,
    content TEXT,
    header_data JSONB DEFAULT '{}'::jsonb,
    modules_config JSONB DEFAULT '{"items": false, "budget": false, "creditor": false}'::jsonb,
    created_by UUID REFERENCES public.sisapi_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_document_templates TO authenticated;
GRANT ALL ON public.sisapi_document_templates TO service_role;
ALTER TABLE public.sisapi_document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates visíveis por todos" ON public.sisapi_document_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Qualquer autenticado gerencia templates" ON public.sisapi_document_templates FOR ALL TO authenticated USING (true);

-- Tabela de Documentos
CREATE TABLE IF NOT EXISTS public.sisapi_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    document_type TEXT,
    department TEXT,
    content TEXT,
    status TEXT DEFAULT 'draft',
    author_id UUID NOT NULL REFERENCES public.sisapi_profiles(id),
    assigned_to UUID REFERENCES public.sisapi_profiles(id),
    template_id UUID REFERENCES public.sisapi_document_templates(id),
    header_data JSONB DEFAULT '{}'::jsonb,
    items JSONB DEFAULT '[]'::jsonb,
    budget_info JSONB DEFAULT '{}'::jsonb,
    creditor_info JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_signed BOOLEAN DEFAULT false,
    signed_by_user_id UUID REFERENCES public.sisapi_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.sisapi_documents TO authenticated;
GRANT ALL ON public.sisapi_documents TO service_role;
ALTER TABLE public.sisapi_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem docs que criaram ou atribuídos" ON public.sisapi_documents FOR SELECT TO authenticated USING (
    author_id = auth.uid() OR assigned_to = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.sisapi_profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Usuários criam seus próprios docs" ON public.sisapi_documents FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

-- Trigger para criar perfil automaticamente ao cadastrar no Auth
CREATE OR REPLACE FUNCTION public.handle_new_sisapi_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.sisapi_profiles (id, full_name, email, status, allowed_modules, is_admin)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário SISAPI'),
    NEW.email,
    'active',
    ARRAY['sisapi']::text[],
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_sisapi_user();
