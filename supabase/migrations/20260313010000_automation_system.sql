-- Sistema de Automação de Reativação de Usuários

-- Tabela de configuração de inatividade por perfil
CREATE TABLE IF NOT EXISTS public.inactivity_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_role app_role NOT NULL,
  inactivity_days INTEGER NOT NULL DEFAULT 30,
  is_enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_role)
);

-- Tabela de modelos de mensagens personalizáveis
CREATE TABLE IF NOT EXISTS public.automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  user_role app_role NOT NULL,
  subject TEXT, -- Para email
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- Variáveis disponíveis: {nome}, {dias_inativo}, {link_reativacao}, etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de rastreamento de inatividade
CREATE TABLE IF NOT EXISTS public.user_inactivity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role app_role NOT NULL,
  last_login TIMESTAMPTZ NOT NULL,
  inactivity_days INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'inactive', 'reactivated', 'subscribed')),
  last_notification_at TIMESTAMPTZ,
  notification_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de log de envios de automação
CREATE TABLE IF NOT EXISTS public.automation_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.automation_templates(id),
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL, -- Email ou telefone
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'opened', 'clicked')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de permissões de automação
CREATE TABLE IF NOT EXISTS public.automation_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_role app_role NOT NULL,
  can_configure_inactivity BOOLEAN DEFAULT false,
  can_create_templates BOOLEAN DEFAULT false,
  can_view_logs BOOLEAN DEFAULT false,
  can_manage_automation BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_role)
);

-- Habilitar RLS
ALTER TABLE public.inactivity_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inactivity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Inactivity Settings
CREATE POLICY "Super admins can manage inactivity settings" ON public.inactivity_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view inactivity settings" ON public.inactivity_settings
  FOR SELECT USING (true);

-- Automation Templates
CREATE POLICY "Super admins can manage templates" ON public.automation_templates
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view active templates" ON public.automation_templates
  FOR SELECT USING (is_active = true);

-- User Inactivity Tracking
CREATE POLICY "Super admins can view all tracking" ON public.user_inactivity_tracking
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own tracking" ON public.user_inactivity_tracking
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can update tracking" ON public.user_inactivity_tracking
  FOR UPDATE WITH CHECK (true);

-- Automation Send Log
CREATE POLICY "Super admins can view all logs" ON public.automation_send_log
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "System can insert logs" ON public.automation_send_log
  FOR INSERT WITH CHECK (true);

-- Automation Permissions
CREATE POLICY "Super admins can manage permissions" ON public.automation_permissions
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view permissions" ON public.automation_permissions
  FOR SELECT USING (true);

-- Índices para performance
CREATE INDEX idx_inactivity_settings_role ON public.inactivity_settings(user_role);
CREATE INDEX idx_automation_templates_role_channel ON public.automation_templates(user_role, channel);
CREATE INDEX idx_user_inactivity_tracking_status ON public.user_inactivity_tracking(status);
CREATE INDEX idx_user_inactivity_tracking_last_login ON public.user_inactivity_tracking(last_login DESC);
CREATE INDEX idx_automation_send_log_user_id ON public.automation_send_log(user_id);
CREATE INDEX idx_automation_send_log_status ON public.automation_send_log(status);
CREATE INDEX idx_automation_send_log_sent_at ON public.automation_send_log(sent_at DESC);

-- Função para atualizar tracking de inatividade
CREATE OR REPLACE FUNCTION public.update_user_inactivity_tracking(
  p_user_id UUID,
  p_last_login TIMESTAMPTZ,
  p_user_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_inactivity_tracking (
    user_id, user_role, last_login, inactivity_days, status
  ) VALUES (
    p_user_id, p_user_role, p_last_login, 0, 'active'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    last_login = p_last_login,
    inactivity_days = 0,
    status = 'reactivated',
    updated_at = now();
END;
$$;

-- Função para processar inatividade diária
CREATE OR REPLACE FUNCTION public.process_daily_inactivity()
RETURNS TABLE(
  user_id UUID,
  user_role app_role,
  inactivity_days INTEGER,
  status TEXT,
  should_notify BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_record RECORD;
BEGIN
  -- Atualizar dias de inatividade para todos os usuários
  UPDATE public.user_inactivity_tracking
  SET 
    inactivity_days = CASE 
      WHEN status = 'active' OR status = 'reactivated' THEN 0
      ELSE inactivity_days + 1
    END,
    updated_at = now()
  WHERE last_login < now() - interval '1 day'
  OR (last_login < now() - interval '1 day' AND status = 'reactivated');

  -- Identificar usuários que precisam de notificação
  RETURN QUERY
  SELECT 
    t.user_id,
    t.user_role,
    t.inactivity_days,
    t.status,
    (t.inactivity_days >= s.inactivity_days AND s.is_enabled) as should_notify
  FROM public.user_inactivity_tracking t
  JOIN public.inactivity_settings s ON t.user_role = s.user_role
  WHERE t.status NOT IN ('subscribed', 'inactive')
  AND t.last_login < now() - interval '1 day'
  AND s.is_enabled = true;
END;
$$;

-- Função para registrar envio de automação
CREATE OR REPLACE FUNCTION public.log_automation_send(
  p_user_id UUID,
  p_template_id UUID,
  p_channel TEXT,
  p_recipient TEXT,
  p_status TEXT DEFAULT 'pending',
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.automation_send_log (
    user_id, template_id, channel, recipient, status, error_message, metadata
  ) VALUES (
    p_user_id, p_template_id, p_channel, p_recipient, p_status, p_error_message, p_metadata
  ) RETURNING id INTO log_id;
  
  -- Atualizar contador de notificações do usuário
  UPDATE public.user_inactivity_tracking
  SET 
    notification_count = notification_count + 1,
    last_notification_at = now()
  WHERE user_id = p_user_id;
  
  RETURN log_id;
END;
$$;

-- Trigger para updated_at
CREATE TRIGGER update_inactivity_settings_updated_at 
  BEFORE UPDATE ON public.inactivity_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_automation_templates_updated_at 
  BEFORE UPDATE ON public.automation_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_inactivity_tracking_updated_at 
  BEFORE UPDATE ON public.user_inactivity_tracking
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_automation_permissions_updated_at 
  BEFORE UPDATE ON public.automation_permissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Inserir configurações padrão
INSERT INTO public.inactivity_settings (user_role, inactivity_days, is_enabled) VALUES
  ('cliente', 30, true),
  ('dono', 15, true),
  ('profissional', 20, true),
  ('afiliado_barbearia', 25, true),
  ('afiliado_saas', 10, true),
  ('contador', 45, true)
ON CONFLICT (user_role) DO NOTHING;

-- Inserir permissões padrão
INSERT INTO public.automation_permissions (user_role, can_configure_inactivity, can_create_templates, can_view_logs, can_manage_automation) VALUES
  ('super_admin', true, true, true, true),
  ('dono', false, false, true, false)
ON CONFLICT (user_role) DO NOTHING;
