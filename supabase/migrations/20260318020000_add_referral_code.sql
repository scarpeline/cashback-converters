-- Adicionar referral_code aos parceiros
ALTER TABLE partners ADD COLUMN referral_code VARCHAR(12) UNIQUE NOT NULL DEFAULT '';

-- Gerar códigos únicos para parceiros existentes
UPDATE partners 
SET referral_code = UPPER(SUBSTRING(MD5(CONCAT(id, created_at)), 1, 8))
WHERE referral_code = '';

-- Criar índice para busca rápida
CREATE INDEX idx_partners_referral_code ON partners(referral_code);

-- Tabela para rastrear referências (quem foi indicado por quem)
CREATE TABLE partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_user_id)
);

-- RLS para partner_referrals
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parceiros podem ver suas referências"
  ON partner_referrals FOR SELECT
  USING (
    referrer_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admin pode ver todas as referências"
  ON partner_referrals FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- Índices
CREATE INDEX idx_partner_referrals_referrer ON partner_referrals(referrer_id);
CREATE INDEX idx_partner_referrals_referred_user ON partner_referrals(referred_user_id);
CREATE INDEX idx_partner_referrals_status ON partner_referrals(status);
