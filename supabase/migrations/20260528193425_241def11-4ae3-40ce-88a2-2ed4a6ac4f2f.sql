-- Create departments table
CREATE TABLE public.sisapi_departments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sectors table
CREATE TABLE public.sisapi_sectors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    department_id UUID REFERENCES public.sisapi_departments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_departments TO authenticated;
GRANT ALL ON public.sisapi_departments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_sectors TO authenticated;
GRANT ALL ON public.sisapi_sectors TO service_role;

-- Enable RLS
ALTER TABLE public.sisapi_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_sectors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all for authenticated users on departments" ON public.sisapi_departments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users on sectors" ON public.sisapi_sectors
    FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_sisapi_departments_updated_at
    BEFORE UPDATE ON public.sisapi_departments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sisapi_sectors_updated_at
    BEFORE UPDATE ON public.sisapi_sectors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
