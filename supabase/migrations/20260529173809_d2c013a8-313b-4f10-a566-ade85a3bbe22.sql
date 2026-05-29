-- Update sisapi_settings foreign key
ALTER TABLE public.sisapi_settings 
DROP CONSTRAINT IF EXISTS sisapi_settings_updated_by_fkey,
ADD CONSTRAINT sisapi_settings_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update sisapi_documents foreign key
ALTER TABLE public.sisapi_documents 
DROP CONSTRAINT IF EXISTS sisapi_documents_signed_by_user_id_fkey,
ADD CONSTRAINT sisapi_documents_signed_by_user_id_fkey 
FOREIGN KEY (signed_by_user_id) REFERENCES public.sisapi_profiles(id) ON DELETE SET NULL;