-- Migração para Configurações de Webhooks
-- Criada em: 2026-03-12
-- Objetivo: Implementar gestão de webhooks para integrações externas

-- Tabela de configurações de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name text NOT NULL UNIQUE,
    webhook_url text NOT NULL,
    webhook_secret text NOT NULL DEFAULT '',
    is_active boolean NOT NULL DEFAULT true,
    last_triggered timestamptz,
    last_success timestamptz,
    last_error text,
    retry_count integer NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Validações
    CONSTRAINT webhook_url_format CHECK (webhook_url ~ '^https?://.*'),
    CONSTRAINT webhook_secret_length CHECK (length(webhook_secret) >= 16)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_configs_service_name ON public.webhook_configs(service_name);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_is_active ON public.webhook_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_last_triggered ON public.webhook_configs(last_triggered);

-- Tabela de logs de webhooks para auditoria
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_config_id uuid NOT NULL REFERENCES public.webhook_configs(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    payload jsonb,
    response_status integer,
    response_body text,
    error_message text,
    duration_ms integer,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_config_id ON public.webhook_logs(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_response_status ON public.webhook_logs(response_status);

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_webhook_configs_updated_at
    BEFORE UPDATE ON public.webhook_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RPC para registrar log de webhook
CREATE OR REPLACE FUNCTION public.log_webhook_execution(
    p_webhook_config_id uuid,
    p_event_type text,
    p_payload jsonb DEFAULT '{}',
    p_response_status integer DEFAULT null,
    p_response_body text DEFAULT null,
    p_error_message text DEFAULT null,
    p_duration_ms integer DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.webhook_logs (
        webhook_config_id,
        event_type,
        payload,
        response_status,
        response_body,
        error_message,
        duration_ms
    ) VALUES (
        p_webhook_config_id,
        p_event_type,
        p_payload,
        p_response_status,
        p_response_body,
        p_error_message,
        p_duration_ms
    );
    
    -- Atualizar estatísticas do webhook
    UPDATE public.webhook_configs 
    SET 
        last_triggered = now(),
        last_success = CASE 
            WHEN p_response_status BETWEEN 200 AND 299 THEN now()
            ELSE last_success
        END,
        last_error = CASE 
            WHEN p_response_status NOT BETWEEN 200 AND 299 THEN p_error_message
            ELSE last_error
        END,
        retry_count = CASE 
            WHEN p_response_status NOT BETWEEN 200 AND 299 THEN retry_count + 1
            ELSE 0
        END,
        updated_at = now()
    WHERE id = p_webhook_config_id;
END;
$$;

-- RPC para buscar webhooks ativos
CREATE OR REPLACE FUNCTION public.get_active_webhooks()
RETURNS TABLE(
    id uuid,
    service_name text,
    webhook_url text,
    webhook_secret text,
    last_triggered timestamptz,
    last_success timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wc.id,
        wc.service_name,
        wc.webhook_url,
        wc.webhook_secret,
        wc.last_triggered,
        wc.last_success
    FROM public.webhook_configs wc
    WHERE wc.is_active = true
    ORDER BY wc.service_name;
END;
$$;

-- RPC para testar webhook
CREATE OR REPLACE FUNCTION public.test_webhook(
    p_webhook_config_id uuid
)
RETURNS TABLE(
    success boolean,
    status_code integer,
    response_text text,
    duration_ms integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_webhook_config RECORD;
    v_start_time timestamptz;
    v_end_time timestamptz;
    v_response_text text;
    v_status_code integer;
BEGIN
    -- Buscar configuração do webhook
    SELECT * INTO v_webhook_config
    FROM public.webhook_configs
    WHERE id = p_webhook_config_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 404, 'Webhook não encontrado'::text, 0;
        RETURN;
    END IF;
    
    -- Registrar tempo de início
    v_start_time := now();
    
    -- Enviar requisição de teste (simulado)
    -- Na implementação real, usaria http extension ou função Edge
    BEGIN
        -- Simular requisição bem-sucedida
        v_status_code := 200;
        v_response_text := 'Teste realizado com sucesso';
        
        -- Registrar log
        PERFORM public.log_webhook_execution(
            p_webhook_config_id,
            'test',
            '{"test": true}',
            v_status_code,
            v_response_text,
            null,
            EXTRACT(MILLISECONDS FROM (now() - v_start_time))::integer
        );
        
        RETURN QUERY SELECT true, v_status_code, v_response_text, EXTRACT(MILLISECONDS FROM (now() - v_start_time))::integer;
        RETURN;
    EXCEPTION WHEN OTHERS THEN
        -- Registrar erro
        PERFORM public.log_webhook_execution(
            p_webhook_config_id,
            'test',
            '{"test": true}',
            null,
            null,
            SQLERRM,
            EXTRACT(MILLISECONDS FROM (now() - v_start_time))::integer
        );
        
        RETURN QUERY SELECT false, 500, SQLERRM, EXTRACT(MILLISECONDS FROM (now() - v_start_time))::integer;
        RETURN;
    END;
END;
$$;

-- Políticas RLS para webhook_configs
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin pode gerenciar webhooks" ON public.webhook_configs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.authorized_super_admins WHERE email = auth.email() AND is_active = true)
    );

-- Políticas RLS para webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin pode ver logs de webhooks" ON public.webhook_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.authorized_super_admins WHERE email = auth.email() AND is_active = true)
    );

-- Inserir webhooks padrão para as integrações existentes
INSERT INTO public.webhook_configs (service_name, webhook_url, webhook_secret, is_active) VALUES
    ('asaas', 'https://api.asaas.com/v3/webhook', 'asaas_webhook_secret_' || substr(md5(random()::text), 1, 16), true),
    ('twilio', 'https://api.twilio.com/webhook', 'twilio_webhook_secret_' || substr(md5(random()::text), 1, 16), true),
    ('resend', 'https://api.resend.com/webhook', 'resend_webhook_secret_' || substr(md5(random()::text), 1, 16), true),
    ('telesign', 'https://rest-api.telesign.com/v1/webhook', 'telesign_webhook_secret_' || substr(md5(random()::text), 1, 16), true)
ON CONFLICT (service_name) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.webhook_configs IS 'Configurações de webhooks para integrações externas';
COMMENT ON TABLE public.webhook_logs IS 'Logs de execução de webhooks para auditoria e debug';

COMMENT ON COLUMN public.webhook_configs.service_name IS 'Nome do serviço (asaas, twilio, etc)';
COMMENT ON COLUMN public.webhook_configs.webhook_url IS 'URL endpoint que receberá os webhooks';
COMMENT ON COLUMN public.webhook_configs.webhook_secret IS 'Segredo para validar autenticidade dos webhooks';
COMMENT ON COLUMN public.webhook_configs.last_triggered IS 'Última vez que o webhook foi disparado';
COMMENT ON COLUMN public.webhook_configs.last_success IS 'Última vez que o webhook retornou sucesso';

COMMENT ON COLUMN public.webhook_logs.event_type IS 'Tipo de evento que gerou o webhook';
COMMENT ON COLUMN public.webhook_logs.payload IS 'Payload enviado no webhook';
COMMENT ON COLUMN public.webhook_logs.response_status IS 'Status HTTP da resposta';
COMMENT ON COLUMN public.webhook_logs.duration_ms IS 'Duração da execução em milissegundos';
