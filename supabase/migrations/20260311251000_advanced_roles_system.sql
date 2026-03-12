-- Sistema de Roles Avançado - Atualização de Usuários
-- Criada em: 2026-03-11
-- Objetivo: Adicionar novos roles mantendo compatibilidade com existentes

-- Atualizar tipo ENUM para incluir novos roles
ALTER TYPE public.app_role ADD VALUE 'master';
ALTER TYPE public.app_role ADD VALUE 'franchise';
ALTER TYPE public.app_role ADD VALUE 'affiliate';

-- Adicionar coluna role na tabela profiles (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'cliente';
    END IF;
END $$;

-- Atualizar profiles existentes com base em roles antigos
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'super_admin';
UPDATE public.profiles SET role = 'dono' WHERE role = 'dono';
UPDATE public.profiles SET role = 'profissional' WHERE role = 'profissional';
UPDATE public.profiles SET role = 'cliente' WHERE role = 'cliente';
UPDATE public.profiles SET role = 'affiliate' WHERE role IN ('afiliado_barbearia', 'afiliado_saas');
UPDATE public.profiles SET role = 'contador' WHERE role = 'contador';

-- Criar tabela de masters
CREATE TABLE IF NOT EXISTS public.masters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    region TEXT,
    commission_percentage DECIMAL(5,2) DEFAULT 10.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Criar tabela de franquias
CREATE TABLE IF NOT EXISTS public.franchises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    master_id UUID REFERENCES public.masters(id) ON DELETE SET NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    commission_percentage DECIMAL(5,2) DEFAULT 15.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Criar tabela de afiliados avançados
CREATE TABLE IF NOT EXISTS public.affiliates_advanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL,
    commission_percentage DECIMAL(5,2) DEFAULT 20.00,
    referral_code TEXT UNIQUE DEFAULT generate_referral_code(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Criar tabela de comissões em cascata
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    commission_type TEXT NOT NULL CHECK (commission_type IN ('affiliate', 'franchise', 'master', 'platform')),
    reference_id UUID, -- ID da referência (assinatura, pagamento, etc)
    reference_type TEXT, -- Tipo da referência (subscription, payment, etc)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE user_id = p_user_id;
    
    IF v_role IS NULL THEN
        RETURN 'cliente';
    END IF;
    
    RETURN v_role;
END;
$$;

-- Criar função para verificar se usuário é master
CREATE OR REPLACE FUNCTION public.is_master(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.masters m ON p.user_id = m.user_id
        WHERE p.user_id = p_user_id
        AND p.role = 'master'
        AND m.status = 'active'
    );
END;
$$;

-- Criar função para verificar se usuário é franqueado
CREATE OR REPLACE FUNCTION public.is_franchise(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.franchises f ON p.user_id = f.user_id
        WHERE p.user_id = p_user_id
        AND p.role = 'franchise'
        AND f.status = 'active'
    );
END;
$$;

-- Criar função para verificar se usuário é afiliado avançado
CREATE OR REPLACE FUNCTION public.is_affiliate_advanced(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.affiliates_advanced a ON p.user_id = a.user_id
        WHERE p.user_id = p_user_id
        AND p.role = 'affiliate'
        AND a.status = 'active'
    );
END;
$$;

-- Criar função para calcular comissões em cascata
CREATE OR REPLACE FUNCTION public.calculate_cascade_commissions(
    p_amount DECIMAL(10,2),
    p_customer_user_id UUID,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_affiliate_id UUID;
    v_franchise_id UUID;
    v_master_id UUID;
    v_affiliate_commission DECIMAL(10,2);
    v_franchise_commission DECIMAL(10,2);
    v_master_commission DECIMAL(10,2);
    v_platform_commission DECIMAL(10,2);
BEGIN
    -- Verificar se sistema de comissões está ativo
    IF NOT is_feature_enabled('commission_system') THEN
        RETURN;
    END IF;
    
    -- Buscar afiliado do cliente
    SELECT user_id INTO v_affiliate_id
    FROM public.affiliates_advanced
    WHERE referral_code IN (
        SELECT referral_code FROM public.referral_tracking 
        WHERE referred_user_id = p_customer_user_id
        LIMIT 1
    )
    AND status = 'active';
    
    -- Se encontrou afiliado, buscar franqueado e master
    IF v_affiliate_id IS NOT NULL THEN
        SELECT f.user_id, f.master_id INTO v_franchise_id, v_master_id
        FROM public.franchises f
        WHERE f.id = (
            SELECT franchise_id FROM public.affiliates_advanced 
            WHERE user_id = v_affiliate_id
        )
        AND f.status = 'active';
    END IF;
    
    -- Calcular comissões
    IF v_affiliate_id IS NOT NULL THEN
        -- Comissão afiliado (20%)
        v_affiliate_commission := p_amount * 0.20;
        
        INSERT INTO public.commissions (
            user_id, source_user_id, amount, commission_type, 
            reference_id, reference_type
        ) VALUES (
            v_affiliate_id, p_customer_user_id, v_affiliate_commission, 
            'affiliate', p_reference_id, p_reference_type
        );
        
        -- Comissão franqueado (15% se existir)
        IF v_franchise_id IS NOT NULL THEN
            v_franchise_commission := p_amount * 0.15;
            
            INSERT INTO public.commissions (
                user_id, source_user_id, amount, commission_type,
                reference_id, reference_type
            ) VALUES (
                v_franchise_id, p_customer_user_id, v_franchise_commission,
                'franchise', p_reference_id, p_reference_type
            );
            
            -- Comissão master (10% se existir)
            IF v_master_id IS NOT NULL THEN
                v_master_commission := p_amount * 0.10;
                
                INSERT INTO public.commissions (
                    user_id, source_user_id, amount, commission_type,
                    reference_id, reference_type
                ) VALUES (
                    v_master_id, p_customer_user_id, v_master_commission,
                    'master', p_reference_id, p_reference_type
                );
            END IF;
        END IF;
    END IF;
    
    -- Comissão plataforma (restante)
    v_platform_commission := p_amount - COALESCE(v_affiliate_commission, 0) 
                              - COALESCE(v_franchise_commission, 0) 
                              - COALESCE(v_master_commission, 0);
    
    INSERT INTO public.commissions (
        user_id, source_user_id, amount, commission_type,
        reference_id, reference_type
    ) VALUES (
        (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1),
        p_customer_user_id, v_platform_commission,
        'platform', p_reference_id, p_reference_type
    );
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER handle_masters_updated_at
    BEFORE UPDATE ON public.masters
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_franchises_updated_at
    BEFORE UPDATE ON public.franchises
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_affiliates_advanced_updated_at
    BEFORE UPDATE ON public.affiliates_advanced
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Políticas RLS
ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates_advanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Políticas para masters
CREATE POLICY "Masters can view their own data" ON public.masters
    FOR SELECT USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage masters" ON public.masters
    FOR ALL USING (is_super_admin(auth.uid()));

-- Políticas para franquias
CREATE POLICY "Franchises can view their own data" ON public.franchises
    FOR SELECT USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

CREATE POLICY "Masters can view their franchises" ON public.franchises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.masters 
            WHERE user_id = auth.uid() 
            AND id = master_id
        ) OR is_super_admin(auth.uid())
    );

CREATE POLICY "Super admins can manage franchises" ON public.franchises
    FOR ALL USING (is_super_admin(auth.uid()));

-- Políticas para afiliados avançados
CREATE POLICY "Affiliates can view their own data" ON public.affiliates_advanced
    FOR SELECT USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

CREATE POLICY "Franchises can view their affiliates" ON public.affiliates_advanced
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.franchises 
            WHERE user_id = auth.uid() 
            AND id = franchise_id
        ) OR is_super_admin(auth.uid())
    );

CREATE POLICY "Super admins can manage affiliates" ON public.affiliates_advanced
    FOR ALL USING (is_super_admin(auth.uid()));

-- Políticas para comissões
CREATE POLICY "Users can view their own commissions" ON public.commissions
    FOR SELECT USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

CREATE POLICY "Masters can view network commissions" ON public.commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.masters m
            JOIN public.franchises f ON f.master_id = m.id
            JOIN public.affiliates_advanced a ON a.franchise_id = f.id
            WHERE m.user_id = auth.uid() 
            AND commissions.user_id IN (f.user_id, a.user_id)
        ) OR is_super_admin(auth.uid())
    );

CREATE POLICY "Franchises can view network commissions" ON public.commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.franchises f
            JOIN public.affiliates_advanced a ON a.franchise_id = f.id
            WHERE f.user_id = auth.uid() 
            AND commissions.user_id IN (a.user_id)
        ) OR is_super_admin(auth.uid())
    );

-- Comentários
COMMENT ON TABLE public.masters IS 'Masters do sistema - recrutam franqueados';
COMMENT ON TABLE public.franchises IS 'Franqueados - gerenciam barbearias e afiliados';
COMMENT ON TABLE public.affiliates_advanced IS 'Afiliados avançados com sistema de comissões';
COMMENT ON TABLE public.commissions IS 'Comissões em cascata do sistema';
COMMENT ON FUNCTION public.get_user_role IS 'Retorna o role do usuário';
COMMENT ON FUNCTION public.is_master IS 'Verifica se usuário é master';
COMMENT ON FUNCTION public.is_franchise IS 'Verifica se usuário é franqueado';
COMMENT ON FUNCTION public.is_affiliate_advanced IS 'Verifica se usuário é afiliado avançado';
COMMENT ON FUNCTION public.calculate_cascade_commissions IS 'Calcula comissões em cascata';
