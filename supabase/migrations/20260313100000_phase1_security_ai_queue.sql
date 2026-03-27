-- Migration: Tabelas para módulos da Fase 1
-- Segurança avançada, IA para agendamento, filas assíncronas

-- ===== SECURITY LOGS =====
CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_ip text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent text,
  endpoint text,
  details jsonb DEFAULT '{}'::jsonb,
  fingerprint text,
  blocked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view security logs"
ON public.security_logs FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Authenticated can insert security logs"
ON public.security_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Deny anon access to security logs"
ON public.security_logs FOR SELECT
TO anon
USING (false);

CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX idx_security_logs_user_id ON public.security_logs(user_id);

-- ===== AI INTERACTIONS =====
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_phone text NOT NULL,
  intent text NOT NULL,
  input_text text NOT NULL,
  response_text text NOT NULL,
  success boolean DEFAULT false,
  processing_time_ms integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all AI interactions"
ON public.ai_interactions FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Barbershop owners can view their AI interactions"
ON public.ai_interactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.barbershops 
    WHERE id = ai_interactions.barbershop_id 
    AND owner_user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated can insert AI interactions"
ON public.ai_interactions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Deny anon access to AI interactions"
ON public.ai_interactions FOR SELECT
TO anon
USING (false);

CREATE INDEX idx_ai_interactions_barbershop ON public.ai_interactions(barbershop_id);
CREATE INDEX idx_ai_interactions_created_at ON public.ai_interactions(created_at DESC);
CREATE INDEX idx_ai_interactions_intent ON public.ai_interactions(intent);

-- ===== QUEUE JOBS =====
CREATE TABLE IF NOT EXISTS public.queue_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.queue_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage queue jobs"
ON public.queue_jobs FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Authenticated can insert queue jobs"
ON public.queue_jobs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Deny anon access to queue jobs"
ON public.queue_jobs FOR SELECT
TO anon
USING (false);

CREATE INDEX idx_queue_jobs_status ON public.queue_jobs(status);
CREATE INDEX idx_queue_jobs_priority ON public.queue_jobs(priority);
CREATE INDEX idx_queue_jobs_type ON public.queue_jobs(type);
CREATE INDEX idx_queue_jobs_created_at ON public.queue_jobs(created_at DESC);
CREATE INDEX idx_queue_jobs_scheduled_for ON public.queue_jobs(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Triggers de updated_at (não necessário para logs, mas sim para queue)
CREATE TRIGGER update_queue_jobs_updated_at 
BEFORE UPDATE ON public.queue_jobs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===== FEATURE FLAGS para os novos módulos =====
INSERT INTO public.feature_flags (feature_key, feature_name, description, enabled)
VALUES
  ('security_dashboard', 'Dashboard de Segurança', 'Painel com logs de segurança no admin', false),
  ('ai_whatsapp_booking', 'IA WhatsApp Agendamento', 'Agendamento automático via IA no WhatsApp', false),
  ('advanced_analytics', 'Analytics Avançado', 'Métricas avançadas de faturamento, retenção e ocupação', false),
  ('async_queue', 'Filas Assíncronas', 'Processamento em background via sistema de filas', false)
ON CONFLICT (feature_key) DO NOTHING;
