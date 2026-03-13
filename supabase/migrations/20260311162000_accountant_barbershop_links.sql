
CREATE TABLE IF NOT EXISTS public.accountant_barbershop_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  accountant_id uuid NOT NULL REFERENCES public.accountants(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  requested_by_user_id uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, accountant_id)
);

DROP TRIGGER IF EXISTS set_updated_at_accountant_barbershop_links ON public.accountant_barbershop_links;

CREATE TRIGGER set_updated_at_accountant_barbershop_links
  BEFORE UPDATE ON public.accountant_barbershop_links
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.accountant_barbershop_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage accountant barbershop links" ON public.accountant_barbershop_links;
DROP POLICY IF EXISTS "Owners view accountant barbershop links" ON public.accountant_barbershop_links;
DROP POLICY IF EXISTS "Owners create accountant barbershop links" ON public.accountant_barbershop_links;
DROP POLICY IF EXISTS "Owners update accountant barbershop links" ON public.accountant_barbershop_links;
DROP POLICY IF EXISTS "Accountants view their links" ON public.accountant_barbershop_links;
DROP POLICY IF EXISTS "Accountants accept their links" ON public.accountant_barbershop_links;

CREATE POLICY "Super admins manage accountant barbershop links" ON public.accountant_barbershop_links
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view accountant barbershop links" ON public.accountant_barbershop_links
  FOR SELECT TO authenticated
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owners create accountant barbershop links" ON public.accountant_barbershop_links
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by_user_id = auth.uid()
    AND barbershop_id IN (
      SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owners update accountant barbershop links" ON public.accountant_barbershop_links
  FOR UPDATE TO authenticated
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Accountants view their links" ON public.accountant_barbershop_links
  FOR SELECT TO authenticated
  USING (
    accountant_id IN (
      SELECT id FROM public.accountants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Accountants accept their links" ON public.accountant_barbershop_links
  FOR UPDATE TO authenticated
  USING (
    accountant_id IN (
      SELECT id FROM public.accountants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    accountant_id IN (
      SELECT id FROM public.accountants WHERE user_id = auth.uid()
    )
  );
