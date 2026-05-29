
-- Grant permissions on all sisapi_ tables to authenticated users
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'sisapi_%') LOOP
        EXECUTE 'GRANT ALL ON public.' || quote_ident(r.tablename) || ' TO authenticated, service_role';
        EXECUTE 'GRANT SELECT ON public.' || quote_ident(r.tablename) || ' TO anon';
    END LOOP;
END $$;
