-- Remover políticas antigas para evitar conflitos ou definições circulares
DROP POLICY IF EXISTS "Admins can manage departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Admins can manage sectors" ON public.sisapi_sectors;
DROP POLICY IF EXISTS "Anyone authenticated can view departments" ON public.sisapi_departments;
DROP POLICY IF EXISTS "Anyone authenticated can view sectors" ON public.sisapi_sectors;

-- Habilitar RLS (caso não esteja)
ALTER TABLE public.sisapi_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_sectors ENABLE ROW LEVEL SECURITY;

-- Grant permissions explicitly
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_sectors TO authenticated;
GRANT ALL ON public.sisapi_departments TO service_role;
GRANT ALL ON public.sisapi_sectors TO service_role;

-- Nova política para Visualização (Leitura)
CREATE POLICY "authenticated_view_departments" 
ON public.sisapi_departments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "authenticated_view_sectors" 
ON public.sisapi_sectors FOR SELECT 
TO authenticated 
USING (true);

-- Nova política para Gerenciamento (INSERT, UPDATE, DELETE)
-- Usando uma verificação direta que evita recursão infinita se profiles também tiver RLS
CREATE POLICY "admin_manage_departments" 
ON public.sisapi_departments FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "admin_manage_sectors" 
ON public.sisapi_sectors FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sisapi_profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
