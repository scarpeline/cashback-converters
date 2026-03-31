-- ============================================================
-- AUDIT SYSTEM — Monitoramento de ações administrativas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    barbershop_id UUID REFERENCES public.barbershops(id),
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'SENSITIVE_ACCESS'
    table_name TEXT,
    record_id UUID,
    old_data JSONB DEFAULT '{}',
    new_data JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas super_admin pode ver TODOS os logs
DROP POLICY IF EXISTS "SuperAdmins can view all logs" ON public.audit_logs;
CREATE POLICY "SuperAdmins can view all logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Donos podem ver logs do seu próprio salão
DROP POLICY IF EXISTS "Owners can view own barbershop logs" ON public.audit_logs;
CREATE POLICY "Owners can view own barbershop logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.id = audit_logs.barbershop_id
          AND b.owner_user_id = auth.uid()
    )
);

-- Bloquear escrita direta via API (apenas via triggers ou funções controladas)
DROP POLICY IF EXISTS "No direct insert into audit_logs" ON public.audit_logs;
CREATE POLICY "No direct insert into audit_logs" ON public.audit_logs
FOR INSERT WITH CHECK (false);

-- ============================================================
-- Função Automatizada de Auditoria (Generic Trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_barbershop_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Tenta encontrar o barbershop_id no registro
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            v_barbershop_id := OLD.barbershop_id;
        ELSE
            v_barbershop_id := NEW.barbershop_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_barbershop_id := NULL;
    END;

    INSERT INTO public.audit_logs (
        user_id,
        barbershop_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        v_user_id,
        v_barbershop_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE '{}' END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE '{}' END
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Aplicar Auditoria em tabelas críticas
-- ============================================================

-- Financeiro
DROP TRIGGER IF EXISTS audit_financial_transactions ON public.financial_transactions;
CREATE TRIGGER audit_financial_transactions
AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Profissionais
DROP TRIGGER IF EXISTS audit_professionals ON public.professionals;
CREATE TRIGGER audit_professionals
AFTER INSERT OR UPDATE OR DELETE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Serviços
DROP TRIGGER IF EXISTS audit_services ON public.services;
CREATE TRIGGER audit_services
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

COMMENT ON TABLE public.audit_logs IS 'Trilha de auditoria para ações críticas no sistema.';
