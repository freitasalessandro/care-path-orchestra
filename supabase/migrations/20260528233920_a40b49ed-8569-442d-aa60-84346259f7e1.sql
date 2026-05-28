-- Permitir que novos usuários insiram seu próprio perfil durante o cadastro
CREATE POLICY "Users can insert their own profile" 
ON public.sisapi_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Adicionalmente, garantir que a função administrativa possa gerenciar perfis (geralmente via service_role, mas a política atual cobre admins)
-- A política "Sisapi profiles admin-manage" já existe para ALL, mas WITH CHECK pode ser necessário para INSERT se não for service_role
ALTER POLICY "Sisapi profiles admin-manage" ON public.sisapi_profiles 
WITH CHECK (EXISTS ( 
  SELECT 1 FROM public.sisapi_profiles 
  WHERE id = auth.uid() AND is_admin = true 
));
