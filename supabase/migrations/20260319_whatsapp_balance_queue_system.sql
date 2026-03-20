-- Migration: Sistema de Balanceamento e Filas de WhatsApp
-- Data: 2026-03-19
-- Funcionalidades:
--   - Balanceamento de envio entre múltiplos números
--   - Monitoramento de bloqueios
--   - Filas de processamento assíncrono
--   - Alertas para super admin

-- =====================================================
-- TABELA: message_sending_logs
-- Registra todos os envios de mensagens (sucesso/falha)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_sending_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_account_id UUID REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    message_content TEXT,
    message_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'blocked')),
    error_reason TEXT,
    error_code TEXT,
    twilio_message_sid TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_sending_logs_account ON public.message_sending_logs(whatsapp_account_id);
CREATE INDEX IF NOT EXISTS idx_message_sending_logs_status ON public.message_sending_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_sending_logs_phone ON public.message_sending_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_message_sending_logs_created ON public.message_sending_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_message_sending_logs_date ON public.message_sending_logs(created_at DESC);

-- =====================================================
-- TABELA: whatsapp_numbers (renomeada para evitar conflito com whatsapp_accounts)
-- Gerencia o rodízio de números para balanceamento
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_account_id UUID NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    successful_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    blocked_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failed_at TIMESTAMPTZ,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    blocked_until TIMESTAMPTZ,
    cooldown_minutes INTEGER NOT NULL DEFAULT 30,
    priority INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_account ON public.whatsapp_numbers(whatsapp_account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_active ON public.whatsapp_numbers(is_active, is_blocked);
CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_usage ON public.whatsapp_numbers(usage_count ASC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_priority ON public.whatsapp_numbers(priority ASC, usage_count ASC);

-- =====================================================
-- TABELA: job_queue
-- Fila de jobs para processamento assíncrono
-- =====================================================
CREATE TABLE IF NOT EXISTS public.job_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL CHECK (job_type IN ('envio_mensagem', 'reenvio', 'alerta', 'verificacao', 'backup')),
    job_priority INTEGER NOT NULL DEFAULT 0,
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'completo', 'falhou', 'cancelado')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    scheduled_for TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON public.job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON public.job_queue(job_type);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON public.job_queue(job_priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON public.job_queue(scheduled_for) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_job_queue_pending ON public.job_queue(status) WHERE status = 'pendente';

-- =====================================================
-- TABELA: blocked_numbers_alerts
-- Armazena alertas de números bloqueados
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blocked_numbers_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_number_id UUID NOT NULL REFERENCES public.whatsapp_numbers(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('blocked', 'rate_limit', 'cooldown', 'high_failure_rate')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    suggested_action TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_alerts_number ON public.blocked_numbers_alerts(whatsapp_number_id);
CREATE INDEX IF NOT EXISTS idx_blocked_alerts_severity ON public.blocked_numbers_alerts(severity) WHERE NOT is_resolved;
CREATE INDEX IF NOT EXISTS idx_blocked_alerts_unresolved ON public.blocked_numbers_alerts(is_resolved) WHERE NOT is_resolved;

-- =====================================================
-- TABELA: sending_policies
-- Políticas de envio por barbearia
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sending_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    max_messages_per_minute INTEGER NOT NULL DEFAULT 10,
    max_messages_per_hour INTEGER NOT NULL DEFAULT 200,
    max_messages_per_day INTEGER NOT NULL DEFAULT 1000,
    cooldown_between_messages INTEGER NOT NULL DEFAULT 3,
    enable_auto_rotation BOOLEAN NOT NULL DEFAULT true,
    block_on_failure_count INTEGER NOT NULL DEFAULT 5,
    auto_unblock_after_hours INTEGER NOT NULL DEFAULT 24,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id)
);

-- =====================================================
-- HABILITAR RLS NAS NOVAS TABELAS
-- =====================================================
ALTER TABLE public.message_sending_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_numbers_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sending_policies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES RLS - message_sending_logs
-- =====================================================
CREATE POLICY "Owners can view sending logs" ON public.message_sending_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            JOIN public.whatsapp_accounts ON whatsapp_accounts.barbershop_id = barbershops.id
            WHERE whatsapp_accounts.id = message_sending_logs.whatsapp_account_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert sending logs" ON public.message_sending_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update sending logs" ON public.message_sending_logs
    FOR UPDATE USING (true);

-- =====================================================
-- POLICIES RLS - whatsapp_numbers
-- =====================================================
CREATE POLICY "Owners can manage whatsapp numbers" ON public.whatsapp_numbers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            JOIN public.whatsapp_accounts ON whatsapp_accounts.barbershop_id = barbershops.id
            WHERE whatsapp_accounts.id = whatsapp_numbers.whatsapp_account_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can view all numbers" ON public.whatsapp_numbers
    FOR SELECT USING (public.is_super_admin(auth.uid()));

-- =====================================================
-- POLICIES RLS - job_queue
-- =====================================================
CREATE POLICY "System can manage job queue" ON public.job_queue
    FOR ALL USING (true);

-- =====================================================
-- POLICIES RLS - blocked_numbers_alerts
-- =====================================================
CREATE POLICY "Owners can view blocked alerts" ON public.blocked_numbers_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            JOIN public.whatsapp_accounts ON whatsapp_accounts.barbershop_id = barbershops.id
            JOIN public.whatsapp_numbers ON whatsapp_numbers.whatsapp_account_id = whatsapp_accounts.id
            WHERE whatsapp_numbers.id = blocked_numbers_alerts.whatsapp_number_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can view all alerts" ON public.blocked_numbers_alerts
    FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "System can create blocked alerts" ON public.blocked_numbers_alerts
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- POLICIES RLS - sending_policies
-- =====================================================
CREATE POLICY "Owners can manage sending policies" ON public.sending_policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = sending_policies.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter próximo número disponível (balanceamento)
CREATE OR REPLACE FUNCTION public.get_next_available_whatsapp_number(p_barbershop_id UUID)
RETURNS TABLE (
    whatsapp_number_id UUID,
    whatsapp_account_id UUID,
    phone_number TEXT,
    account_nickname TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        wn.id,
        wn.whatsapp_account_id,
        wn.phone_number,
        wa.nickname
    FROM public.whatsapp_numbers wn
    JOIN public.whatsapp_accounts wa ON wa.id = wn.whatsapp_account_id
    WHERE wa.barbershop_id = p_barbershop_id
      AND wn.is_active = true
      AND wn.is_blocked = false
      AND (wn.blocked_until IS NULL OR wn.blocked_until < now())
    ORDER BY
        wn.priority ASC,
        wn.usage_count ASC,
        RANDOM()
    LIMIT 1;
END;
$$;

-- Função para registrar uso de número
CREATE OR REPLACE FUNCTION public.register_whatsapp_number_usage(
    p_whatsapp_number_id UUID,
    p_success BOOLEAN,
    p_error_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_success THEN
        UPDATE public.whatsapp_numbers
        SET
            usage_count = usage_count + 1,
            successful_count = successful_count + 1,
            last_used_at = now(),
            last_success_at = now(),
            updated_at = now()
        WHERE id = p_whatsapp_number_id;
    ELSE
        UPDATE public.whatsapp_numbers
        SET
            usage_count = usage_count + 1,
            failed_count = failed_count + 1,
            last_used_at = now(),
            last_failed_at = now(),
            updated_at = now()
        WHERE id = p_whatsapp_number_id;

        IF p_error_reason ILIKE '%bloqueado%' OR p_error_reason ILIKE '%blocked%' THEN
            UPDATE public.whatsapp_numbers
            SET
                is_blocked = true,
                blocked_count = blocked_count + 1,
                blocked_until = now() + (cooldown_minutes || ' minutes')::interval,
                updated_at = now()
            WHERE id = p_whatsapp_number_id;
        END IF;
    END IF;
END;
$$;

-- Função para adicionar job na fila
CREATE OR REPLACE FUNCTION public.add_job_to_queue(
    p_job_type TEXT,
    p_payload JSONB,
    p_priority INTEGER DEFAULT 0,
    p_scheduled_for TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_id UUID;
BEGIN
    INSERT INTO public.job_queue (job_type, payload, job_priority, scheduled_for)
    VALUES (p_job_type, p_payload, p_priority, p_scheduled_for)
    RETURNING id INTO v_job_id;

    RETURN v_job_id;
END;
$$;

-- Função para pegar próximo job da fila
CREATE OR REPLACE FUNCTION public.get_next_job(p_max_jobs INTEGER DEFAULT 10)
RETURNS TABLE (
    job_id UUID,
    job_type TEXT,
    payload JSONB,
    job_priority INTEGER,
    attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.id,
        j.job_type,
        j.payload,
        j.job_priority,
        j.attempts
    FROM public.job_queue j
    WHERE j.status = 'pendente'
      AND (j.scheduled_for IS NULL OR j.scheduled_for <= now())
      AND j.attempts < j.max_attempts
    ORDER BY
        j.job_priority DESC,
        j.created_at ASC
    LIMIT p_max_jobs
    FOR UPDATE SKIP LOCKED;

    -- Marcar jobs como processando
    UPDATE public.job_queue
    SET
        status = 'processando',
        started_at = now(),
        attempts = attempts + 1
    WHERE id IN (SELECT id FROM get_next_job(p_max_jobs));
END;
$$;

-- Função para marcar job como completo
CREATE OR REPLACE FUNCTION public.complete_job(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.job_queue
    SET
        status = 'completo',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_job_id;
END;
$$;

-- Função para marcar job como falhou
CREATE OR REPLACE FUNCTION public.fail_job(p_job_id UUID, p_error_message TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.job_queue
    SET
        status = CASE WHEN attempts >= max_attempts THEN 'falhou' ELSE 'pendente' END,
        error_message = p_error_message,
        updated_at = now()
    WHERE id = p_job_id;
END;
$$;

-- Trigger para sincronizar whatsapp_numbers com whatsapp_accounts
CREATE OR REPLACE FUNCTION public.sync_whatsapp_numbers_with_accounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.whatsapp_numbers (whatsapp_account_id, phone_number)
        VALUES (NEW.id, NEW.phone_number_formatted)
        ON CONFLICT DO NOTHING;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.whatsapp_numbers
        SET phone_number = NEW.phone_number_formatted,
            updated_at = now()
        WHERE whatsapp_account_id = NEW.id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_sync_whatsapp_numbers
    AFTER INSERT OR UPDATE ON public.whatsapp_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_whatsapp_numbers_with_accounts();

-- Trigger para criar políticas padrão ao criar barbearia
CREATE OR REPLACE FUNCTION public.create_default_sending_policy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.sending_policies (barbershop_id)
    VALUES (NEW.id)
    ON CONFLICT (barbershop_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_sending_policy
    AFTER INSERT ON public.barbershops
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_sending_policy();

-- =====================================================
-- DADOS INICIAIS
-- =====================================================
-- Inserir políticas padrão para barbearias existentes (executar manualmente se necessário)
-- INSERT INTO public.sending_policies (barbershop_id)
-- SELECT id FROM public.barbershops
-- ON CONFLICT (barbershop_id) DO NOTHING;
