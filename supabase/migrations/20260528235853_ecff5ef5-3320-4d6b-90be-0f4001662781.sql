-- Função para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sisapi_profiles (id, full_name, status, allowed_modules, is_admin)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    'pending',
    ARRAY['sisapi']::text[],
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função após o INSERT no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sincronizar usuários existentes que não possuem perfil (correção retroativa)
INSERT INTO public.sisapi_profiles (id, full_name, status, allowed_modules, is_admin)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'Usuário Antigo'),
  'pending',
  ARRAY['sisapi']::text[],
  false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.sisapi_profiles)
ON CONFLICT (id) DO NOTHING;
