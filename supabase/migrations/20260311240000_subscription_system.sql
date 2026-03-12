-- Migração para Sistema de Assinaturas Completo
-- Criada em: 2026-03-11
-- Objetivo: Implementar estrutura completa para gerenciamento de assinaturas SaaS

-- Tabela para assinaturas de usuários
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'cancelled', 'expired', 'trial')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    trial_used BOOLEAN DEFAULT false,
    asaas_subscription_id TEXT,
    asaas_customer_id TEXT,
    payment_method TEXT,
    last_payment_at TIMESTAMPTZ,
    next_payment_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id) -- Um usuário por assinatura
);

-- Tabela para histórico de pagamentos de assinaturas
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    asaas_payment_id TEXT,
    gateway_response JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para eventos de assinatura (logs)
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('created', 'activated', 'payment_failed', 'payment_success', 'cancelled', 'expired', 'renewed', 'trial_started', 'trial_ended')),
    event_data JSONB DEFAULT '{}',
    triggered_by TEXT CHECK (triggered_by IN ('system', 'user', 'admin', 'webhook')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para recursos e limites por plano
CREATE TABLE IF NOT EXISTS public.plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    feature_type TEXT NOT NULL CHECK (feature_type IN ('boolean', 'number', 'text')),
    feature_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(plan_id, feature_name)
);

-- Tabela para uso de recursos (tracking)
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
    feature_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    usage_data JSONB DEFAULT '{}',
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, feature_name, period_start)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar assinatura trial
CREATE OR REPLACE FUNCTION public.create_trial_subscription(
    p_user_id UUID,
    p_plan_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan_id UUID;
    v_subscription_id UUID;
    v_trial_days INTEGER := 7;
BEGIN
    -- Se plano não for especificado, usar o plano trial
    IF p_plan_id IS NULL THEN
        SELECT id INTO v_plan_id
        FROM public.subscription_plans
        WHERE duration_months = 0
        AND is_active = true
        LIMIT 1;
    ELSE
        v_plan_id := p_plan_id;
    END IF;
    
    -- Verificar se usuário já tem assinatura
    IF EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'Usuário já possui assinatura';
    END IF;
    
    -- Criar assinatura trial
    INSERT INTO public.user_subscriptions (
        user_id,
        plan_id,
        status,
        starts_at,
        ends_at,
        trial_used,
        auto_renew
    ) VALUES (
        p_user_id,
        v_plan_id,
        'trial',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + (v_trial_days || ' days')::INTERVAL,
        true,
        false
    ) RETURNING id INTO v_subscription_id;
    
    -- Registrar evento
    INSERT INTO public.subscription_events (
        subscription_id,
        event_type,
        event_data,
        triggered_by
    ) VALUES (
        v_subscription_id,
        'trial_started',
        json_build_object('trial_days', v_trial_days),
        'system'
    );
    
    RETURN v_subscription_id;
END;
$$;

-- Função para verificar acesso a recursos
CREATE OR REPLACE FUNCTION public.check_feature_access(
    p_user_id UUID,
    p_feature_name TEXT,
    p_usage_count INTEGER DEFAULT 1
)
RETURNS TABLE(
    has_access BOOLEAN,
    remaining_usage INTEGER,
    limit_value INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription RECORD;
    v_feature RECORD;
    v_current_usage INTEGER;
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
BEGIN
    -- Buscar assinatura ativa do usuário
    SELECT us.*, sp.name as plan_name INTO v_subscription
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND us.ends_at > CURRENT_TIMESTAMP;
    
    -- Se não tem assinatura ativa, verificar se está em trial
    IF NOT FOUND THEN
        SELECT us.*, sp.name as plan_name INTO v_subscription
        FROM public.user_subscriptions us
        JOIN public.subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = p_user_id
        AND us.status = 'trial'
        AND us.ends_at > CURRENT_TIMESTAMP;
    END IF;
    
    -- Se ainda não encontrou, sem acesso
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 0, 'Nenhuma assinatura ativa encontrada';
        RETURN;
    END IF;
    
    -- Buscar configuração do recurso
    SELECT * INTO v_feature
    FROM public.plan_features
    WHERE plan_id = v_subscription.plan_id
    AND feature_name = p_feature_name;
    
    -- Se recurso não encontrado, acesso negado
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 0, 'Recurso não encontrado no plano';
        RETURN;
    END IF;
    
    -- Se recurso é booleano
    IF v_feature.feature_type = 'boolean' THEN
        RETURN QUERY SELECT 
            (v_feature.feature_value = 'true')::BOOLEAN as has_access,
            0 as remaining_usage,
            0 as limit_value,
            CASE WHEN v_feature.feature_value = 'true' THEN 'Acesso concedido' ELSE 'Recurso não disponível no plano' END as message;
        RETURN;
    END IF;
    
    -- Se recurso é numérico, verificar uso
    IF v_feature.feature_type = 'number' THEN
        -- Definir período (mensal)
        v_period_start := DATE_TRUNC('month', CURRENT_TIMESTAMP);
        v_period_end := v_period_start + INTERVAL '1 month';
        
        -- Buscar uso atual
        SELECT COALESCE(SUM(usage_count), 0) INTO v_current_usage
        FROM public.feature_usage
        WHERE user_id = p_user_id
        AND feature_name = p_feature_name
        AND period_start >= v_period_start
        AND period_end < v_period_end;
        
        -- Calcular limite e restante
        DECLARE
            v_limit INTEGER := v_feature.feature_value::INTEGER;
            v_remaining INTEGER := GREATEST(0, v_limit - v_current_usage);
            v_has_access BOOLEAN := v_remaining >= p_usage_count;
        BEGIN
            -- Registrar uso se tiver acesso
            IF v_has_access THEN
                INSERT INTO public.feature_usage (
                    user_id,
                    subscription_id,
                    feature_name,
                    usage_count,
                    period_start,
                    period_end
                ) VALUES (
                    p_user_id,
                    v_subscription.id,
                    p_feature_name,
                    p_usage_count,
                    v_period_start,
                    v_period_end
                )
                ON CONFLICT (user_id, feature_name, period_start)
                DO UPDATE SET
                    usage_count = feature_usage.usage_count + p_usage_count;
            END IF;
            
            RETURN QUERY SELECT 
                v_has_access as has_access,
                v_remaining as remaining_usage,
                v_limit as limit_value,
                CASE 
                    WHEN v_has_access THEN 'Acesso concedido'
                    WHEN v_remaining = 0 THEN 'Limite atingido'
                    ELSE 'Limite excedido'
                END as message;
        END;
    END IF;
    
    -- Para recursos textuais, sempre conceder acesso
    RETURN QUERY SELECT true, 0, 0, 'Acesso concedido';
END;
$$;

-- Função para processar webhook de assinatura ASAAS
CREATE OR REPLACE FUNCTION public.process_asaas_subscription_webhook(
    p_event_type TEXT,
    p_payment_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription_id UUID;
    v_payment_id UUID;
    v_status TEXT;
    v_amount DECIMAL(10,2);
BEGIN
    -- Extrair dados do webhook
    v_status := p_payment_data->>'status';
    v_amount := (p_payment_data->>'value')::DECIMAL(10,2);
    
    -- Buscar assinatura pelo ASAAS subscription ID
    SELECT id INTO v_subscription_id
    FROM public.user_subscriptions
    WHERE asaas_subscription_id = p_payment_data->>'subscription'
    LIMIT 1;
    
    -- Se não encontrar, tentar pelo payment ID
    IF v_subscription_id IS NULL THEN
        SELECT us.id INTO v_subscription_id
        FROM public.user_subscriptions us
        JOIN public.subscription_payments sp ON us.id = sp.subscription_id
        WHERE sp.asaas_payment_id = p_payment_data->>'id'
        LIMIT 1;
    END IF;
    
    IF v_subscription_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Processar baseado no tipo de evento
    CASE p_event_type
        WHEN 'PAYMENT_CONFIRMED' THEN
            -- Ativar assinatura se pagamento confirmado
            IF v_status = 'CONFIRMED' THEN
                UPDATE public.user_subscriptions
                SET 
                    status = 'active',
                    last_payment_at = CURRENT_TIMESTAMP,
                    next_payment_at = CURRENT_TIMESTAMP + INTERVAL '1 month',
                    ends_at = CASE 
                        WHEN ends_at < CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP + INTERVAL '1 month'
                        ELSE ends_at
                    END
                WHERE id = v_subscription_id;
                
                -- Registrar pagamento
                INSERT INTO public.subscription_payments (
                    subscription_id,
                    amount,
                    payment_method,
                    status,
                    asaas_payment_id,
                    gateway_response,
                    processed_at
                ) VALUES (
                    v_subscription_id,
                    v_amount,
                    p_payment_data->>'billingType',
                    'paid',
                    p_payment_data->>'id',
                    p_payment_data,
                    CURRENT_TIMESTAMP
                );
                
                -- Registrar evento
                INSERT INTO public.subscription_events (
                    subscription_id,
                    event_type,
                    event_data,
                    triggered_by
                ) VALUES (
                    v_subscription_id,
                    'payment_success',
                    json_build_object('amount', v_amount, 'payment_id', p_payment_data->>'id'),
                    'webhook'
                );
            END IF;
            
        WHEN 'PAYMENT_FAILED' THEN
            -- Marcar pagamento como falha
            UPDATE public.user_subscriptions
            SET status = CASE 
                WHEN status = 'trial' THEN 'expired'
                ELSE 'pending'
            END
            WHERE id = v_subscription_id;
            
            -- Registrar evento
            INSERT INTO public.subscription_events (
                subscription_id,
                event_type,
                event_data,
                triggered_by
            ) VALUES (
                v_subscription_id,
                'payment_failed',
                json_build_object('amount', v_amount, 'reason', p_payment_data->>'description'),
                'webhook'
            );
            
        WHEN 'SUBSCRIPTION_DELETED' THEN
            -- Cancelar assinatura
            UPDATE public.user_subscriptions
            SET 
                status = 'cancelled',
                cancelled_at = CURRENT_TIMESTAMP,
                cancellation_reason = p_payment_data->>'description',
                auto_renew = false
            WHERE id = v_subscription_id;
            
            -- Registrar evento
            INSERT INTO public.subscription_events (
                subscription_id,
                event_type,
                event_data,
                triggered_by
            ) VALUES (
                v_subscription_id,
                'cancelled',
                json_build_object('reason', p_payment_data->>'description'),
                'webhook'
            );
    END CASE;
    
    RETURN TRUE;
END;
$$;

-- Políticas RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- Políticas para user_subscriptions
CREATE POLICY "Usuários podem ver suas assinaturas" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins podem gerenciar assinaturas" ON public.user_subscriptions
    FOR ALL USING (is_super_admin(auth.uid()));

-- Políticas para subscription_payments
CREATE POLICY "Usuários podem ver seus pagamentos" ON public.subscription_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_subscriptions 
            WHERE id = subscription_id 
            AND user_id = auth.uid()
        )
    );

-- Inserir recursos padrão para planos
INSERT INTO public.plan_features (plan_id, feature_name, feature_type, feature_value, description)
SELECT 
    sp.id,
    pf.feature_name,
    pf.feature_type,
    pf.feature_value,
    pf.description
FROM public.subscription_plans sp
CROSS JOIN (VALUES 
    -- Recursos básicos (todos os planos)
    ('dashboard_access', 'boolean', 'true', 'Acesso ao dashboard'),
    ('appointments', 'number', '100', 'Agendamentos por mês'),
    ('professionals', 'number', '3', 'Máximo de profissionais'),
    ('services', 'number', '20', 'Máximo de serviços'),
    ('clients', 'number', '500', 'Máximo de clientes'),
    ('reports', 'boolean', 'true', 'Acesso a relatórios'),
    ('notifications', 'boolean', 'true', 'Notificações automáticas'),
    ('cashback', 'boolean', 'true', 'Sistema de cashback'),
    ('affiliate_basic', 'boolean', 'true', 'Sistema de afiliados básico'),
    
    -- Recursos premium (planos pagos)
    ('api_access', 'boolean', CASE WHEN sp.price > 0 THEN 'true' ELSE 'false' END, 'Acesso à API'),
    ('custom_domain', 'boolean', CASE WHEN sp.price >= 79.90 THEN 'true' ELSE 'false' END, 'Domínio personalizado'),
    ('priority_support', 'boolean', CASE WHEN sp.price >= 79.90 THEN 'true' ELSE 'false' END, 'Suporte prioritário'),
    ('advanced_analytics', 'boolean', CASE WHEN sp.price >= 79.90 THEN 'true' ELSE 'false' END, 'Analytics avançado'),
    ('white_label', 'boolean', CASE WHEN sp.price >= 199.90 THEN 'true' ELSE 'false' END, 'White label'),
    ('dedicated_support', 'boolean', CASE WHEN sp.price >= 199.90 THEN 'true' ELSE 'false' END, 'Suporte dedicado'),
    ('unlimited_everything', 'boolean', CASE WHEN sp.price >= 199.90 THEN 'true' ELSE 'false' END, 'Recursos ilimitados')
) AS pf(feature_name, feature_type, feature_value, description)
WHERE sp.is_active = true
ON CONFLICT (plan_id, feature_name) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.user_subscriptions IS 'Assinaturas dos usuários do SaaS';
COMMENT ON TABLE public.subscription_payments IS 'Histórico de pagamentos das assinaturas';
COMMENT ON TABLE public.subscription_events IS 'Eventos e logs das assinaturas';
COMMENT ON TABLE public.plan_features IS 'Recursos e limites por plano';
COMMENT ON TABLE public.feature_usage IS 'Controle de uso dos recursos';
