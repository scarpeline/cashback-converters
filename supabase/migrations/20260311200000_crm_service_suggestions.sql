-- Migração para CRM Inteligente com Sugestão de Serviços
-- Criada em: 2026-03-11
-- Objetivo: Implementar sistema de sugestão automática de serviços

-- Tabela para histórico de serviços do cliente
CREATE TABLE IF NOT EXISTS public.client_service_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    service_date TIMESTAMPTZ NOT NULL,
    service_price DECIMAL(10,2) NOT NULL,
    professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para configurações de sugestões por barbearia
CREATE TABLE IF NOT EXISTS public.service_suggestion_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    enable_suggestions BOOLEAN DEFAULT true,
    min_services_for_suggestions INTEGER DEFAULT 3,
    suggestion_probability DECIMAL(3,2) DEFAULT 0.7,
    max_suggestions_per_booking INTEGER DEFAULT 2,
    show_price_comparison BOOLEAN DEFAULT true,
    show_popularity_badge BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id)
);

-- Tabela para regras de sugestão de serviços
CREATE TABLE IF NOT EXISTS public.service_suggestion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    trigger_service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    suggested_service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('complementary', 'upsell', 'popular_pair', 'seasonal')),
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id, trigger_service_id, suggested_service_id)
);

-- Tabela para estatísticas de sugestões
CREATE TABLE IF NOT EXISTS public.service_suggestion_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    suggested_service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    times_suggested INTEGER DEFAULT 0,
    times_accepted INTEGER DEFAULT 0,
    times_declined INTEGER DEFAULT 0,
    total_revenue_generated DECIMAL(10,2) DEFAULT 0,
    last_suggested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id, service_id, suggested_service_id)
);

-- Tabela para logs de sugestões apresentadas
CREATE TABLE IF NOT EXISTS public.service_suggestion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    trigger_service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    suggested_services JSONB NOT NULL,
    client_response JSONB,
    response_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_service_suggestion_settings_updated_at
    BEFORE UPDATE ON public.service_suggestion_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_service_suggestion_rules_updated_at
    BEFORE UPDATE ON public.service_suggestion_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_service_suggestion_stats_updated_at
    BEFORE UPDATE ON public.service_suggestion_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Função para registrar histórico de serviços
CREATE OR REPLACE FUNCTION public.register_service_history(
    p_appointment_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appointment RECORD;
BEGIN
    -- Buscar dados do agendamento
    SELECT * INTO v_appointment
    FROM public.appointments
    WHERE id = p_appointment_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Inserir no histórico
    INSERT INTO public.client_service_history (
        client_user_id,
        barbershop_id,
        service_id,
        appointment_id,
        service_date,
        service_price,
        professional_id
    ) VALUES (
        v_appointment.client_user_id,
        v_appointment.barbershop_id,
        v_appointment.service_id,
        v_appointment.id,
        v_appointment.scheduled_at,
        (SELECT price FROM public.services WHERE id = v_appointment.service_id),
        v_appointment.professional_id
    );
    
    RETURN TRUE;
END;
$$;

-- Função para gerar sugestões de serviços
CREATE OR REPLACE FUNCTION public.generate_service_suggestions(
    p_client_user_id UUID,
    p_barbershop_id UUID,
    p_trigger_service_id UUID
)
RETURNS TABLE(
    service_id UUID,
    service_name TEXT,
    service_price DECIMAL(10,2),
    service_duration INTEGER,
    suggestion_reason TEXT,
    confidence_score DECIMAL(3,2),
    popularity_score INTEGER,
    revenue_impact DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings RECORD;
    v_client_history RECORD;
    v_suggestions RECORD[];
BEGIN
    -- Buscar configurações da barbearia
    SELECT * INTO v_settings
    FROM public.service_suggestion_settings
    WHERE barbershop_id = p_barbershop_id;
    
    IF NOT FOUND OR NOT v_settings.enable_suggestions THEN
        RETURN;
    END IF;
    
    -- Buscar histórico do cliente
    SELECT 
        COUNT(*) as total_visits,
        AVG(service_price) as avg_ticket,
        MAX(service_date) as last_visit,
        array_agg(DISTINCT service_id) as service_ids
    INTO v_client_history
    FROM public.client_service_history
    WHERE client_user_id = p_client_user_id
    AND barbershop_id = p_barbershop_id;
    
    -- Se cliente não tem histórico suficiente, não sugerir
    IF v_client_history.total_visits < v_settings.min_services_for_suggestions THEN
        RETURN;
    END IF;
    
    -- Gerar sugestões baseadas em diferentes estratégias
    RETURN QUERY
    WITH service_stats AS (
        SELECT 
            s.id,
            s.name,
            s.price,
            s.duration_minutes,
            COUNT(csh.id) as times_ordered,
            AVG(csh.service_price) as avg_price,
            -- Calcular score de popularidade
            (COUNT(csh.id) * 100.0 / (SELECT COUNT(*) FROM public.client_service_history WHERE barbershop_id = p_barbershop_id)) as popularity_score
        FROM public.services s
        LEFT JOIN public.client_service_history csh ON s.id = csh.service_id AND csh.barbershop_id = p_barbershop_id
        WHERE s.barbershop_id = p_barbershop_id
        AND s.is_active = true
        AND s.id != p_trigger_service_id
        GROUP BY s.id, s.name, s.price, s.duration_minutes
    ),
    complementary_services AS (
        SELECT 
            ss.suggested_service_id,
            'complementar' as suggestion_reason,
            0.8 as confidence_score
        FROM public.service_suggestion_rules ss
        WHERE ss.barbershop_id = p_barbershop_id
        AND ss.trigger_service_id = p_trigger_service_id
        AND ss.rule_type = 'complementary'
        AND ss.is_active = true
    ),
    popular_pairs AS (
        SELECT 
            csh2.service_id as suggested_service_id,
            'popular_combo' as suggestion_reason,
            (COUNT(*) * 1.0 / (SELECT COUNT(*) FROM public.client_service_history csh3 WHERE csh3.service_id = p_trigger_service_id)) as confidence_score
        FROM public.client_service_history csh1
        JOIN public.appointments a1 ON csh1.appointment_id = a1.id
        JOIN public.appointments a2 ON a1.client_user_id = a2.client_user_id 
            AND a1.barbershop_id = a2.barbershop_id 
            AND DATE(a1.scheduled_at) = DATE(a2.scheduled_at)
            AND a1.id != a2.id
        JOIN public.client_service_history csh2 ON a2.id = csh2.appointment_id
        WHERE csh1.service_id = p_trigger_service_id
        AND csh1.barbershop_id = p_barbershop_id
        GROUP BY csh2.service_id
        HAVING COUNT(*) >= 3
    ),
    upsell_suggestions AS (
        SELECT 
            s.id as suggested_service_id,
            'upgrade' as suggestion_reason,
            CASE 
                WHEN s.price > (SELECT AVG(price) FROM public.services WHERE barbershop_id = p_barbershop_id) THEN 0.7
                ELSE 0.5
            END as confidence_score
        FROM public.services s
        WHERE s.barbershop_id = p_barbershop_id
        AND s.price > (SELECT price FROM public.services WHERE id = p_trigger_service_id)
        AND s.is_active = true
        AND s.price <= (SELECT AVG(price) FROM public.services WHERE barbershop_id = p_barbershop_id) * 1.5
    )
    SELECT 
        ss.suggested_service_id as service_id,
        s.name as service_name,
        s.price as service_price,
        s.duration_minutes as service_duration,
        COALESCE(cs.suggestion_reason, ups.suggestion_reason, ps.suggestion_reason, 'similar') as suggestion_reason,
        COALESCE(cs.confidence_score, ups.confidence_score, ps.confidence_score, 0.5) as confidence_score,
        COALESCE(ss.popularity_score, 0) as popularity_score,
        (s.price - (SELECT price FROM public.services WHERE id = p_trigger_service_id)) as revenue_impact
    FROM service_stats s
    LEFT JOIN complementary_services cs ON s.id = cs.suggested_service_id
    LEFT JOIN popular_pairs ps ON s.id = ps.suggested_service_id
    LEFT JOIN upsell_suggestions ups ON s.id = ups.suggested_service_id
    WHERE (cs.suggested_service_id IS NOT NULL 
           OR ps.suggested_service_id IS NOT NULL 
           OR ups.suggested_service_id IS NOT NULL
           OR (s.popularity_score > 20 AND s.price <= (SELECT price FROM public.services WHERE id = p_trigger_service_id) * 1.3))
    ORDER BY confidence_score DESC, popularity_score DESC, revenue_impact DESC
    LIMIT v_settings.max_suggestions_per_booking;
END;
$$;

-- Função para registrar resposta do cliente à sugestão
CREATE OR REPLACE FUNCTION public.record_suggestion_response(
    p_log_id UUID,
    p_response JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log RECORD;
    v_suggestion JSONB;
BEGIN
    -- Buscar log da sugestão
    SELECT * INTO v_log
    FROM public.service_suggestion_logs
    WHERE id = p_log_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar log com resposta
    UPDATE public.service_suggestion_logs
    SET 
        client_response = p_response,
        response_time = now()
    WHERE id = p_log_id;
    
    -- Atualizar estatísticas
    FOR v_suggestion IN SELECT * FROM jsonb_array_elements(v_log.suggested_services)
    LOOP
        UPDATE public.service_suggestion_stats
        SET 
            times_accepted = CASE WHEN p_response->>'action' = 'accept' THEN times_accepted + 1 ELSE times_accepted END,
            times_declined = CASE WHEN p_response->>'action' = 'decline' THEN times_declined + 1 ELSE times_declined END,
            updated_at = now()
        WHERE barbershop_id = v_log.barbershop_id
        AND service_id = v_log.trigger_service_id
        AND suggested_service_id = (v_suggestion->>'service_id')::UUID;
        
        -- Se não existir, criar
        IF NOT FOUND THEN
            INSERT INTO public.service_suggestion_stats (
                barbershop_id,
                service_id,
                suggested_service_id,
                times_accepted,
                times_declined
            ) VALUES (
                v_log.barbershop_id,
                v_log.trigger_service_id,
                (v_suggestion->>'service_id')::UUID,
                CASE WHEN p_response->>'action' = 'accept' THEN 1 ELSE 0 END,
                CASE WHEN p_response->>'action' = 'decline' THEN 1 ELSE 0 END
            );
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$;

-- Políticas RLS
ALTER TABLE public.client_service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_suggestion_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_suggestion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_suggestion_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_suggestion_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para client_service_history
CREATE POLICY "Clientes podem ver seu histórico" ON public.client_service_history
    FOR SELECT USING (client_user_id = auth.uid());

CREATE POLICY "Donos podem ver histórico de sua barbearia" ON public.client_service_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops 
            WHERE id = barbershop_id 
            AND owner_user_id = auth.uid()
        )
    );

-- Políticas para service_suggestion_settings
CREATE POLICY "Donos podem gerenciar configurações" ON public.service_suggestion_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops 
            WHERE id = barbershop_id 
            AND owner_user_id = auth.uid()
        )
    );

-- Inserir configurações padrão
INSERT INTO public.service_suggestion_settings (barbershop_id, enable_suggestions, min_services_for_suggestions, suggestion_probability, max_suggestions_per_booking)
SELECT id, true, 3, 0.7, 2
FROM public.barbershops
WHERE id NOT IN (SELECT barbershop_id FROM public.service_suggestion_settings)
ON CONFLICT (barbershop_id) DO NOTHING;

-- Criar regras de sugestão padrão
INSERT INTO public.service_suggestion_rules (barbershop_id, trigger_service_id, suggested_service_id, rule_type, priority)
SELECT 
    b.id as barbershop_id,
    s1.id as trigger_service_id,
    s2.id as suggested_service_id,
    'complementary' as rule_type,
    1 as priority
FROM public.barbershops b
CROSS JOIN public.services s1
CROSS JOIN public.services s2
WHERE s1.barbershop_id = b.id
AND s2.barbershop_id = b.id
AND s1.id != s2.id
AND (
    (LOWER(s1.name) LIKE '%corte%' AND LOWER(s2.name) LIKE '%barba%') OR
    (LOWER(s1.name) LIKE '%barba%' AND LOWER(s2.name) LIKE '%corte%') OR
    (LOWER(s1.name) LIKE '%corte%' AND LOWER(s2.name) LIKE '%sobrancelha%')
)
AND s1.is_active = true
AND s2.is_active = true
ON CONFLICT (barbershop_id, trigger_service_id, suggested_service_id) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.client_service_history IS 'Histórico completo de serviços realizados pelos clientes';
COMMENT ON TABLE public.service_suggestion_settings IS 'Configurações do sistema de sugestões por barbearia';
COMMENT ON TABLE public.service_suggestion_rules IS 'Regras personalizadas para sugestão de serviços';
COMMENT ON TABLE public.service_suggestion_stats IS 'Estatísticas de performance das sugestões';
COMMENT ON TABLE public.service_suggestion_logs IS 'Logs de sugestões apresentadas aos clientes';
