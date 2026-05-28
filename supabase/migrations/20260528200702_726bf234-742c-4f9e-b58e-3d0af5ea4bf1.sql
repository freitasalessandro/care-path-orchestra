-- Create exam_results table
CREATE TABLE public.exam_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name TEXT NOT NULL,
    patient_cpf TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'collected')),
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    collected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for searching by CPF
CREATE INDEX idx_exam_results_cpf ON public.exam_results(patient_cpf);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_results TO authenticated;
GRANT ALL ON public.exam_results TO service_role;

-- Enable RLS
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all for authenticated users" 
ON public.exam_results 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exam_results_updated_at
BEFORE UPDATE ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
