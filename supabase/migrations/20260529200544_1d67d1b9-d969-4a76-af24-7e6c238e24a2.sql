-- Add RLS policies for sisapi_document_templates
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_document_templates TO authenticated;
GRANT ALL ON public.sisapi_document_templates TO service_role;

-- Ensure RLS is enabled (it is, but good practice)
ALTER TABLE public.sisapi_document_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Templates are viewable by all authenticated users" 
ON public.sisapi_document_templates 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Templates can be created by all authenticated users" 
ON public.sisapi_document_templates 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Templates can be updated by all authenticated users" 
ON public.sisapi_document_templates 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Templates can be deleted by all authenticated users" 
ON public.sisapi_document_templates 
FOR DELETE 
TO authenticated 
USING (true);
