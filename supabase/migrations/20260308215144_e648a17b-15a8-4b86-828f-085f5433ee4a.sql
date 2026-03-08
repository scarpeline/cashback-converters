
-- Subscription plans table (editable by super admin)
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration_months integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  asaas_checkout_id text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage plans" ON public.subscription_plans FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);

-- SaaS fee config (stored in integration_settings with service_name = 'saas_fee')
-- No migration needed, we use existing integration_settings table

-- Affiliate invite codes table
CREATE TABLE public.affiliate_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code text NOT NULL UNIQUE DEFAULT generate_referral_code(),
  affiliate_type text NOT NULL DEFAULT 'afiliado_saas',
  commission_first numeric DEFAULT 60,
  commission_recurring numeric DEFAULT 20,
  commission_saas_tax numeric DEFAULT 10,
  created_by uuid,
  used_by uuid,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage invites" ON public.affiliate_invites FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Anyone can view unused invites" ON public.affiliate_invites FOR SELECT USING (used_by IS NULL);

-- Insert default plans
INSERT INTO public.subscription_plans (name, duration_months, price, asaas_checkout_id, sort_order) VALUES
  ('Trial 7 dias', 0, 0, null, 0),
  ('Mensal', 1, 19.90, 'wyg2cu1i6z2e52el', 1),
  ('Trimestral', 3, 79.90, 'ntu1tp1iloyj99de', 2),
  ('Semestral', 6, 145.90, null, 3),
  ('Anual', 12, 199.90, '0yhsb6e32ieawwvv', 4);
