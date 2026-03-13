-- Tabela de auditoria de segurança
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  target_user_id UUID,
  performed_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON public.security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_performed_by ON public.security_audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);

-- Políticas de segurança
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas super admins podem ver logs
CREATE POLICY "Super admins can view security logs" ON public.security_audit_logs
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- Ninguém pode inserir diretamente (apelas funções)
CREATE POLICY "Deny direct insert to security logs" ON public.security_audit_logs
  FOR INSERT WITH CHECK (false);

-- Ninguém pode atualizar diretamente
CREATE POLICY "Deny direct update to security logs" ON public.security_audit_logs
  FOR UPDATE USING (false);

-- Ninguém pode deletar diretamente
CREATE POLICY "Deny direct delete to security logs" ON public.security_audit_logs
  FOR DELETE USING (false);
