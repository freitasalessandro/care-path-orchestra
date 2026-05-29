-- Garantir que RLS está habilitado
ALTER TABLE public.sisapi_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas restritivas antigas
DROP POLICY IF EXISTS "Users can view their own profile" ON public.sisapi_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.sisapi_profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.sisapi_profiles;

-- Criar uma política única e robusta para leitura
CREATE POLICY "Enable read access for all authenticated users"
ON public.sisapi_profiles
FOR SELECT
TO authenticated
USING (true);

-- Criar política para atualização (apenas o próprio ou admin)
CREATE POLICY "Enable update for users or admins"
ON public.sisapi_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR 
  (SELECT is_admin FROM public.sisapi_profiles WHERE id = auth.uid()) = true
  OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@gmail.com'
);

-- Forçar a sincronização de emails e nomes de TODOS os usuários do Auth
INSERT INTO public.sisapi_profiles (id, full_name, email, status, allowed_modules, is_admin)
SELECT 
  u.id, 
  COALESCE(u.raw_user_meta_data->>'full_name', 'Usuário Autenticado'),
  u.email,
  'pending',
  ARRAY['sisapi']::text[],
  false
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(sisapi_profiles.full_name, EXCLUDED.full_name);
