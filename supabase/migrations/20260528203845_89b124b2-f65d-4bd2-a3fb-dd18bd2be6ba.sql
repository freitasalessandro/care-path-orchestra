-- First, drop the old table if it exists
DROP TABLE IF EXISTS public.sisapi_authorities CASCADE;

-- Create the new table with the requested structure
CREATE TABLE public.sisapi_authorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  autoridade_user_id UUID NOT NULL REFERENCES public.sisapi_profiles(id) ON DELETE CASCADE,
  representante_user_id UUID NOT NULL REFERENCES public.sisapi_profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_authorities TO authenticated;
GRANT ALL ON public.sisapi_authorities TO service_role;

-- Enable RLS
ALTER TABLE public.sisapi_authorities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone authenticated can view authorities"
  ON public.sisapi_authorities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage authorities"
  ON public.sisapi_authorities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sisapi_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_sisapi_authorities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_sisapi_authorities_updated_at
BEFORE UPDATE ON public.sisapi_authorities
FOR EACH ROW
EXECUTE FUNCTION public.update_sisapi_authorities_updated_at();
