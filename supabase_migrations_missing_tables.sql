-- ============ TABELAS FALTANDO - CRIAR NO SUPABASE ============

-- 1. STOCK_ITEMS (Produtos/Estoque da Barbearia)
CREATE TABLE IF NOT EXISTS stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  sell_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. RAFFLES (Ações entre Amigos / Rifas)
CREATE TABLE IF NOT EXISTS raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ticket_price DECIMAL(10,2) NOT NULL,
  credit_award DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'open', -- open, closed, drawn
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. RAFFLE_TICKETS (Bilhetes de Rifa)
CREATE TABLE IF NOT EXISTS raffle_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_number INTEGER,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(raffle_id, user_id)
);

-- 4. DEBTS (Dívidas/Fiado do Profissional)
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 5. FISCAL_SERVICE_TYPES (Tipos de Serviços Contábeis)
CREATE TABLE IF NOT EXISTS fiscal_service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2),
  service_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now()
);

-- 6. FISCAL_SERVICE_REQUESTS (Solicitações de Serviços Contábeis)
CREATE TABLE IF NOT EXISTS fiscal_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accountant_id UUID REFERENCES accountants(id) ON DELETE SET NULL,
  service_type_id UUID REFERENCES fiscal_service_types(id),
  status TEXT DEFAULT 'pending', -- pending, approved, completed, rejected
  amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 7. SUBSCRIPTION_PLANS (Planos de Assinatura)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 8. MESSAGING_PACKAGES (Pacotes de Mensagens)
CREATE TABLE IF NOT EXISTS messaging_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sms_count INTEGER,
  whatsapp_count INTEGER,
  email_count INTEGER,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 9. INTERNAL_SYSTEM_MESSAGES (Mensagens Internas do Sistema)
CREATE TABLE IF NOT EXISTS internal_system_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, warning, error, success
  target_role TEXT, -- super_admin, dono, profissional, contador, cliente
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- ============ CRIAR ÍNDICES PARA PERFORMANCE ============
CREATE INDEX IF NOT EXISTS idx_stock_items_barbershop ON stock_items(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_raffles_barbershop ON raffles(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_raffle_tickets_raffle ON raffle_tickets(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_tickets_user ON raffle_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_professional ON debts(professional_user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_requests_client ON fiscal_service_requests(client_user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_requests_accountant ON fiscal_service_requests(accountant_id);
