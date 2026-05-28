ALTER TABLE public.sisapi_archive_files ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.sisapi_archive_files ADD COLUMN IF NOT EXISTS document_type TEXT;
