-- Sistema de Segurança Avançada
-- Criada em: 2026-03-11
-- Objetivo: Logs de segurança, monitoramento e proteção contra ataques

-- Tabela de logs de segurança
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    action TEXT NOT NULL CHECK (action IN (
        'login', 'login_failed', 'password_change', 'financial_change', 
        'admin_access', 'feature_toggle', 'data_export', 'api_access',
        'suspicious_activity', 'blocked_attempt'
    )),
    device_fingerprint TEXT,
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    details JSONB DEFAULT '{}',
    location_country TEXT,
    location_city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de IPs bloqueados
CREATE TABLE IF NOT EXISTS public.blocked_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_until TIMESTAMPTZ NOT NULL,
    blocked_by UUID REFERENCES auth.users(id),
    attempts_count INTEGER DEFAULT 1,
    last_attempt_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de tentativas de login
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    email TEXT,
    success BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_agent TEXT,
    attempt_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de vulnerabilidades detectadas
CREATE TABLE IF NOT EXISTS public.vulnerability_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_type TEXT NOT NULL CHECK (scan_type IN ('sql_injection', 'xss', 'csrf', 'rate_limit', 'auth_bypass')),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    affected_endpoint TEXT,
    ip_address INET,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Função para registrar log de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET,
    p_action TEXT,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_location_country TEXT DEFAULT NULL,
    p_location_city TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_risk_level TEXT := 'low';
    v_attempt_count INTEGER;
BEGIN
    -- Verificar se sistema de segurança está ativo
    IF NOT is_feature_enabled('advanced_security') THEN
        RETURN NULL;
    END IF;
    
    -- Calcular nível de risco baseado na ação
    CASE p_action
        WHEN 'login_failed' THEN
            v_risk_level := 'medium';
        WHEN 'admin_access', 'financial_change', 'feature_toggle' THEN
            v_risk_level := 'high';
        WHEN 'blocked_attempt', 'suspicious_activity' THEN
            v_risk_level := 'critical';
        ELSE
            v_risk_level := 'low';
    END CASE;
    
    -- Inserir log
    INSERT INTO public.security_logs (
        user_id, ip_address, user_agent, action, device_fingerprint,
        risk_level, details, location_country, location_city
    ) VALUES (
        p_user_id, p_ip_address, p_user_agent, p_action, p_device_fingerprint,
        v_risk_level, p_details, p_location_country, p_location_city
    ) RETURNING id INTO v_log_id;
    
    -- Verificar tentativas de login falhas para bloqueio
    IF p_action = 'login_failed' THEN
        -- Registrar tentativa
        INSERT INTO public.login_attempts (ip_address, email, success, user_id, user_agent)
        VALUES (p_ip_address, COALESCE(p_details->>'email', ''), false, p_user_id, p_user_agent);
        
        -- Contar tentativas nas últimas 24 horas
        SELECT COUNT(*) INTO v_attempt_count
        FROM public.login_attempts
        WHERE ip_address = p_ip_address
        AND attempt_at > now() - INTERVAL '24 hours'
        AND success = false;
        
        -- Se mais de 10 tentativas, bloquear IP
        IF v_attempt_count > 10 THEN
            INSERT INTO public.blocked_ips (
                ip_address, reason, blocked_until, attempts_count, last_attempt_at
            ) VALUES (
                p_ip_address, 
                'Too many failed login attempts', 
                now() + INTERVAL '24 hours',
                v_attempt_count,
                now()
            )
            ON CONFLICT (ip_address) DO UPDATE SET
                attempts_count = v_attempt_count,
                blocked_until = now() + INTERVAL '24 hours',
                last_attempt_at = now();
        END IF;
    END IF;
    
    RETURN v_log_id;
END;
$$;

-- Função para verificar se IP está bloqueado
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocked_ips 
        WHERE ip_address = p_ip_address 
        AND blocked_until > now()
    );
END;
$$;

-- Função para desbloquear IP
CREATE OR REPLACE FUNCTION public.unblock_ip(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se é super admin
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: apenas super admin pode desbloquear IPs';
    END IF;
    
    DELETE FROM public.blocked_ips WHERE ip_address = p_ip_address;
    
    RETURN FOUND;
END;
$$;

-- Função para escanear vulnerabilidades
CREATE OR REPLACE FUNCTION public.scan_vulnerabilities(p_scan_type TEXT DEFAULT NULL)
RETURNS TABLE (
    scan_type TEXT,
    severity TEXT,
    description TEXT,
    affected_endpoint TEXT,
    ip_address INET,
    user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se sistema de segurança está ativo
    IF NOT is_feature_enabled('advanced_security') THEN
        RETURN;
    END IF;
    
    -- Escanear SQL Injection
    IF p_scan_type IS NULL OR p_scan_type = 'sql_injection' THEN
        -- Verificar logs recentes por padrões suspeitos
        INSERT INTO public.vulnerability_scans (scan_type, severity, description, affected_endpoint)
        SELECT 
            'sql_injection',
            'medium',
            'Potential SQL injection pattern detected',
            details->>'endpoint'
        FROM public.security_logs
        WHERE action = 'api_access'
        AND details->>'query' ~* '(union|select|drop|insert|update|delete)'
        AND created_at > now() - INTERVAL '1 hour'
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Escanear XSS
    IF p_scan_type IS NULL OR p_scan_type = 'xss' THEN
        INSERT INTO public.vulnerability_scans (scan_type, severity, description, affected_endpoint)
        SELECT 
            'xss',
            'medium',
            'Potential XSS pattern detected',
            details->>'endpoint'
        FROM public.security_logs
        WHERE action = 'api_access'
        AND details->>'query' ~* '(<script|javascript:|onload=|onerror=)'
        AND created_at > now() - INTERVAL '1 hour'
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Escanear Rate Limit
    IF p_scan_type IS NULL OR p_scan_type = 'rate_limit' THEN
        INSERT INTO public.vulnerability_scans (scan_type, severity, description, ip_address)
        SELECT 
            'rate_limit',
            'high',
            'High rate of requests detected',
            ip_address
        FROM public.security_logs
        WHERE ip_address IN (
            SELECT ip_address 
            FROM public.security_logs 
            WHERE created_at > now() - INTERVAL '1 minute'
            GROUP BY ip_address 
            HAVING COUNT(*) > 100
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Retornar vulnerabilidades abertas
    RETURN QUERY
    SELECT vs.scan_type, vs.severity, vs.description, vs.affected_endpoint, 
           vs.ip_address, vs.user_id
    FROM public.vulnerability_scans vs
    WHERE vs.status = 'open'
    ORDER BY vs.severity DESC, vs.created_at DESC;
END;
$$;

-- Função para obter estatísticas de segurança
CREATE OR REPLACE FUNCTION public.get_security_stats()
RETURNS TABLE (
    total_logs BIGINT,
    high_risk_events BIGINT,
    blocked_ips_count BIGINT,
    failed_logins_24h BIGINT,
    open_vulnerabilities BIGINT,
    critical_vulnerabilities BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se é super admin
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: apenas super admin pode ver estatísticas';
    END IF;
    
    SELECT 
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE risk_level IN ('high', 'critical'))::BIGINT,
        (SELECT COUNT(*)::BIGINT FROM public.blocked_ips WHERE blocked_until > now()),
        (SELECT COUNT(*)::BIGINT FROM public.login_attempts 
         WHERE success = false AND attempt_at > now() - INTERVAL '24 hours'),
        (SELECT COUNT(*)::BIGINT FROM public.vulnerability_scans WHERE status = 'open'),
        (SELECT COUNT(*)::BIGINT FROM public.vulnerability_scans 
         WHERE status = 'open' AND severity = 'critical')
    INTO total_logs, high_risk_events, blocked_ips_count, failed_logins_24h, 
         open_vulnerabilities, critical_vulnerabilities
    FROM public.security_logs
    WHERE created_at > now() - INTERVAL '7 days';
    
    RETURN NEXT;
END;
$$;

-- Trigger para limpar logs antigos (manter apenas 90 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.security_logs WHERE created_at < now() - INTERVAL '90 days';
    DELETE FROM public.login_attempts WHERE attempt_at < now() - INTERVAL '30 days';
    DELETE FROM public.blocked_ips WHERE blocked_until < now();
END;
$$;

-- Agendar limpeza (executar diariamente)
-- Isso precisaria ser configurado no Supabase Dashboard ou via cron job

-- Políticas RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vulnerability_scans ENABLE ROW LEVEL SECURITY;

-- Políticas para security_logs
CREATE POLICY "Super admins can view all security logs" ON public.security_logs
    FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own security logs" ON public.security_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas para blocked_ips
CREATE POLICY "Super admins can manage blocked IPs" ON public.blocked_ips
    FOR ALL USING (is_super_admin(auth.uid()));

-- Políticas para login_attempts
CREATE POLICY "Super admins can view login attempts" ON public.login_attempts
    FOR SELECT USING (is_super_admin(auth.uid()));

-- Políticas para vulnerability_scans
CREATE POLICY "Super admins can manage vulnerability scans" ON public.vulnerability_scans
    FOR ALL USING (is_super_admin(auth.uid()));

-- Comentários
COMMENT ON TABLE public.security_logs IS 'Logs de segurança do sistema';
COMMENT ON TABLE public.blocked_ips IS 'IPs bloqueados por segurança';
COMMENT ON TABLE public.login_attempts IS 'Tentativas de login';
COMMENT ON TABLE public.vulnerability_scans IS 'Vulnerabilidades detectadas pelo sistema';
COMMENT ON FUNCTION public.log_security_event IS 'Registra evento de segurança';
COMMENT ON FUNCTION public.is_ip_blocked IS 'Verifica se IP está bloqueado';
COMMENT ON FUNCTION public.unblock_ip IS 'Desbloqueia um IP (super admin only)';
COMMENT ON FUNCTION public.scan_vulnerabilities IS 'Escaneia vulnerabilidades no sistema';
COMMENT ON FUNCTION public.get_security_stats IS 'Retorna estatísticas de segurança (super admin only)';
COMMENT ON FUNCTION public.cleanup_old_security_logs IS 'Limpa logs antigos de segurança';
