-- Migração: Sistema de Fila de Espera Inteligente
-- Criar tabelas para fila de espera, configurações de inteligência e preço dinâmico

-- 1. Tabela de Fila de Espera
CREATE TABLE IF NOT EXISTS waitlist_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_preferred_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  desired_date DATE NOT NULL,
  desired_time TIME NOT NULL,
  accepts_other_professional BOOLEAN DEFAULT false,
  accepts_nearby_time BOOLEAN DEFAULT false,
  accepts_any_time BOOLEAN DEFAULT false,
  position_in_queue INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'accepted', 'declined', 'expired', 'cancelled')),
  offered_at TIMESTAMP WITH TIME ZONE,
  offered_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  response_deadline TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Configurações de Inteligência de Agenda
CREATE TABLE IF NOT EXISTS agenda_intelligence_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  
  -- Configurações de Fila de Espera
  enable_waitlist BOOLEAN DEFAULT true,
  allow_professionals_view_queue BOOLEAN DEFAULT false,
  allow_professionals_offer_slots BOOLEAN DEFAULT false,
  waitlist_response_minutes INTEGER DEFAULT 10,
  
  -- Configurações de Antecipação
  enable_auto_anticipation BOOLEAN DEFAULT true,
  anticipation_time_window_hours INTEGER DEFAULT 4,
  allow_professionals_view_anticipations BOOLEAN DEFAULT false,
  
  -- Configurações de Preço Dinâmico
  enable_dynamic_pricing BOOLEAN DEFAULT false,
  allow_professionals_view_dynamic_pricing BOOLEAN DEFAULT false,
  
  -- Configurações de Realocação
  enable_reallocation BOOLEAN DEFAULT true,
  allow_professionals_reallocation BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(barbershop_id)
);

-- 3. Tabela de Preços Dinâmicos
CREATE TABLE IF NOT EXISTS dynamic_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  
  -- Configuração de Período
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dom, 1=Seg, ..., 6=Sáb
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Configuração de Preço
  price_type TEXT DEFAULT 'percentage' CHECK (price_type IN ('percentage', 'fixed')),
  price_adjustment NUMERIC NOT NULL, -- Porcentagem ou valor fixo
  
  -- Configurações Adicionais
  is_active BOOLEAN DEFAULT true,
  min_capacity_threshold INTEGER DEFAULT 80, -- Percentual mínimo de ocupação
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar sobreposição de períodos
  EXCLUDE (USING gist(
    barbershop_id WITH =,
    service_id WITH =,
    day_of_week WITH =,
    tstzrange(
      make_timestamp(2024, 1, 1, EXTRACT(HOUR FROM start_time), EXTRACT(MINUTE FROM start_time), 0),
      make_timestamp(2024, 1, 1, EXTRACT(HOUR FROM end_time), EXTRACT(MINUTE FROM end_time), 0)
    ) WITH &&
  ))
);

-- 4. Tabela de Histórico de Ofertas da Fila
CREATE TABLE IF NOT EXISTS waitlist_offer_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  waitlist_id UUID NOT NULL REFERENCES waitlist_queue(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('slot_available', 'anticipation', 'reallocation')),
  offered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  response TEXT CHECK (response IN ('accepted', 'declined', 'expired')),
  responded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_waitlist_queue_barbershop_status ON waitlist_queue(barbershop_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_queue_position ON waitlist_queue(barbershop_id, desired_date, position_in_queue);
CREATE INDEX IF NOT EXISTS idx_waitlist_queue_client ON waitlist_queue(client_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_queue_professional ON waitlist_queue(professional_preferred_id, status);

CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_barbershop ON dynamic_pricing(barbershop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_service_time ON dynamic_pricing(service_id, day_of_week, start_time);

CREATE INDEX IF NOT EXISTS idx_waitlist_history_waitlist ON waitlist_offer_history(waitlist_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_history_date ON waitlist_offer_history(offered_at);

-- 6. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_waitlist_queue_updated_at BEFORE UPDATE ON waitlist_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agenda_intelligence_settings_updated_at BEFORE UPDATE ON agenda_intelligence_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dynamic_pricing_updated_at BEFORE UPDATE ON dynamic_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Trigger para atualizar posição na fila automaticamente
CREATE OR REPLACE FUNCTION update_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é um novo registro na fila
  IF TG_OP = 'INSERT' THEN
    -- Encontrar a próxima posição disponível
    NEW.position_in_queue = (
      SELECT COALESCE(MAX(position_in_queue), 0) + 1
      FROM waitlist_queue
      WHERE barbershop_id = NEW.barbershop_id 
        AND desired_date = NEW.desired_date
        AND status = 'waiting'
    );
    RETURN NEW;
  
  -- Se um registro foi removido da fila
  ELSIF TG_OP = 'DELETE' THEN
    -- Reorganizar as posições
    UPDATE waitlist_queue
    SET position_in_queue = position_in_queue - 1
    WHERE barbershop_id = OLD.barbershop_id
      AND desired_date = OLD.desired_date
      AND status = 'waiting'
      AND position_in_queue > OLD.position_in_queue;
    RETURN OLD;
  
  -- Se o status mudou para algo diferente de 'waiting'
  ELSIF TG_OP = 'UPDATE' THEN
    -- Se saiu do status waiting, reorganizar fila
    IF OLD.status = 'waiting' AND NEW.status != 'waiting' THEN
      UPDATE waitlist_queue
      SET position_in_queue = position_in_queue - 1
      WHERE barbershop_id = NEW.barbershop_id
        AND desired_date = NEW.desired_date
        AND status = 'waiting'
        AND position_in_queue > NEW.position_in_queue;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_waitlist_position
    AFTER INSERT OR DELETE OR UPDATE ON waitlist_queue
    FOR EACH ROW EXECUTE FUNCTION update_waitlist_position();

-- 8. RLS (Row Level Security)
ALTER TABLE waitlist_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_intelligence_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_offer_history ENABLE ROW LEVEL SECURITY;

-- Políticas para waitlist_queue
CREATE POLICY "Donos podem ver fila da sua barbearia" ON waitlist_queue
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM barbershops 
        WHERE id = barbershop_id 
        AND owner_id = auth.uid()
      )
    );

CREATE POLICY "Profissionais podem ver fila (se permitido)" ON waitlist_queue
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM professionals p
        JOIN agenda_intelligence_settings ais ON p.barbershop_id = ais.barbershop_id
        WHERE p.user_id = auth.uid()
          AND p.barbershop_id = waitlist_queue.barbershop_id
          AND ais.allow_professionals_view_queue = true
      )
    );

CREATE POLICY "Clientes podem ver própria fila" ON waitlist_queue
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Sistema pode gerenciar fila" ON waitlist_queue
    FOR ALL USING (false); -- Apenas service role

-- Políticas para agenda_intelligence_settings
CREATE POLICY "Donos podem gerenciar configurações" ON agenda_intelligence_settings
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM barbershops 
        WHERE id = barbershop_id 
        AND owner_id = auth.uid()
      )
    );

CREATE POLICY "Profissionais podem ver configurações" ON agenda_intelligence_settings
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM professionals p
        WHERE p.user_id = auth.uid()
          AND p.barbershop_id = agenda_intelligence_settings.barbershop_id
      )
    );

-- Políticas para dynamic_pricing
CREATE POLICY "Donos podem gerenciar preços dinâmicos" ON dynamic_pricing
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM barbershops 
        WHERE id = barbershop_id 
        AND owner_id = auth.uid()
      )
    );

CREATE POLICY "Profissionais podem ver preços dinâmicos (se permitido)" ON dynamic_pricing
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM professionals p
        JOIN agenda_intelligence_settings ais ON p.barbershop_id = ais.barbershop_id
        WHERE p.user_id = auth.uid()
          AND p.barbershop_id = dynamic_pricing.barbershop_id
          AND ais.allow_professionals_view_dynamic_pricing = true
      )
    );

-- Políticas para waitlist_offer_history
CREATE POLICY "Donos podem ver histórico" ON waitlist_offer_history
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM waitlist_queue wq
        JOIN barbershops b ON wq.barbershop_id = b.id
        WHERE wq.id = waitlist_id 
        AND b.owner_id = auth.uid()
      )
    );

CREATE POLICY "Clientes podem ver próprio histórico" ON waitlist_offer_history
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM waitlist_queue wq
        WHERE wq.id = waitlist_id 
        AND wq.client_id = auth.uid()
      )
    );

-- 9. Funções auxiliares para o sistema

-- Função para encontrar próximo cliente elegível na fila
CREATE OR REPLACE FUNCTION find_next_waitlist_client(
  p_barbershop_id UUID,
  p_available_date DATE,
  p_available_time TIME,
  p_professional_id UUID DEFAULT NULL,
  p_service_id UUID DEFAULT NULL
)
RETURNS TABLE (
  waitlist_id UUID,
  client_id UUID,
  client_name TEXT,
  position_in_queue INTEGER,
  priority_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wq.id,
    wq.client_id,
    p.name as client_name,
    wq.position_in_queue,
    -- Calcular score de prioridade
    CASE 
      -- Prioridade 1: Mesmo profissional + mesma data + horário próximo
      WHEN wq.professional_preferred_id = p_professional_id 
        AND wq.desired_date = p_available_date
        AND wq.accepts_nearby_time = true
        AND ABS(EXTRACT(EPOCH FROM (p_available_time::time - wq.desired_time)) / 60) <= 60
      THEN 100
      
      -- Prioridade 2: Aceita outro profissional + horário próximo
      WHEN wq.accepts_other_professional = true 
        AND wq.desired_date = p_available_date
        AND wq.accepts_nearby_time = true
        AND ABS(EXTRACT(EPOCH FROM (p_available_time::time - wq.desired_time)) / 60) <= 60
      THEN 80
      
      -- Prioridade 3: Aceita qualquer horário no dia
      WHEN wq.desired_date = p_available_date 
        AND wq.accepts_any_time = true
      THEN 60
      
      -- Prioridade 4: Outros casos
      ELSE 40
    END as priority_score
  FROM waitlist_queue wq
  JOIN profiles p ON wq.client_id = p.id
  WHERE wq.barbershop_id = p_barbershop_id
    AND wq.status = 'waiting'
    AND wq.desired_date = p_available_date
    AND (
      -- Filtro por serviço se especificado
      p_service_id IS NULL 
      OR wq.service_id = p_service_id
    )
  ORDER BY 
    priority_score DESC,
    wq.position_in_queue ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular preço dinâmico
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
  p_barbershop_id UUID,
  p_service_id UUID,
  p_date DATE,
  p_time TIME,
  p_base_price NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  v_adjustment NUMERIC := 0;
  v_final_price NUMERIC := p_base_price;
  v_day_of_week INTEGER;
BEGIN
  -- Obter dia da semana (0=Dom, 1=Seg, ..., 6=Sáb)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Buscar regras de preço dinâmico aplicáveis
  SELECT 
    CASE 
      WHEN dp.price_type = 'percentage' THEN p_base_price * (dp.price_adjustment / 100)
      ELSE dp.price_adjustment
    END INTO v_adjustment
  FROM dynamic_pricing dp
  WHERE dp.barbershop_id = p_barbershop_id
    AND dp.is_active = true
    AND (dp.service_id IS NULL OR dp.service_id = p_service_id)
    AND dp.day_of_week = v_day_of_week
    AND p_time::time BETWEEN dp.start_time AND dp.end_time;
  
  -- Aplicar ajuste se encontrado
  IF v_adjustment IS NOT NULL THEN
    v_final_price := p_base_price + v_adjustment;
  END IF;
  
  -- Garantir que preço não seja negativo
  v_final_price := GREATEST(v_final_price, 0);
  
  RETURN v_final_price;
END;
$$ LANGUAGE plpgsql;

-- 10. Inserir configurações padrão para barbearias existentes
INSERT INTO agenda_intelligence_settings (barbershop_id)
SELECT id FROM barbershops
ON CONFLICT (barbershop_id) DO NOTHING;

-- Comentários explicativos
COMMENT ON TABLE waitlist_queue IS 'Fila de espera inteligente para agendamentos';
COMMENT ON TABLE agenda_intelligence_settings IS 'Configurações de inteligência de agenda por barbearia';
COMMENT ON TABLE dynamic_pricing IS 'Regras de preço dinâmico por período';
COMMENT ON TABLE waitlist_offer_history IS 'Histórico de ofertas feitas para clientes na fila';

COMMENT ON COLUMN waitlist_queue.position_in_queue IS 'Posição automática na fila (mantida por trigger)';
COMMENT ON COLUMN waitlist_queue.accepts_other_professional IS 'Aceita atendimento com outros profissionais';
COMMENT ON COLUMN waitlist_queue.accepts_nearby_time IS 'Aceita horários próximos ao desejado';
COMMENT ON COLUMN waitlist_queue.accepts_any_time IS 'Aceita qualquer horário no dia desejado';

COMMENT ON COLUMN dynamic_pricing.price_type IS 'Tipo de ajuste: percentage ou fixed';
COMMENT ON COLUMN dynamic_pricing.price_adjustment IS 'Valor do ajuste: porcentagem ou valor fixo';
COMMENT ON COLUMN dynamic_pricing.min_capacity_threshold IS 'Ocupação mínima para ativar preço dinâmico';
