
CREATE OR REPLACE FUNCTION public.get_accountant_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id
  FROM public.accountants a
  JOIN public.profiles p ON p.user_id = a.user_id
  WHERE a.is_active = true
    AND p.email IS NOT NULL
    AND lower(p.email) = lower(_email)
  LIMIT 1;
$$;
