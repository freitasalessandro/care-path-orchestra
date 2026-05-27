-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view iose_patients" ON public.iose_patients;
DROP POLICY IF EXISTS "Allow authenticated users to insert iose_patients" ON public.iose_patients;
DROP POLICY IF EXISTS "Allow authenticated users to update iose_patients" ON public.iose_patients;
DROP POLICY IF EXISTS "Allow authenticated users to delete iose_patients" ON public.iose_patients;

-- Create fresh, explicit policies for iose_patients
CREATE POLICY "Enable all access for authenticated users on iose_patients" 
ON public.iose_patients 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Also for iose_surgery_list just in case
DROP POLICY IF EXISTS "Allow authenticated users to view iose_surgery_list" ON public.iose_surgery_list;
DROP POLICY IF EXISTS "Allow authenticated users to insert iose_surgery_list" ON public.iose_surgery_list;
DROP POLICY IF EXISTS "Allow authenticated users to update iose_surgery_list" ON public.iose_surgery_list;
DROP POLICY IF EXISTS "Allow authenticated users to delete iose_surgery_list" ON public.iose_surgery_list;

CREATE POLICY "Enable all access for authenticated users on iose_surgery_list" 
ON public.iose_surgery_list 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Ensure service_role always has access
ALTER TABLE public.iose_patients FORCE ROW LEVEL SECURITY;
ALTER TABLE public.iose_surgery_list FORCE ROW LEVEL SECURITY;

-- Grant broad permissions again
GRANT ALL ON public.iose_patients TO authenticated, service_role;
GRANT ALL ON public.iose_surgery_list TO authenticated, service_role;