
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_info jsonb DEFAULT NULL;

ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS asaas_account_status text DEFAULT 'pending';

CREATE TABLE public.fiscal_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL,
  accountant_id uuid REFERENCES public.accountants(id),
  service_type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  amount numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fiscal_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create requests" ON public.fiscal_service_requests
  FOR INSERT WITH CHECK (client_user_id = auth.uid());

CREATE POLICY "Clients can view own requests" ON public.fiscal_service_requests
  FOR SELECT USING (client_user_id = auth.uid());

CREATE POLICY "Accountants can view assigned requests" ON public.fiscal_service_requests
  FOR SELECT USING (
    accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
    OR accountant_id IS NULL
  );

CREATE POLICY "Accountants can update assigned requests" ON public.fiscal_service_requests
  FOR UPDATE USING (
    accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
  );

CREATE POLICY "Super admins manage all requests" ON public.fiscal_service_requests
  FOR ALL USING (is_super_admin(auth.uid()));
