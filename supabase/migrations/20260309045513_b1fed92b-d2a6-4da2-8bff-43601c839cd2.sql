
-- Create SECURITY DEFINER function for checking authorized admin emails (pre-auth)
CREATE OR REPLACE FUNCTION public.is_authorized_admin_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.authorized_super_admins
    WHERE email = _email AND is_active = true
  )
$$;

-- Allow anon to call this function (returns only boolean, not emails)
GRANT EXECUTE ON FUNCTION public.is_authorized_admin_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_authorized_admin_email(text) TO authenticated;
