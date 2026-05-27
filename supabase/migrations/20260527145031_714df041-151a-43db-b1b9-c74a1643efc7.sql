-- Grant access to anon for HR tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_assignments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.positions TO anon;

-- Update RLS policies to allow anon
CREATE POLICY "Allow anon users to manage units" ON public.units FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon users to manage departments" ON public.departments FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon users to manage staff" ON public.staff FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon users to manage staff assignments" ON public.staff_assignments FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon users to manage positions" ON public.positions FOR ALL TO anon USING (true);
