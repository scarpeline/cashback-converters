
-- Storage bucket for accounting documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('accounting-docs', 'accounting-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.can_access_accounting_doc_object(
  _user_id uuid,
  _bucket_id text,
  _object_name text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_super_admin(_user_id) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.accounting_documents d
      WHERE d.storage_bucket = _bucket_id
        AND d.storage_path = _object_name
        AND (
          d.owner_user_id = _user_id
          OR (
            d.is_company_document = true
            AND d.barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = _user_id)
          )
          OR (
            d.is_company_document = true
            AND d.barbershop_id IS NOT NULL
            AND public.has_active_accountant_link(_user_id, d.barbershop_id)
          )
        )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.can_upload_accounting_doc_object(
  _user_id uuid,
  _object_name text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _object_name LIKE ('user/' || _user_id::text || '/%') THEN true
    WHEN _object_name LIKE 'barbershop/%' THEN (
      split_part(_object_name, '/', 2) IN (
        SELECT id::text FROM public.barbershops WHERE owner_user_id = _user_id
      )
    )
    ELSE false
  END;
$$;

DROP POLICY IF EXISTS "Accounting docs read" ON storage.objects;
DROP POLICY IF EXISTS "Accounting docs upload" ON storage.objects;
DROP POLICY IF EXISTS "Accounting docs update" ON storage.objects;
DROP POLICY IF EXISTS "Accounting docs delete" ON storage.objects;

CREATE POLICY "Accounting docs read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'accounting-docs'
    AND public.can_access_accounting_doc_object(auth.uid(), bucket_id, name)
  );

CREATE POLICY "Accounting docs upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'accounting-docs'
    AND public.can_upload_accounting_doc_object(auth.uid(), name)
  );

CREATE POLICY "Accounting docs update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'accounting-docs'
    AND public.can_access_accounting_doc_object(auth.uid(), bucket_id, name)
  )
  WITH CHECK (
    bucket_id = 'accounting-docs'
    AND public.can_access_accounting_doc_object(auth.uid(), bucket_id, name)
  );

CREATE POLICY "Accounting docs delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'accounting-docs'
    AND public.can_access_accounting_doc_object(auth.uid(), bucket_id, name)
  );
