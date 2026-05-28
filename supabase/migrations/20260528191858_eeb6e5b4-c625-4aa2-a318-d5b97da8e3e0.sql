-- Criar bucket para documentos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sisapi_documents', 'sisapi_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'sisapi_documents');
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sisapi_documents' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete their own files" ON storage.objects FOR DELETE USING (bucket_id = 'sisapi_documents' AND auth.role() = 'authenticated');
