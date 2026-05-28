-- Drop existing FKs if they exist (need to find names or just drop and recreate columns)
-- Since we just created them, we can drop and recreate the columns or the FKs.

-- Fix sisapi_documents
ALTER TABLE public.sisapi_documents DROP CONSTRAINT IF EXISTS sisapi_documents_author_id_fkey;
ALTER TABLE public.sisapi_documents ADD CONSTRAINT sisapi_documents_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.sisapi_profiles(id);

ALTER TABLE public.sisapi_documents DROP CONSTRAINT IF EXISTS sisapi_documents_assigned_to_fkey;
ALTER TABLE public.sisapi_documents ADD CONSTRAINT sisapi_documents_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.sisapi_profiles(id);

-- Fix sisapi_document_templates
ALTER TABLE public.sisapi_document_templates DROP CONSTRAINT IF EXISTS sisapi_document_templates_created_by_fkey;
ALTER TABLE public.sisapi_document_templates ADD CONSTRAINT sisapi_document_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.sisapi_profiles(id);

-- Fix sisapi_archive_files
ALTER TABLE public.sisapi_archive_files DROP CONSTRAINT IF EXISTS sisapi_archive_files_uploaded_by_fkey;
ALTER TABLE public.sisapi_archive_files ADD CONSTRAINT sisapi_archive_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.sisapi_profiles(id);
