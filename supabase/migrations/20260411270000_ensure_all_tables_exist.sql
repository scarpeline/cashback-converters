-- =============================================
-- Migration: Ensure all new tables exist
-- Created: 2026-04-11
-- Garante que todas as tabelas criadas hoje existam
-- =============================================

-- 1. contas_financeiras (Contas a Pagar/Receber)
CREATE TABLE IF NOT EXISTS public.contas_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  descricao text NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0),
  vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  categoria text NOT NULL DEFAULT 'Outros',
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage contas" ON public.contas_financeiras;
CREATE POLICY "Owners manage contas" ON public.contas_financeiras
  FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

-- 2. fichas_anamnese
CREATE TABLE IF NOT EXISTS public.fichas_anamnese (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  cliente_nome text NOT NULL,
  cliente_telefone text,
  data_nascimento date,
  alergias text,
  medicamentos text,
  condicoes_saude text,
  observacoes text,
  assinatura_digital boolean DEFAULT false,
  assinado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fichas_anamnese ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage fichas" ON public.fichas_anamnese;
CREATE POLICY "Owners manage fichas" ON public.fichas_anamnese
  FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

-- 3. whatsapp_connections
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  nickname text NOT NULL DEFAULT 'WhatsApp',
  phone_number text NOT NULL,
  connection_type text NOT NULL DEFAULT 'web' CHECK (connection_type IN ('web', 'api')),
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
  is_primary boolean DEFAULT false,
  send_mode text DEFAULT 'fixed' CHECK (send_mode IN ('fixed', 'alternate')),
  qr_code text,
  twilio_sid text,
  twilio_auth_token text,
  twilio_phone text,
  notify_disconnect boolean DEFAULT true,
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage connections" ON public.whatsapp_connections;
CREATE POLICY "Owners manage connections" ON public.whatsapp_connections
  FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

-- 4. sms_config
CREATE TABLE IF NOT EXISTS public.sms_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL UNIQUE REFERENCES public.barbershops(id) ON DELETE CASCADE,
  agendamento_enabled boolean DEFAULT false,
  agendamento_horas integer DEFAULT 4,
  agendamento_msg text DEFAULT 'Ola @CLIENTE, voce tem @NOMESERVICO com @NOMEEMPRESA, dia @DIA as @HORA com @NOMEPROFISSIONAL.',
  retorno_enabled boolean DEFAULT false,
  retorno_dias integer DEFAULT 7,
  retorno_msg text DEFAULT 'Ola @CLIENTE, seu retorno de @NOMESERVICO se aproxima. Garanta ja seu horario acessando nossa Agenda Online.',
  aniversario_enabled boolean DEFAULT false,
  aniversario_msg text DEFAULT 'Ola @CLIENTE, hoje eh o seu dia, feliz aniversario! Desejamos muita saude, paz e sabedoria. Equipe @NOMEEMPRESA.',
  saldo_sms integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage sms_config" ON public.sms_config;
CREATE POLICY "Owners manage sms_config" ON public.sms_config
  FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

-- 5. integration_tokens
CREATE TABLE IF NOT EXISTS public.integration_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Token de Integração',
  permissions text[] NOT NULL DEFAULT ARRAY['booking:create', 'booking:read', 'services:read'],
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage tokens" ON public.integration_tokens;
CREATE POLICY "Owners manage tokens" ON public.integration_tokens
  FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));
DROP POLICY IF EXISTS "Public read active tokens" ON public.integration_tokens;
CREATE POLICY "Public read active tokens" ON public.integration_tokens
  FOR SELECT TO anon USING (is_active = true);

-- 6. integration_token_logs
CREATE TABLE IF NOT EXISTS public.integration_token_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES public.integration_tokens(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_token_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read logs" ON public.integration_token_logs;
CREATE POLICY "Owners read logs" ON public.integration_token_logs
  FOR SELECT TO authenticated
  USING (token_id IN (
    SELECT id FROM public.integration_tokens
    WHERE barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  ));

-- 7. Colunas extras em appointments (source tracking)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS source text DEFAULT 'direct';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS source_token_id uuid REFERENCES public.integration_tokens(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS source_metadata jsonb;

-- 8. max_professionals em subscription_plans
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS max_professionals INTEGER DEFAULT 1;
UPDATE public.subscription_plans SET max_professionals = CASE
  WHEN name ILIKE '%trial%' THEN 1
  WHEN name ILIKE '%mensal%' THEN 3
  WHEN name ILIKE '%trimestral%' THEN 5
  WHEN name ILIKE '%semestral%' THEN 10
  WHEN name ILIKE '%anual%' THEN NULL
  ELSE 1
END WHERE max_professionals = 1 OR max_professionals IS NULL;

-- 9. meta_social_accounts
CREATE TABLE IF NOT EXISTS public.meta_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  account_id text NOT NULL,
  account_name text,
  account_username text,
  account_picture_url text,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  page_id text,
  instagram_business_id text,
  is_active boolean DEFAULT true,
  connected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meta_social_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage meta accounts" ON public.meta_social_accounts;
CREATE POLICY "Owners manage meta accounts" ON public.meta_social_accounts
  FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

-- 10. meta_comment_automations
CREATE TABLE IF NOT EXISTS public.meta_comment_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.meta_social_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  trigger_keywords text[] DEFAULT '{}',
  trigger_all_comments boolean DEFAULT false,
  apply_to_posts boolean DEFAULT true,
  apply_to_reels boolean DEFAULT true,
  apply_to_stories boolean DEFAULT false,
  reply_comment_enabled boolean DEFAULT true,
  reply_comment_text text,
  reply_comment_include_link boolean DEFAULT false,
  reply_comment_link text,
  send_dm_enabled boolean DEFAULT true,
  dm_text text,
  dm_include_booking_link boolean DEFAULT true,
  total_triggered integer DEFAULT 0,
  total_replies_sent integer DEFAULT 0,
  total_dms_sent integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meta_comment_automations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage automations" ON public.meta_comment_automations;
CREATE POLICY "Owners manage automations" ON public.meta_comment_automations
  FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

-- 11. meta_webhook_events
CREATE TABLE IF NOT EXISTS public.meta_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  platform text NOT NULL,
  event_type text NOT NULL,
  post_id text,
  comment_id text,
  commenter_id text,
  commenter_name text,
  comment_text text,
  automation_id uuid REFERENCES public.meta_comment_automations(id),
  action_taken text,
  response_text text,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meta_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read events" ON public.meta_webhook_events;
CREATE POLICY "Owners read events" ON public.meta_webhook_events
  FOR SELECT TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

-- Feature flag para Meta (desativado por padrão)
INSERT INTO public.feature_flags (feature_key, feature_name, description, enabled)
VALUES ('meta_social_integration', 'Integração Instagram & Facebook', 'Resposta automática a comentários e DMs via Meta Graph API.', false)
ON CONFLICT (feature_key) DO NOTHING;

-- Índices gerais
CREATE INDEX IF NOT EXISTS idx_contas_barbershop ON public.contas_financeiras(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_fichas_barbershop ON public.fichas_anamnese(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_wa_connections_barbershop ON public.whatsapp_connections(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_integration_tokens_token ON public.integration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_meta_accounts_barbershop ON public.meta_social_accounts(barbershop_id);
