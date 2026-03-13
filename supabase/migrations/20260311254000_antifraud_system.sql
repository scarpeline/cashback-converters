-- Sistema Anti-Fraude
-- Criada em: 2026-03-11
-- Objetivo: Detecção automática de atividades suspeitas e fraudes

-- Tabela de alertas de fraude
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'payment_mismatch', 'unusual_volume', 'suspicious_pattern', 
        'multiple_accounts', 'chargeback_risk', 'velocity_exceeded'
    )),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de padrões suspeitos
CREATE TABLE IF NOT EXISTS public.suspicious_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name TEXT NOT NULL,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('velocity', 'amount', 'frequency', 'behavior')),
    threshold_value DECIMAL(10,2),
    time_window INTERVAL DEFAULT '1 hour',
    risk_weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de métricas de fraude
CREATE TABLE IF NOT EXISTS public.fraud_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_appointments INTEGER DEFAULT 0,
    total_payments DECIMAL(10,2) DEFAULT 0,
    recorded_payments DECIMAL(10,2) DEFAULT 0,
    discrepancy_amount DECIMAL(10,2) DEFAULT 0,
    discrepancy_percentage DECIMAL(5,2) DEFAULT 0,
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Função para calcular score de risco
CREATE OR REPLACE FUNCTION public.calculate_fraud_score(
    p_barbershop_id UUID,
    p_alert_type TEXT,
    p_details JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_base_score INTEGER := 0;
    v_pattern_weight DECIMAL(3,2);
    v_recent_alerts INTEGER;
    v_discrepancy_score INTEGER;
BEGIN
    -- Verificar se sistema anti-fraude está ativo
    IF NOT is_feature_enabled('antifraud_system') THEN
        RETURN 0;
    END IF;
    
    -- Score base por tipo de alerta
    CASE p_alert_type
        WHEN 'payment_mismatch' THEN v_base_score := 40;
        WHEN 'unusual_volume' THEN v_base_score := 30;
        WHEN 'suspicious_pattern' THEN v_base_score := 35;
        WHEN 'multiple_accounts' THEN v_base_score := 50;
        WHEN 'chargeback_risk' THEN v_base_score := 45;
        WHEN 'velocity_exceeded' THEN v_base_score := 25;
        ELSE v_base_score := 20;
    END CASE;
    
    -- Buscar peso do padrão
    SELECT COALESCE(risk_weight, 1.0) INTO v_pattern_weight
    FROM public.suspicious_patterns 
    WHERE pattern_type = p_alert_type 
    AND is_active = true
    LIMIT 1;
    
    -- Verificar alertas recentes
    SELECT COUNT(*) INTO v_recent_alerts
    FROM public.fraud_alerts
    WHERE barbershop_id = p_barbershop_id
    AND created_at > now() - INTERVAL '24 hours'
    AND status != 'false_positive';
    
    -- Ajustar score baseado em alertas recentes
    v_base_score := v_base_score + (v_recent_alerts * 10);
    
    -- Verificar discrepância de pagamentos
    SELECT COALESCE(discrepancy_percentage, 0) INTO v_discrepancy_score
    FROM public.fraud_metrics
    WHERE barbershop_id = p_barbershop_id
    AND date = CURRENT_DATE
    LIMIT 1;
    
    v_base_score := v_base_score + v_discrepancy_score;
    
    -- Aplicar peso do padrão
    v_base_score := ROUND(v_base_score * v_pattern_weight);
    
    -- Limitar score entre 0 e 100
    v_base_score := GREATEST(0, LEAST(100, v_base_score));
    
    RETURN v_base_score;
END;
$$;

-- Função para criar alerta de fraude
CREATE OR REPLACE FUNCTION public.create_fraud_alert(
    p_barbershop_id UUID,
    p_alert_type TEXT,
    p_description TEXT,
    p_details JSONB DEFAULT '{}',
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alert_id UUID;
    v_risk_score INTEGER;
BEGIN
    -- Verificar se sistema anti-fraude está ativo
    IF NOT is_feature_enabled('antifraud_system') THEN
        RETURN NULL;
    END IF;
    
    -- Calcular score de risco
    v_risk_score := public.calculate_fraud_score(p_barbershop_id, p_alert_type, p_details);
    
    -- Inserir alerta
    INSERT INTO public.fraud_alerts (
        barbershop_id, user_id, alert_type, risk_score, 
        description, details
    ) VALUES (
        p_barbershop_id, p_user_id, p_alert_type, v_risk_score,
        p_description, p_details
    ) RETURNING id INTO v_alert_id;
    
    -- Se score alto, registrar log de segurança
    IF v_risk_score >= 70 THEN
        PERFORM public.log_security_event(
            p_user_id,
            inet_client_addr(),
            'suspicious_activity',
            current_setting('application_name'),
            NULL,
            json_build_object(
                'alert_id', v_alert_id,
                'alert_type', p_alert_type,
                'risk_score', v_risk_score,
                'barbershop_id', p_barbershop_id
            )
        );
    END IF;
    
    RETURN v_alert_id;
END;
$$;

-- Função para analisar discrepância de pagamentos
CREATE OR REPLACE FUNCTION public.analyze_payment_discrepancy(p_barbershop_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_appointments INTEGER;
    v_total_payments DECIMAL(10,2);
    v_recorded_payments DECIMAL(10,2);
    v_discrepancy_amount DECIMAL(10,2);
    v_discrepancy_percentage DECIMAL(5,2);
    v_risk_level TEXT := 'low';
    v_alert_id UUID;
BEGIN
    -- Verificar se sistema anti-fraude está ativo
    IF NOT is_feature_enabled('antifraud_system') THEN
        RETURN;
    END IF;
    
    -- Contar agendamentos do dia
    SELECT COUNT(*) INTO v_total_appointments
    FROM public.appointments
    WHERE barbershop_id = p_barbershop_id
    AND DATE(start_time) = CURRENT_DATE
    AND status = 'completed';
    
    -- Somar pagamentos registrados
    SELECT COALESCE(SUM(amount), 0) INTO v_recorded_payments
    FROM public.payments
    WHERE barbershop_id = p_barbershop_id
    AND DATE(created_at) = CURRENT_DATE
    AND status = 'paid';
    
    -- Estimar pagamentos esperados (baseado em agendamentos)
    v_total_payments := v_total_appointments * 50; -- Média estimada
    
    -- Calcular discrepância
    v_discrepancy_amount := v_total_payments - v_recorded_payments;
    
    IF v_total_payments > 0 THEN
        v_discrepancy_percentage := (v_discrepancy_amount / v_total_payments) * 100;
    ELSE
        v_discrepancy_percentage := 0;
    END IF;
    
    -- Determinar nível de risco
    IF ABS(v_discrepancy_percentage) > 30 THEN
        v_risk_level := 'critical';
    ELSIF ABS(v_discrepancy_percentage) > 20 THEN
        v_risk_level := 'high';
    ELSIF ABS(v_discrepancy_percentage) > 10 THEN
        v_risk_level := 'medium';
    ELSE
        v_risk_level := 'low';
    END IF;
    
    -- Atualizar métricas
    INSERT INTO public.fraud_metrics (
        barbershop_id, date, total_appointments, total_payments,
        recorded_payments, discrepancy_amount, discrepancy_percentage, risk_level
    ) VALUES (
        p_barbershop_id, CURRENT_DATE, v_total_appointments, v_total_payments,
        v_recorded_payments, v_discrepancy_amount, v_discrepancy_percentage, v_risk_level
    )
    ON CONFLICT (barbershop_id, date) DO UPDATE SET
        total_appointments = v_total_appointments,
        total_payments = v_total_payments,
        recorded_payments = v_recorded_payments,
        discrepancy_amount = v_discrepancy_amount,
        discrepancy_percentage = v_discrepancy_percentage,
        risk_level = v_risk_level;
    
    -- Criar alerta se discrepância for alta
    IF ABS(v_discrepancy_percentage) > 30 THEN
        v_alert_id := public.create_fraud_alert(
            p_barbershop_id,
            'payment_mismatch',
            'Discrepância significativa entre agendamentos e pagamentos registrados',
            json_build_object(
                'expected_payments', v_total_payments,
                'recorded_payments', v_recorded_payments,
                'discrepancy_percentage', v_discrepancy_percentage
            )
        );
    END IF;
END;
$$;

-- Função para detectar volume incomum
CREATE OR REPLACE FUNCTION public.detect_unusual_volume(p_barbershop_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today_count INTEGER;
    v_avg_7days DECIMAL(10,2);
    v_volume_ratio DECIMAL(5,2);
    v_alert_id UUID;
BEGIN
    -- Verificar se sistema anti-fraude está ativo
    IF NOT is_feature_enabled('antifraud_system') THEN
        RETURN;
    END IF;
    
    -- Contar agendamentos hoje
    SELECT COUNT(*) INTO v_today_count
    FROM public.appointments
    WHERE barbershop_id = p_barbershop_id
    AND DATE(start_time) = CURRENT_DATE;
    
    -- Calcular média dos últimos 7 dias
    SELECT AVG(daily_count) INTO v_avg_7days
    FROM (
        SELECT COUNT(*) as daily_count
        FROM public.appointments
        WHERE barbershop_id = p_barbershop_id
        AND DATE(start_time) BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE - INTERVAL '1 day'
        GROUP BY DATE(start_time)
    ) AS daily_counts;
    
    -- Se não há histórico, não analisar
    IF v_avg_7days IS NULL OR v_avg_7days = 0 THEN
        RETURN;
    END IF;
    
    -- Calcular razão de volume
    v_volume_ratio := v_today_count / v_avg_7days;
    
    -- Se volume > 3x média, criar alerta
    IF v_volume_ratio > 3.0 THEN
        v_alert_id := public.create_fraud_alert(
            p_barbershop_id,
            'unusual_volume',
            'Volume de agendamentos incomum detectado',
            json_build_object(
                'today_count', v_today_count,
                'avg_7days', v_avg_7days,
                'volume_ratio', v_volume_ratio
            )
        );
    END IF;
END;
$$;

-- Função para obter alertas de fraude
CREATE OR REPLACE FUNCTION public.get_fraud_alerts(
    p_status TEXT DEFAULT NULL,
    p_risk_min INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    barbershop_id UUID,
    barbershop_name TEXT,
    alert_type TEXT,
    risk_score INTEGER,
    description TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se é super admin
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: apenas super admin pode ver alertas';
    END IF;
    
    RETURN QUERY
    SELECT 
        fa.id,
        fa.barbershop_id,
        b.name as barbershop_name,
        fa.alert_type,
        fa.risk_score,
        fa.description,
        fa.status,
        fa.created_at
    FROM public.fraud_alerts fa
    LEFT JOIN public.barbershops b ON fa.barbershop_id = b.id
    WHERE (p_status IS NULL OR fa.status = p_status)
    AND (p_risk_min IS NULL OR fa.risk_score >= p_risk_min)
    ORDER BY fa.risk_score DESC, fa.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Inserir padrões suspeitos padrão
INSERT INTO public.suspicious_patterns (pattern_name, pattern_type, threshold_value, time_window, risk_weight) VALUES
    ('Alto volume de transações', 'velocity', 100.0, '1 hour', 1.5),
    ('Múltiplas contas mesmo IP', 'behavior', 3.0, '1 day', 2.0),
    ('Discrepância de pagamentos', 'amount', 30.0, '1 day', 1.8),
    ('Padrão anormal de horários', 'behavior', 2.0, '1 hour', 1.2)
ON CONFLICT DO NOTHING;

-- Triggers para updated_at
CREATE TRIGGER handle_suspicious_patterns_updated_at
    BEFORE UPDATE ON public.suspicious_patterns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Políticas RLS
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para fraud_alerts
CREATE POLICY "Super admins can manage fraud alerts" ON public.fraud_alerts
    FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "Barbershops can view their own alerts" ON public.fraud_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops b
            WHERE b.owner_user_id = auth.uid()
            AND b.id = barbershop_id
        )
    );

-- Políticas para suspicious_patterns
CREATE POLICY "Super admins can manage suspicious patterns" ON public.suspicious_patterns
    FOR ALL USING (is_super_admin(auth.uid()));

-- Políticas para fraud_metrics
CREATE POLICY "Super admins can view fraud metrics" ON public.fraud_metrics
    FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Barbershops can view their own metrics" ON public.fraud_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops b
            WHERE b.owner_user_id = auth.uid()
            AND b.id = barbershop_id
        )
    );

-- Comentários
COMMENT ON TABLE public.fraud_alerts IS 'Alertas de fraude detectados pelo sistema';
COMMENT ON TABLE public.suspicious_patterns IS 'Padrões suspeitos para detecção automática';
COMMENT ON TABLE public.fraud_metrics IS 'Métricas de análise de fraude';
COMMENT ON FUNCTION public.calculate_fraud_score IS 'Calcula score de risco de fraude';
COMMENT ON FUNCTION public.create_fraud_alert IS 'Cria alerta de fraude';
COMMENT ON FUNCTION public.analyze_payment_discrepancy IS 'Analisa discrepância de pagamentos';
COMMENT ON FUNCTION public.detect_unusual_volume IS 'Detecta volume incomum de transações';
COMMENT ON FUNCTION public.get_fraud_alerts IS 'Retorna alertas de fraude (super admin only)';
