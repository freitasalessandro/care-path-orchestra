-- Create a table for secretariat settings
CREATE TABLE public.secretariat_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Use GRANT to set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secretariat_settings TO authenticated;
GRANT ALL ON public.secretariat_settings TO service_role;

-- Enable RLS
ALTER TABLE public.secretariat_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage secretariat settings" 
ON public.secretariat_settings 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Add work_schedule to staff
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS work_schedule TEXT;

-- Create trigger for automatic timestamp updates on secretariat_settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_secretariat_settings_updated_at
BEFORE UPDATE ON public.secretariat_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize a default row if not exists (optional, but helpful)
INSERT INTO public.secretariat_settings (name) VALUES ('Secretaria de Saúde');