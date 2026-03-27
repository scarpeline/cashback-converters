-- Tabela de Log de Campanhas de Reativação
CREATE TABLE IF NOT EXISTS reactivation_campaigns_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read, failed
  response_type VARCHAR(50), -- scheduled, declined, no_response
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_reactivation_client_id ON reactivation_campaigns_log(client_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_sent_at ON reactivation_campaigns_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_reactivation_status ON reactivation_campaigns_log(status);

-- RLS Policies
ALTER TABLE reactivation_campaigns_log ENABLE ROW LEVEL SECURITY;

-- Política para profissionais verem campanhas de seus clientes
CREATE POLICY "Profissionais podem ver campanhas de reativação de seus clientes"
  ON reactivation_campaigns_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.professional_user_id = auth.uid()
      AND appointments.client_user_id = (
        SELECT user_id FROM profiles WHERE id = reactivation_campaigns_log.client_id
      )
    )
  );

-- Política para profissionais criarem campanhas
CREATE POLICY "Profissionais podem criar campanhas de reativação"
  ON reactivation_campaigns_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.professional_user_id = auth.uid()
      AND appointments.client_user_id = (
        SELECT user_id FROM profiles WHERE id = reactivation_campaigns_log.client_id
      )
    )
  );

-- Política para profissionais atualizarem campanhas
CREATE POLICY "Profissionais podem atualizar campanhas de reativação"
  ON reactivation_campaigns_log
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.professional_user_id = auth.uid()
      AND appointments.client_user_id = (
        SELECT user_id FROM profiles WHERE id = reactivation_campaigns_log.client_id
      )
    )
  );
