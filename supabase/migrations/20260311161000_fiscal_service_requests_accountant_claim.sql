
DROP POLICY IF EXISTS "Accountants can update assigned requests" ON public.fiscal_service_requests;

CREATE POLICY "Accountants can update assigned requests" ON public.fiscal_service_requests
  FOR UPDATE TO authenticated
  USING (
    accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
    OR (
      accountant_id IS NULL
      AND allow_accountant_matching = true
      AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'contador'::public.app_role)
    )
  )
  WITH CHECK (
    accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
  );
