-- Create iose_patients table
CREATE TABLE public.iose_patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    cpf TEXT UNIQUE,
    rg TEXT,
    birth_date DATE,
    phone TEXT,
    address TEXT,
    city TEXT,
    sus_card TEXT,
    health_insurance TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create iose_surgery_list table
CREATE TABLE public.iose_surgery_list (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.iose_patients(id) ON DELETE CASCADE,
    surgery_type TEXT NOT NULL, -- e.g., Cataract, Pterygium, etc.
    eye_side TEXT, -- Left, Right, Both
    scheduled_date DATE,
    scheduled_time TIME,
    status TEXT NOT NULL DEFAULT 'Aguardando', -- Aguardando, Confirmado, Realizado, Cancelado
    priority TEXT DEFAULT 'Normal', -- Normal, Urgente, Prioritário
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iose_patients TO authenticated;
GRANT ALL ON public.iose_patients TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iose_surgery_list TO authenticated;
GRANT ALL ON public.iose_surgery_list TO service_role;

-- Enable RLS
ALTER TABLE public.iose_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iose_surgery_list ENABLE ROW LEVEL SECURITY;

-- Policies for iose_patients
CREATE POLICY "Allow authenticated users to view iose_patients" ON public.iose_patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert iose_patients" ON public.iose_patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update iose_patients" ON public.iose_patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete iose_patients" ON public.iose_patients FOR DELETE TO authenticated USING (true);

-- Policies for iose_surgery_list
CREATE POLICY "Allow authenticated users to view iose_surgery_list" ON public.iose_surgery_list FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert iose_surgery_list" ON public.iose_surgery_list FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update iose_surgery_list" ON public.iose_surgery_list FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete iose_surgery_list" ON public.iose_surgery_list FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_iose_patients_updated_at BEFORE UPDATE ON public.iose_patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_iose_surgery_list_updated_at BEFORE UPDATE ON public.iose_surgery_list FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
