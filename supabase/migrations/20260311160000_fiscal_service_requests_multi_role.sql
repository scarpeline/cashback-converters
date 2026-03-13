
ALTER TABLE public.fiscal_service_requests
  ADD COLUMN IF NOT EXISTS requested_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS requested_by_role public.app_role,
  ADD COLUMN IF NOT EXISTS barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_company_request boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_accountant_matching boolean NOT NULL DEFAULT false;

UPDATE public.fiscal_service_requests
SET requested_by_user_id = client_user_id
WHERE requested_by_user_id IS NULL;

UPDATE public.fiscal_service_requests
SET requested_by_role = 'cliente'::public.app_role
WHERE requested_by_role IS NULL;

ALTER TABLE public.fiscal_service_requests
  ALTER COLUMN requested_by_user_id SET NOT NULL,
  ALTER COLUMN requested_by_role SET NOT NULL;

ALTER TABLE public.fiscal_service_requests
  DROP CONSTRAINT IF EXISTS fiscal_service_requests_company_request_check;

ALTER TABLE public.fiscal_service_requests
  ADD CONSTRAINT fiscal_service_requests_company_request_check
  CHECK (
    (is_company_request = false AND barbershop_id IS NULL)
    OR
    (is_company_request = true AND barbershop_id IS NOT NULL AND requested_by_role = 'dono'::public.app_role)
  );

DROP POLICY IF EXISTS "Clients can create requests" ON public.fiscal_service_requests;
DROP POLICY IF EXISTS "Clients can view own requests" ON public.fiscal_service_requests;
DROP POLICY IF EXISTS "Accountants can view assigned requests" ON public.fiscal_service_requests;
DROP POLICY IF EXISTS "Accountants can update assigned requests" ON public.fiscal_service_requests;

CREATE POLICY "Users can create requests" ON public.fiscal_service_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by_user_id = auth.uid()
    AND client_user_id = auth.uid()
    AND (
      (is_company_request = false AND barbershop_id IS NULL)
      OR
      (
        is_company_request = true
        AND requested_by_role = 'dono'::public.app_role
        AND barbershop_id IN (
          SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can view own requests" ON public.fiscal_service_requests
  FOR SELECT TO authenticated
  USING (requested_by_user_id = auth.uid() OR client_user_id = auth.uid());

CREATE POLICY "Accountants can view requests" ON public.fiscal_service_requests
  FOR SELECT TO authenticated
  USING (
    accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
    OR (
      accountant_id IS NULL
      AND allow_accountant_matching = true
      AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'contador'::public.app_role)
    )
  );

CREATE POLICY "Accountants can update assigned requests" ON public.fiscal_service_requests
  FOR UPDATE TO authenticated
  USING (accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid()));
