-- Grant permissions to authenticated users and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secretariat_settings TO authenticated;
GRANT ALL ON public.secretariat_settings TO service_role;

-- Ensure RLS is enabled
ALTER TABLE public.secretariat_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can manage secretariat settings" ON public.secretariat_settings;

-- Create a more robust policy
CREATE POLICY "Users can manage secretariat settings" 
ON public.secretariat_settings 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Also allow anon to SELECT if we want public access (useful for reports)
GRANT SELECT ON public.secretariat_settings TO anon;
CREATE POLICY "Anyone can view secretariat settings" 
ON public.secretariat_settings 
FOR SELECT 
TO anon 
USING (true);
