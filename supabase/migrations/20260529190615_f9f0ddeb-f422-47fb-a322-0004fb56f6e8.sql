
-- Ensure USAGE on public schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Disable RLS temporarily to reset state
ALTER TABLE public.sisapi_departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_sectors DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'sisapi_departments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.sisapi_departments';
    END LOOP;
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'sisapi_sectors') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.sisapi_sectors';
    END LOOP;
END $$;

-- Grant permissions explicitly
GRANT ALL ON public.sisapi_departments TO authenticated;
GRANT ALL ON public.sisapi_departments TO service_role;
GRANT SELECT ON public.sisapi_departments TO anon;

GRANT ALL ON public.sisapi_sectors TO authenticated;
GRANT ALL ON public.sisapi_sectors TO service_role;
GRANT SELECT ON public.sisapi_sectors TO anon;

-- Re-enable RLS
ALTER TABLE public.sisapi_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisapi_sectors ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "allow_all_auth_departments" 
ON public.sisapi_departments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "allow_all_service_role_departments" 
ON public.sisapi_departments 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "allow_read_anon_departments" 
ON public.sisapi_departments 
FOR SELECT 
TO anon 
USING (true);

-- Create policies for sectors
CREATE POLICY "allow_all_auth_sectors" 
ON public.sisapi_sectors 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "allow_all_service_role_sectors" 
ON public.sisapi_sectors 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "allow_read_anon_sectors" 
ON public.sisapi_sectors 
FOR SELECT 
TO anon 
USING (true);
