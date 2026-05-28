-- Add allowed_modules to sisapi_profiles
ALTER TABLE public.sisapi_profiles 
ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT ARRAY['sisapi'];

-- Add general_settings to sisapi_settings
ALTER TABLE public.sisapi_settings
ADD COLUMN IF NOT EXISTS general_settings JSONB DEFAULT '{}'::jsonb;

-- Comment on columns for clarity
COMMENT ON COLUMN public.sisapi_profiles.allowed_modules IS 'Array of module IDs the user has access to (e.g. {sisapi, surgeries, hr, iose, exams})';
COMMENT ON COLUMN public.sisapi_settings.general_settings IS 'General system configuration stored as JSONB';
