-- Migração: Sistema de Antecipação Automática
-- Criar tabela para registrar ofertas de antecipação de horários

-- Tabela de ofertas de antecipação
CREATE TABLE IF NOT EXISTS anticipation_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  offered_scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  offered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_anticipation_offers_appointment ON anticipation_offers(appointment_id);
CREATE INDEX IF NOT EXISTS idx_anticipation_offers_client ON anticipation_offers(client_id, status);
CREATE INDEX IF NOT EXISTS idx_anticipation_offers_status_deadline ON anticipation_offers(status, response_deadline);
CREATE INDEX IF NOT EXISTS idx_anticipation_offers_offered_at ON anticipation_offers(offered_at);

-- Trigger para updated_at
CREATE TRIGGER update_anticipation_offers_updated_at BEFORE UPDATE ON anticipation_offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE anticipation_offers ENABLE ROW LEVEL SECURITY;

-- Políticas para anticipation_offers
CREATE POLICY "Donos podem ver ofertas da sua barbearia" ON anticipation_offers
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM appointments a
        JOIN barbershops b ON a.barbershop_id = b.id
        WHERE a.id = anticipation_offers.appointment_id 
        AND b.owner_id = auth.uid()
      )
    );

CREATE POLICY "Clientes podem ver próprias ofertas" ON anticipation_offers
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Profissionais podem ver ofertas (se permitido)" ON anticipation_offers
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM appointments a
        JOIN professionals p ON a.professional_id = p.id
        JOIN agenda_intelligence_settings ais ON p.barbershop_id = ais.barbershop_id
        WHERE a.id = anticipation_offers.appointment_id 
          AND p.user_id = auth.uid()
          AND ais.allow_professionals_view_anticipations = true
      )
    );

CREATE POLICY "Sistema pode gerenciar ofertas" ON anticipation_offers
    FOR ALL USING (false); -- Apenas service role

-- Comentários explicativos
COMMENT ON TABLE anticipation_offers IS 'Ofertas de antecipação automática de agendamentos';
COMMENT ON COLUMN anticipation_offers.original_scheduled_at IS 'Horário original do agendamento';
COMMENT ON COLUMN anticipation_offers.offered_scheduled_at IS 'Horário oferecido para antecipação';
COMMENT ON COLUMN anticipation_offers.response_deadline IS 'Prazo limite para resposta do cliente';
