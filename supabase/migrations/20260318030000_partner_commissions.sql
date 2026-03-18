-- Tabela de comissões de parceiros
CREATE TABLE partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'referral', 'franchise_revenue', 'network_revenue'
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  source_id UUID, -- ID do pagamento, agendamento, etc que gerou a comissão
  source_type VARCHAR(50), -- 'payment', 'appointment', 'franchise_signup'
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, cancelled
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parceiros podem ver suas comissões"
  ON partner_commissions FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admin pode ver todas as comissões"
  ON partner_commissions FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- Índices
CREATE INDEX idx_partner_commissions_partner ON partner_commissions(partner_id);
CREATE INDEX idx_partner_commissions_status ON partner_commissions(status);
CREATE INDEX idx_partner_commissions_created ON partner_commissions(created_at);

-- View para resumo de comissões por parceiro
CREATE VIEW partner_commission_summary AS
SELECT 
  p.id,
  p.user_id,
  COUNT(CASE WHEN pc.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN pc.status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN pc.status = 'paid' THEN 1 END) as paid_count,
  COALESCE(SUM(CASE WHEN pc.status = 'pending' THEN pc.amount ELSE 0 END), 0) as pending_amount,
  COALESCE(SUM(CASE WHEN pc.status = 'approved' THEN pc.amount ELSE 0 END), 0) as approved_amount,
  COALESCE(SUM(CASE WHEN pc.status = 'paid' THEN pc.amount ELSE 0 END), 0) as paid_amount,
  COALESCE(SUM(pc.amount), 0) as total_amount
FROM partners p
LEFT JOIN partner_commissions pc ON p.id = pc.partner_id
GROUP BY p.id, p.user_id;
