
-- Allow service role inserts on webhooks_log (used by webhook-dispatcher edge function)
-- Drop existing restrictive INSERT policy and create a more permissive one for authenticated + service role
DROP POLICY IF EXISTS "Authenticated users can insert webhook logs" ON public.webhooks_log;

CREATE POLICY "System can insert webhook logs"
ON public.webhooks_log
FOR INSERT
WITH CHECK (true);
