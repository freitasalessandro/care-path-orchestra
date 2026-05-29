GRANT SELECT, INSERT, UPDATE, DELETE ON sisapi_departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sisapi_sectors TO authenticated;
GRANT ALL ON sisapi_departments TO service_role;
GRANT ALL ON sisapi_sectors TO service_role;
ALTER TABLE sisapi_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sisapi_sectors ENABLE ROW LEVEL SECURITY;
