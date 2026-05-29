-- Ajustar chaves estrangeiras para permitir exclusão de usuários
ALTER TABLE public.sisapi_notifications 
DROP CONSTRAINT IF EXISTS sisapi_notifications_user_id_fkey,
ADD CONSTRAINT sisapi_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.sisapi_archive_files 
DROP CONSTRAINT IF EXISTS sisapi_archive_files_uploaded_by_fkey,
ADD CONSTRAINT sisapi_archive_files_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.sisapi_document_templates 
DROP CONSTRAINT IF EXISTS sisapi_document_templates_created_by_fkey,
ADD CONSTRAINT sisapi_document_templates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.sisapi_documents 
DROP CONSTRAINT IF EXISTS sisapi_documents_author_id_fkey,
ADD CONSTRAINT sisapi_documents_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.sisapi_documents 
DROP CONSTRAINT IF EXISTS sisapi_documents_assigned_to_fkey,
ADD CONSTRAINT sisapi_documents_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE CASCADE;