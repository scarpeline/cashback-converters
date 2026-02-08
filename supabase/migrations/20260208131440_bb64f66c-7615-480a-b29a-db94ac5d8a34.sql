-- Fix permissive RLS policy for integration_logs
-- Replace WITH CHECK (true) with proper service role check

DROP POLICY IF EXISTS "Service role can insert integration logs" ON public.integration_logs;

-- Create a more restrictive policy that allows system inserts via service role
-- Edge functions use service role key, so this is appropriate
CREATE POLICY "Authenticated system can insert logs"
ON public.integration_logs FOR INSERT
WITH CHECK (
  -- Allow super admins
  public.is_super_admin(auth.uid())
  OR 
  -- Allow service role (edge functions) - detected by null uid when using service key
  auth.uid() IS NULL
);