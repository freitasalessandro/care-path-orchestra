-- Disable RLS temporarily to isolate the issue
ALTER TABLE public.iose_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.iose_surgery_list DISABLE ROW LEVEL SECURITY;

-- Grant ALL permissions to all possible roles just to be absolutely sure
GRANT ALL ON public.iose_patients TO anon, authenticated, service_role;
GRANT ALL ON public.iose_surgery_list TO anon, authenticated, service_role;

-- Ensure sequences (if any) are also accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;