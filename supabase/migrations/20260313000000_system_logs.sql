-- Criar tabela para logs de sistema
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('ERROR', 'WARN', 'INFO', 'DEBUG')),
  component TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  route TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Super admins can view all logs" ON public.system_logs
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "System can insert logs" ON public.system_logs
  FOR INSERT WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_component ON public.system_logs(component);
CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);

-- Função RPC para inserir logs (evita problemas de RLS)
CREATE OR REPLACE FUNCTION public.insert_system_log(
  p_level TEXT,
  p_component TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_route TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.system_logs (
    level,
    component,
    message,
    data,
    route,
    user_id,
    user_agent,
    ip_address
  ) VALUES (
    p_level,
    p_component,
    p_message,
    p_data,
    p_route,
    p_user_id,
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', ''),
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', '')
  );
END;
$$;

-- Função para limpar logs antigos (manter apenas 30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_system_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.system_logs
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Agendar limpeza (se suportado pelo Supabase)
-- SELECT cron.schedule('cleanup-system-logs', '0 2 * * *', 'SELECT public.cleanup_old_system_logs();');
