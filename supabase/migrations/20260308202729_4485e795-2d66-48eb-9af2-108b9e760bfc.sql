
-- Stock items table with buy/sell prices
CREATE TABLE IF NOT EXISTS public.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  buy_price numeric NOT NULL DEFAULT 0,
  sell_price numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage stock" ON public.stock_items
FOR ALL TO authenticated
USING (public.owns_barbershop(auth.uid(), barbershop_id))
WITH CHECK (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Super admins manage stock" ON public.stock_items
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Raffles table (Ação entre Amigos)
CREATE TABLE IF NOT EXISTS public.raffles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  ticket_price numeric NOT NULL DEFAULT 10,
  credit_award numeric NOT NULL DEFAULT 50,
  max_tickets integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'open',
  winner_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage raffles" ON public.raffles
FOR ALL TO authenticated
USING (public.owns_barbershop(auth.uid(), barbershop_id))
WITH CHECK (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Public view open raffles" ON public.raffles
FOR SELECT TO authenticated
USING (status = 'open');

CREATE POLICY "Super admins manage raffles" ON public.raffles
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Messaging packages table
CREATE TABLE IF NOT EXISTS public.messaging_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'sms',
  quantity integer NOT NULL,
  price numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messaging_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view packages" ON public.messaging_packages
FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Super admins manage packages" ON public.messaging_packages
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Messaging credits per barbershop
CREATE TABLE IF NOT EXISTS public.messaging_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'sms',
  remaining integer NOT NULL DEFAULT 0,
  total_purchased integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messaging_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own credits" ON public.messaging_credits
FOR ALL TO authenticated
USING (public.owns_barbershop(auth.uid(), barbershop_id))
WITH CHECK (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Super admins manage credits" ON public.messaging_credits
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Add cashback_percentage to barbershops
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS cashback_percentage numeric DEFAULT 5;

-- Add automation schedule columns to barbershops (JSONB for weekly schedule)
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS automation_schedule jsonb DEFAULT '[]'::jsonb;

-- Add affiliate commission settings to barbershops
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS affiliate_reward_type text DEFAULT 'commission';
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS affiliate_commission_pct numeric DEFAULT 10;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS affiliate_auto_pay boolean DEFAULT false;

-- Debts table for "Fiado"
CREATE TABLE IF NOT EXISTS public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_whatsapp text,
  client_user_id uuid,
  amount numeric NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  payment_id uuid REFERENCES public.payments(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage debts" ON public.debts
FOR ALL TO authenticated
USING (public.owns_barbershop(auth.uid(), barbershop_id))
WITH CHECK (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Clients view own debts" ON public.debts
FOR SELECT TO authenticated
USING (client_user_id = auth.uid());

CREATE POLICY "Super admins manage debts" ON public.debts
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()));
