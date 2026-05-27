-- Create table for surgery lists
CREATE TABLE public.iose_lists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    scheduled_date DATE,
    description TEXT,
    status TEXT DEFAULT 'Ativa',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add list_id to iose_surgery_list
ALTER TABLE public.iose_surgery_list ADD COLUMN list_id UUID REFERENCES public.iose_lists(id);

-- Use GRANT to set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iose_lists TO anon, authenticated, service_role;
GRANT ALL ON public.iose_lists TO service_role;

-- Enable Row Level Security (though we might keep it permissive for now as per previous changes)
ALTER TABLE public.iose_lists ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now to avoid the previous RLS errors
CREATE POLICY "Allow all on iose_lists" ON public.iose_lists FOR ALL USING (true) WITH CHECK (true);

-- Update updated_at trigger for iose_lists
CREATE TRIGGER update_iose_lists_updated_at
BEFORE UPDATE ON public.iose_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
