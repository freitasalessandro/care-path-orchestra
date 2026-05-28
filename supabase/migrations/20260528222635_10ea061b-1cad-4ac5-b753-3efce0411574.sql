CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO service_role;