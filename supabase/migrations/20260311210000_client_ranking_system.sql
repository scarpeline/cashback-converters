-- Migração para Ranking de Clientes
-- Criada em: 2026-03-11
-- Objetivo: Implementar sistema de classificação e ranking de clientes

-- Tabela para métricas de clientes
CREATE TABLE IF NOT EXISTS public.client_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    avg_ticket DECIMAL(10,2) DEFAULT 0,
    last_visit_date TIMESTAMPTZ,
    first_visit_date TIMESTAMPTZ,
    visit_frequency_days DECIMAL(8,2) DEFAULT 0,
    loyalty_score INTEGER DEFAULT 0 CHECK (loyalty_score BETWEEN 0 AND 100),
    vip_level TEXT DEFAULT 'bronze' CHECK (vip_level IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    total_services_taken INTEGER DEFAULT 0,
    favorite_service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    preferred_professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    cancelled_appointments INTEGER DEFAULT 0,
    no_show_rate DECIMAL(5,2) DEFAULT 0,
    referral_count INTEGER DEFAULT 0,
    cashback_earned DECIMAL(10,2) DEFAULT 0,
    cashback_used DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(client_user_id, barbershop_id)
);

-- Tabela para níveis VIP e benefícios
CREATE TABLE IF NOT EXISTS public.vip_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    level_name TEXT NOT NULL CHECK (level_name IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    min_visits INTEGER DEFAULT 0,
    min_spent DECIMAL(12,2) DEFAULT 0,
    min_loyalty_score INTEGER DEFAULT 0,
    benefits JSONB DEFAULT '{}',
    discount_percentage DECIMAL(3,2) DEFAULT 0,
    cashback_multiplier DECIMAL(3,2) DEFAULT 1.0,
    priority_booking BOOLEAN DEFAULT false,
    exclusive_services TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id, level_name)
);

-- Tabela para histórico de mudanças de nível
CREATE TABLE IF NOT EXISTS public.vip_level_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    old_level TEXT,
    new_level TEXT NOT NULL,
    change_reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para conquistas e badges dos clientes
CREATE TABLE IF NOT EXISTS public.client_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    badge_icon TEXT,
    badge_color TEXT DEFAULT '#000000',
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_displayed BOOLEAN DEFAULT true,
    UNIQUE(client_user_id, barbershop_id, achievement_type)
);

-- Tabela para eventos de gamificação
CREATE TABLE IF NOT EXISTS public.gamification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_description TEXT,
    points_earned INTEGER DEFAULT 0,
    level_progress INTEGER DEFAULT 0,
    related_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_client_metrics_updated_at
    BEFORE UPDATE ON public.client_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_vip_levels_updated_at
    BEFORE UPDATE ON public.vip_levels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Função para calcular métricas do cliente
CREATE OR REPLACE FUNCTION public.calculate_client_metrics(
    p_client_user_id UUID,
    p_barbershop_id UUID
)
RETURNS TABLE(
    total_visits INTEGER,
    total_spent DECIMAL(12,2),
    avg_ticket DECIMAL(10,2),
    last_visit_date TIMESTAMPTZ,
    first_visit_date TIMESTAMPTZ,
    visit_frequency_days DECIMAL(8,2),
    loyalty_score INTEGER,
    vip_level TEXT,
    total_services_taken INTEGER,
    favorite_service_id UUID,
    preferred_professional_id UUID,
    cancelled_appointments INTEGER,
    no_show_rate DECIMAL(5,2),
    referral_count INTEGER,
    cashback_earned DECIMAL(10,2),
    cashback_used DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_visits INTEGER;
    v_total_spent DECIMAL(12,2);
    v_avg_ticket DECIMAL(10,2);
    v_last_visit TIMESTAMPTZ;
    v_first_visit TIMESTAMPTZ;
    v_visit_frequency DECIMAL(8,2);
    v_loyalty_score INTEGER;
    v_vip_level TEXT;
    v_total_services INTEGER;
    v_favorite_service UUID;
    v_preferred_professional UUID;
    v_cancelled INTEGER;
    v_no_show_rate DECIMAL(5,2);
    v_referral_count INTEGER;
    v_cashback_earned DECIMAL(10,2);
    v_cashback_used DECIMAL(10,2);
    v_days_active INTEGER;
BEGIN
    -- Calcular visitas e gastos
    SELECT 
        COUNT(*) as total_visits,
        COALESCE(SUM(p.amount), 0) as total_spent,
        COALESCE(AVG(p.amount), 0) as avg_ticket,
        MAX(a.scheduled_at) as last_visit,
        MIN(a.scheduled_at) as first_visit,
        COUNT(DISTINCT a.service_id) as total_services
    INTO v_total_visits, v_total_spent, v_avg_ticket, v_last_visit, v_first_visit, v_total_services
    FROM public.appointments a
    LEFT JOIN public.payments p ON a.id = p.appointment_id AND p.status = 'paid'
    WHERE a.client_user_id = p_client_user_id
    AND a.barbershop_id = p_barbershop_id
    AND a.status IN ('completed', 'confirmed');
    
    -- Calcular frequência de visitas (dias entre visitas)
    IF v_total_visits > 1 AND v_first_visit IS NOT NULL THEN
        v_days_active := EXTRACT(DAYS FROM (v_last_visit - v_first_visit));
        v_visit_frequency := v_days_active::DECIMAL / (v_total_visits - 1);
    ELSE
        v_visit_frequency := 0;
    END IF;
    
    -- Calcular score de lealdade (0-100)
    v_loyalty_score := LEAST(100, GREATEST(0,
        -- Baseado em frequência (40%)
        CASE 
            WHEN v_visit_frequency <= 7 THEN 40
            WHEN v_visit_frequency <= 14 THEN 30
            WHEN v_visit_frequency <= 30 THEN 20
            ELSE 10
        END +
        -- Baseado em valor gasto (30%)
        CASE 
            WHEN v_total_spent >= 1000 THEN 30
            WHEN v_total_spent >= 500 THEN 20
            WHEN v_total_spent >= 200 THEN 10
            ELSE 0
        END +
        -- Baseado em número de visitas (20%)
        CASE 
            WHEN v_total_visits >= 20 THEN 20
            WHEN v_total_visits >= 10 THEN 15
            WHEN v_total_visits >= 5 THEN 10
            WHEN v_total_visits >= 3 THEN 5
            ELSE 0
        END +
        -- Baseado em regularidade (10%)
        CASE 
            WHEN v_visit_frequency > 0 AND v_visit_frequency <= 21 THEN 10
            WHEN v_visit_frequency <= 35 THEN 5
            ELSE 0
        END
    ));
    
    -- Determinar nível VIP
    v_vip_level := CASE
        WHEN v_loyalty_score >= 90 THEN 'diamond'
        WHEN v_loyalty_score >= 75 THEN 'platinum'
        WHEN v_loyalty_score >= 60 THEN 'gold'
        WHEN v_loyalty_score >= 40 THEN 'silver'
        ELSE 'bronze'
    END;
    
    -- Encontrar serviço favorito (mais visitado)
    SELECT a.service_id INTO v_favorite_service
    FROM public.appointments a
    WHERE a.client_user_id = p_client_user_id
    AND a.barbershop_id = p_barbershop_id
    AND a.status IN ('completed', 'confirmed')
    GROUP BY a.service_id
    ORDER BY COUNT(*) DESC, MAX(a.scheduled_at) DESC
    LIMIT 1;
    
    -- Encontrar profissional preferido
    SELECT a.professional_id INTO v_preferred_professional
    FROM public.appointments a
    WHERE a.client_user_id = p_client_user_id
    AND a.barbershop_id = p_barbershop_id
    AND a.status IN ('completed', 'confirmed')
    GROUP BY a.professional_id
    ORDER BY COUNT(*) DESC, MAX(a.scheduled_at) DESC
    LIMIT 1;
    
    -- Calcular cancelamentos e no-shows
    SELECT 
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        ROUND(COUNT(*) FILTER (WHERE status = 'no_show')::DECIMAL / COUNT(*) * 100, 2) as no_show_rate
    INTO v_cancelled, v_no_show_rate
    FROM public.appointments
    WHERE client_user_id = p_client_user_id
    AND barbershop_id = p_barbershop_id;
    
    -- Contar indicações
    SELECT COUNT(*) INTO v_referral_count
    FROM public.affiliates
    WHERE user_id = p_client_user_id
    AND barbershop_id = p_barbershop_id;
    
    -- Calcular cashback
    SELECT 
        COALESCE(SUM(amount), 0) as earned,
        COALESCE(SUM(amount_used), 0) as used
    INTO v_cashback_earned, v_cashback_used
    FROM public.cashback_transactions
    WHERE client_user_id = p_client_user_id
    AND barbershop_id = p_barbershop_id;
    
    RETURN QUERY SELECT 
        v_total_visits,
        v_total_spent,
        v_avg_ticket,
        v_last_visit,
        v_first_visit,
        v_visit_frequency,
        v_loyalty_score,
        v_vip_level,
        v_total_services,
        v_favorite_service,
        v_preferred_professional,
        v_cancelled,
        v_no_show_rate,
        v_referral_count,
        v_cashback_earned,
        v_cashback_used;
END;
$$;

-- Função para atualizar métricas do cliente
CREATE OR REPLACE FUNCTION public.update_client_metrics(
    p_client_user_id UUID,
    p_barbershop_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_level TEXT;
    v_new_level TEXT;
    v_metrics RECORD;
BEGIN
    -- Buscar nível atual
    SELECT vip_level INTO v_old_level
    FROM public.client_metrics
    WHERE client_user_id = p_client_user_id
    AND barbershop_id = p_barbershop_id;
    
    -- Calcular novas métricas
    SELECT * INTO v_metrics
    FROM public.calculate_client_metrics(p_client_user_id, p_barbershop_id);
    
    -- Atualizar ou inserir métricas
    INSERT INTO public.client_metrics (
        client_user_id,
        barbershop_id,
        total_visits,
        total_spent,
        avg_ticket,
        last_visit_date,
        first_visit_date,
        visit_frequency_days,
        loyalty_score,
        vip_level,
        total_services_taken,
        favorite_service_id,
        preferred_professional_id,
        cancelled_appointments,
        no_show_rate,
        referral_count,
        cashback_earned,
        cashback_used,
        updated_at
    ) VALUES (
        p_client_user_id,
        p_barbershop_id,
        v_metrics.total_visits,
        v_metrics.total_spent,
        v_metrics.avg_ticket,
        v_metrics.last_visit_date,
        v_metrics.first_visit_date,
        v_metrics.visit_frequency_days,
        v_metrics.loyalty_score,
        v_metrics.vip_level,
        v_metrics.total_services_taken,
        v_metrics.favorite_service_id,
        v_metrics.preferred_professional_id,
        v_metrics.cancelled_appointments,
        v_metrics.no_show_rate,
        v_metrics.referral_count,
        v_metrics.cashback_earned,
        v_metrics.cashback_used,
        now()
    )
    ON CONFLICT (client_user_id, barbershop_id) DO UPDATE SET
        total_visits = EXCLUDED.total_visits,
        total_spent = EXCLUDED.total_spent,
        avg_ticket = EXCLUDED.avg_ticket,
        last_visit_date = EXCLUDED.last_visit_date,
        first_visit_date = EXCLUDED.first_visit_date,
        visit_frequency_days = EXCLUDED.visit_frequency_days,
        loyalty_score = EXCLUDED.loyalty_score,
        vip_level = EXCLUDED.vip_level,
        total_services_taken = EXCLUDED.total_services_taken,
        favorite_service_id = EXCLUDED.favorite_service_id,
        preferred_professional_id = EXCLUDED.preferred_professional_id,
        cancelled_appointments = EXCLUDED.cancelled_appointments,
        no_show_rate = EXCLUDED.no_show_rate,
        referral_count = EXCLUDED.referral_count,
        cashback_earned = EXCLUDED.cashback_earned,
        cashback_used = EXCLUDED.cashback_used,
        updated_at = now();
    
    -- Verificar mudança de nível VIP
    v_new_level := v_metrics.vip_level;
    
    IF v_old_level IS NULL OR v_old_level != v_new_level THEN
        -- Registrar mudança de nível
        INSERT INTO public.vip_level_history (
            client_user_id,
            barbershop_id,
            old_level,
            new_level,
            change_reason
        ) VALUES (
            p_client_user_id,
            p_barbershop_id,
            v_old_level,
            v_new_level,
            CASE 
                WHEN v_old_level IS NULL THEN 'Nível inicial'
                WHEN v_new_level > v_old_level THEN 'Upgrade de nível'
                ELSE 'Downgrade de nível'
            END
        );
        
        -- Conceder achievement de nível
        INSERT INTO public.client_achievements (
            client_user_id,
            barbershop_id,
            achievement_type,
            achievement_name,
            achievement_description,
            badge_icon,
            badge_color
        ) VALUES (
            p_client_user_id,
            p_barbershop_id,
            'vip_level',
            'VIP ' || UPPER(v_new_level),
            'Alcançou o nível ' || v_new_level,
            'crown',
            CASE v_new_level
                WHEN 'diamond' THEN '#B9F2FF'
                WHEN 'platinum' THEN '#E5E4E2'
                WHEN 'gold' THEN '#FFD700'
                WHEN 'silver' THEN '#C0C0C0'
                ELSE '#CD7F32'
            END
        )
        ON CONFLICT (client_user_id, barbershop_id, achievement_type) DO UPDATE SET
            achievement_name = EXCLUDED.achievement_name,
            achievement_description = EXCLUDED.achievement_description,
            badge_icon = EXCLUDED.badge_icon,
            badge_color = EXCLUDED.badge_color,
            earned_at = now();
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Função para obter ranking de clientes
CREATE OR REPLACE FUNCTION public.get_client_ranking(
    p_barbershop_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_order_by TEXT DEFAULT 'loyalty_score'
)
RETURNS TABLE(
    rank_position INTEGER,
    client_user_id UUID,
    client_name TEXT,
    total_visits INTEGER,
    total_spent DECIMAL(12,2),
    avg_ticket DECIMAL(10,2),
    loyalty_score INTEGER,
    vip_level TEXT,
    last_visit_date TIMESTAMPTZ,
    referral_count INTEGER,
    achievements_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_clients AS (
        SELECT 
            cm.*,
            p.name as client_name,
            ROW_NUMBER() OVER (
                ORDER BY 
                    CASE p_order_by
                        WHEN 'total_visits' THEN cm.total_visits
                        WHEN 'total_spent' THEN cm.total_spent
                        WHEN 'avg_ticket' THEN cm.avg_ticket
                        WHEN 'referral_count' THEN cm.referral_count
                        ELSE cm.loyalty_score
                    END DESC,
                    cm.last_visit_date DESC NULLS LAST
            ) as rank_position,
            (SELECT COUNT(*) FROM public.client_achievements ca 
             WHERE ca.client_user_id = cm.client_user_id 
             AND ca.barbershop_id = p_barbershop_id) as achievements_count
        FROM public.client_metrics cm
        JOIN public.profiles p ON cm.client_user_id = p.user_id
        WHERE cm.barbershop_id = p_barbershop_id
        AND cm.total_visits > 0
    )
    SELECT 
        rank_position,
        client_user_id,
        client_name,
        total_visits,
        total_spent,
        avg_ticket,
        loyalty_score,
        vip_level,
        last_visit_date,
        referral_count,
        achievements_count
    FROM ranked_clients
    ORDER BY rank_position
    LIMIT p_limit;
END;
$$;

-- Função para conceder achievements automaticamente
CREATE OR REPLACE FUNCTION public.check_and_grant_achievements(
    p_client_user_id UUID,
    p_barbershop_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_metrics RECORD;
    v_achievements_granted INTEGER := 0;
BEGIN
    -- Buscar métricas atuais
    SELECT * INTO v_metrics
    FROM public.calculate_client_metrics(p_client_user_id, p_barbershop_id);
    
    -- Achievement de primeira visita
    IF v_metrics.total_visits = 1 THEN
        INSERT INTO public.client_achievements (
            client_user_id,
            barbershop_id,
            achievement_type,
            achievement_name,
            achievement_description,
            badge_icon,
            badge_color
        ) VALUES (
            p_client_user_id,
            p_barbershop_id,
            'first_visit',
            'Primeira Visita',
            'Bem-vindo! Sua primeira visita à nossa barbearia',
            'star',
            '#FFD700'
        )
        ON CONFLICT (client_user_id, barbershop_id, achievement_type) DO NOTHING;
        
        IF FOUND THEN v_achievements_granted := v_achievements_granted + 1; END IF;
    END IF;
    
    -- Achievement de cliente fiel
    IF v_metrics.total_visits >= 10 THEN
        INSERT INTO public.client_achievements (
            client_user_id,
            barbershop_id,
            achievement_type,
            achievement_name,
            achievement_description,
            badge_icon,
            badge_color
        ) VALUES (
            p_client_user_id,
            p_barbershop_id,
            'loyal_customer',
            'Cliente Fiel',
            '10 visitas realizadas',
            'heart',
            '#FF1744'
        )
        ON CONFLICT (client_user_id, barbershop_id, achievement_type) DO NOTHING;
        
        IF FOUND THEN v_achievements_granted := v_achievements_granted + 1; END IF;
    END IF;
    
    -- Achievement de grande gastador
    IF v_metrics.total_spent >= 500 THEN
        INSERT INTO public.client_achievements (
            client_user_id,
            barbershop_id,
            achievement_type,
            achievement_name,
            achievement_description,
            badge_icon,
            badge_color
        ) VALUES (
            p_client_user_id,
            p_barbershop_id,
            'big_spender',
            'Grande Gastador',
            'Mais de R$ 500 em serviços',
            'dollar-sign',
            '#4CAF50'
        )
        ON CONFLICT (client_user_id, barbershop_id, achievement_type) DO NOTHING;
        
        IF FOUND THEN v_achievements_granted := v_achievements_granted + 1; END IF;
    END IF;
    
    -- Achievement de indicador
    IF v_metrics.referral_count >= 3 THEN
        INSERT INTO public.client_achievements (
            client_user_id,
            barbershop_id,
            achievement_type,
            achievement_name,
            achievement_description,
            badge_icon,
            badge_color
        ) VALUES (
            p_client_user_id,
            p_barbershop_id,
            'referral_master',
            'Mestre das Indicações',
            '3 ou mais indicações realizadas',
            'users',
            '#2196F3'
        )
        ON CONFLICT (client_user_id, barbershop_id, achievement_type) DO NOTHING;
        
        IF FOUND THEN v_achievements_granted := v_achievements_granted + 1; END IF;
    END IF;
    
    RETURN v_achievements_granted;
END;
$$;

-- Políticas RLS
ALTER TABLE public.client_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_level_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_events ENABLE ROW LEVEL SECURITY;

-- Políticas para client_metrics
CREATE POLICY "Clientes podem ver suas métricas" ON public.client_metrics
    FOR SELECT USING (client_user_id = auth.uid());

CREATE POLICY "Donos podem ver métricas de sua barbearia" ON public.client_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops 
            WHERE id = barbershop_id 
            AND owner_user_id = auth.uid()
        )
    );

-- Políticas para vip_levels
CREATE POLICY "Donos podem gerenciar níveis VIP" ON public.vip_levels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops 
            WHERE id = barbershop_id 
            AND owner_user_id = auth.uid()
        )
    );

-- Inserir níveis VIP padrão
INSERT INTO public.vip_levels (barbershop_id, level_name, min_visits, min_spent, min_loyalty_score, benefits, discount_percentage, cashback_multiplier, priority_booking)
SELECT 
    b.id,
    vl.level_name,
    vl.min_visits,
    vl.min_spent,
    vl.min_loyalty_score,
    vl.benefits,
    vl.discount_percentage,
    vl.cashback_multiplier,
    vl.priority_booking
FROM public.barbershops b
CROSS JOIN (VALUES 
    ('bronze', 0, 0, 0, '{"welcome": true, "birthday_discount": 5}', 0, 1.0, false),
    ('silver', 3, 100, 40, '{"priority_support": true, "exclusive_offers": true}', 5, 1.1, false),
    ('gold', 10, 500, 60, '{"priority_booking": true, "free_service_annually": 1}', 10, 1.2, true),
    ('platinum', 20, 1000, 75, '{"vip_lounge": true, "exclusive_events": true}', 15, 1.3, true),
    ('diamond', 50, 2500, 90, '{"all_benefits": true, "personal_attendant": true}', 20, 1.5, true)
) AS vl(level_name, min_visits, min_spent, min_loyalty_score, benefits, discount_percentage, cashback_multiplier, priority_booking)
WHERE b.id NOT IN (SELECT barbershop_id FROM public.vip_levels)
ON CONFLICT (barbershop_id, level_name) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.client_metrics IS 'Métricas completas de clientes para ranking e VIP';
COMMENT ON TABLE public.vip_levels IS 'Configurações dos níveis VIP e benefícios';
COMMENT ON TABLE public.client_achievements IS 'Conquistas e badges dos clientes';
COMMENT ON TABLE public.gamification_events IS 'Eventos de gamificação para engajamento';
