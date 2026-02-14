
-- Fix overly permissive INSERT policy on webhooks_log
DROP POLICY "System can insert webhook logs" ON public.webhooks_log;

CREATE POLICY "Authenticated users can insert webhook logs"
ON public.webhooks_log FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));
