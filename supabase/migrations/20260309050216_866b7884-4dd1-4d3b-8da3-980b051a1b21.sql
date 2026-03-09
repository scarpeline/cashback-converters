
-- =============================================
-- SECURITY HARDENING MIGRATION
-- =============================================

-- 1. authorized_super_admins: restrict SELECT to super_admins only (we have RPC for pre-auth check)
DROP POLICY IF EXISTS "Only authenticated can check authorized emails" ON public.authorized_super_admins;
CREATE POLICY "Only super admins can view admin list"
  ON public.authorized_super_admins FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 2. rate_limits: remove open ALL, only allow via SECURITY DEFINER function (check_rate_limit)
DROP POLICY IF EXISTS "Authenticated can manage rate limits" ON public.rate_limits;
-- Super admins can view for debugging
CREATE POLICY "Super admins manage rate limits"
  ON public.rate_limits FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 3. job_queue: restrict INSERT/UPDATE to super_admins (edge functions use service_role)
DROP POLICY IF EXISTS "Authenticated can insert jobs" ON public.job_queue;
DROP POLICY IF EXISTS "Authenticated can update jobs" ON public.job_queue;
-- Edge functions already use service_role_key which bypasses RLS

-- 4. webhooks_log & integration_logs: restrict INSERT to super_admins (edge functions use service_role)
DROP POLICY IF EXISTS "Authenticated can insert webhook logs" ON public.webhooks_log;
DROP POLICY IF EXISTS "Authenticated can insert integration logs" ON public.integration_logs;

-- 5. affiliate_invites: restrict unused invites to authenticated only
DROP POLICY IF EXISTS "Anyone can view unused invites" ON public.affiliate_invites;
CREATE POLICY "Authenticated can view unused invites"
  ON public.affiliate_invites FOR SELECT TO authenticated
  USING (used_by IS NULL);

-- 6. Create a SECURITY DEFINER function to verify contador status (for login validation)
CREATE OR REPLACE FUNCTION public.is_authorized_contador(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accountants
    WHERE user_id = _user_id AND is_active = true
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_authorized_contador(uuid) TO authenticated;
