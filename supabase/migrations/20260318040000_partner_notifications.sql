-- Tabela de notificações para parceiros
CREATE TABLE partner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'commission_generated', 'commission_approved', 'commission_paid', 'referral_completed', 'new_referral'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE partner_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parceiros podem ver suas notificações"
  ON partner_notifications FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parceiros podem marcar suas notificações como lidas"
  ON partner_notifications FOR UPDATE
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parceiros podem deletar suas notificações"
  ON partner_notifications FOR DELETE
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admin pode ver todas as notificações"
  ON partner_notifications FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- Índices
CREATE INDEX idx_partner_notifications_partner ON partner_notifications(partner_id);
CREATE INDEX idx_partner_notifications_read ON partner_notifications(read);
CREATE INDEX idx_partner_notifications_created ON partner_notifications(created_at);
CREATE INDEX idx_partner_notifications_type ON partner_notifications(type);

-- View para contar notificações não lidas
CREATE VIEW partner_unread_notifications_count AS
SELECT 
  partner_id,
  COUNT(*) as unread_count
FROM partner_notifications
WHERE read = FALSE
GROUP BY partner_id;
