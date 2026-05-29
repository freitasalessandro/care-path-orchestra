ALTER TABLE public.sisapi_profiles ADD COLUMN must_change_password BOOLEAN DEFAULT false;

-- Update existing users to false just in case
UPDATE public.sisapi_profiles SET must_change_password = false WHERE must_change_password IS NULL;
