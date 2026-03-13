-- Migração para Agendamento Recorrente Automático
-- Criada em: 2026-03-11
-- Objetivo: Implementar sistema de agendamentos recorrentes

-- Adicionar campos de recorrência à tabela appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_type TEXT DEFAULT NULL CHECK (recurring_type IN ('weekly', 'biweekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurring_day INTEGER DEFAULT NULL CHECK (recurring_day BETWEEN 1 AND 7), -- 1=domingo, 7=sábado
ADD COLUMN IF NOT EXISTS recurring_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurring_end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurring_parent_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_recurring ON public.appointments(is_recurring, recurring_end_date);
CREATE INDEX IF NOT EXISTS idx_appointments_recurring_parent ON public.appointments(recurring_parent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barbershop_date ON public.appointments(barbershop_id, scheduled_at);

-- Tabela para configurações de recorrência por barbearia
CREATE TABLE IF NOT EXISTS public.recurring_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    max_recurring_days INTEGER DEFAULT 90,
    allow_conflicts BOOLEAN DEFAULT false,
    notify_conflicts BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_recurring_settings_updated_at
    BEFORE UPDATE ON public.recurring_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Função para gerar próximos agendamentos recorrentes
CREATE OR REPLACE FUNCTION public.generate_recurring_appointments()
RETURNS TABLE(
    generated_count INTEGER,
    conflicts_count INTEGER,
    errors TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appointment RECORD;
    v_next_date DATE;
    v_count INTEGER := 0;
    v_conflicts INTEGER := 0;
    v_errors TEXT[] := '{}';
    v_end_date DATE;
    v_settings RECORD;
BEGIN
    -- Buscar todos os agendamentos recorrentes ativos
    FOR v_appointment IN 
        SELECT 
            a.*,
            rs.max_recurring_days,
            rs.allow_conflicts,
            rs.notify_conflicts
        FROM public.appointments a
        LEFT JOIN public.recurring_settings rs ON a.barbershop_id = rs.barbershop_id
        WHERE a.is_recurring = true 
        AND a.recurring_end_date >= CURRENT_DATE
        AND a.status = 'scheduled'
        AND a.auto_generated = false
    LOOP
        -- Calcular data final para geração
        v_end_date := LEAST(
            v_appointment.recurring_end_date,
            CURRENT_DATE + (v_appointment.max_recurring_days || ' days')::INTERVAL::DATE
        );
        
        -- Gerar próximos agendamentos
        v_next_date := CURRENT_DATE;
        
        WHILE v_next_date <= v_end_date LOOP
            -- Calcular próxima data baseada no tipo de recorrência
            CASE v_appointment.recurring_type
                WHEN 'weekly' THEN
                    -- Avançar para o próximo dia da semana correto
                    WHILE EXTRACT(DOW FROM v_next_date)::INTEGER != v_appointment.recurring_day - 1 LOOP
                        v_next_date := v_next_date + 1;
                    END LOOP;
                WHEN 'biweekly' THEN
                    -- Avançar para o próximo dia da semana correto a cada 2 semanas
                    WHILE EXTRACT(DOW FROM v_next_date)::INTEGER != v_appointment.recurring_day - 1 LOOP
                        v_next_date := v_next_date + 1;
                    END LOOP;
                    -- Pular uma semana se não for a primeira ocorrência
                    IF v_next_date > CURRENT_DATE THEN
                        v_next_date := v_next_date + 7;
                    END IF;
                WHEN 'monthly' THEN
                    -- Avançar para o mesmo dia do mês
                    IF EXTRACT(DAY FROM v_next_date) > EXTRACT(DAY FROM v_appointment.scheduled_at) THEN
                        v_next_date := (v_next_date + INTERVAL '1 month')::DATE;
                    END IF;
                    v_next_date := DATE_TRUNC('month', v_next_date)::DATE + 
                                 (EXTRACT(DAY FROM v_appointment.scheduled_at) - 1 || ' days')::INTERVAL::DATE;
                ELSE
                    v_errors := array_append(v_errors, 'Tipo de recorrência inválido: ' || v_appointment.recurring_type);
                    EXIT;
            END CASE;
            
            -- Verificar se já existe agendamento nesta data/hora
            IF EXISTS (
                SELECT 1 FROM public.appointments 
                WHERE barbershop_id = v_appointment.barbershop_id
                AND professional_id = v_appointment.professional_id
                AND DATE(scheduled_at) = v_next_date
                AND EXTRACT(HOUR FROM scheduled_at) = EXTRACT(HOUR FROM v_appointment.recurring_time)
                AND EXTRACT(MINUTE FROM scheduled_at) = EXTRACT(MINUTE FROM v_appointment.recurring_time)
                AND status != 'cancelled'
            ) THEN
                v_conflicts := v_conflicts + 1;
                
                -- Notificar sobre conflito se configurado
                IF v_appointment.notify_conflicts THEN
                    INSERT INTO public.notifications (
                        user_id, 
                        title, 
                        message, 
                        type, 
                        priority,
                        data
                    ) VALUES (
                        v_appointment.client_user_id,
                        'Conflito de Agendamento Recorrente',
                        'Seu agendamento recorrente para ' || TO_CHAR(v_next_date, 'DD/MM/YYYY') || ' conflitou com outro horário.',
                        'warning',
                        'high',
                        json_build_object(
                            'appointment_id', v_appointment.id,
                            'conflict_date', v_next_date,
                            'professional_id', v_appointment.professional_id
                        )
                    );
                END IF;
                
                -- Se não permite conflitos, parar geração para este agendamento
                IF NOT v_appointment.allow_conflicts THEN
                    EXIT;
                END IF;
            ELSE
                -- Criar novo agendamento
                INSERT INTO public.appointments (
                    barbershop_id,
                    professional_id,
                    service_id,
                    client_user_id,
                    client_name,
                    client_whatsapp,
                    scheduled_at,
                    status,
                    notes,
                    is_recurring,
                    recurring_type,
                    recurring_day,
                    recurring_time,
                    recurring_end_date,
                    recurring_parent_id,
                    auto_generated,
                    created_at,
                    updated_at
                ) VALUES (
                    v_appointment.barbershop_id,
                    v_appointment.professional_id,
                    v_appointment.service_id,
                    v_appointment.client_user_id,
                    v_appointment.client_name,
                    v_appointment.client_whatsapp,
                    v_next_date || ' ' || v_appointment.recurring_time,
                    'scheduled',
                    'Agendamento recorrente gerado automaticamente',
                    true,
                    v_appointment.recurring_type,
                    v_appointment.recurring_day,
                    v_appointment.recurring_time,
                    v_appointment.recurring_end_date,
                    v_appointment.id,
                    true,
                    now(),
                    now()
                );
                
                v_count := v_count + 1;
                
                -- Notificar cliente sobre novo agendamento
                INSERT INTO public.notifications (
                    user_id, 
                    title, 
                    message, 
                    type, 
                    priority,
                    data
                ) VALUES (
                    v_appointment.client_user_id,
                    'Novo Agendamento Recorrente',
                    'Seu agendamento recorrente foi criado para ' || TO_CHAR(v_next_date, 'DD/MM/YYYY') || ' às ' || v_appointment.recurring_time,
                    'info',
                    'normal',
                    json_build_object(
                        'appointment_id', v_appointment.id,
                        'new_date', v_next_date,
                        'time', v_appointment.recurring_time
                    )
                );
            END IF;
            
            -- Avançar para próxima data
            CASE v_appointment.recurring_type
                WHEN 'weekly' THEN
                    v_next_date := v_next_date + 7;
                WHEN 'biweekly' THEN
                    v_next_date := v_next_date + 14;
                WHEN 'monthly' THEN
                    v_next_date := v_next_date + INTERVAL '1 month';
            END CASE;
            
            -- Evitar loop infinito
            IF v_next_date > v_end_date THEN
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN QUERY SELECT v_count, v_conflicts, v_errors;
END;
$$;

-- Função para cancelar todos os agendamentos futuros de uma série recorrente
CREATE OR REPLACE FUNCTION public.cancel_recurring_series(
    p_parent_appointment_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cancelled_count INTEGER := 0;
BEGIN
    -- Cancelar todos os agendamentos gerados automaticamente
    UPDATE public.appointments 
    SET status = 'cancelled', updated_at = now()
    WHERE recurring_parent_id = p_parent_appointment_id
    AND auto_generated = true
    AND scheduled_at > CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;
    
    -- Cancelar também o agendamento pai se estiver no futuro
    UPDATE public.appointments 
    SET status = 'cancelled', updated_at = now()
    WHERE id = p_parent_appointment_id
    AND scheduled_at > CURRENT_TIMESTAMP;
    
    IF FOUND THEN
        v_cancelled_count := v_cancelled_count + 1;
    END IF;
    
    RETURN v_cancelled_count;
END;
$$;

-- Políticas RLS
ALTER TABLE public.recurring_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem gerenciar configurações de recorrência" ON public.recurring_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops 
            WHERE id = barbershop_id 
            AND owner_user_id = auth.uid()
        )
    );

-- Inserir configurações padrão para barbearias existentes
INSERT INTO public.recurring_settings (barbershop_id, max_recurring_days, allow_conflicts, notify_conflicts)
SELECT id, 90, false, true
FROM public.barbershops
WHERE id NOT IN (SELECT barbershop_id FROM public.recurring_settings)
ON CONFLICT (barbershop_id) DO NOTHING;

-- Comentários
COMMENT ON COLUMN public.appointments.is_recurring IS 'Indica se este é um agendamento recorrente';
COMMENT ON COLUMN public.appointments.recurring_type IS 'Tipo de recorrência: weekly, biweekly, monthly';
COMMENT ON COLUMN public.appointments.recurring_day IS 'Dia da semana para recorrência (1=domingo, 7=sábado)';
COMMENT ON COLUMN public.appointments.recurring_time IS 'Horário fixo para agendamentos recorrentes';
COMMENT ON COLUMN public.appointments.recurring_end_date IS 'Data final para geração automática';
COMMENT ON COLUMN public.appointments.recurring_parent_id IS 'Referência ao agendamento pai da série';
COMMENT ON COLUMN public.appointments.auto_generated IS 'Indica se foi gerado automaticamente pelo sistema';

COMMENT ON TABLE public.recurring_settings IS 'Configurações de agendamentos recorrentes por barbearia';
COMMENT ON COLUMN public.recurring_settings.max_recurring_days IS 'Máximo de dias para gerar agendamentos futuros';
COMMENT ON COLUMN public.recurring_settings.allow_conflicts IS 'Permitir geração mesmo com conflitos de horário';
COMMENT ON COLUMN public.recurring_settings.notify_conflicts IS 'Notificar sobre conflitos de agendamento';
