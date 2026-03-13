
CREATE TABLE public.social_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  type text NOT NULL DEFAULT 'fake',
  pages jsonb NOT NULL DEFAULT '["landing"]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage all social proofs"
  ON public.social_proofs FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners manage own barbershop social proofs"
  ON public.social_proofs FOR ALL
  TO authenticated
  USING (public.owns_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Anyone can view active social proofs"
  ON public.social_proofs FOR SELECT
  TO authenticated
  USING (is_active = true);
