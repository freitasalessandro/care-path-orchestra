-- Add unit_id to departments table
ALTER TABLE public.departments ADD COLUMN unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE;

-- Update existing departments if any (optional, but good practice if you want to link them to a default unit)
-- UPDATE public.departments SET unit_id = (SELECT id FROM public.units LIMIT 1) WHERE unit_id IS NULL;

-- Create index for better performance
CREATE INDEX idx_departments_unit_id ON public.departments(unit_id);

-- Update RLS to ensure policies still work or are more specific if needed
-- The existing policy "Allow authenticated users to manage departments" covers ALL commands to authenticated users.
-- We keep it as is unless we want to restrict by unit ownership, but the app uses a global admin approach.
