
-- =============================================
-- 1. Colunas extras em barbershops (generalização)
-- =============================================
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS sector text DEFAULT 'barbearia',
  ADD COLUMN IF NOT EXISTS specialty text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS booking_policies jsonb DEFAULT '{}'::jsonb;

-- =============================================
-- 2. sector_presets
-- =============================================
CREATE TABLE IF NOT EXISTS public.sector_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector text NOT NULL,
  specialty text NOT NULL,
  display_name text NOT NULL,
  default_services jsonb DEFAULT '[]'::jsonb,
  default_automations jsonb DEFAULT '[]'::jsonb,
  default_policies jsonb DEFAULT '{}'::jsonb,
  default_resources jsonb DEFAULT '[]'::jsonb,
  icon text DEFAULT 'Scissors',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sector_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sector presets" ON public.sector_presets FOR SELECT USING (true);
CREATE POLICY "Super admins manage sector presets" ON public.sector_presets FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 3. clients
-- =============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  user_id uuid,
  name text NOT NULL,
  email text,
  whatsapp text,
  notes text,
  tags text[] DEFAULT '{}',
  total_visits integer DEFAULT 0,
  last_visit_at timestamptz,
  total_spent numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage clients" ON public.clients FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Clients view own data" ON public.clients FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Super admins manage clients" ON public.clients FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 4. automations
-- =============================================
CREATE TABLE IF NOT EXISTS public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'reminder',
  trigger_event text NOT NULL DEFAULT 'appointment_created',
  action_type text NOT NULL DEFAULT 'send_whatsapp',
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage automations" ON public.automations FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage automations" ON public.automations FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 5. resources (salas, equipamentos, etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'room',
  description text,
  is_available boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage resources" ON public.resources FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage resources" ON public.resources FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 6. whatsapp_accounts
-- =============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id),
  phone_number text NOT NULL,
  display_name text,
  provider text DEFAULT 'twilio',
  status text DEFAULT 'pending',
  is_active boolean DEFAULT true,
  daily_limit integer DEFAULT 250,
  messages_sent_today integer DEFAULT 0,
  last_reset_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage whatsapp accounts" ON public.whatsapp_accounts FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage whatsapp accounts" ON public.whatsapp_accounts FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 7. whatsapp_messages
-- =============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid REFERENCES public.barbershops(id),
  account_id uuid REFERENCES public.whatsapp_accounts(id),
  client_id uuid REFERENCES public.clients(id),
  direction text NOT NULL DEFAULT 'outbound',
  message_type text DEFAULT 'text',
  content text,
  status text DEFAULT 'queued',
  external_id text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage messages" ON public.whatsapp_messages FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage messages" ON public.whatsapp_messages FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 8. message_balance
-- =============================================
CREATE TABLE IF NOT EXISTS public.message_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp',
  total_credits integer DEFAULT 0,
  used_credits integer DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.message_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage balance" ON public.message_balance FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage balance" ON public.message_balance FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 9. store_products
-- =============================================
CREATE TABLE IF NOT EXISTS public.store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text DEFAULT 'product',
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  sales_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active products" ON public.store_products FOR SELECT USING (is_active = true);
CREATE POLICY "Owners manage products" ON public.store_products FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage products" ON public.store_products FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 10. store_orders
-- =============================================
CREATE TABLE IF NOT EXISTS public.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_user_id uuid,
  product_id uuid REFERENCES public.store_products(id),
  quantity integer DEFAULT 1,
  total_amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage orders" ON public.store_orders FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Clients view own orders" ON public.store_orders FOR SELECT TO authenticated USING (client_user_id = auth.uid());
CREATE POLICY "Super admins manage orders" ON public.store_orders FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 11. membership_plans
-- =============================================
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  duration_days integer DEFAULT 30,
  benefits jsonb DEFAULT '[]'::jsonb,
  cashback_bonus numeric DEFAULT 0,
  max_members integer,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active plans" ON public.membership_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Owners manage plans" ON public.membership_plans FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage plans" ON public.membership_plans FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 12. membership_subscriptions
-- =============================================
CREATE TABLE IF NOT EXISTS public.membership_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.membership_plans(id),
  user_id uuid NOT NULL,
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id),
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.membership_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions" ON public.membership_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners manage subscriptions" ON public.membership_subscriptions FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage subscriptions" ON public.membership_subscriptions FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 13. client_referrals
-- =============================================
CREATE TABLE IF NOT EXISTS public.client_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  referrer_user_id uuid NOT NULL,
  referred_user_id uuid,
  referral_code text NOT NULL DEFAULT generate_referral_code(),
  status text DEFAULT 'pending',
  reward_type text DEFAULT 'cashback',
  reward_amount numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.client_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referrals" ON public.client_referrals FOR SELECT TO authenticated USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());
CREATE POLICY "Users create referrals" ON public.client_referrals FOR INSERT TO authenticated WITH CHECK (referrer_user_id = auth.uid());
CREATE POLICY "Owners manage referrals" ON public.client_referrals FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage referrals" ON public.client_referrals FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- 14. waiting_list (fila de espera inteligente)
-- =============================================
CREATE TABLE IF NOT EXISTS public.waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id),
  client_user_id uuid,
  service_id uuid REFERENCES public.services(id),
  professional_id uuid REFERENCES public.professionals(id),
  preferred_date date,
  preferred_time_start time,
  preferred_time_end time,
  status text DEFAULT 'waiting',
  priority integer DEFAULT 0,
  notified_at timestamptz,
  confirmed_at timestamptz,
  expired_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage waiting list" ON public.waiting_list FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Clients view own waiting list" ON public.waiting_list FOR SELECT TO authenticated USING (client_user_id = auth.uid());
CREATE POLICY "Clients add to waiting list" ON public.waiting_list FOR INSERT TO authenticated WITH CHECK (client_user_id = auth.uid());
CREATE POLICY "Super admins manage waiting list" ON public.waiting_list FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- =============================================
-- Seed sector_presets
-- =============================================
INSERT INTO public.sector_presets (sector, specialty, display_name, icon, default_services) VALUES
  ('beleza', 'barbearia', 'Barbearia', 'Scissors', '[{"name":"Corte Masculino","price":45,"duration":30},{"name":"Barba","price":30,"duration":20},{"name":"Corte + Barba","price":65,"duration":50}]'::jsonb),
  ('beleza', 'nail_designer', 'Nail Designer', 'Paintbrush', '[{"name":"Unha Gel","price":120,"duration":90},{"name":"Manicure","price":40,"duration":45},{"name":"Pedicure","price":50,"duration":50}]'::jsonb),
  ('beleza', 'maquiadora', 'Maquiadora', 'Sparkles', '[{"name":"Maquiagem Social","price":150,"duration":60},{"name":"Maquiagem Noiva","price":350,"duration":120}]'::jsonb),
  ('beleza', 'salao', 'Salão de Beleza', 'Scissors', '[{"name":"Corte Feminino","price":80,"duration":45},{"name":"Escova","price":50,"duration":30},{"name":"Coloração","price":150,"duration":120}]'::jsonb),
  ('saude', 'massagista', 'Massagista', 'Heart', '[{"name":"Massagem Relaxante","price":120,"duration":60},{"name":"Massagem Desportiva","price":150,"duration":60}]'::jsonb),
  ('saude', 'fisioterapeuta', 'Fisioterapeuta', 'Activity', '[{"name":"Sessão Fisioterapia","price":100,"duration":50},{"name":"Avaliação","price":80,"duration":30}]'::jsonb),
  ('servicos', 'consultor', 'Consultor', 'Briefcase', '[{"name":"Consultoria 1h","price":200,"duration":60},{"name":"Mentoria","price":350,"duration":90}]'::jsonb)
ON CONFLICT DO NOTHING;
