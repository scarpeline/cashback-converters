
CREATE TABLE IF NOT EXISTS public.accounting_tax_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  accountant_id uuid REFERENCES public.accountants(id) ON DELETE SET NULL,
  tax_type text NOT NULL DEFAULT 'other' CHECK (tax_type IN ('das', 'darf', 'gps', 'iss', 'irpj', 'csll', 'other')),
  reference_period text,
  due_date date,
  amount numeric(12,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'archived')),
  guide_document_id uuid REFERENCES public.accounting_documents(id) ON DELETE SET NULL,
  notes text,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_tax_guides_barbershop_id_idx ON public.accounting_tax_guides(barbershop_id);
CREATE INDEX IF NOT EXISTS accounting_tax_guides_accountant_id_idx ON public.accounting_tax_guides(accountant_id);
CREATE INDEX IF NOT EXISTS accounting_tax_guides_due_date_idx ON public.accounting_tax_guides(due_date);
CREATE INDEX IF NOT EXISTS accounting_tax_guides_status_idx ON public.accounting_tax_guides(status);

DROP TRIGGER IF EXISTS set_updated_at_accounting_tax_guides ON public.accounting_tax_guides;
CREATE TRIGGER set_updated_at_accounting_tax_guides
  BEFORE UPDATE ON public.accounting_tax_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.accounting_tax_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage accounting_tax_guides" ON public.accounting_tax_guides;
DROP POLICY IF EXISTS "Owners view company accounting_tax_guides" ON public.accounting_tax_guides;
DROP POLICY IF EXISTS "Owners create company accounting_tax_guides" ON public.accounting_tax_guides;
DROP POLICY IF EXISTS "Owners update company accounting_tax_guides" ON public.accounting_tax_guides;
DROP POLICY IF EXISTS "Accountants view linked accounting_tax_guides" ON public.accounting_tax_guides;
DROP POLICY IF EXISTS "Accountants create linked accounting_tax_guides" ON public.accounting_tax_guides;
DROP POLICY IF EXISTS "Accountants update linked accounting_tax_guides" ON public.accounting_tax_guides;

CREATE POLICY "Super admins manage accounting_tax_guides" ON public.accounting_tax_guides
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view company accounting_tax_guides" ON public.accounting_tax_guides
  FOR SELECT TO authenticated
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Owners create company accounting_tax_guides" ON public.accounting_tax_guides
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Owners update company accounting_tax_guides" ON public.accounting_tax_guides
  FOR UPDATE TO authenticated
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Accountants view linked accounting_tax_guides" ON public.accounting_tax_guides
  FOR SELECT TO authenticated
  USING (
    public.has_active_accountant_link(auth.uid(), barbershop_id)
  );

CREATE POLICY "Accountants create linked accounting_tax_guides" ON public.accounting_tax_guides
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND public.has_active_accountant_link(auth.uid(), barbershop_id)
  );

CREATE POLICY "Accountants update linked accounting_tax_guides" ON public.accounting_tax_guides
  FOR UPDATE TO authenticated
  USING (
    public.has_active_accountant_link(auth.uid(), barbershop_id)
  )
  WITH CHECK (
    public.has_active_accountant_link(auth.uid(), barbershop_id)
  );
