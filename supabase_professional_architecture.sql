-- ============================================================================
-- ARQUITETURA PROFISSIONAL - SISTEMA DE PARCEIROS + COMISSÕES + AUTOMAÇÕES
-- ============================================================================
-- ⚠️ IMPORTANTE: Este SQL usa IF NOT EXISTS para não sobrescrever nada existente
-- ⚠️ Executar no Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. TABELA CENTRAL: PARCEIROS (AFILIADO / FRANQUEADO / DIRETOR)
-- ============================================================================
-- Substitui: afiliado, franqueado, diretor (tudo em uma tabela com hierarquia)

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('afiliado', 'franqueado', 'diretor')),
  parent_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  level INT DEFAULT 0,
  total_indicados INT DEFAULT 0,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'bloqueado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_partners_user_id ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_parent_id ON public.partners(parent_id);
CREATE INDEX IF NOT EXISTS idx_partners_type ON public.partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS: Usuários veem seus próprios dados
CREATE POLICY IF NOT EXISTS "Users can view own partner data"
ON public.partners FOR SELECT
USING (user_id = auth.uid());

-- RLS: Super admins veem tudo
CREATE POLICY IF NOT EXISTS "Super admins can view all partners"
ON public.partners FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- ============================================================================
-- 2. REGRAS DE COMISSÃO (NÍVEIS: Explorador → Imperador Líder)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type TEXT NOT NULL CHECK (partner_type IN ('afiliado', 'franqueado', 'diretor')),
  level_min INT NOT NULL,
  level_max INT NOT NULL,
  name TEXT NOT NULL,
  commission_percent NUMERIC(5,2) NOT NULL,
  recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_type, level_min, level_max)
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_type ON public.commission_rules(partner_type);

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins gerenciam
CREATE POLICY IF NOT EXISTS "Super admins can manage commission rules"
ON public.commission_rules FOR ALL
USING (public.is_super_admin(auth.uid()));

-- RLS: Todos podem ver (para cálculos)
CREATE POLICY IF NOT EXISTS "Anyone can view commission rules"
ON public.commission_rules FOR SELECT
USING (true);

-- ============================================================================
-- 3. COMISSÕES GERADAS (histórico de comissões)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  source_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('adesao', 'recorrente')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_partner_id ON public.commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON public.commissions(created_at);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- RLS: Parceiros veem suas próprias comissões
CREATE POLICY IF NOT EXISTS "Partners can view own commissions"
ON public.commissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = commissions.partner_id
    AND partners.user_id = auth.uid()
  )
);

-- RLS: Super admins veem tudo
CREATE POLICY IF NOT EXISTS "Super admins can view all commissions"
ON public.commissions FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- ============================================================================
-- 4. AUTOMAÇÕES (tipos de automação do sistema)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('reativacao', 'abandono', 'agenda_vazia', 'pagamento', 'comissao')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email', 'push')),
  active BOOLEAN DEFAULT true,
  template TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(type, channel)
);

CREATE INDEX IF NOT EXISTS idx_automations_type ON public.automations(type);
CREATE INDEX IF NOT EXISTS idx_automations_active ON public.automations(active);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins gerenciam
CREATE POLICY IF NOT EXISTS "Super admins can manage automations"
ON public.automations FOR ALL
USING (public.is_super_admin(auth.uid()));

-- RLS: Todos podem ver (para sistema usar)
CREATE POLICY IF NOT EXISTS "Anyone can view automations"
ON public.automations FOR SELECT
USING (true);

-- ============================================================================
-- 5. FILA DE AUTOMAÇÃO (mensagens pendentes de envio)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES public.automations(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'erro')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_queue_status ON public.automation_queue(status);
CREATE INDEX IF NOT EXISTS idx_automation_queue_scheduled_at ON public.automation_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_automation_queue_client_id ON public.automation_queue(client_id);

ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins gerenciam
CREATE POLICY IF NOT EXISTS "Super admins can manage automation queue"
ON public.automation_queue FOR ALL
USING (public.is_super_admin(auth.uid()));

-- ============================================================================
-- 6. SERVIÇOS CONTÁBEIS (tipos de serviços que contador oferece)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounting_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  approved_by_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_services_active ON public.accounting_services(active);

ALTER TABLE public.accounting_services ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins gerenciam
CREATE POLICY IF NOT EXISTS "Super admins can manage accounting services"
ON public.accounting_services FOR ALL
USING (public.is_super_admin(auth.uid()));

-- RLS: Todos podem ver serviços ativos
CREATE POLICY IF NOT EXISTS "Anyone can view active accounting services"
ON public.accounting_services FOR SELECT
USING (active = true);

-- ============================================================================
-- 7. DADOS INICIAIS - NÍVEIS DE AFILIADO
-- ============================================================================
-- Explorador → Visionário → Estrategista Visionário → Líder Supremo → Imperador Líder → Sócio PLM

INSERT INTO public.commission_rules (partner_type, level_min, level_max, name, commission_percent, recurring)
VALUES
  ('afiliado', 0, 50, 'Explorador', 5.00, false),
  ('afiliado', 51, 100, 'Visionário', 7.00, false),
  ('afiliado', 101, 200, 'Estrategista Visionário', 10.00, false),
  ('afiliado', 201, 400, 'Líder Supremo', 12.00, false),
  ('afiliado', 401, 700, 'Imperador Líder', 15.00, false),
  ('afiliado', 701, 1000, 'Sócio PLM', 20.00, false),
  ('franqueado', 0, 100, 'Franqueado', 10.00, true),
  ('diretor', 0, 1000, 'Diretor', 15.00, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. DADOS INICIAIS - AUTOMAÇÕES PADRÃO
-- ============================================================================

INSERT INTO public.automations (type, channel, active, template)
VALUES
  ('reativacao', 'whatsapp', true, 'Oi! Sentimos sua falta. Volte para um corte especial com 20% de desconto!'),
  ('reativacao', 'sms', true, 'Volte para um corte especial com 20% de desconto!'),
  ('abandono', 'email', true, 'Você deixou um agendamento pendente. Clique aqui para confirmar.'),
  ('agenda_vazia', 'whatsapp', true, 'Temos horários disponíveis hoje. Agende agora!'),
  ('pagamento', 'whatsapp', true, 'Seu pagamento foi recebido com sucesso!'),
  ('comissao', 'email', true, 'Você recebeu uma nova comissão. Confira seu saldo.')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. TRIGGERS PARA UPDATED_AT
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS set_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_commissions_updated_at
BEFORE UPDATE ON public.commissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_automations_updated_at
BEFORE UPDATE ON public.automations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_accounting_services_updated_at
BEFORE UPDATE ON public.accounting_services
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 10. FUNÇÃO PARA DISTRIBUIR COMISSÃO (MULTINÍVEL)
-- ============================================================================
-- Esta função é chamada quando uma barbearia assina ou faz pagamento

CREATE OR REPLACE FUNCTION public.distribute_commission(
  p_partner_id UUID,
  p_amount NUMERIC,
  p_type TEXT DEFAULT 'adesao'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_current_partner UUID := p_partner_id;
  v_parent_partner UUID;
  v_rule RECORD;
  v_commission_amount NUMERIC;
BEGIN
  -- Loop através da hierarquia de parceiros
  WHILE v_current_partner IS NOT NULL LOOP
    -- Buscar regra de comissão para este parceiro
    SELECT cr.* INTO v_rule
    FROM public.commission_rules cr
    JOIN public.partners p ON p.type = cr.partner_type
    WHERE p.id = v_current_partner
    AND cr.level_min <= p.level
    AND cr.level_max >= p.level
    LIMIT 1;

    -- Se encontrou regra, criar comissão
    IF v_rule IS NOT NULL THEN
      v_commission_amount := p_amount * (v_rule.commission_percent / 100);
      
      INSERT INTO public.commissions (
        partner_id,
        source_user_id,
        amount,
        type,
        status
      ) VALUES (
        v_current_partner,
        NULL,
        v_commission_amount,
        p_type,
        'pendente'
      );
    END IF;

    -- Buscar parceiro pai
    SELECT parent_id INTO v_parent_partner
    FROM public.partners
    WHERE id = v_current_partner;

    v_current_partner := v_parent_partner;
  END LOOP;
END;
$;

-- ============================================================================
-- 11. FUNÇÃO PARA ATUALIZAR NÍVEL DE PARCEIRO
-- ============================================================================
-- Atualiza o nível baseado no número de indicados

CREATE OR REPLACE FUNCTION public.update_partner_level(p_partner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_total_indicados INT;
  v_new_level INT;
BEGIN
  -- Contar indicados diretos
  SELECT COUNT(*) INTO v_total_indicados
  FROM public.partners
  WHERE parent_id = p_partner_id;

  -- Calcular novo nível (a cada 50 indicados, sobe um nível)
  v_new_level := v_total_indicados / 50;

  -- Atualizar parceiro
  UPDATE public.partners
  SET level = v_new_level, total_indicados = v_total_indicados
  WHERE id = p_partner_id;
END;
$;

-- ============================================================================
-- 12. VERIFICAÇÃO: Tabelas existentes vs novas
-- ============================================================================
-- Execute esta query para verificar o que foi criado:
/*
SELECT 
  'partners' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') as exists
UNION ALL
SELECT 'commission_rules', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'commission_rules')
UNION ALL
SELECT 'commissions', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions')
UNION ALL
SELECT 'automations', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'automations')
UNION ALL
SELECT 'automation_queue', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_queue')
UNION ALL
SELECT 'accounting_services', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_services');
*/

-- ============================================================================
-- FIM DA ARQUITETURA PROFISSIONAL
-- ============================================================================
