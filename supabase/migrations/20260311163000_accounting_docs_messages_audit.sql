
CREATE OR REPLACE FUNCTION public.has_active_accountant_link(_user_id uuid, _barbershop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.accountant_barbershop_links l
    JOIN public.accountants a ON a.id = l.accountant_id
    WHERE l.barbershop_id = _barbershop_id
      AND a.user_id = _user_id
      AND l.status = 'active'
  );
$$;

CREATE TABLE IF NOT EXISTS public.accounting_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  accountant_id uuid REFERENCES public.accountants(id) ON DELETE SET NULL,
  fiscal_service_request_id uuid REFERENCES public.fiscal_service_requests(id) ON DELETE SET NULL,
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'other',
  storage_bucket text NOT NULL DEFAULT 'accounting-docs',
  storage_path text NOT NULL,
  mime_type text,
  file_size_bytes bigint,
  is_company_document boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'reviewed', 'approved', 'rejected', 'archived')),
  uploaded_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (is_company_document = false AND barbershop_id IS NULL)
    OR
    (is_company_document = true AND barbershop_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS accounting_documents_barbershop_id_idx ON public.accounting_documents(barbershop_id);
CREATE INDEX IF NOT EXISTS accounting_documents_owner_user_id_idx ON public.accounting_documents(owner_user_id);
CREATE INDEX IF NOT EXISTS accounting_documents_accountant_id_idx ON public.accounting_documents(accountant_id);
CREATE UNIQUE INDEX IF NOT EXISTS accounting_documents_storage_unique ON public.accounting_documents(storage_bucket, storage_path);

DROP TRIGGER IF EXISTS set_updated_at_accounting_documents ON public.accounting_documents;
CREATE TRIGGER set_updated_at_accounting_documents
  BEFORE UPDATE ON public.accounting_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.accounting_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage accounting_documents" ON public.accounting_documents;
DROP POLICY IF EXISTS "Owners view their accounting_documents" ON public.accounting_documents;
DROP POLICY IF EXISTS "Owners create their accounting_documents" ON public.accounting_documents;
DROP POLICY IF EXISTS "Owners update their accounting_documents" ON public.accounting_documents;
DROP POLICY IF EXISTS "Accountants view linked accounting_documents" ON public.accounting_documents;
DROP POLICY IF EXISTS "Accountants update linked accounting_documents" ON public.accounting_documents;

CREATE POLICY "Super admins manage accounting_documents" ON public.accounting_documents
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view their accounting_documents" ON public.accounting_documents
  FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR (
      is_company_document = true
      AND barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
    )
  );

CREATE POLICY "Owners create their accounting_documents" ON public.accounting_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by_user_id = auth.uid()
    AND owner_user_id = auth.uid()
    AND (
      (is_company_document = false AND barbershop_id IS NULL)
      OR (
        is_company_document = true
        AND barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Owners update their accounting_documents" ON public.accounting_documents
  FOR UPDATE TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR (
      is_company_document = true
      AND barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
    )
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    OR (
      is_company_document = true
      AND barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
    )
  );

CREATE POLICY "Accountants view linked accounting_documents" ON public.accounting_documents
  FOR SELECT TO authenticated
  USING (
    accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
    OR (
      is_company_document = true
      AND barbershop_id IS NOT NULL
      AND public.has_active_accountant_link(auth.uid(), barbershop_id)
    )
  );

CREATE POLICY "Accountants update linked accounting_documents" ON public.accounting_documents
  FOR UPDATE TO authenticated
  USING (
    accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
    OR (
      is_company_document = true
      AND barbershop_id IS NOT NULL
      AND public.has_active_accountant_link(auth.uid(), barbershop_id)
    )
  )
  WITH CHECK (
    accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
    OR (
      is_company_document = true
      AND barbershop_id IS NOT NULL
      AND public.has_active_accountant_link(auth.uid(), barbershop_id)
    )
  );

CREATE TABLE IF NOT EXISTS public.accounting_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  accountant_id uuid REFERENCES public.accountants(id) ON DELETE SET NULL,
  sender_user_id uuid NOT NULL,
  sender_role public.app_role,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_messages_barbershop_id_idx ON public.accounting_messages(barbershop_id);
CREATE INDEX IF NOT EXISTS accounting_messages_accountant_id_idx ON public.accounting_messages(accountant_id);
CREATE INDEX IF NOT EXISTS accounting_messages_sender_user_id_idx ON public.accounting_messages(sender_user_id);

ALTER TABLE public.accounting_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage accounting_messages" ON public.accounting_messages;
DROP POLICY IF EXISTS "Owners view company accounting_messages" ON public.accounting_messages;
DROP POLICY IF EXISTS "Owners send company accounting_messages" ON public.accounting_messages;
DROP POLICY IF EXISTS "Accountants view linked accounting_messages" ON public.accounting_messages;
DROP POLICY IF EXISTS "Accountants send linked accounting_messages" ON public.accounting_messages;

CREATE POLICY "Super admins manage accounting_messages" ON public.accounting_messages
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view company accounting_messages" ON public.accounting_messages
  FOR SELECT TO authenticated
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Owners send company accounting_messages" ON public.accounting_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Accountants view linked accounting_messages" ON public.accounting_messages
  FOR SELECT TO authenticated
  USING (
    accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
    OR (barbershop_id IS NOT NULL AND public.has_active_accountant_link(auth.uid(), barbershop_id))
  );

CREATE POLICY "Accountants send linked accounting_messages" ON public.accounting_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND (
      accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
      OR (barbershop_id IS NOT NULL AND public.has_active_accountant_link(auth.uid(), barbershop_id))
    )
  );

CREATE TABLE IF NOT EXISTS public.accounting_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE SET NULL,
  actor_user_id uuid NOT NULL,
  actor_role public.app_role,
  action text NOT NULL,
  entity_table text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounting_audit_logs_barbershop_id_idx ON public.accounting_audit_logs(barbershop_id);
CREATE INDEX IF NOT EXISTS accounting_audit_logs_actor_user_id_idx ON public.accounting_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS accounting_audit_logs_entity_idx ON public.accounting_audit_logs(entity_table, entity_id);

ALTER TABLE public.accounting_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage accounting_audit_logs" ON public.accounting_audit_logs;
DROP POLICY IF EXISTS "Owners view company accounting_audit_logs" ON public.accounting_audit_logs;
DROP POLICY IF EXISTS "Accountants view linked accounting_audit_logs" ON public.accounting_audit_logs;

CREATE POLICY "Super admins manage accounting_audit_logs" ON public.accounting_audit_logs
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view company accounting_audit_logs" ON public.accounting_audit_logs
  FOR SELECT TO authenticated
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Accountants view linked accounting_audit_logs" ON public.accounting_audit_logs
  FOR SELECT TO authenticated
  USING (
    barbershop_id IS NOT NULL AND public.has_active_accountant_link(auth.uid(), barbershop_id)
  );
