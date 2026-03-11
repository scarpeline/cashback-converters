-- Migração para Comissões de Profissionais e Métricas Diárias
-- Criada em: 2026-03-12
-- Objetivo: Implementar sistema de comissões automáticas e métricas de negócio

-- Tabela de comissões de profissionais
CREATE TABLE IF NOT EXISTS public.professional_commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    commission_percent numeric(5,2) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
    commission_amount numeric(10,2) NOT NULL CHECK (commission_amount >= 0),
    total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at timestamptz,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Restrição para evitar comissões duplicadas
    UNIQUE(appointment_id)
);

-- Tabela de métricas diárias da barbearia
CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    date date NOT NULL,
    revenue numeric(12,2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
    services_count integer NOT NULL DEFAULT 0 CHECK (services_count >= 0),
    appointments_count integer NOT NULL DEFAULT 0 CHECK (appointments_count >= 0),
    clients_count integer NOT NULL DEFAULT 0 CHECK (clients_count >= 0),
    cash_revenue numeric(12,2) NOT NULL DEFAULT 0 CHECK (cash_revenue >= 0),
    pix_revenue numeric(12,2) NOT NULL DEFAULT 0 CHECK (pix_revenue >= 0),
    card_revenue numeric(12,2) NOT NULL DEFAULT 0 CHECK (card_revenue >= 0),
    commission_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (commission_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Restrição para evitar registros duplicados
    UNIQUE(barbershop_id, date)
);

-- Tabela de notificações pós-atendimento
CREATE TABLE IF NOT EXISTS public.post_appointment_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    professional_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type text NOT NULL CHECK (notification_type IN ('finalization_reminder', 'cancellation_request')),
    sent_at timestamptz,
    acknowledged_at timestamptz,
    action_taken text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_professional_commissions_professional_id ON public.professional_commissions(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_commissions_appointment_id ON public.professional_commissions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_professional_commissions_status ON public.professional_commissions(status);
CREATE INDEX IF NOT EXISTS idx_professional_commissions_created_at ON public.professional_commissions(created_at);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_barbershop_id ON public.daily_metrics(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_barbershop_date ON public.daily_metrics(barbershop_id, date);

CREATE INDEX IF NOT EXISTS idx_post_appointment_notifications_appointment_id ON public.post_appointment_notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_post_appointment_notifications_professional_id ON public.post_appointment_notifications(professional_id);
CREATE INDEX IF NOT EXISTS idx_post_appointment_notifications_sent_at ON public.post_appointment_notifications(sent_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_professional_commissions_updated_at
    BEFORE UPDATE ON public.professional_commissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_daily_metrics_updated_at
    BEFORE UPDATE ON public.daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_post_appointment_notifications_updated_at
    BEFORE UPDATE ON public.post_appointment_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RPC para atualizar métricas diárias
CREATE OR REPLACE FUNCTION public.update_daily_metrics(
    p_barbershop_id uuid,
    p_date date,
    p_revenue numeric DEFAULT 0,
    p_services_count integer DEFAULT 0,
    p_appointments_count integer DEFAULT 0,
    p_clients_count integer DEFAULT 0,
    p_cash_revenue numeric DEFAULT 0,
    p_pix_revenue numeric DEFAULT 0,
    p_card_revenue numeric DEFAULT 0,
    p_commission_total numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.daily_metrics (
        barbershop_id,
        date,
        revenue,
        services_count,
        appointments_count,
        clients_count,
        cash_revenue,
        pix_revenue,
        card_revenue,
        commission_total
    ) VALUES (
        p_barbershop_id,
        p_date,
        p_revenue,
        p_services_count,
        p_appointments_count,
        p_clients_count,
        p_cash_revenue,
        p_pix_revenue,
        p_card_revenue,
        p_commission_total
    )
    ON CONFLICT (barbershop_id, date)
    DO UPDATE SET
        revenue = daily_metrics.revenue + p_revenue,
        services_count = daily_metrics.services_count + p_services_count,
        appointments_count = daily_metrics.appointments_count + p_appointments_count,
        clients_count = daily_metrics.clients_count + p_clients_count,
        cash_revenue = daily_metrics.cash_revenue + p_cash_revenue,
        pix_revenue = daily_metrics.pix_revenue + p_pix_revenue,
        card_revenue = daily_metrics.card_revenue + p_card_revenue,
        commission_total = daily_metrics.commission_total + p_commission_total,
        updated_at = now();
END;
$$;

-- RPC para calcular comissões do profissional
CREATE OR REPLACE FUNCTION public.calculate_professional_commission(
    p_professional_id uuid,
    p_appointment_id uuid,
    p_payment_id uuid,
    p_total_amount numeric
)
RETURNS TABLE(
    commission_percent numeric,
    commission_amount numeric,
    success boolean,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_commission_percent numeric;
    v_commission_amount numeric;
    v_barbershop_id uuid;
BEGIN
    -- Buscar percentual de comissão do profissional
    SELECT 
        COALESCE(p.commission_percent, 50) as commission_percent,
        p.barbershop_id
    INTO v_commission_percent, v_barbershop_id
    FROM public.professionals p
    WHERE p.id = p_professional_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, 0, false, 'Profissional não encontrado'::text;
        RETURN;
    END IF;
    
    -- Calcular valor da comissão
    v_commission_amount := (p_total_amount * v_commission_percent) / 100;
    
    -- Inserir comissão
    INSERT INTO public.professional_commissions (
        professional_id,
        appointment_id,
        payment_id,
        commission_percent,
        commission_amount,
        total_amount,
        status
    ) VALUES (
        p_professional_id,
        p_appointment_id,
        p_payment_id,
        v_commission_percent,
        v_commission_amount,
        p_total_amount,
        'pending'
    )
    ON CONFLICT (appointment_id) DO NOTHING;
    
    -- Atualizar métricas diárias
    PERFORM public.update_daily_metrics(
        v_barbershop_id,
        CURRENT_DATE,
        p_total_amount,
        1,
        1,
        1,
        0, -- será atualizado conforme método de pagamento
        0,
        0,
        v_commission_amount
    );
    
    RETURN QUERY SELECT 
        v_commission_percent, 
        v_commission_amount, 
        true, 
        'Comissão calculada com sucesso'::text;
    RETURN;
END;
$$;

-- RPC para buscar comissões pendentes do profissional
CREATE OR REPLACE FUNCTION public.get_pending_commissions(p_professional_id uuid)
RETURNS TABLE(
    id uuid,
    appointment_id uuid,
    payment_id uuid,
    commission_percent numeric,
    commission_amount numeric,
    total_amount numeric,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.appointment_id,
        pc.payment_id,
        pc.commission_percent,
        pc.commission_amount,
        pc.total_amount,
        pc.created_at
    FROM public.professional_commissions pc
    WHERE pc.professional_id = p_professional_id
      AND pc.status = 'pending'
    ORDER BY pc.created_at DESC;
END;
$$;

-- RPC para criar notificação pós-atendimento
CREATE OR REPLACE FUNCTION public.create_post_appointment_notification(
    p_appointment_id uuid,
    p_professional_id uuid,
    p_notification_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification_id uuid;
BEGIN
    INSERT INTO public.post_appointment_notifications (
        appointment_id,
        professional_id,
        notification_type
    ) VALUES (
        p_appointment_id,
        p_professional_id,
        p_notification_type
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Políticas RLS para professional_commissions
ALTER TABLE public.professional_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profissionais podem ver suas comissões" ON public.professional_commissions
    FOR SELECT USING (
        auth.uid() = professional_id
    );

CREATE POLICY "Donos podem ver comissões da sua barbearia" ON public.professional_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.professionals p
            JOIN public.barbershops b ON b.id = p.barbershop_id
            WHERE p.id = professional_id
              AND b.user_id = auth.uid()
        )
    );

CREATE POLICY "Super admin pode ver todas comissões" ON public.professional_commissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.authorized_super_admins WHERE email = auth.email() AND is_active = true)
    );

-- Políticas RLS para daily_metrics
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem ver métricas da sua barbearia" ON public.daily_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops b
            WHERE b.id = barbershop_id
              AND b.user_id = auth.uid()
        )
    );

CREATE POLICY "Super admin pode ver todas métricas" ON public.daily_metrics
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.authorized_super_admins WHERE email = auth.email() AND is_active = true)
    );

-- Políticas RLS para post_appointment_notifications
ALTER TABLE public.post_appointment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profissionais podem ver suas notificações" ON public.post_appointment_notifications
    FOR SELECT USING (
        auth.uid() = professional_id
    );

CREATE POLICY "Super admin pode ver todas notificações" ON public.post_appointment_notifications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.authorized_super_admins WHERE email = auth.email() AND is_active = true)
    );

-- Comentários
COMMENT ON TABLE public.professional_commissions IS 'Tabela de comissões de profissionais geradas automaticamente';
COMMENT ON TABLE public.daily_metrics IS 'Métricas diárias das barbearias para relatórios e dashboards';
COMMENT ON TABLE public.post_appointment_notifications IS 'Notificações enviadas após o horário do atendimento';

COMMENT ON COLUMN public.professional_commissions.commission_percent IS 'Percentual de comissão aplicado';
COMMENT ON COLUMN public.professional_commissions.commission_amount IS 'Valor da comissão em reais';
COMMENT ON COLUMN public.professional_commissions.status IS 'Status: pending, paid, cancelled';

COMMENT ON COLUMN public.daily_metrics.revenue IS 'Faturamento total do dia';
COMMENT ON COLUMN public.daily_metrics.services_count IS 'Número de serviços realizados';
COMMENT ON COLUMN public.daily_metrics.cash_revenue IS 'Faturamento em dinheiro';
COMMENT ON COLUMN public.daily_metrics.pix_revenue IS 'Faturamento via PIX';
COMMENT ON COLUMN public.daily_metrics.card_revenue IS 'Faturamento via cartão';
