-- Create positions table
CREATE TABLE public.positions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    work_hours INTEGER NOT NULL DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.positions TO authenticated;
GRANT ALL ON public.positions TO service_role;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage positions" ON public.positions FOR ALL TO authenticated USING (true);

-- Update staff table to use position_id instead of text position
ALTER TABLE public.staff ADD COLUMN position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL;
-- Keep the position column for now to avoid breaking existing data, but we'll prioritize position_id
