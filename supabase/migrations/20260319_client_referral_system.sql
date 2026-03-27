-- Migration: Sistema de Indicação de Clientes
-- Data: 2026-03-19
-- Funcionalidades:
--   - Cliente indica amigo e ganha cashback
--   - Sistema de códigos de indicação
--   - Recompensas por indicação

-- =====================================================
-- TABELA: client_referrals
-- Indicações realizadas pelos clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.client_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded', 'cancelled')),
    reward_type TEXT CHECK (reward_type IN ('cashback', 'discount', 'free_service')),
    reward_amount DECIMAL(10,2),
    reward_credited BOOLEAN DEFAULT false,
    referred_user_name TEXT,
    referred_user_email TEXT,
    referred_user_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_client_referrals_referrer ON public.client_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_client_referrals_referred ON public.client_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_client_referrals_code ON public.client_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_client_referrals_status ON public.client_referrals(status);

-- =====================================================
-- TABELA: referral_rewards_config
-- Configuração de recompensas por indicação
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referral_rewards_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('cashback', 'discount', 'free_service')),
    reward_amount DECIMAL(10,2) NOT NULL,
    min_purchases_required INTEGER DEFAULT 0,
    reward_cycles INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id)
);

-- =====================================================
-- TABELA: referral_rewards_earned
-- Recompensas ganhas por indicações
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referral_rewards_earned (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES public.client_referrals(id) ON DELETE SET NULL,
    reward_type TEXT NOT NULL,
    reward_amount DECIMAL(10,2) NOT NULL,
    is_credited BOOLEAN DEFAULT false,
    credited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON public.referral_rewards_earned(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_credited ON public.referral_rewards_earned(is_credited);

-- =====================================================
-- ADICIONAR COLUNA referral_code NA TABLE profiles (se não existir)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'referral_code'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
    END IF;
END $$;

-- =====================================================
-- HABILITAR RLS
-- =====================================================
ALTER TABLE public.client_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards_earned ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES RLS
-- =====================================================
CREATE POLICY "Users can view own referrals" ON public.client_referrals
    FOR SELECT USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Users can create referrals" ON public.client_referrals
    FOR INSERT WITH CHECK (referrer_user_id = auth.uid());

CREATE POLICY "Users can view own rewards" ON public.referral_rewards_earned
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their referral config" ON public.referral_rewards_config
    FOR SELECT USING (
        barbershop_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = referral_rewards_config.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para creditar cashback de indicação
CREATE OR REPLACE FUNCTION public.credit_referral_cashback(
    p_user_id UUID,
    p_amount DECIMAL(10,2),
    p_referral_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.referral_rewards_earned (user_id, referral_id, reward_type, reward_amount, is_credited, credited_at)
    VALUES (p_user_id, p_referral_id, 'cashback', p_amount, true, now());

    INSERT INTO public.account_balance (user_id, balance_type, amount, description, reference_id)
    VALUES (p_user_id, 'cashback', p_amount, 'Cashback de indicação', p_referral_id);
END;
$$;

-- Função para processar indicação completa (quando indicado faz primeira compra)
CREATE OR REPLACE FUNCTION public.process_referral_on_purchase(p_user_id UUID, p_order_total DECIMAL(10,2))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referral client_referrals%ROWTYPE;
    v_config referral_rewards_config%ROWTYPE;
BEGIN
    SELECT * INTO v_referral
    FROM public.client_referrals
    WHERE referred_user_id = p_user_id
    AND status = 'pending'
    LIMIT 1;

    IF v_referral IS NULL THEN
        RETURN;
    END IF;

    IF v_referral.reward_amount IS NULL OR v_referral.reward_amount = 0 THEN
        SELECT * INTO v_config
        FROM public.referral_rewards_config
        WHERE barbershop_id = (
            SELECT barbershop_id FROM public.appointments
            WHERE client_user_id = p_user_id
            LIMIT 1
        )
        AND is_active = true;

        IF v_config IS NOT NULL THEN
            UPDATE public.client_referrals
            SET reward_type = v_config.reward_type,
                reward_amount = v_config.reward_amount
            WHERE id = v_referral.id;
        ELSE
            UPDATE public.client_referrals
            SET reward_type = 'cashback',
                reward_amount = 10.00
            WHERE id = v_referral.id;
        END IF;
    END IF;

    UPDATE public.client_referrals
    SET status = 'completed',
        completed_at = now()
    WHERE id = v_referral.id;

    PERFORM credit_referral_cashback(
        v_referral.referrer_user_id,
        COALESCE(v_referral.reward_amount, 10.00),
        v_referral.id
    );
END;
$$;

-- =====================================================
-- DADOS INICIAIS - Configuração padrão
-- =====================================================
-- INSERT INTO public.referral_rewards_config (barbershop_id, reward_type, reward_amount, is_active)
-- SELECT id, 'cashback', 10.00, true FROM public.barbershops;
