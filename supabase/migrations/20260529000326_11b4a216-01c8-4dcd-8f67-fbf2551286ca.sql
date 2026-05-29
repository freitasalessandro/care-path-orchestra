-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.sisapi_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.sisapi_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.sisapi_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.sisapi_profiles;

-- Criar política para que usuários logados vejam seu próprio perfil
CREATE POLICY "Users can view their own profile" 
ON public.sisapi_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Criar política para que administradores vejam todos os perfis
-- Nota: Usamos a própria tabela para verificar se o usuário é admin
CREATE POLICY "Admins can view all profiles" 
ON public.sisapi_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
  OR 
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@gmail.com'
);

-- Garantir permissões de leitura
GRANT SELECT ON public.sisapi_profiles TO authenticated;
GRANT ALL ON public.sisapi_profiles TO service_role;
