-- Create roles/functions table
CREATE TABLE public.sisapi_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create authorities table
CREATE TABLE public.sisapi_authorities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    signature_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for SISAPI users
CREATE TABLE public.sisapi_profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role_id UUID REFERENCES public.sisapi_roles(id),
    is_admin BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending', -- pending, approved, blocked
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document templates table
CREATE TABLE public.sisapi_document_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT, -- HTML content for the template
    category TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.sisapi_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, pending_approval, approved, archived
    author_id UUID REFERENCES auth.users(id) NOT NULL,
    assigned_to UUID REFERENCES auth.users(id), -- For workflow
    template_id UUID REFERENCES public.sisapi_document_templates(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.sisapi_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create archive files table
CREATE TABLE public.sisapi_archive_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    size_bytes BIGINT,
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT ALL ON public.sisapi_roles TO authenticated, service_role;
GRANT ALL ON public.sisapi_authorities TO authenticated, service_role;
GRANT ALL ON public.sisapi_profiles TO authenticated, service_role;
GRANT ALL ON public.sisapi_document_templates TO authenticated, service_role;
GRANT ALL ON public.sisapi_documents TO authenticated, service_role;
GRANT ALL ON public.sisapi_notifications TO authenticated, service_role;
GRANT ALL ON public.sisapi_archive_files TO authenticated, service_role;

-- Enable RLS
ALTER TABLE public.sisapi_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_archive_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Roles & Authorities
CREATE POLICY "Sisapi roles viewable by everyone" ON public.sisapi_roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Sisapi roles managed by admins" ON public.sisapi_roles FOR ALL USING (EXISTS (SELECT 1 FROM public.sisapi_profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Sisapi authorities viewable by everyone" ON public.sisapi_authorities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Sisapi authorities managed by admins" ON public.sisapi_authorities FOR ALL USING (EXISTS (SELECT 1 FROM public.sisapi_profiles WHERE id = auth.uid() AND is_admin = true));

-- Profiles
CREATE POLICY "Sisapi profiles viewable by everyone" ON public.sisapi_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Sisapi profiles self-manage" ON public.sisapi_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Sisapi profiles admin-manage" ON public.sisapi_profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.sisapi_profiles WHERE id = auth.uid() AND is_admin = true));

-- Documents
CREATE POLICY "Sisapi documents view access" ON public.sisapi_documents FOR SELECT USING (
    auth.uid() = author_id OR 
    auth.uid() = assigned_to OR 
    EXISTS (SELECT 1 FROM public.sisapi_profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Sisapi documents create access" ON public.sisapi_documents FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Sisapi documents update access" ON public.sisapi_documents FOR UPDATE USING (
    auth.uid() = author_id OR 
    EXISTS (SELECT 1 FROM public.sisapi_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Notifications
CREATE POLICY "Sisapi notifications view self" ON public.sisapi_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sisapi notifications update self" ON public.sisapi_notifications FOR UPDATE USING (auth.uid() = user_id);

-- Archive
CREATE POLICY "Sisapi archive view access" ON public.sisapi_archive_files FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Sisapi archive upload access" ON public.sisapi_archive_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Sisapi archive manage access" ON public.sisapi_archive_files FOR ALL USING (
    auth.uid() = uploaded_by OR 
    EXISTS (SELECT 1 FROM public.sisapi_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Templates
CREATE POLICY "Sisapi templates view access" ON public.sisapi_document_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Sisapi templates manage access" ON public.sisapi_document_templates FOR ALL USING (EXISTS (SELECT 1 FROM public.sisapi_profiles WHERE id = auth.uid() AND is_admin = true));

-- Update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_sisapi_roles_updated_at BEFORE UPDATE ON public.sisapi_roles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_sisapi_authorities_updated_at BEFORE UPDATE ON public.sisapi_authorities FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_sisapi_profiles_updated_at BEFORE UPDATE ON public.sisapi_profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_sisapi_document_templates_updated_at BEFORE UPDATE ON public.sisapi_document_templates FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_sisapi_documents_updated_at BEFORE UPDATE ON public.sisapi_documents FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
