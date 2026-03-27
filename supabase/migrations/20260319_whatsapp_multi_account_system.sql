-- Migration: Sistema de WhatsApp Multi-Conta com Twilio
-- Data: 2026-03-19
-- Funcionalidades:
--   - Cadastro e verificação de números de WhatsApp por profissional
--   - Compra de pacotes de mensagens
--   - Divisão de custos entre Dono e Profissionais
--   - Relatório de envios e custos

-- =====================================================
-- TABELA: whatsapp_accounts
-- Armazena os números de WhatsApp verificados de cada profissional
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    phone_number_formatted TEXT NOT NULL,
    twilio_sid TEXT,
    twilio_auth_token TEXT,
    twilio_messaging_service_sid TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_code TEXT,
    verification_expires_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    nickname TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para whatsapp_accounts
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_barbershop ON public.whatsapp_accounts(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_professional ON public.whatsapp_accounts(professional_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_phone ON public.whatsapp_accounts(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_verified ON public.whatsapp_accounts(is_verified);

-- =====================================================
-- TABELA: message_packages
-- Armazena os pacotes de mensagens disponíveis para compra
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity_messages INTEGER NOT NULL,
    price_per_message DECIMAL(10,6) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    validity_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para message_packages
CREATE INDEX IF NOT EXISTS idx_message_packages_barbershop ON public.message_packages(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_message_packages_active ON public.message_packages(is_active);

-- =====================================================
-- TABELA: message_purchases
-- Registra as compras de pacotes de mensagens
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.message_packages(id) ON DELETE RESTRICT,
    quantity_messages INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'pix',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_id TEXT,
    purchased_by UUID REFERENCES auth.users(id),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para message_purchases
CREATE INDEX IF NOT EXISTS idx_message_purchases_barbershop ON public.message_purchases(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_message_purchases_package ON public.message_purchases(package_id);
CREATE INDEX IF NOT EXISTS idx_message_purchases_status ON public.message_purchases(payment_status);

-- =====================================================
-- TABELA: message_balance
-- Saldo de mensagens disponível por barbearia (agregado das compras)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL UNIQUE REFERENCES public.barbershops(id) ON DELETE CASCADE,
    total_messages INTEGER NOT NULL DEFAULT 0,
    used_messages INTEGER NOT NULL DEFAULT 0,
    expired_messages INTEGER NOT NULL DEFAULT 0,
    available_messages INTEGER GENERATED ALWAYS AS (total_messages - used_messages - expired_messages) STORED,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA: message_usage
-- Registra cada mensagem enviada com detalhes de custo
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    whatsapp_account_id UUID NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE RESTRICT,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    recipient_phone TEXT NOT NULL,
    message_type TEXT NOT NULL,
    message_content TEXT,
    template_id TEXT,
    twilio_message_sid TEXT,
    twilio_status TEXT,
    cost_per_message DECIMAL(10,6) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    owner_cost_share DECIMAL(10,2) NOT NULL DEFAULT 0,
    professional_cost_share DECIMAL(10,2) NOT NULL DEFAULT 0,
    split_percentage_owner INTEGER NOT NULL DEFAULT 100,
    split_percentage_professional INTEGER NOT NULL DEFAULT 0,
    automation_type TEXT,
    campaign_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ
);

-- Índices para message_usage
CREATE INDEX IF NOT EXISTS idx_message_usage_barbershop ON public.message_usage(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_message_usage_whatsapp ON public.message_usage(whatsapp_account_id);
CREATE INDEX IF NOT EXISTS idx_message_usage_professional ON public.message_usage(professional_id);
CREATE INDEX IF NOT EXISTS idx_message_usage_date ON public.message_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_message_usage_type ON public.message_usage(message_type);
CREATE INDEX IF NOT EXISTS idx_message_usage_campaign ON public.message_usage(campaign_id);

-- =====================================================
-- TABELA: message_cost_splits
-- Configuração de divisão de custos por profissional
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_cost_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    split_enabled BOOLEAN NOT NULL DEFAULT true,
    split_percentage_owner INTEGER NOT NULL DEFAULT 50,
    split_percentage_professional INTEGER NOT NULL DEFAULT 50,
    owner_cost_limit DECIMAL(10,2),
    professional_cost_limit DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id, professional_id)
);

-- Índices para message_cost_splits
CREATE INDEX IF NOT EXISTS idx_message_cost_splits_barbershop ON public.message_cost_splits(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_message_cost_splits_professional ON public.message_cost_splits(professional_id);

-- =====================================================
-- TABELA: message_campaigns
-- Campanhas de marketing/mensagens automatizadas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    message_template TEXT NOT NULL,
    whatsapp_account_id UUID REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL,
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices para message_campaigns
CREATE INDEX IF NOT EXISTS idx_message_campaigns_barbershop ON public.message_campaigns(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_message_campaigns_status ON public.message_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_message_campaigns_scheduled ON public.message_campaigns(scheduled_at);

-- =====================================================
-- TABELA: message_templates
-- Templates de mensagens pré-configuradas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_text TEXT NOT NULL,
    template_type TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para message_templates
CREATE INDEX IF NOT EXISTS idx_message_templates_barbershop ON public.message_templates(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON public.message_templates(template_type);

-- =====================================================
-- HABILITAR RLS
-- =====================================================
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_cost_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES RLS - whatsapp_accounts
-- =====================================================
CREATE POLICY "Owners can manage whatsapp accounts" ON public.whatsapp_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = whatsapp_accounts.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Professionals can view own whatsapp account" ON public.whatsapp_accounts
    FOR SELECT USING (professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
    ));

CREATE POLICY "Super admins can manage all whatsapp accounts" ON public.whatsapp_accounts
    FOR ALL USING (public.is_super_admin(auth.uid()));

-- =====================================================
-- POLICIES RLS - message_packages
-- =====================================================
CREATE POLICY "Owners can manage message packages" ON public.message_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = message_packages.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view active message packages" ON public.message_packages
    FOR SELECT USING (is_active = true);

-- =====================================================
-- POLICIES RLS - message_purchases
-- =====================================================
CREATE POLICY "Owners can manage message purchases" ON public.message_purchases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = message_purchases.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

-- =====================================================
-- POLICIES RLS - message_balance
-- =====================================================
CREATE POLICY "Owners can view message balance" ON public.message_balance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = message_balance.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Professionals can view barbershop balance" ON public.message_balance
    FOR SELECT USING (
        barbershop_id IN (
            SELECT barbershop_id FROM public.professionals WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- POLICIES RLS - message_usage
-- =====================================================
CREATE POLICY "Owners can view all message usage" ON public.message_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = message_usage.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Professionals can view own message usage" ON public.message_usage
    FOR SELECT USING (professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
    ));

-- =====================================================
-- POLICIES RLS - message_cost_splits
-- =====================================================
CREATE POLICY "Owners can manage cost splits" ON public.message_cost_splits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = message_cost_splits.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Professionals can view own cost split" ON public.message_cost_splits
    FOR SELECT USING (professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
    ));

-- =====================================================
-- POLICIES RLS - message_campaigns
-- =====================================================
CREATE POLICY "Owners can manage campaigns" ON public.message_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = message_campaigns.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

-- =====================================================
-- POLICIES RLS - message_templates
-- =====================================================
CREATE POLICY "Owners can manage templates" ON public.message_templates
    FOR ALL USING (
        barbershop_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = message_templates.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view public templates" ON public.message_templates
    FOR SELECT USING (is_public = true);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar se número WhatsApp é válido
CREATE OR REPLACE FUNCTION public.is_valid_whatsapp_number(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Remove caracteres não numéricos
    RETURN p_phone ~ '^\+?[1-9]\d{10,14}$';
END;
$$;

-- Função para formatar número WhatsApp
CREATE OR REPLACE FUNCTION public.format_whatsapp_number(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    -- Remove tudo exceto números
    RETURN regexp_replace(p_phone, '[^0-9]', '', 'g');
END;
$$;

-- Função para atualizar saldo de mensagens
CREATE OR REPLACE FUNCTION public.update_message_balance(
    p_barbershop_id UUID,
    p_messages_used INTEGER DEFAULT 0,
    p_messages_expired INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.message_balance
    SET
        used_messages = used_messages + p_messages_used,
        expired_messages = expired_messages + p_messages_expired,
        last_updated = now()
    WHERE barbershop_id = p_barbershop_id;
END;
$$;

-- Função para obter estatísticas de uso de mensagens
CREATE OR REPLACE FUNCTION public.get_message_usage_stats(
    p_barbershop_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT (now() - interval '30 days'),
    p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
    total_sent BIGINT,
    total_cost DECIMAL(10,2),
    owner_cost_share DECIMAL(10,2),
    professional_cost_share DECIMAL(10,2),
    by_type JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_sent,
        COALESCE(SUM(mu.total_cost), 0)::DECIMAL(10,2) as total_cost,
        COALESCE(SUM(mu.owner_cost_share), 0)::DECIMAL(10,2) as owner_cost_share,
        COALESCE(SUM(mu.professional_cost_share), 0)::DECIMAL(10,2) as professional_cost_share,
        COALESCE(jsonb_object_agg(mu.message_type, jsonb_build_object(
            'count', COUNT(*)::INTEGER,
            'cost', COALESCE(SUM(mu.total_cost), 0)::DECIMAL(10,2)
        ) FILTER (WHERE mu.message_type IS NOT NULL)), '{}'::jsonb) as by_type
    FROM public.message_usage mu
    WHERE mu.barbershop_id = p_barbershop_id
      AND mu.created_at >= p_start_date
      AND mu.created_at <= p_end_date;
END;
$$;

-- =====================================================
-- DADOS INICIAIS - Pacotes padrão
-- =====================================================
-- Os pacotes serão criados quando a barbearia for criada (trigger)
