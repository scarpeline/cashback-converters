-- =============================================
-- Migration: Meta Social Integration (Instagram + Facebook)
-- Created: 2026-04-11
-- Status: Pending Meta App Approval
-- =============================================

-- Feature flag para controlar liberação
INSERT INTO public.feature_flags (feature_key, feature_name, description, enabled)
VALUES (
  'meta_social_integration',
  'Integração Instagram & Facebook',
  'Resposta automática a comentários e DMs via Meta Graph API. Requer aprovação da Meta.',
  false
)
ON CONFLICT (feature_key) DO NOTHING;

-- Tabela de contas Meta conectadas por barbershop
CREATE TABLE IF NOT EXISTS public.meta_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  account_id text NOT NULL,           -- ID da conta/página na Meta
  account_name text,
  account_username text,
  account_picture_url text,
  access_token text NOT NULL,         -- Token de acesso (criptografado em prod)
  token_expires_at timestamptz,
  page_id text,                       -- ID da página do Facebook vinculada
  instagram_business_id text,         -- ID do Instagram Business
  is_active boolean DEFAULT true,
  connected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de automações de comentários
CREATE TABLE IF NOT EXISTS public.meta_comment_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.meta_social_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  -- Gatilhos
  trigger_keywords text[] DEFAULT '{}',   -- palavras que ativam a automação
  trigger_all_comments boolean DEFAULT false,
  apply_to_posts boolean DEFAULT true,
  apply_to_reels boolean DEFAULT true,
  apply_to_stories boolean DEFAULT false,
  -- Ação: resposta pública no comentário
  reply_comment_enabled boolean DEFAULT true,
  reply_comment_text text,
  reply_comment_include_link boolean DEFAULT false,
  reply_comment_link text,
  -- Ação: DM automático
  send_dm_enabled boolean DEFAULT true,
  dm_text text,
  dm_include_booking_link boolean DEFAULT true,
  -- Estatísticas
  total_triggered integer DEFAULT 0,
  total_replies_sent integer DEFAULT 0,
  total_dms_sent integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Log de eventos processados
CREATE TABLE IF NOT EXISTS public.meta_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  platform text NOT NULL,
  event_type text NOT NULL,           -- 'comment', 'dm', 'mention'
  post_id text,
  comment_id text,
  commenter_id text,
  commenter_name text,
  comment_text text,
  automation_id uuid REFERENCES public.meta_comment_automations(id),
  action_taken text,                  -- 'replied_comment', 'sent_dm', 'ignored'
  response_text text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.meta_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_comment_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage meta accounts" ON public.meta_social_accounts
  FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Owners manage automations" ON public.meta_comment_automations
  FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Owners read events" ON public.meta_webhook_events
  FOR SELECT TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_meta_accounts_barbershop ON public.meta_social_accounts(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_meta_automations_barbershop ON public.meta_comment_automations(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_meta_events_barbershop ON public.meta_webhook_events(barbershop_id);
