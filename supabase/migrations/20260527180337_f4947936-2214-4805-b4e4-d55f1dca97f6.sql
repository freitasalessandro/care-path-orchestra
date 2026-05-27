-- Grant all permissions to both authenticated and anon roles
GRANT ALL ON public.secretariat_settings TO authenticated;
GRANT ALL ON public.secretariat_settings TO anon;
GRANT ALL ON public.secretariat_settings TO service_role;

-- Update the policy to be truly public for this specific settings table
DROP POLICY IF EXISTS "Users can manage secretariat settings" ON public.secretariat_settings;
DROP POLICY IF EXISTS "Anyone can view secretariat settings" ON public.secretariat_settings;

CREATE POLICY "Public manage secretariat settings" 
ON public.secretariat_settings 
FOR ALL 
TO public
USING (true) 
WITH CHECK (true);
