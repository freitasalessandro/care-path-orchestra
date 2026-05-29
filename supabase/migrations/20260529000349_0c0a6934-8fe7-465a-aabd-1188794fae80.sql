-- Adicionar coluna de email na tabela de perfis se não existir
ALTER TABLE public.sisapi_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Sincronizar emails existentes do auth.users para sisapi_profiles
UPDATE public.sisapi_profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Atualizar a função handle_new_user para incluir o email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sisapi_profiles (id, full_name, email, status, allowed_modules, is_admin)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    NEW.email,
    'pending',
    ARRAY['sisapi']::text[],
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, sisapi_profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
