-- Migração: Sistema de Notificações para Fila de Espera
-- Criar tabelas para gerenciar notificações e respostas

-- Tabela de notificações (ampliação da existente)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  channels TEXT[] DEFAULT ARRAY['whatsapp'],
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas de notificações
CREATE TABLE IF NOT EXISTS notification_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications(type, priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_response ON notifications(response, responded_at);

CREATE INDEX IF NOT EXISTS idx_notification_responses_notification ON notification_responses(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_responses_action ON notification_responses(action);
CREATE INDEX IF NOT EXISTS idx_notification_responses_responded_at ON notification_responses(responded_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_responses ENABLE ROW LEVEL SECURITY;

-- Políticas para notifications
CREATE POLICY "Usuários podem ver próprias notificações" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Sistema pode gerenciar notificações" ON notifications
    FOR ALL USING (false); -- Apenas service role

-- Políticas para notification_responses
CREATE POLICY "Usuários podem ver próprias respostas" ON notification_responses
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.id = notification_responses.notification_id 
        AND n.user_id = auth.uid()
      )
    );

CREATE POLICY "Sistema pode gerenciar respostas" ON notification_responses
    FOR ALL USING (false); -- Apenas service role

-- Função para limpar notificações antigas
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Excluir notificações com mais de 90 dias
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '90 days'
      AND status IN ('delivered', 'read', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Excluir respostas órfãs
    DELETE FROM notification_responses 
    WHERE notification_id NOT IN (SELECT id FROM notifications);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários explicativos
COMMENT ON TABLE notifications IS 'Notificações do sistema para usuários';
COMMENT ON TABLE notification_responses IS 'Respostas dos usuários às notificações';
COMMENT ON COLUMN notifications.metadata IS 'Dados adicionais como botões, templates, etc.';
COMMENT ON COLUMN notifications.response IS 'Ação/resposta do usuário à notificação';
COMMENT ON COLUMN notification_responses.action IS 'Ação executada pelo usuário';
