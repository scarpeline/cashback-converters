-- Atualização do Token do Webhook ASAAS
-- Criada em: 2026-03-11
-- Objetivo: Atualizar o token do webhook do ASAAS para o novo token fornecido

-- Atualizar o webhook_secret do ASAAS na tabela webhook_configs
UPDATE public.webhook_configs 
SET 
    webhook_secret = 'whsec_mrSRd1SUymPnGW2VnnKcoXZIFdOd6j4hvvQPT_lH4NU',
    updated_at = now(),
    last_error = null,
    retry_count = 0
WHERE service_name = 'asaas';

-- Se não existir registro, inserir com o novo token
INSERT INTO public.webhook_configs (
    service_name, 
    webhook_url, 
    webhook_secret, 
    is_active
) VALUES (
    'asaas',
    'https://api.asaas.com/v3/webhook',
    'whsec_mrSRd1SUymPnGW2VnnKcoXZIFdOd6j4hvvQPT_lH4NU',
    true
) ON CONFLICT (service_name) DO UPDATE SET
    webhook_secret = EXCLUDED.webhook_secret,
    updated_at = now(),
    last_error = null,
    retry_count = 0;

-- Log da atualização para auditoria
INSERT INTO public.webhook_logs (
    webhook_config_id,
    event_type,
    payload,
    response_status,
    response_body,
    duration_ms
) 
SELECT 
    wc.id,
    'token_updated',
    json_build_object('old_secret', 'updated', 'new_secret', 'whsec_mrSRd1SUymPnGW2VnnKcoXZIFdOd6j4hvvQPT_lH4NU'),
    200,
    'Webhook secret updated successfully',
    0
FROM public.webhook_configs wc 
WHERE wc.service_name = 'asaas';

-- Comentário sobre a atualização
COMMENT ON COLUMN public.webhook_configs.webhook_secret IS 'Segredo para validar autenticidade dos webhooks - Atualizado em 2026-03-11';
