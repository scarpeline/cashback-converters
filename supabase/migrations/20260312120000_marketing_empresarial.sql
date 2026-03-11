-- Migração: Marketing Empresarial
-- Criar tabela para configurações de vídeo promocional e marketing

-- Tabela de configurações de Marketing Empresarial
CREATE TABLE IF NOT EXISTS marketing_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  
  -- Configurações do vídeo promocional
  video_headline TEXT DEFAULT 'Descubra como aumentar seus clientes com nosso sistema',
  video_url TEXT,
  video_description TEXT DEFAULT 'Nosso sistema automatiza agendamentos, envia lembretes e ajuda você a fidelizar clientes. Transforme sua barbearia em um negócio de sucesso.',
  
  -- Configurações do botão
  button_text TEXT DEFAULT 'Começar Agora',
  button_url TEXT DEFAULT '/login',
  button_target TEXT DEFAULT 'internal' CHECK (button_target IN ('internal', 'external', 'whatsapp')),
  
  -- Controle de visibilidade
  allow_professionals_view BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir apenas um registro por barbearia
  UNIQUE(barbershop_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_marketing_settings_barbershop ON marketing_settings(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_marketing_settings_active ON marketing_settings(is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE TRIGGER update_marketing_settings_updated_at BEFORE UPDATE ON marketing_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE marketing_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Donos podem gerenciar próprio marketing" ON marketing_settings
    FOR ALL TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM barbershops b 
        WHERE b.id = marketing_settings.barbershop_id 
        AND b.owner_user_id = auth.uid()
    ));

CREATE POLICY "Profissionais podem visualizar se permitido" ON marketing_settings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM marketing_settings ms
            JOIN barbershops b ON b.id = ms.barbershop_id
            WHERE ms.id = marketing_settings.id
            AND ms.allow_professionals_view = true
            AND EXISTS (
                SELECT 1 FROM professionals p 
                WHERE p.barbershop_id = b.id 
                AND p.user_id = auth.uid()
            )
        )
    );

-- Inserir configurações padrão para barbearias existentes
INSERT INTO marketing_settings (barbershop_id)
SELECT id FROM barbershops
WHERE id NOT IN (SELECT barbershop_id FROM marketing_settings);

-- Comentários
COMMENT ON TABLE marketing_settings IS 'Configurações de Marketing Empresarial para barbearias';
COMMENT ON COLUMN marketing_settings.video_headline IS 'Headline exibida acima do vídeo';
COMMENT ON COLUMN marketing_settings.video_url IS 'URL do vídeo promocional';
COMMENT ON COLUMN marketing_settings.video_description IS 'Texto explicativo abaixo do vídeo';
COMMENT ON COLUMN marketing_settings.button_text IS 'Texto do botão de call-to-action';
COMMENT ON COLUMN marketing_settings.button_url IS 'URL de destino do botão';
COMMENT ON COLUMN marketing_settings.button_target IS 'Tipo de destino: internal, external ou whatsapp';
COMMENT ON COLUMN marketing_settings.allow_professionals_view IS 'Permite que profissionais vejam o marketing';
COMMENT ON COLUMN marketing_settings.is_active IS 'Se o marketing está ativo';
