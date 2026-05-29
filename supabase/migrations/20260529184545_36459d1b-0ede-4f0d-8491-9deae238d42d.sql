-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sisapi_sectors TO authenticated;

-- Ensure service_role also has access
GRANT ALL ON public.sisapi_departments TO service_role;
GRANT ALL ON public.sisapi_sectors TO service_role;

-- Grant access to anon for reading (if needed by your app's logic, though policies might still restrict it)
GRANT SELECT ON public.sisapi_departments TO anon;
GRANT SELECT ON public.sisapi_sectors TO anon;
