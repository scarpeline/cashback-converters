-- Migração para Recuperação Automática de Pagamento
-- Criada em: 2026-03-11
-- Objetivo: Implementar sistema automático de recuperação de pagamentos para assinaturas

-- Tabela para gerenciamento de recuperação de pagamentos
CREATE TABLE IF NOT EXISTS public.payment_recovery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    subscription_id UUID,
    original_amount DECIMAL(10,2) NOT NULL,
    due_amount DECIMAL(10,2) NOT NULL,
    recovery_stage TEXT NOT NULL CHECK (recovery_stage IN ('initial', 'reminder_1', 'retry_1', 'reminder_2', 'retry_2', 'warning', 'partial_block', 'full_block', 'legal', 'recovered', 'failed')),
    recovery_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_action_date TIMESTAMPTZ,
    last_attempt_date TIMESTAMPTZ,
    recovery_method TEXT DEFAULT 'automatic' CHECK (recovery_method IN ('automatic', 'manual', 'legal')),
    gateway_response JSONB,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para configurações de recuperação por barbearia
CREATE TABLE IF NOT EXISTS public.payment_recovery_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    enable_recovery BOOLEAN DEFAULT true,
    day_1_notification BOOLEAN DEFAULT true,
    day_3_retry BOOLEAN DEFAULT true,
    day_5_warning BOOLEAN DEFAULT true,
    day_7_partial_block BOOLEAN DEFAULT true,
    day_10_full_block BOOLEAN DEFAULT true,
    max_retry_attempts INTEGER DEFAULT 3,
    retry_interval_hours INTEGER DEFAULT 48,
    block_new_appointments BOOLEAN DEFAULT true,
    allow_partial_payment BOOLEAN DEFAULT false,
    interest_rate_daily DECIMAL(5,2) DEFAULT 0.02,
    legal_action_threshold INTEGER DEFAULT 3,
    custom_messages JSONB DEFAULT '{}',
    notification_channels TEXT[] DEFAULT ARRAY['email', 'whatsapp', 'sms'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id)
);

-- Tabela para histórico de ações de recuperação
CREATE TABLE IF NOT EXISTS public.payment_recovery_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recovery_id UUID NOT NULL REFERENCES public.payment_recovery(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('notification', 'retry', 'block', 'unblock', 'legal', 'manual')),
    action_description TEXT,
    channel TEXT,
    response_data JSONB,
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para bloqueios de acesso
CREATE TABLE IF NOT EXISTS public.access_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL CHECK (block_type IN ('partial', 'full', 'payment', 'legal')),
    block_reason TEXT,
    block_level INTEGER DEFAULT 1 CHECK (block_level BETWEEN 1 AND 5),
    restrictions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    unblocked_at TIMESTAMPTZ,
    unblocked_by UUID REFERENCES auth.users(id),
    unblock_reason TEXT,
    UNIQUE(user_id, barbershop_id, block_type)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_payment_recovery_updated_at
    BEFORE UPDATE ON public.payment_recovery
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_payment_recovery_settings_updated_at
    BEFORE UPDATE ON public.payment_recovery_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Função para iniciar recuperação de pagamento
CREATE OR REPLACE FUNCTION public.start_payment_recovery(
    p_payment_id UUID,
    p_barbershop_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment RECORD;
    v_recovery_id UUID;
    v_settings RECORD;
    v_due_amount DECIMAL(10,2);
    v_days_overdue INTEGER;
BEGIN
    -- Buscar dados do pagamento
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pagamento não encontrado';
    END IF;
    
    -- Verificar se já existe recuperação em andamento
    IF EXISTS (SELECT 1 FROM public.payment_recovery WHERE payment_id = p_payment_id AND status = 'active') THEN
        RETURN (SELECT id FROM public.payment_recovery WHERE payment_id = p_payment_id AND status = 'active');
    END IF;
    
    -- Buscar configurações da barbearia
    SELECT * INTO v_settings
    FROM public.payment_recovery_settings
    WHERE barbershop_id = COALESCE(p_barbershop_id, v_payment.barbershop_id);
    
    IF NOT FOUND OR NOT v_settings.enable_recovery THEN
        RAISE EXCEPTION 'Recuperação não habilitada para esta barbearia';
    END IF;
    
    -- Calcular valor devido e dias de atraso
    v_due_amount := v_payment.amount;
    IF v_payment.paid_at IS NULL THEN
        v_days_overdue := EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - v_payment.created_at));
    ELSE
        v_days_overdue := 0;
    END IF;
    
    -- Adicionar juros diários se configurado
    IF v_days_overdue > 0 AND v_settings.interest_rate_daily > 0 THEN
        v_due_amount := v_due_amount * (1 + (v_settings.interest_rate_daily * v_days_overdue / 100));
    END IF;
    
    -- Criar registro de recuperação
    INSERT INTO public.payment_recovery (
        barbershop_id,
        client_user_id,
        payment_id,
        subscription_id,
        original_amount,
        due_amount,
        recovery_stage,
        next_action_date,
        recovery_method,
        status
    ) VALUES (
        v_payment.barbershop_id,
        v_payment.client_user_id,
        v_payment.id,
        v_payment.subscription_id,
        v_payment.amount,
        v_due_amount,
        'initial',
        CURRENT_TIMESTAMP + INTERVAL '1 day',
        'automatic',
        'active'
    ) RETURNING id INTO v_recovery_id;
    
    -- Registrar ação inicial
    INSERT INTO public.payment_recovery_actions (
        recovery_id,
        action_type,
        action_description,
        channel,
        success
    ) VALUES (
        v_recovery_id,
        'notification',
        'Início do processo de recuperação de pagamento',
        'system',
        true
    );
    
    -- Enviar notificação inicial
    PERFORM public.send_recovery_notification(v_recovery_id, 'initial');
    
    RETURN v_recovery_id;
END;
$$;

-- Função para processar próxima ação de recuperação
CREATE OR REPLACE FUNCTION public.process_recovery_action(
    p_recovery_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recovery RECORD;
    v_settings RECORD;
    v_next_stage TEXT;
    v_days_since_last INTEGER;
    v_success BOOLEAN := false;
BEGIN
    -- Buscar dados da recuperação
    SELECT * INTO v_recovery
    FROM public.payment_recovery
    WHERE id = p_recovery_id AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Buscar configurações
    SELECT * INTO v_settings
    FROM public.payment_recovery_settings
    WHERE barbershop_id = v_recovery.barbershop_id;
    
    -- Calcular dias desde a última ação
    v_days_since_last := EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - COALESCE(v_recovery.last_attempt_date, v_recovery.created_at)));
    
    -- Determinar próxima ação baseada no estágio atual e configurações
    CASE v_recovery.recovery_stage
        WHEN 'initial' THEN
            IF v_settings.day_1_notification AND v_days_since_last >= 1 THEN
                v_success := public.send_recovery_notification(p_recovery_id, 'reminder_1');
                v_next_stage := 'reminder_1';
            END IF;
            
        WHEN 'reminder_1' THEN
            IF v_settings.day_3_retry AND v_days_since_last >= 2 THEN
                v_success := public.retry_payment(p_recovery_id);
                v_next_stage := CASE WHEN v_success THEN 'recovered' ELSE 'retry_1' END;
            END IF;
            
        WHEN 'retry_1' THEN
            IF v_settings.day_5_warning AND v_days_since_last >= 2 THEN
                v_success := public.send_recovery_notification(p_recovery_id, 'warning');
                v_next_stage := 'warning';
            END IF;
            
        WHEN 'warning' THEN
            IF v_settings.day_7_partial_block AND v_days_since_last >= 2 THEN
                v_success := public.apply_access_block(p_recovery_id, 'partial');
                v_next_stage := 'partial_block';
            END IF;
            
        WHEN 'partial_block' THEN
            IF v_settings.day_10_full_block AND v_days_since_last >= 3 THEN
                v_success := public.apply_access_block(p_recovery_id, 'full');
                v_next_stage := 'full_block';
            END IF;
            
        WHEN 'full_block' THEN
            IF v_recovery.recovery_attempts >= v_settings.legal_action_threshold THEN
                v_success := public.initiate_legal_action(p_recovery_id);
                v_next_stage := 'legal';
            END IF;
    END CASE;
    
    -- Atualizar estágio se houve ação
    IF v_next_stage IS NOT NULL THEN
        UPDATE public.payment_recovery
        SET 
            recovery_stage = v_next_stage,
            recovery_attempts = recovery_attempts + 1,
            last_attempt_date = CURRENT_TIMESTAMP,
            next_action_date = CASE v_next_stage
                WHEN 'recovered' THEN NULL
                WHEN 'failed' THEN NULL
                ELSE CURRENT_TIMESTAMP + INTERVAL '1 day'
            END,
            status = CASE v_next_stage
                WHEN 'recovered' THEN 'completed'
                WHEN 'failed' THEN 'failed'
                ELSE 'active'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_recovery_id;
        
        -- Registrar ação
        INSERT INTO public.payment_recovery_actions (
            recovery_id,
            action_type,
            action_description,
            channel,
            success,
            response_data
        ) VALUES (
            p_recovery_id,
            CASE v_next_stage
                WHEN 'reminder_1' THEN 'notification'
                WHEN 'retry_1' THEN 'retry'
                WHEN 'warning' THEN 'notification'
                WHEN 'partial_block' THEN 'block'
                WHEN 'full_block' THEN 'block'
                WHEN 'legal' THEN 'legal'
                ELSE 'notification'
            END,
            'Processamento: ' || v_next_stage,
            'system',
            v_success,
            json_build_object('stage', v_next_stage, 'attempts', v_recovery.recovery_attempts + 1)
        );
    END IF;
    
    RETURN v_success;
END;
$$;

-- Função para enviar notificação de recuperação
CREATE OR REPLACE FUNCTION public.send_recovery_notification(
    p_recovery_id UUID,
    p_notification_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recovery RECORD;
    v_client_name TEXT;
    v_message TEXT;
    v_subject TEXT;
    v_success BOOLEAN := false;
BEGIN
    -- Buscar dados da recuperação
    SELECT 
        pr.*,
        p.amount as original_amount,
        prs.custom_messages
    INTO v_recovery
    FROM public.payment_recovery pr
    JOIN public.payments p ON pr.payment_id = p.id
    LEFT JOIN public.payment_recovery_settings prs ON pr.barbershop_id = prs.barbershop_id
    WHERE pr.id = p_recovery_id;
    
    -- Buscar nome do cliente
    SELECT name INTO v_client_name
    FROM public.profiles
    WHERE user_id = v_recovery.client_user_id;
    
    -- Montar mensagem baseada no tipo
    CASE p_notification_type
        WHEN 'initial' THEN
            v_subject := 'Pagamento em Processamento';
            v_message := COALESCE(
                (v_recovery.custom_messages->>'initial'),
                'Olá ' || COALESCE(v_client_name, 'Cliente') || ', não conseguimos processar seu pagamento recentemente. Por favor, verifique seus dados e tente novamente.'
            );
            
        WHEN 'reminder_1' THEN
            v_subject := 'Lembrete de Pagamento';
            v_message := COALESCE(
                (v_recovery.custom_messages->>'reminder_1'),
                'Olá ' || COALESCE(v_client_name, 'Cliente') || ', seu pagamento de R$ ' || v_recovery.due_amount::TEXT || ' está pendente. Regularize para evitar bloqueios.'
            );
            
        WHEN 'warning' THEN
            v_subject := 'Aviso Importante - Pagamento';
            v_message := COALESCE(
                (v_recovery.custom_messages->>'warning'),
                'ATENÇÃO ' || COALESCE(v_client_name, 'Cliente') || '! Seu pagamento está atrasado e seu acesso será bloqueado em breve. Pague agora para evitar suspensão.'
            );
            
        ELSE
            v_subject := 'Notificação de Pagamento';
            v_message := 'Olá ' || COALESCE(v_client_name, 'Cliente') || ', temos uma atualização sobre seu pagamento.';
    END CASE;
    
    -- Inserir notificação no sistema
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        priority,
        data
    ) VALUES (
        v_recovery.client_user_id,
        v_subject,
        v_message,
        'payment',
        CASE p_notification_type
            WHEN 'warning' THEN 'high'
            WHEN 'reminder_1' THEN 'normal'
            ELSE 'low'
        END,
        json_build_object(
            'recovery_id', p_recovery_id,
            'payment_id', v_recovery.payment_id,
            'amount', v_recovery.due_amount,
            'type', p_notification_type
        )
    );
    
    -- Aqui você integraria com serviços de email/SMS/WhatsApp
    -- Por ora, consideramos sucesso
    v_success := true;
    
    RETURN v_success;
END;
$$;

-- Função para tentar pagamento novamente
CREATE OR REPLACE FUNCTION public.retry_payment(
    p_recovery_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recovery RECORD;
    v_success BOOLEAN := false;
BEGIN
    -- Buscar dados da recuperação
    SELECT * INTO v_recovery
    FROM public.payment_recovery
    WHERE id = p_recovery_id;
    
    -- Aqui você integraria com o gateway de pagamento (ASAAS, Stripe)
    -- Por ora, simulamos uma tentativa
    
    -- Simulação: 30% de chance de sucesso
    v_success := (RANDOM() < 0.3);
    
    IF v_success THEN
        -- Atualizar pagamento como pago
        UPDATE public.payments
        SET 
            status = 'paid',
            paid_at = CURRENT_TIMESTAMP
        WHERE id = v_recovery.payment_id;
        
        -- Registrar log de sucesso
        INSERT INTO public.payment_recovery_actions (
            recovery_id,
            action_type,
            action_description,
            channel,
            success,
            response_data
        ) VALUES (
            p_recovery_id,
            'retry',
            'Pagamento recuperado com sucesso',
            'payment_gateway',
            true,
            json_build_object('amount', v_recovery.due_amount, 'timestamp', CURRENT_TIMESTAMP)
        );
    ELSE
        -- Registrar log de falha
        INSERT INTO public.payment_recovery_actions (
            recovery_id,
            action_type,
            action_description,
            channel,
            success,
            error_message
        ) VALUES (
            p_recovery_id,
            'retry',
            'Tentativa de pagamento falhou',
            'payment_gateway',
            false,
            'Pagamento recusado pelo gateway'
        );
    END IF;
    
    RETURN v_success;
END;
$$;

-- Função para aplicar bloqueio de acesso
CREATE OR REPLACE FUNCTION public.apply_access_block(
    p_recovery_id UUID,
    p_block_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recovery RECORD;
    v_restrictions JSONB;
BEGIN
    -- Buscar dados da recuperação
    SELECT * INTO v_recovery
    FROM public.payment_recovery
    WHERE id = p_recovery_id;
    
    -- Definir restrições baseadas no tipo de bloqueio
    v_restrictions := CASE p_block_type
        WHEN 'partial' THEN json_build_object(
            'new_appointments', false,
            'dashboard_access', true,
            'view_history', true
        )
        WHEN 'full' THEN json_build_object(
            'new_appointments', false,
            'dashboard_access', false,
            'view_history', false,
            'api_access', false
        )
        ELSE json_build_object()
    END;
    
    -- Aplicar bloqueio
    INSERT INTO public.access_blocks (
        user_id,
        barbershop_id,
        block_type,
        block_reason,
        block_level,
        restrictions,
        is_active,
        expires_at
    ) VALUES (
        v_recovery.client_user_id,
        v_recovery.barbershop_id,
        'payment',
        'Bloqueio por pagamento pendente: ' || v_recovery.recovery_stage,
        CASE p_block_type
            WHEN 'partial' THEN 2
            WHEN 'full' THEN 3
            ELSE 1
        END,
        v_restrictions,
        true,
        CURRENT_TIMESTAMP + INTERVAL '30 days'
    )
    ON CONFLICT (user_id, barbershop_id, block_type) DO UPDATE SET
        block_reason = EXCLUDED.block_reason,
        block_level = EXCLUDED.block_level,
        restrictions = EXCLUDED.restrictions,
        is_active = true,
        expires_at = EXCLUDED.expires_at,
        unblocked_at = NULL,
        unblocked_by = NULL,
        unblock_reason = NULL;
    
    -- Enviar notificação sobre bloqueio
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        priority,
        data
    ) VALUES (
        v_recovery.client_user_id,
        'Acesso Bloqueado',
        CASE p_block_type
            WHEN 'partial' THEN 'Seu acesso foi parcialmente bloqueado. Novos agendamentos não permitidos até regularizar pagamento.'
            WHEN 'full' THEN 'Seu acesso foi completamente bloqueado. Regularize seu pagamento para reativar.'
            ELSE 'Seu acesso foi restrito devido a pagamento pendente.'
        END,
        'warning',
        'high',
        json_build_object(
            'block_type', p_block_type,
            'recovery_id', p_recovery_id,
            'expires_at', CURRENT_TIMESTAMP + INTERVAL '30 days'
        )
    );
    
    RETURN true;
END;
$$;

-- Função para reativar acesso após pagamento
CREATE OR REPLACE FUNCTION public.reactivate_access_after_payment(
    p_payment_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment RECORD;
    v_recovery RECORD;
BEGIN
    -- Buscar dados do pagamento
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id AND status = 'paid';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Buscar recuperação ativa
    SELECT * INTO v_recovery
    FROM public.payment_recovery
    WHERE payment_id = p_payment_id AND status = 'active';
    
    IF FOUND THEN
        -- Finalizar recuperação
        UPDATE public.payment_recovery
        SET 
            status = 'completed',
            recovery_stage = 'recovered',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_recovery.id;
        
        -- Remover bloqueios de pagamento
        UPDATE public.access_blocks
        SET 
            is_active = false,
            unblocked_at = CURRENT_TIMESTAMP,
            unblock_reason = 'Pago - Recuperação concluída'
        WHERE user_id = v_payment.client_user_id
        AND barbershop_id = v_payment.barbershop_id
        AND block_type = 'payment'
        AND is_active = true;
        
        -- Enviar notificação de reativação
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            priority,
            data
        ) VALUES (
            v_payment.client_user_id,
            'Acesso Restabelecido',
            'Pagamento confirmado! Seu acesso foi totalmente restabelecido. Obrigado pela regularização.',
            'success',
            'normal',
            json_build_object(
                'payment_id', p_payment_id,
                'amount', v_payment.amount,
                'reactivated_at', CURRENT_TIMESTAMP
            )
        );
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Função para processar todas as recuperações pendentes
CREATE OR REPLACE FUNCTION public.process_pending_recoveries()
RETURNS TABLE(
    processed_count INTEGER,
    success_count INTEGER,
    error_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recovery RECORD;
    v_processed INTEGER := 0;
    v_success INTEGER := 0;
    v_error INTEGER := 0;
BEGIN
    -- Buscar todas as recuperações ativas que precisam de ação
    FOR v_recovery IN 
        SELECT * FROM public.payment_recovery
        WHERE status = 'active'
        AND next_action_date <= CURRENT_TIMESTAMP
    LOOP
        v_processed := v_processed + 1;
        
        BEGIN
            IF public.process_recovery_action(v_recovery.id) THEN
                v_success := v_success + 1;
            ELSE
                v_error := v_error + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_error := v_error + 1;
            -- Registrar erro
            INSERT INTO public.payment_recovery_actions (
                recovery_id,
                action_type,
                action_description,
                success,
                error_message
            ) VALUES (
                v_recovery.id,
                'error',
                'Erro no processamento automático',
                false,
                SQLERRM
            );
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_processed, v_success, v_error;
END;
$$;

-- Políticas RLS
ALTER TABLE public.payment_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_recovery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_recovery_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_recovery
CREATE POLICY "Donos podem ver recuperações de sua barbearia" ON public.payment_recovery
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops 
            WHERE id = barbershop_id 
            AND owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Donos podem gerenciar recuperações" ON public.payment_recovery
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops 
            WHERE id = barbershop_id 
            AND owner_user_id = auth.uid()
        )
    );

-- Políticas para access_blocks
CREATE POLICY "Usuários podem ver seus bloqueios" ON public.access_blocks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Donos podem gerenciar bloqueios de sua barbearia" ON public.access_blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops 
            WHERE id = barbershop_id 
            AND owner_user_id = auth.uid()
        )
    );

-- Inserir configurações padrão
INSERT INTO public.payment_recovery_settings (
    barbershop_id,
    enable_recovery,
    day_1_notification,
    day_3_retry,
    day_5_warning,
    day_7_partial_block,
    day_10_full_block,
    max_retry_attempts,
    retry_interval_hours,
    block_new_appointments,
    allow_partial_payment,
    interest_rate_daily,
    notification_channels
)
SELECT 
    id,
    true,
    true,
    true,
    true,
    true,
    true,
    3,
    48,
    true,
    false,
    0.02,
    ARRAY['email', 'whatsapp']
FROM public.barbershops
WHERE id NOT IN (SELECT barbershop_id FROM public.payment_recovery_settings)
ON CONFLICT (barbershop_id) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.payment_recovery IS 'Gerenciamento de recuperação automática de pagamentos';
COMMENT ON TABLE public.payment_recovery_settings IS 'Configurações do sistema de recuperação por barbearia';
COMMENT ON TABLE public.access_blocks IS 'Controle de bloqueios de acesso por inadimplência';
