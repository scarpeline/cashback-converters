-- Tabela de logs de bloqueio de automação
-- Criada em: 2026-03-12
-- Objetivo: Registrar quando automações são bloqueadas por cliente ter agendamento na semana

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.automation_blocked_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    automation_type text NOT NULL,
    block_reason text NOT NULL,
    barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
    appointment_ids uuid[] DEFAULT '{}', -- IDs dos agendamentos que causaram o bloqueio
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_automation_blocked_logs_client_id 
ON public.automation_blocked_logs(client_id);

CREATE INDEX IF NOT EXISTS idx_automation_blocked_logs_created_at 
ON public.automation_blocked_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_blocked_logs_barbershop_id 
ON public.automation_blocked_logs(barbershop_id);

CREATE INDEX IF NOT EXISTS idx_automation_blocked_logs_automation_type 
ON public.automation_blocked_logs(automation_type);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Adicionar trigger à tabela
DROP TRIGGER IF EXISTS update_automation_blocked_logs_updated_at ON public.automation_blocked_logs;
CREATE TRIGGER update_automation_blocked_logs_updated_at
    BEFORE UPDATE ON public.automation_blocked_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Políticas RLS
ALTER TABLE public.automation_blocked_logs ENABLE ROW LEVEL SECURITY;

-- Política para donos da barbearia verem os logs de sua barbearia
CREATE POLICY "Donos podem ver logs de sua barbearha"
ON public.automation_blocked_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM public.barbershops b
        WHERE b.id = barbershop_id
        AND b.owner_user_id = auth.uid()
    )
);

-- Política para super admin ver todos os logs
CREATE POLICY "Super admin pode ver todos os logs"
ON public.automation_blocked_logs FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Política para o sistema inserir logs (via service role)
CREATE POLICY "Sistema pode inserir logs"
ON public.automation_blocked_logs FOR INSERT
WITH CHECK (auth.uid() IS NULL);

-- Comentários
COMMENT ON TABLE public.automation_blocked_logs IS 'Registra quando automações são bloqueadas por cliente ter agendamento na semana atual';
COMMENT ON COLUMN public.automation_blocked_logs.client_id IS 'ID do cliente que teve a automação bloqueada';
COMMENT ON COLUMN public.automation_blocked_logs.automation_type IS 'Tipo da automação que foi bloqueada';
COMMENT ON COLUMN public.automation_blocked_logs.block_reason IS 'Motivo do bloqueio (ex: cliente possui agendamento na semana atual)';
COMMENT ON COLUMN public.automation_blocked_logs.barbershop_id IS 'ID da barbearia (opcional)';
COMMENT ON COLUMN public.automation_blocked_logs.appointment_ids IS 'Array com IDs dos agendamentos que causaram o bloqueio';
