-- 1. Desativar RLS temporariamente para garantir limpeza
ALTER TABLE public.sisapi_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas de SELECT existentes para evitar conflitos
DO $$ 
BEGIN
    EXECUTE (
        SELECT 'DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.sisapi_profiles'
        FROM pg_policies 
        WHERE tablename = 'sisapi_profiles' AND cmd = 'SELECT'
    );
EXCEPTION WHEN OTHERS THEN 
    NULL;
END $$;

-- 3. Criar política ultra-permissiva para leitura (necessário para a tela de gestão)
CREATE POLICY "Profiles_Public_Read" 
ON public.sisapi_profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. Re-ativar RLS
ALTER TABLE public.sisapi_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Garantir que o usuário admin master tenha is_admin = true
UPDATE public.sisapi_profiles 
SET is_admin = true, status = 'active' 
WHERE email = 'admin@gmail.com' OR email = 'alessandro@gmail.com';

-- 6. Garantir Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_profiles TO authenticated;
GRANT ALL ON public.sisapi_profiles TO service_role;
