ALTER TABLE public.sisapi_documents 
ADD COLUMN signed_by_user_id UUID REFERENCES public.sisapi_profiles(id);

-- Update existing signed documents (fallback to author_id if unknown)
UPDATE public.sisapi_documents 
SET signed_by_user_id = author_id 
WHERE is_signed = true AND signed_by_user_id IS NULL;
