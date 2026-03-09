
-- 1. FIX: Super admin emails exposed publicly
DROP POLICY IF EXISTS "Anyone can check authorized emails" ON public.authorized_super_admins;
CREATE POLICY "Only authenticated can check authorized emails"
  ON public.authorized_super_admins FOR SELECT TO authenticated
  USING (true);

-- 2. FIX: job_queue INSERT/UPDATE open to anon
DROP POLICY IF EXISTS "System can insert jobs" ON public.job_queue;
DROP POLICY IF EXISTS "System can update jobs" ON public.job_queue;
CREATE POLICY "Authenticated can insert jobs" ON public.job_queue FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update jobs" ON public.job_queue FOR UPDATE TO authenticated USING (true);

-- 3. FIX: rate_limits fully open to anon
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;
CREATE POLICY "Authenticated can manage rate limits" ON public.rate_limits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. FIX: Unassigned fiscal requests readable by anon
DROP POLICY IF EXISTS "Accountants can view assigned requests" ON public.fiscal_service_requests;
CREATE POLICY "Accountants can view assigned requests"
  ON public.fiscal_service_requests FOR SELECT TO authenticated
  USING (
    (accountant_id IN (SELECT id FROM accountants WHERE user_id = auth.uid()))
    OR (accountant_id IS NULL AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'contador'))
  );

-- 5. FIX: integration_logs INSERT open to anon
DROP POLICY IF EXISTS "System can insert integration logs" ON public.integration_logs;
CREATE POLICY "Authenticated can insert integration logs" ON public.integration_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 6. FIX: webhooks_log INSERT open to anon
DROP POLICY IF EXISTS "System can insert webhook logs" ON public.webhooks_log;
CREATE POLICY "Authenticated can insert webhook logs" ON public.webhooks_log FOR INSERT TO authenticated WITH CHECK (true);
