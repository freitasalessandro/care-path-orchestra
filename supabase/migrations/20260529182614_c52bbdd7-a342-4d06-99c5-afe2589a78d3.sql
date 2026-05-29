-- Create departments table
CREATE TABLE IF NOT EXISTS public.sisapi_departments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions for departments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_departments TO authenticated;
GRANT ALL ON public.sisapi_departments TO service_role;

-- Enable RLS for departments
ALTER TABLE public.sisapi_departments ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "Enable all access for authenticated users on departments"
ON public.sisapi_departments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create sectors table
CREATE TABLE IF NOT EXISTS public.sisapi_sectors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL REFERENCES public.sisapi_departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions for sectors
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_sectors TO authenticated;
GRANT ALL ON public.sisapi_sectors TO service_role;

-- Enable RLS for sectors
ALTER TABLE public.sisapi_sectors ENABLE ROW LEVEL SECURITY;

-- Create policies for sectors
CREATE POLICY "Enable all access for authenticated users on sectors"
ON public.sisapi_sectors
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add updated_at trigger for both tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_sisapi_departments_updated_at ON public.sisapi_departments;
CREATE TRIGGER set_sisapi_departments_updated_at
    BEFORE UPDATE ON public.sisapi_departments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_sisapi_sectors_updated_at ON public.sisapi_sectors;
CREATE TRIGGER set_sisapi_sectors_updated_at
    BEFORE UPDATE ON public.sisapi_sectors
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
