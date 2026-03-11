-- fiscal_service_types: add description fields + allow accountants insert pending proposals

ALTER TABLE public.fiscal_service_types
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS proposed_description text;

-- Allow accountants to create new services as pending proposals
DROP POLICY IF EXISTS "Accountants can insert pending proposals" ON public.fiscal_service_types;
CREATE POLICY "Accountants can insert pending proposals" ON public.fiscal_service_types
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.accountants WHERE user_id = auth.uid())
    AND status = 'pending'
  );

