-- =============================================
-- FIX: Break infinite recursion in RLS policies
-- =============================================

-- 1. Create a specialized function to check super admin status
-- that avoids querying user_roles if possible, or does it without RLS.
CREATE OR REPLACE FUNCTION public.is_super_admin_v2(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Checks against the authorized_super_admins table which has a simple "true" policy
  SELECT EXISTS (
    SELECT 1 FROM public.authorized_super_admins 
    WHERE email = (SELECT email FROM auth.users WHERE id = _user_id)
    AND is_active = true
  );
$$;

-- 2. Update user_roles policies to use the new function or direct check
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny public access" ON public.user_roles;

CREATE POLICY "Super admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin_v2(auth.uid()));

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 3. Update profiles policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny public access" ON public.profiles;

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_super_admin_v2(auth.uid()));

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. Fix recursive barbershop/professional check
DROP POLICY IF EXISTS "Professionals can view their barbershop" ON public.barbershops;
CREATE POLICY "Professionals can view their barbershop" ON public.barbershops
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT barbershop_id FROM professionals WHERE user_id = auth.uid())
  );
