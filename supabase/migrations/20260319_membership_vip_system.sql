-- Migration: Sistema de Clube de Assinatura VIP
-- Data: 2026-03-19
-- Funcionalidades:
--   - Planos de assinatura VIP
--   - Benefícios mensais para assinantes
--   - Cashback em compras
--   - Acesso antecipado a promotions

-- =====================================================
-- TABELA: membership_plans
-- Planos de assinatura VIP
-- =====================================================
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
    price_monthly DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    monthly_visits_included INTEGER DEFAULT 1,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    cashback_percentage DECIMAL(5,2) DEFAULT 5,
    priority_booking BOOLEAN DEFAULT true,
    exclusive_access BOOLEAN DEFAULT true,
    freebies JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_plans_barbershop ON public.membership_plans(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_active ON public.membership_plans(is_active);

-- =====================================================
-- TABELA: memberships
-- Assinaturas ativas dos clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    start_date TIMESTAMPTZ NOT NULL,
    next_billing_date TIMESTAMPTZ,
    last_billing_date TIMESTAMPTZ,
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    visits_used_this_period INTEGER DEFAULT 0,
    total_cashback_earned DECIMAL(10,2) DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
    referral_count INTEGER DEFAULT 0,
    paused_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memberships_client ON public.memberships(client_user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_barbershop ON public.memberships(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);

-- =====================================================
-- TABELA: membership_benefits
-- Benefícios resgatados pelos membros
-- =====================================================
CREATE TABLE IF NOT EXISTS public.membership_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    benefit_type TEXT NOT NULL CHECK (benefit_type IN ('discount', 'cashback', 'free_service', 'priority_booking', 'exclusive_access')),
    benefit_value DECIMAL(10,2),
    benefit_description TEXT,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    order_id UUID REFERENCES public.store_orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_benefits_membership ON public.membership_benefits(membership_id);
CREATE INDEX IF NOT EXISTS idx_membership_benefits_used ON public.membership_benefits(is_used);

-- =====================================================
-- TABELA: membership_transactions
-- Histórico de transações de cashback
-- =====================================================
CREATE TABLE IF NOT EXISTS public.membership_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('cashback_earned', 'cashback_redeemed', 'refund', 'monthly_fee', 'referral_bonus')),
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    description TEXT,
    order_id UUID REFERENCES public.store_orders(id) ON DELETE SET NULL,
    reference_membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_transactions_membership ON public.membership_transactions(membership_id);

-- =====================================================
-- TABELA: membership_referrals
-- Programa de indicação de membros
-- =====================================================
CREATE TABLE IF NOT EXISTS public.membership_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
    referral_code_used TEXT,
    bonus_awarded DECIMAL(10,2) DEFAULT 0,
    bonus_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_referrals_referrer ON public.membership_referrals(referrer_membership_id);
CREATE INDEX IF NOT EXISTS idx_membership_referrals_referred ON public.membership_referrals(referred_user_id);

-- =====================================================
-- HABILITAR RLS
-- =====================================================
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_referrals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES RLS
-- =====================================================
CREATE POLICY "Public can view active membership plans" ON public.membership_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage membership plans" ON public.membership_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = membership_plans.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can manage own membership" ON public.memberships
    FOR ALL USING (client_user_id = auth.uid());

CREATE POLICY "Owners can view memberships" ON public.memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = memberships.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can view own benefits" ON public.membership_benefits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.id = membership_benefits.membership_id
            AND memberships.client_user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can view own transactions" ON public.membership_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.id = membership_transactions.membership_id
            AND memberships.client_user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para gerar código de indicação
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN := true;
BEGIN
    WHILE v_exists LOOP
        v_code := 'REF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        SELECT EXISTS(
            SELECT 1 FROM public.memberships WHERE referral_code = v_code
        ) INTO v_exists;
    END LOOP;
    RETURN v_code;
END;
$$;

-- Função para creditar cashback
CREATE OR REPLACE FUNCTION public.credit_cashback(
    p_membership_id UUID,
    p_amount DECIMAL(10,2),
    p_description TEXT,
    p_order_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_balance DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(CASE WHEN transaction_type = 'cashback_earned' THEN amount ELSE 0 END) -
           COALESCE(SUM(CASE WHEN transaction_type IN ('cashback_redeemed', 'refund') THEN amount ELSE 0 END), 0), 0)
    INTO v_current_balance
    FROM public.membership_transactions
    WHERE membership_id = p_membership_id;

    INSERT INTO public.membership_transactions (membership_id, transaction_type, amount, balance_after, description, order_id)
    VALUES (p_membership_id, 'cashback_earned', p_amount, v_current_balance + p_amount, p_description, p_order_id);

    UPDATE public.memberships
    SET total_cashback_earned = total_cashback_earned + p_amount
    WHERE id = p_membership_id;
END;
$$;

-- Função para resgatar cashback
CREATE OR REPLACE FUNCTION public.redeem_cashback(
    p_membership_id UUID,
    p_amount DECIMAL(10,2),
    p_description TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_balance DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(CASE WHEN transaction_type = 'cashback_earned' THEN amount ELSE 0 END) -
           COALESCE(SUM(CASE WHEN transaction_type IN ('cashback_redeemed', 'refund') THEN amount ELSE 0 END), 0), 0)
    INTO v_current_balance
    FROM public.membership_transactions
    WHERE membership_id = p_membership_id;

    IF v_current_balance < p_amount THEN
        RETURN false;
    END IF;

    INSERT INTO public.membership_transactions (membership_id, transaction_type, amount, balance_after, description)
    VALUES (p_membership_id, 'cashback_redeemed', p_amount, v_current_balance - p_amount, p_description);

    RETURN true;
END;
$$;

-- Função para processar expiração de assinaturas
CREATE OR REPLACE FUNCTION public.process_membership_expiration()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.memberships
    SET status = 'expired'
    WHERE status = 'active'
      AND next_billing_date < now();
END;
$$;

-- Trigger para criar beneficios mensais
CREATE OR REPLACE FUNCTION public.create_monthly_benefits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_plan membership_plans%ROWTYPE;
    v_benefit JSONB;
BEGIN
    IF NEW.billing_period_start IS DISTINCT FROM OLD.billing_period_start THEN
        SELECT * INTO v_plan FROM membership_plans WHERE id = NEW.plan_id;

        IF v_plan.monthly_visits_included > 0 THEN
            INSERT INTO public.membership_benefits (membership_id, benefit_type, benefit_value, benefit_description, expires_at)
            VALUES (
                NEW.id,
                'free_service',
                v_plan.monthly_visits_included,
                'Visitas mensais incluídas no plano ' || v_plan.name,
                NEW.billing_period_end
            );
        END IF;

        IF v_plan.discount_percentage > 0 THEN
            INSERT INTO public.membership_benefits (membership_id, benefit_type, benefit_value, benefit_description, expires_at)
            VALUES (
                NEW.id,
                'discount',
                v_plan.discount_percentage,
                'Desconto de ' || v_plan.discount_percentage || '% em serviços',
                NEW.billing_period_end
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_monthly_benefits
    AFTER UPDATE ON public.memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.create_monthly_benefits();
