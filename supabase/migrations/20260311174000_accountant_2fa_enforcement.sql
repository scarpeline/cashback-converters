
CREATE OR REPLACE FUNCTION public.is_mfa_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

-- Enforce MFA (aal2) for accountant access to company accounting module

-- ============ accountant_barbershop_links ============
DROP POLICY IF EXISTS "Accountants view their links" ON public.accountant_barbershop_links;
DROP POLICY IF EXISTS "Accountants accept their links" ON public.accountant_barbershop_links;

CREATE POLICY "Accountants view their links" ON public.accountant_barbershop_links
  FOR SELECT TO authenticated
  USING (
    public.is_mfa_authenticated()
    AND accountant_id IN (
      SELECT id FROM public.accountants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Accountants accept their links" ON public.accountant_barbershop_links
  FOR UPDATE TO authenticated
  USING (
    public.is_mfa_authenticated()
    AND accountant_id IN (
      SELECT id FROM public.accountants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_mfa_authenticated()
    AND accountant_id IN (
      SELECT id FROM public.accountants WHERE user_id = auth.uid()
    )
  );

-- ============ accounting_documents ============
DROP POLICY IF EXISTS "Accountants view linked accounting_documents" ON public.accounting_documents;
DROP POLICY IF EXISTS "Accountants update linked accounting_documents" ON public.accounting_documents;

CREATE POLICY "Accountants view linked accounting_documents" ON public.accounting_documents
  FOR SELECT TO authenticated
  USING (
    public.is_mfa_authenticated()
    AND (
      accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
      OR (
        is_company_document = true
        AND barbershop_id IS NOT NULL
        AND public.has_active_accountant_link(auth.uid(), barbershop_id)
      )
    )
  );

CREATE POLICY "Accountants update linked accounting_documents" ON public.accounting_documents
  FOR UPDATE TO authenticated
  USING (
    public.is_mfa_authenticated()
    AND (
      accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
      OR (
        is_company_document = true
        AND barbershop_id IS NOT NULL
        AND public.has_active_accountant_link(auth.uid(), barbershop_id)
      )
    )
  )
  WITH CHECK (
    public.is_mfa_authenticated()
    AND (
      accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
      OR (
        is_company_document = true
        AND barbershop_id IS NOT NULL
        AND public.has_active_accountant_link(auth.uid(), barbershop_id)
      )
    )
  );

-- ============ accounting_tax_guides ============
DROP POLICY IF EXISTS "Accountants view linked accounting_tax_guides" ON public.accounting_tax_guides;
DROP POLICY IF EXISTS "Accountants create linked accounting_tax_guides" ON public.accounting_tax_guides;
DROP POLICY IF EXISTS "Accountants update linked accounting_tax_guides" ON public.accounting_tax_guides;

CREATE POLICY "Accountants view linked accounting_tax_guides" ON public.accounting_tax_guides
  FOR SELECT TO authenticated
  USING (
    public.is_mfa_authenticated()
    AND public.has_active_accountant_link(auth.uid(), barbershop_id)
  );

CREATE POLICY "Accountants create linked accounting_tax_guides" ON public.accounting_tax_guides
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_mfa_authenticated()
    AND created_by_user_id = auth.uid()
    AND public.has_active_accountant_link(auth.uid(), barbershop_id)
  );

CREATE POLICY "Accountants update linked accounting_tax_guides" ON public.accounting_tax_guides
  FOR UPDATE TO authenticated
  USING (
    public.is_mfa_authenticated()
    AND public.has_active_accountant_link(auth.uid(), barbershop_id)
  )
  WITH CHECK (
    public.is_mfa_authenticated()
    AND public.has_active_accountant_link(auth.uid(), barbershop_id)
  );

-- ============ accounting_messages ============
DROP POLICY IF EXISTS "Accountants view linked accounting_messages" ON public.accounting_messages;
DROP POLICY IF EXISTS "Accountants send linked accounting_messages" ON public.accounting_messages;

CREATE POLICY "Accountants view linked accounting_messages" ON public.accounting_messages
  FOR SELECT TO authenticated
  USING (
    public.is_mfa_authenticated()
    AND (
      accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
      OR (barbershop_id IS NOT NULL AND public.has_active_accountant_link(auth.uid(), barbershop_id))
    )
  );

CREATE POLICY "Accountants send linked accounting_messages" ON public.accounting_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_mfa_authenticated()
    AND sender_user_id = auth.uid()
    AND (
      accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
      OR (barbershop_id IS NOT NULL AND public.has_active_accountant_link(auth.uid(), barbershop_id))
    )
  );
