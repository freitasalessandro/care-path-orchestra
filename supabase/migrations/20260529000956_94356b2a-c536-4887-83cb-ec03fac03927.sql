-- 1. Ativar RLS em todas as tabelas do SISAPI
ALTER TABLE IF EXISTS public.sisapi_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sisapi_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sisapi_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sisapi_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sisapi_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sisapi_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sisapi_archive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sisapi_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sisapi_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas para evitar redundância
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'sisapi_%') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. Políticas para SISAPI_PROFILES (Crucial para visibilidade de usuários)
CREATE POLICY "Profiles_Read_All" ON public.sisapi_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles_Insert_Self" ON public.sisapi_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles_Update_Admin_Or_Self" ON public.sisapi_profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id OR (SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true);

-- 4. Políticas para SISAPI_SETTINGS
CREATE POLICY "Settings_Read_All" ON public.sisapi_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Settings_Admin_All" ON public.sisapi_settings FOR ALL TO authenticated 
USING ((SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true);

-- 5. Políticas para SISAPI_ROLES, DEPARTMENTS, SECTORS
CREATE POLICY "Roles_Read_All" ON public.sisapi_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Roles_Admin_All" ON public.sisapi_roles FOR ALL TO authenticated 
USING ((SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Depts_Read_All" ON public.sisapi_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Depts_Admin_All" ON public.sisapi_departments FOR ALL TO authenticated 
USING ((SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Sectors_Read_All" ON public.sisapi_sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sectors_Admin_All" ON public.sisapi_sectors FOR ALL TO authenticated 
USING ((SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true);

-- 6. Políticas para SISAPI_DOCUMENTS (Visibilidade baseada em autoria ou atribuição)
CREATE POLICY "Docs_Read_Authorized" ON public.sisapi_documents FOR SELECT TO authenticated 
USING (
    author_id = auth.uid() 
    OR assigned_to = auth.uid() 
    OR (SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true
    OR id IN (SELECT document_id FROM public.sisapi_archive_files)
);
CREATE POLICY "Docs_Insert_Auth" ON public.sisapi_documents FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Docs_Update_Authorized" ON public.sisapi_documents FOR UPDATE TO authenticated 
USING (author_id = auth.uid() OR assigned_to = auth.uid() OR (SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true);

-- 7. Grant Permissions (Essencial para PostgREST)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 8. Correção de Busca de Usuário (Reforçar trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sisapi_profiles (id, full_name, email, status, allowed_modules, is_admin)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email,
    'pending',
    ARRAY['sisapi']::text[],
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(sisapi_profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
