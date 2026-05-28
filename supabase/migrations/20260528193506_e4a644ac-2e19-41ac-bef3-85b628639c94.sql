ALTER TABLE public.sisapi_profiles 
ADD COLUMN department_id UUID REFERENCES public.sisapi_departments(id),
ADD COLUMN sector_id UUID REFERENCES public.sisapi_sectors(id);

-- Update RLS if needed (already enabled for authenticated)
