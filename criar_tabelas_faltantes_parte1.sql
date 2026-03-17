-- ============================================================================
-- CRIAR TABELAS FALTANTES (SEM SOBRESCREVER) - PARTE 1
-- ============================================================================
-- ⚠️ IMPORTANTE: Executar no Supabase Dashboard > SQL Editor
-- ⚠️ Este SQL usa IF NOT EXISTS para não sobrescrever tabelas existentes
-- ============================================================================

-- ============================================================================
-- 1. stock_items (Produtos/Estoque)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  quantity INT NOT NULL DEFAULT 0,
  min_quantity INT DEFAULT 5,
  unit_price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_items_barbershop_id ON public.stock_items(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON public.stock_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_items_is_active ON public.stock_items(is_active);

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

-- RLS: Donos veem seus próprios itens
CREATE POLICY IF NOT EXISTS "Owners can manage own stock items"
ON public.stock_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE barbershops.id = stock_items.barbershop_id
    AND barbershops.owner_user_id = auth.uid()
  )
);

-- RLS: Super admins veem tudo
CREATE POLICY IF NOT EXISTS "Super admins can view all stock items"
ON public.stock_items FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- ============================================================================
-- 2. raffles (Ações entre amigos / Rifas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ticket_price NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  credit_award NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  total_tickets INT NOT NULL DEFAULT 100,
  sold_tickets INT DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  draw_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raffles_barbershop_id ON public.raffles(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_raffles_status ON public.raffles(status);
CREATE INDEX IF NOT EXISTS idx_raffles_draw_date ON public.raffles(draw_date);

ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;

-- RLS: Donos gerenciam suas rifas
CREATE POLICY IF NOT EXISTS "Owners can manage own raffles"
ON public.raffles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE barbershops.id = raffles.barbershop_id
    AND barbershops.owner_user_id = auth.uid()
  )
);

-- RLS: Clientes veem rifas abertas
CREATE POLICY IF NOT EXISTS "Clients can view open raffles"
ON public.raffles FOR SELECT
USING (status = 'open');

-- ============================================================================
-- 3. raffle_tickets (Bilhetes de rifa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.raffle_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number INT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'winner', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(raffle_id, user_id) -- Um usuário só pode ter um bilhete por rifa
);

CREATE INDEX IF NOT EXISTS idx_raffle_tickets_raffle_id ON public.raffle_tickets(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_tickets_user_id ON public.raffle_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_raffle_tickets_status ON public.raffle_tickets(status);

ALTER TABLE public.raffle_tickets ENABLE ROW LEVEL SECURITY;

-- RLS: Usuários veem seus próprios bilhetes
CREATE POLICY IF NOT EXISTS "Users can view own tickets"
ON public.raffle_tickets FOR SELECT
USING (user_id = auth.uid());

-- RLS: Donos veem bilhetes de suas rifas
CREATE POLICY IF NOT EXISTS "Owners can view tickets for their raffles"
ON public.raffle_tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.raffles r
    JOIN public.barbershops b ON b.id = r.barbershop_id
    WHERE r.id = raffle_tickets.raffle_id
    AND b.owner_user_id = auth.uid()
  )
);

-- ============================================================================
-- 4. debts (Dívidas de clientes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT,
  client_whatsapp TEXT,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debts_barbershop_id ON public.debts(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_debts_client_user_id ON public.debts(client_user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON public.debts(due_date);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- RLS: Donos gerenciam dívidas de sua barbearia
CREATE POLICY IF NOT EXISTS "Owners can manage own barbershop debts"
ON public.debts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE barbershops.id = debts.barbershop_id
    AND barbershops.owner_user_id = auth.uid()
  )
);

-- RLS: Clientes veem suas próprias dívidas
CREATE POLICY IF NOT EXISTS "Clients can view own debts"
ON public.debts FOR SELECT
USING (client_user_id = auth.uid());

-- RLS: Profissionais veem dívidas de sua barbearia
CREATE POLICY IF NOT EXISTS "Professionals can view barbershop debts"
ON public.debts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.barbershop_id = debts.barbershop_id
    AND p.user_id = auth.uid()
  )
);

-- ============================================================================
-- 5. fiscal_service_types (Tipos de serviços contábeis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fiscal_service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  duration_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_service_types_is_active ON public.fiscal_service_types(is_active);

ALTER TABLE public.fiscal_service_types ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins gerenciam
CREATE POLICY IF NOT EXISTS "Super admins can manage fiscal service types"
ON public.fiscal_service_types FOR ALL
USING (public.is_super_admin(auth.uid()));

-- RLS: Todos podem ver serviços ativos
CREATE POLICY IF NOT EXISTS "Anyone can view active fiscal service types"
ON public.fiscal_service_types FOR SELECT
USING (is_active = true);

-- ============================================================================
-- 6. fiscal_service_requests (Solicitações de serviços contábeis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fiscal_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type_id UUID NOT NULL REFERENCES public.fiscal_service_types(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE SET NULL,
  accountant_id UUID REFERENCES public.accountants(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  amount NUMERIC(10,2) NOT NULL,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_service_requests_user_id ON public.fiscal_service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_service_requests_accountant_id ON public.fiscal_service_requests(accountant_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_service_requests_status ON public.fiscal_service_requests(status);

ALTER TABLE public.fiscal_service_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Usuários veem suas próprias solicitações
CREATE POLICY IF NOT EXISTS "Users can view own service requests"
ON public.fiscal_service_requests FOR SELECT
USING (user_id = auth.uid());

-- RLS: Contadores veem solicitações atribuídas a eles
CREATE POLICY IF NOT EXISTS "Accountants can view assigned service requests"
ON public.fiscal_service_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.accountants
    WHERE accountants.id = fiscal_service_requests.accountant_id
    AND accountants.user_id = auth.uid()
  )
);

-- RLS: Super admins veem tudo
CREATE POLICY IF NOT EXISTS "Super admins can view all service requests"
ON public.fiscal_service_requests FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- ============================================================================
-- 7. subscription_plans (Planos de assinatura)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL,
  price_yearly NUMERIC(10,2),
  features JSONB DEFAULT '[]'::jsonb,
  max_professionals INT DEFAULT 1,
  max_services INT DEFAULT 10,
  max_clients INT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_price_monthly ON public.subscription_plans(price_monthly);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins gerenciam
CREATE POLICY IF NOT EXISTS "Super admins can manage subscription plans"
ON public.subscription_plans FOR ALL
USING (public.is_super_admin(auth.uid()));

-- RLS: Todos podem ver planos ativos
CREATE POLICY IF NOT EXISTS "Anyone can view active subscription plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

-- ============================================================================
-- 8. messaging_packages (Pacotes de mensagens SMS/WhatsApp)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messaging_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  message_count INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'both')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messaging_packages_channel ON public.messaging_packages(channel);
CREATE INDEX IF NOT EXISTS idx_messaging_packages_is_active ON public.messaging_packages(is_active);

ALTER TABLE public.messaging_packages ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins gerenciam
CREATE POLICY IF NOT EXISTS "Super admins can manage messaging packages"
ON public.messaging_packages FOR ALL
USING (public.is_super_admin(auth.uid()));

-- RLS: Todos podem ver pacotes ativos
CREATE POLICY IF NOT EXISTS "Anyone can view active messaging packages"
ON public.messaging_packages FOR SELECT
USING (is_active = true);

-- ============================================================================
-- 9. internal_system_messages (Mensagens internas do sistema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.internal_system_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'critical', 'maintenance')),
  target_roles JSONB DEFAULT '[]'::jsonb, -- ['super_admin', 'dono', 'contador']
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_system_messages_type ON public.internal_system_messages(type);
CREATE INDEX IF NOT EXISTS idx_internal_system_messages_is_active ON public.internal_system_messages(is_active);
CREATE INDEX IF NOT EXISTS idx_internal_system_messages_starts_at ON public.internal_system_messages(starts_at);

ALTER TABLE public.internal_system_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins gerenciam
CREATE POLICY IF NOT EXISTS "Super admins can manage internal system messages"
ON public.internal_system_messages FOR ALL
USING (public.is_super_admin(auth.uid()));

-- RLS: Usuários veem mensagens ativas para seus roles
CREATE POLICY IF NOT EXISTS "Users can view active messages for their roles"
ON public.internal_system_messages FOR SELECT
USING (
  is_active = true
  AND now() BETWEEN starts_at AND COALESCE(ends_at, 'infinity'::timestamptz)
  AND (
    target_roles = '[]'::jsonb
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND target_roles @> jsonb_build_array(ur.role::text)
    )
  )
);
-- ============================================================================
-- 10. TRIGGERS PARA UPDATED_AT
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS set_stock_items_updated_at
BEFORE UPDATE ON public.stock_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_raffles_updated_at
BEFORE UPDATE ON public.raffles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_debts_updated_at
BEFORE UPDATE ON public.debts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_fiscal_service_types_updated_at
BEFORE UPDATE ON public.fiscal_service_types
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_fiscal_service_requests_updated_at
BEFORE UPDATE ON public.fiscal_service_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_messaging_packages_updated_at
BEFORE UPDATE ON public.messaging_packages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_internal_system_messages_updated_at
BEFORE UPDATE ON public.internal_system_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 11. DADOS INICIAIS
-- ============================================================================

-- Planos de assinatura
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, max_professionals, max_services, max_clients, is_active, is_popular)
VALUES
  ('Básico', 'Para barbearias iniciantes', 49.90, 499.00, '["Agendamentos", "1 Profissional", "10 Serviços", "100 Clientes", "Suporte por email"]', 1, 10, 100, true, false),
  ('Profissional', 'Para barbearias em crescimento', 99.90, 999.00, '["Agendamentos", "3 Profissionais", "30 Serviços", "500 Clientes", "Cashback", "Suporte prioritário"]', 3, 30, 500, true, true),
  ('Premium', 'Para barbearias estabelecidas', 199.90, 1999.00, '["Agendamentos", "10 Profissionais", "100 Serviços", "Clientes ilimitados", "Cashback", "Afiliados", "Suporte 24/7"]', 10, 100, 999999, true, false)
ON CONFLICT DO NOTHING;

-- Pacotes de mensagens
INSERT INTO public.messaging_packages (name, description, message_count, price, channel, is_active)
VALUES
  ('Pacote WhatsApp 100', '100 mensagens WhatsApp', 100, 29.90, 'whatsapp', true),
  ('Pacote WhatsApp 500', '500 mensagens WhatsApp', 500, 99.90, 'whatsapp', true),
  ('Pacote SMS 1000', '1000 mensagens SMS', 1000, 49.90, 'sms', true),
  ('Combo Completo', '500 WhatsApp + 500 SMS', 1000, 149.90, 'both', true)
ON CONFLICT DO NOTHING;

-- Tipos de serviços contábeis
INSERT INTO public.fiscal_service_types (name, description, base_price, duration_days, is_active)
VALUES
  ('Abertura MEI', 'Abertura completa de MEI', 199.90, 7, true),
  ('Abertura ME', 'Abertura completa de ME', 499.90, 15, true),
  ('Declaração Anual', 'Declaração anual do MEI', 99.90, 30, true),
  ('Declaração Mensal', 'Declaração mensal do ME', 149.90, 30, true),
  ('Regularização Fiscal', 'Regularização de pendências', 299.90, 45, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. VERIFICAÇÃO
-- ============================================================================
-- Execute esta query para verificar o que foi criado:

/*
SELECT 
  table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = table_name) as created
FROM (VALUES 
  ('stock_items'),
  ('raffles'),
  ('raffle_tickets'),
  ('debts'),
  ('fiscal_service_types'),
  ('fiscal_service_requests'),
  ('subscription_plans'),
  ('messaging_packages'),
  ('internal_system_messages')
) AS tables(table_name);
*/

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================