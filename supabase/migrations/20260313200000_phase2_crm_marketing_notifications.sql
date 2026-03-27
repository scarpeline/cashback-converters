-- Migration: Tabelas para módulos da Fase 2
-- Marketing, CRM inteligente e otimização de agenda

-- ===== MARKETING CAMPAIGNS =====
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'custom',
  channel text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'paused')),
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  target_criteria jsonb DEFAULT '{}'::jsonb,
  scheduled_for timestamptz,
  sent_count integer DEFAULT 0,
  open_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbershop owners can manage their campaigns"
ON public.marketing_campaigns FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbershops 
    WHERE id = marketing_campaigns.barbershop_id 
    AND owner_user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all campaigns"
ON public.marketing_campaigns FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE INDEX idx_marketing_campaigns_barbershop ON public.marketing_campaigns(barbershop_id);
CREATE INDEX idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_scheduled ON public.marketing_campaigns(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- ===== CLIENT PROFILES (CRM) =====
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  email text,
  tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'vip')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('active', 'at_risk', 'inactive', 'lost', 'new')),
  total_visits integer DEFAULT 0,
  total_spent numeric(12,2) DEFAULT 0,
  average_ticket numeric(12,2) DEFAULT 0,
  last_visit_at timestamptz,
  first_visit_at timestamptz,
  favorite_service_id uuid,
  favorite_professional_id uuid,
  visit_frequency_days integer DEFAULT 30,
  birthday date,
  notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbershop owners can manage client profiles"
ON public.client_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbershops 
    WHERE id = client_profiles.barbershop_id 
    AND owner_user_id = auth.uid()
  )
);

CREATE POLICY "Client can view own profile"
ON public.client_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all client profiles"
ON public.client_profiles FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE INDEX idx_client_profiles_barbershop ON public.client_profiles(barbershop_id);
CREATE INDEX idx_client_profiles_tier ON public.client_profiles(tier);
CREATE INDEX idx_client_profiles_status ON public.client_profiles(status);
CREATE INDEX idx_client_profiles_birthday ON public.client_profiles(birthday);
CREATE INDEX idx_client_profiles_user_id ON public.client_profiles(user_id);

-- ===== NOTIFICATION TEMPLATES =====
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  channel text NOT NULL DEFAULT 'push',
  title_template text NOT NULL DEFAULT '',
  body_template text NOT NULL DEFAULT '',
  variables text[] DEFAULT '{}',
  enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbershop owners can manage notification templates"
ON public.notification_templates FOR ALL
TO authenticated
USING (
  barbershop_id IS NULL OR EXISTS (
    SELECT 1 FROM public.barbershops 
    WHERE id = notification_templates.barbershop_id 
    AND owner_user_id = auth.uid()
  )
);

CREATE POLICY "Super admins manage all templates"
ON public.notification_templates FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE INDEX idx_notification_templates_barbershop ON public.notification_templates(barbershop_id);
CREATE INDEX idx_notification_templates_trigger ON public.notification_templates(trigger_type);

-- ===== FEATURE FLAGS para Fase 2 =====
INSERT INTO public.feature_flags (feature_key, feature_name, description, enabled)
VALUES
  ('crm_intelligent', 'CRM Inteligente', 'Ranking de clientes, segmentação e perfil CRM', false),
  ('marketing_automation', 'Marketing Automático', 'Campanhas automáticas: aniversário, reativação, slots vazios', false),
  ('agenda_optimization', 'Otimização de Agenda', 'Detecção de gaps, previsão de cancelamento, sugestões IA', false),
  ('notification_templates', 'Templates de Notificação', 'Templates customizáveis por barbearia', false)
ON CONFLICT (feature_key) DO NOTHING;

-- ===== TRIGGERS =====
CREATE TRIGGER update_marketing_campaigns_updated_at 
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_client_profiles_updated_at 
BEFORE UPDATE ON public.client_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
