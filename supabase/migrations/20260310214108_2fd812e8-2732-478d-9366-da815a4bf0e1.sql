
-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'aguardando', 'cirurgia_realizada')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Anyone can insert patients" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update patients" ON public.patients FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete patients" ON public.patients FOR DELETE USING (true);

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Checklist templates table
CREATE TABLE public.checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  surgery_type TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read templates" ON public.checklist_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert templates" ON public.checklist_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update templates" ON public.checklist_templates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete templates" ON public.checklist_templates FOR DELETE USING (true);

CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON public.checklist_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Surgeries table
CREATE TABLE public.surgeries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('pequena', 'grande')),
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_preparo', 'realizada', 'cancelada')),
  scheduled_date DATE NOT NULL,
  notes TEXT,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read surgeries" ON public.surgeries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert surgeries" ON public.surgeries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update surgeries" ON public.surgeries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete surgeries" ON public.surgeries FOR DELETE USING (true);

CREATE TRIGGER update_surgeries_updated_at BEFORE UPDATE ON public.surgeries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Patient attachments table
CREATE TABLE public.patient_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read attachments" ON public.patient_attachments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert attachments" ON public.patient_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete attachments" ON public.patient_attachments FOR DELETE USING (true);

-- Print settings table
CREATE TABLE public.print_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  header_title TEXT DEFAULT 'Secretaria Municipal de Saúde',
  header_subtitle TEXT,
  footer_text TEXT,
  show_logo BOOLEAN DEFAULT true,
  show_header BOOLEAN DEFAULT true,
  show_footer BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.print_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read print settings" ON public.print_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert print settings" ON public.print_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update print settings" ON public.print_settings FOR UPDATE USING (true);

CREATE TRIGGER update_print_settings_updated_at BEFORE UPDATE ON public.print_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default print settings
INSERT INTO public.print_settings (header_title, header_subtitle, footer_text)
VALUES ('Secretaria Municipal de Saúde', 'Sistema de Gestão Cirúrgica', 'Documento gerado pelo Sistema de Gestão Cirúrgica');

-- Insert default checklist templates
INSERT INTO public.checklist_templates (name, surgery_type, items) VALUES
('Cirurgia Pequena - Padrão', 'pequena', '[
  {"id": "1", "label": "Exames laboratoriais (hemograma, coagulograma)"},
  {"id": "2", "label": "Avaliação pré-anestésica"},
  {"id": "3", "label": "Termo de consentimento assinado"},
  {"id": "4", "label": "Jejum de 8 horas confirmado"},
  {"id": "5", "label": "Reserva de sala cirúrgica"}
]'::jsonb),
('Cirurgia Grande - Padrão', 'grande', '[
  {"id": "1", "label": "Exames laboratoriais completos"},
  {"id": "2", "label": "Exames de imagem (raio-x, tomografia)"},
  {"id": "3", "label": "Avaliação cardiológica"},
  {"id": "4", "label": "Avaliação pré-anestésica"},
  {"id": "5", "label": "Reserva de sangue/hemoderivados"},
  {"id": "6", "label": "Termo de consentimento assinado"},
  {"id": "7", "label": "Internação pré-operatória"},
  {"id": "8", "label": "Jejum de 8 horas confirmado"},
  {"id": "9", "label": "Reserva de UTI pós-operatória"},
  {"id": "10", "label": "Reserva de sala cirúrgica"}
]'::jsonb);

-- Storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Anyone can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos');
CREATE POLICY "Anyone can update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos');
CREATE POLICY "Anyone can delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos');
