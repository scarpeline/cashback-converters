-- Sistema de Inteligência de Crescimento
-- Criada em: 2026-03-11
-- Objetivo: Análise avançada de métricas e insights para crescimento

-- Tabela de métricas de crescimento por cidade
CREATE TABLE IF NOT EXISTS public.growth_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    barbershops_count INTEGER DEFAULT 0,
    new_barbershops_month INTEGER DEFAULT 0,
    total_clients INTEGER DEFAULT 0,
    new_clients_month INTEGER DEFAULT 0,
    monthly_revenue DECIMAL(12,2) DEFAULT 0,
    growth_rate DECIMAL(5,2) DEFAULT 0,
    demand_score DECIMAL(5,2) DEFAULT 0,
    market_saturation DECIMAL(5,2) DEFAULT 0,
    competition_level TEXT DEFAULT 'medium' CHECK (competition_level IN ('low', 'medium', 'high')),
    potential_score DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(city, state)
);

-- Tabela de insights de crescimento
CREATE TABLE IF NOT EXISTS public.growth_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'market_opportunity', 'growth_trend', 'risk_alert', 
        'performance_gap', 'expansion_recommendation'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_cities TEXT[],
    target_barbershops UUID[],
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    action_required BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'implemented', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- Tabela de previsões de crescimento
CREATE TABLE IF NOT EXISTS public.growth_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_type TEXT NOT NULL CHECK (forecast_type IN ('revenue', 'barbershops', 'clients', 'market_share')),
    target_entity TEXT NOT NULL, -- city, state, region, or 'global'
    current_value DECIMAL(12,2),
    forecast_3m DECIMAL(12,2),
    forecast_6m DECIMAL(12,2),
    forecast_12m DECIMAL(12,2),
    confidence_level DECIMAL(3,2) DEFAULT 0.8,
    model_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de ranking de franqueados
CREATE TABLE IF NOT EXISTS public.franchise_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_barbershops INTEGER DEFAULT 0,
    new_barbershops INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    growth_rate DECIMAL(5,2) DEFAULT 0,
    client_retention_rate DECIMAL(5,2) DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0,
    ranking_position INTEGER,
    total_franchises INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(franchise_id, period_start, period_end)
);

-- Função para calcular score de demanda por cidade
CREATE OR REPLACE FUNCTION public.calculate_demand_score(p_city TEXT, p_state TEXT)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_population_score DECIMAL(5,2);
    v_growth_score DECIMAL(5,2);
    v_competition_score DECIMAL(5,2);
    v_saturation_score DECIMAL(5,2);
    v_final_score DECIMAL(5,2);
    v_barbershops_per_100k DECIMAL(5,2);
BEGIN
    -- Verificar se sistema de inteligência está ativo
    IF NOT is_feature_enabled('growth_intelligence') THEN
        RETURN 0;
    END IF;
    
    -- Calcular barbearias por 100k habitantes (estimado)
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(*)::DECIMAL / 100000.0) * 100
            ELSE 0
        END INTO v_barbershops_per_100k
    FROM public.barbershops b
    JOIN public.profiles p ON b.owner_user_id = p.user_id
    WHERE LOWER(b.city) = LOWER(p_city)
    AND LOWER(b.state) = LOWER(p_state);
    
    -- Score de população (baseado em dados estimados)
    v_population_score := CASE 
        WHEN v_barbershops_per_100k < 5 THEN 80 -- Baixa saturação
        WHEN v_barbershops_per_100k < 15 THEN 60 -- Média saturação
        WHEN v_barbershops_per_100k < 30 THEN 40 -- Alta saturação
        ELSE 20 -- Saturação muito alta
    END;
    
    -- Score de crescimento (novas barbearias nos últimos 30 dias)
    SELECT 
        CASE 
            WHEN COUNT(*) > 5 THEN 80 -- Alto crescimento
            WHEN COUNT(*) > 2 THEN 60 -- Médio crescimento
            WHEN COUNT(*) > 0 THEN 40 -- Baixo crescimento
            ELSE 20 -- Sem crescimento
        END INTO v_growth_score
    FROM public.barbershops b
    WHERE LOWER(b.city) = LOWER(p_city)
    AND LOWER(b.state) = LOWER(p_state)
    AND created_at > now() - INTERVAL '30 days';
    
    -- Score de competição (inverso da saturação)
    v_competition_score := 100 - v_population_score;
    
    -- Score de saturação atual
    v_saturation_score := CASE 
        WHEN v_barbershops_per_100k < 5 THEN 20
        WHEN v_barbershops_per_100k < 15 THEN 40
        WHEN v_barbershops_per_100k < 30 THEN 70
        ELSE 90
    END;
    
    -- Calcular score final (média ponderada)
    v_final_score := (
        (v_population_score * 0.3) +
        (v_growth_score * 0.4) +
        (v_competition_score * 0.2) +
        (100 - v_saturation_score) * 0.1
    );
    
    RETURN ROUND(v_final_score, 2);
END;
$$;

-- Função para atualizar métricas de crescimento
CREATE OR REPLACE FUNCTION public.update_growth_metrics(p_city TEXT DEFAULT NULL, p_state TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_city_record RECORD;
    v_demand_score DECIMAL(5,2);
    v_growth_rate DECIMAL(5,2);
    v_new_barbershops INTEGER;
    v_new_clients INTEGER;
    v_monthly_revenue DECIMAL(12,2);
BEGIN
    -- Verificar se sistema de inteligência está ativo
    IF NOT is_feature_enabled('growth_intelligence') THEN
        RETURN;
    END IF;
    
    -- Se cidade/estado não especificados, atualizar todas
    IF p_city IS NULL OR p_state IS NULL THEN
        FOR v_city_record IN 
            SELECT DISTINCT LOWER(TRIM(city)) as city, LOWER(TRIM(state)) as state
            FROM public.barbershops
            WHERE city IS NOT NULL AND state IS NOT NULL
        LOOP
            PERFORM public.update_growth_metrics(v_city_record.city, v_city_record.state);
        END LOOP;
        RETURN;
    END IF;
    
    -- Calcular métricas para a cidade específica
    v_demand_score := public.calculate_demand_score(p_city, p_state);
    
    -- Contar barbearias existentes
    SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE created_at > now() - INTERVAL '30 days') as new_count
    INTO v_growth_metrics.total_barbershops, v_new_barbershops
    FROM public.barbershops
    WHERE LOWER(city) = LOWER(p_city)
    AND LOWER(state) = LOWER(p_state);
    
    -- Calcular taxa de crescimento
    IF v_growth_metrics.total_barbershops > 0 THEN
        v_growth_rate := (v_new_barbershops::DECIMAL / v_growth_metrics.total_barbershops::DECIMAL) * 100;
    ELSE
        v_growth_rate := 0;
    END IF;
    
    -- Estimar receita mensal (baseado em assinaturas)
    SELECT COALESCE(SUM(sp.price), 0) INTO v_monthly_revenue
    FROM public.barbershops b
    JOIN public.user_subscriptions us ON b.owner_user_id = us.user_id
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE LOWER(b.city) = LOWER(p_city)
    AND LOWER(b.state) = LOWER(p_state)
    AND us.status = 'active';
    
    -- Calcular score de potencial
    v_growth_metrics.potential_score := CASE 
        WHEN v_demand_score > 70 AND v_growth_rate > 10 THEN 90
        WHEN v_demand_score > 50 AND v_growth_rate > 5 THEN 70
        WHEN v_demand_score > 30 OR v_growth_rate > 0 THEN 50
        ELSE 30
    END;
    
    -- Atualizar ou inserir métricas
    INSERT INTO public.growth_metrics (
        city, state, barbershops_count, new_barbershops_month,
        growth_rate, demand_score, potential_score, monthly_revenue
    ) VALUES (
        p_city, p_state, v_growth_metrics.total_barbershops, v_new_barbershops,
        v_growth_rate, v_demand_score, v_growth_metrics.potential_score, v_monthly_revenue
    )
    ON CONFLICT (city, state) DO UPDATE SET
        barbershops_count = v_growth_metrics.total_barbershops,
        new_barbershops_month = v_new_barbershops,
        growth_rate = v_growth_rate,
        demand_score = v_demand_score,
        potential_score = v_growth_metrics.potential_score,
        monthly_revenue = v_monthly_revenue,
        updated_at = now();
END;
$$;

-- Função para gerar insights automáticos
CREATE OR REPLACE FUNCTION public.generate_growth_insights()
RETURNS TABLE (
    insight_type TEXT,
    title TEXT,
    description TEXT,
    target_cities TEXT[],
    priority TEXT,
    confidence_score DECIMAL(3,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_city_record RECORD;
    v_insight_title TEXT;
    v_insight_description TEXT;
    v_priority TEXT;
    v_confidence DECIMAL(3,2);
BEGIN
    -- Verificar se sistema de inteligência está ativo
    IF NOT is_feature_enabled('growth_intelligence') THEN
        RETURN;
    END IF;
    
    -- Analisar cidades com alto potencial mas baixa penetração
    FOR v_city_record IN 
        SELECT city, state, demand_score, barbershops_count, growth_rate
        FROM public.growth_metrics
        WHERE demand_score > 70 
        AND barbershops_count < 5
        AND growth_rate > 5
        ORDER BY demand_score DESC
        LIMIT 10
    LOOP
        v_insight_title := 'Oportunidade de Mercado: ' || INITCAP(v_city_record.city);
        v_insight_description := 'Alta demanda (' || v_city_record.demand_score || 
            '/100) com baixa competição (' || v_city_record.barbershops_count || 
            ' barbearias). Crescimento de ' || v_city_record.growth_rate || '% no último mês.';
        v_priority := 'high';
        v_confidence := 0.85;
        
        -- Inserir insight
        INSERT INTO public.growth_insights (
            insight_type, title, description, target_cities,
            priority, confidence_score, expires_at
        ) VALUES (
            'market_opportunity', v_insight_title, v_insight_description,
            ARRAY[v_city_record.city || ', ' || v_city_record.state],
            v_priority, v_confidence, now() + INTERVAL '30 days'
        ) ON CONFLICT DO NOTHING;
        
        RETURN NEXT;
    END LOOP;
    
    -- Analisar cidades com crescimento acelerado
    FOR v_city_record IN 
        SELECT city, state, growth_rate, new_barbershops_month
        FROM public.growth_metrics
        WHERE growth_rate > 20 
        AND new_barbershops_month >= 2
        ORDER BY growth_rate DESC
        LIMIT 5
    LOOP
        v_insight_title := 'Crescimento Acelerado: ' || INITCAP(v_city_record.city);
        v_insight_description := 'Crescimento exponencial de ' || v_city_record.growth_rate || 
            '% com ' || v_city_record.new_barbershops_month || ' novas barbearias no mês.';
        v_priority := 'medium';
        v_confidence := 0.90;
        
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Função para prever crescimento
CREATE OR REPLACE FUNCTION public.forecast_growth(
    p_target_entity TEXT DEFAULT 'global',
    p_forecast_type TEXT DEFAULT 'revenue'
)
RETURNS TABLE (
    forecast_type TEXT,
    target_entity TEXT,
    current_value DECIMAL(12,2),
    forecast_3m DECIMAL(12,2),
    forecast_6m DECIMAL(12,2),
    forecast_12m DECIMAL(12,2),
    confidence_level DECIMAL(3,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_value DECIMAL(12,2);
    v_growth_rate DECIMAL(5,2);
    v_seasonality_factor DECIMAL(3,2) DEFAULT 1.0;
BEGIN
    -- Verificar se sistema de inteligência está ativo
    IF NOT is_feature_enabled('growth_intelligence') THEN
        RETURN;
    END IF;
    
    -- Calcular valor atual baseado no tipo
    CASE p_forecast_type
        WHEN 'revenue' THEN
            SELECT COALESCE(SUM(sp.price), 0) INTO v_current_value
            FROM public.user_subscriptions us
            JOIN public.subscription_plans sp ON us.plan_id = sp.id
            WHERE us.status = 'active';
            
        WHEN 'barbershops' THEN
            SELECT COUNT(*)::DECIMAL INTO v_current_value
            FROM public.barbershops;
            
        WHEN 'clients' THEN
            SELECT COUNT(DISTINCT client_id)::DECIMAL INTO v_current_value
            FROM public.appointments
            WHERE client_id IS NOT NULL;
            
        ELSE
            v_current_value := 0;
    END CASE;
    
    -- Calcular taxa de crescimento média
    SELECT AVG(growth_rate) INTO v_growth_rate
    FROM public.growth_metrics
    WHERE growth_rate IS NOT NULL
    AND growth_rate > 0;
    
    IF v_growth_rate IS NULL THEN
        v_growth_rate := 5.0; -- Padrão 5% mensal
    END IF;
    
    -- Aplicar fator sazonalidade (simplificado)
    v_seasonality_factor := CASE 
        WHEN EXTRACT(MONTH FROM now()) IN (11, 12) THEN 1.2 -- Festas
        WHEN EXTRACT(MONTH FROM now()) IN (1, 2) THEN 0.8 -- Férias
        ELSE 1.0
    END;
    
    -- Calcular previsões
    RETURN QUERY SELECT 
        p_forecast_type,
        p_target_entity,
        v_current_value,
        v_current_value * POWER(1 + (v_growth_rate / 100), 3) * v_seasonality_factor,
        v_current_value * POWER(1 + (v_growth_rate / 100), 6) * v_seasonality_factor,
        v_current_value * POWER(1 + (v_growth_rate / 100), 12) * v_seasonality_factor,
        0.85;
END;
$$;

-- Função para obter ranking de franqueados
CREATE OR REPLACE FUNCTION public.get_franchise_rankings(p_period_start DATE DEFAULT NULL)
RETURNS TABLE (
    franchise_id UUID,
    franchise_name TEXT,
    total_barbershops INTEGER,
    new_barbershops INTEGER,
    total_revenue DECIMAL(12,2),
    growth_rate DECIMAL(5,2),
    performance_score DECIMAL(5,2),
    ranking_position INTEGER,
    total_franchises INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Verificar se sistema de inteligência está ativo
    IF NOT is_feature_enabled('growth_intelligence') THEN
        RETURN;
    END IF;
    
    -- Definir período
    v_period_start := COALESCE(p_period_start, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month');
    v_period_end := v_period_start + INTERVAL '1 month' - INTERVAL '1 day';
    
    RETURN QUERY
    WITH franchise_stats AS (
        SELECT 
            f.id as franchise_id,
            p.name as franchise_name,
            COUNT(b.id) as total_barbershops,
            COUNT(b.id) FILTER (WHERE b.created_at BETWEEN v_period_start AND v_period_end) as new_barbershops,
            COALESCE(SUM(sp.price), 0) as total_revenue,
            CASE 
                WHEN COUNT(b.id) > 0 THEN 
                    (COUNT(b.id) FILTER (WHERE b.created_at BETWEEN v_period_start AND v_period_end)::DECIMAL / COUNT(b.id)) * 100
                ELSE 0 
            END as growth_rate
        FROM public.franchises f
        JOIN public.profiles p ON f.user_id = p.user_id
        LEFT JOIN public.barbershops b ON f.user_id = b.owner_user_id
        LEFT JOIN public.user_subscriptions us ON b.owner_user_id = us.user_id
        LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
        WHERE f.status = 'active'
        GROUP BY f.id, p.name
    ),
    ranked_franchises AS (
        SELECT 
            *,
            ROW_NUMBER() OVER (ORDER BY 
                (total_revenue * 0.4 + total_barbershops * 20 + new_barbershops * 30 + growth_rate * 0.1)
            DESC) as ranking_position,
            COUNT(*) OVER () as total_franchises,
            (total_revenue * 0.4 + total_barbershops * 20 + new_barbershops * 30 + growth_rate * 0.1) as performance_score
        FROM franchise_stats
    )
    SELECT 
        franchise_id,
        franchise_name,
        total_barbershops,
        new_barbershops,
        total_revenue,
        growth_rate,
        performance_score,
        ranking_position,
        total_franchises
    FROM ranked_franchises
    ORDER BY ranking_position;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER handle_growth_metrics_updated_at
    BEFORE UPDATE ON public.growth_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_growth_forecasts_updated_at
    BEFORE UPDATE ON public.growth_forecasts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Políticas RLS
ALTER TABLE public.growth_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_rankings ENABLE ROW LEVEL SECURITY;

-- Políticas para growth_metrics
CREATE POLICY "Super admins can view growth metrics" ON public.growth_metrics
    FOR SELECT USING (is_super_admin(auth.uid()));

-- Políticas para growth_insights
CREATE POLICY "Super admins can manage growth insights" ON public.growth_insights
    FOR ALL USING (is_super_admin(auth.uid()));

-- Políticas para growth_forecasts
CREATE POLICY "Super admins can view growth forecasts" ON public.growth_forecasts
    FOR SELECT USING (is_super_admin(auth.uid()));

-- Políticas para franchise_rankings
CREATE POLICY "Super admins can view franchise rankings" ON public.franchise_rankings
    FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Masters can view their network rankings" ON public.franchise_rankings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.masters m
            JOIN public.franchises f ON f.master_id = m.id
            WHERE m.user_id = auth.uid()
            AND f.id = franchise_id
        )
    );

-- Comentários
COMMENT ON TABLE public.growth_metrics IS 'Métricas de crescimento por cidade';
COMMENT ON TABLE public.growth_insights IS 'Insights automáticos de crescimento';
COMMENT ON TABLE public.growth_forecasts IS 'Previsões de crescimento do sistema';
COMMENT ON TABLE public.franchise_rankings IS 'Ranking de performance de franqueados';
COMMENT ON FUNCTION public.calculate_demand_score IS 'Calcula score de demanda por cidade';
COMMENT ON FUNCTION public.update_growth_metrics IS 'Atualiza métricas de crescimento';
COMMENT ON FUNCTION public.generate_growth_insights IS 'Gera insights automáticos';
COMMENT ON FUNCTION public.forecast_growth IS 'Previsão de crescimento';
COMMENT ON FUNCTION public.get_franchise_rankings IS 'Retorna ranking de franqueados';
