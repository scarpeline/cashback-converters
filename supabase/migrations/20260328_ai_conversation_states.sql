-- Tabela para estado de conversas do assistente IA WhatsApp
CREATE TABLE IF NOT EXISTS ai_conversation_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  client_id UUID REFERENCES profiles(user_id),
  client_name TEXT,
  current_step TEXT NOT NULL DEFAULT 'idle',
  intent TEXT,
  context JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barbershop_id, client_phone)
);

-- Índice para busca rápida por telefone + barbearia
CREATE INDEX IF NOT EXISTS idx_ai_conv_states_lookup 
  ON ai_conversation_states(barbershop_id, client_phone, last_message_at DESC);

-- Limpar estados antigos (mais de 24h)
CREATE OR REPLACE FUNCTION cleanup_old_conversation_states()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_conversation_states 
  WHERE last_message_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
