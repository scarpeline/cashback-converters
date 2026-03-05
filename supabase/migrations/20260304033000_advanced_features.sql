-- Adição de colunas extras no cadastro da barbearia
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS affiliate_reward_type TEXT DEFAULT 'commission' CHECK (affiliate_reward_type IN ('commission', 'credit'));
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS marketing_flows JSONB DEFAULT '[]';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS pixels_config JSONB DEFAULT '{}';

-- Tabela de Rifas
CREATE TABLE IF NOT EXISTS raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ticket_price DECIMAL(10,2) DEFAULT 0,
  credit_award DECIMAL(10,2) DEFAULT 0,
  max_tickets INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_user_id UUID REFERENCES profiles(user_id),
  draw_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Bilhetes da Rifa
CREATE TABLE IF NOT EXISTS raffle_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID REFERENCES raffles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Rifas
CREATE POLICY "Qualquer usuário autenticado pode ver rifas" ON raffles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Donos podem gerenciar suas rifas" ON raffles FOR ALL USING (
  EXISTS (SELECT 1 FROM barbershops WHERE id = raffles.barbershop_id AND owner_user_id = auth.uid())
);

-- Políticas de RLS para Bilhetes
CREATE POLICY "Usuários podem ver seus próprios bilhetes" ON raffle_tickets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Donos podem ver bilhetes das suas rifas" ON raffle_tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM raffles JOIN barbershops ON raffles.barbershop_id = barbershops.id WHERE raffles.id = raffle_tickets.raffle_id AND barbershops.owner_user_id = auth.uid())
);
CREATE POLICY "Usuários podem comprar bilhetes" ON raffle_tickets FOR INSERT WITH CHECK (user_id = auth.uid());

-- Tabela de Mensagens Internas do Sistema
CREATE TABLE IF NOT EXISTS internal_system_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(user_id),
  target_role TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE internal_system_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins gerenciam mensagens" ON internal_system_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM authorized_super_admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND is_active = true)
);
CREATE POLICY "Usuários veem mensagens filtradas por role" ON internal_system_messages FOR SELECT USING (auth.uid() IS NOT NULL);
