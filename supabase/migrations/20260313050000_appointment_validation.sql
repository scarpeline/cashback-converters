-- Correção de segurança: Validação robusta de agendamentos
-- Migration para prevenir agendamentos inválidos

-- 1. Função de validação de disponibilidade
CREATE OR REPLACE FUNCTION public.validate_appointment_availability(
  p_professional_id UUID,
  p_service_id UUID,
  p_barbershop_id UUID,
  p_start_time TIMESTAMPTZ,
  p_duration_minutes INTEGER
)
RETURNS TABLE(
  is_available BOOLEAN,
  conflict_reason TEXT,
  conflict_details JSONB
) AS $$
DECLARE
  professional_exists BOOLEAN;
  service_exists BOOLEAN;
  barbershop_exists BOOLEAN;
  working_hours RECORD;
  existing_appointments RECORD;
  professional_services RECORD;
BEGIN
  -- Verificar se profissional existe e está ativo
  SELECT EXISTS(
    SELECT 1 FROM public.professionals p
    WHERE p.id = p_professional_id AND p.is_active = true
  ) INTO professional_exists;
  
  IF NOT professional_exists THEN
    RETURN QUERY SELECT false, 'Profissional não encontrado ou inativo', '{}'::JSONB;
    RETURN;
  END IF;
  
  -- Verificar se serviço existe e está ativo
  SELECT EXISTS(
    SELECT 1 FROM public.services s
    WHERE s.id = p_service_id AND s.is_active = true
  ) INTO service_exists;
  
  IF NOT service_exists THEN
    RETURN QUERY SELECT false, 'Serviço não encontrado ou inativo', '{}'::JSONB;
    RETURN;
  END IF;
  
  -- Verificar se barbearia existe e está ativa
  SELECT EXISTS(
    SELECT 1 FROM public.barbershops b
    WHERE b.id = p_barbershop_id AND b.is_active = true
  ) INTO barbershop_exists;
  
  IF NOT barbershop_exists THEN
    RETURN QUERY SELECT false, 'Barbearia não encontrada ou inativa', '{}'::JSONB;
    RETURN;
  END IF;
  
  -- Verificar se profissional trabalha na barbearia
  SELECT EXISTS(
    SELECT 1 FROM public.professionals p
    WHERE p.id = p_professional_id AND p.barbershop_id = p_barbershop_id
  ) INTO professional_exists;
  
  IF NOT professional_exists THEN
    RETURN QUERY SELECT false, 'Profissional não trabalha nesta barbearia', '{}'::JSONB;
    RETURN;
  END IF;
  
  -- Verificar se serviço pertence à barbearia
  SELECT EXISTS(
    SELECT 1 FROM public.services s
    WHERE s.id = p_service_id AND s.barbershop_id = p_barbershop_id
  ) INTO service_exists;
  
  IF NOT service_exists THEN
    RETURN QUERY SELECT false, 'Serviço não pertence a esta barbearia', '{}'::JSONB;
    RETURN;
  END IF;
  
  -- Verificar se profissional oferece este serviço
  SELECT EXISTS(
    SELECT 1 FROM public.professional_services ps
    WHERE ps.professional_id = p_professional_id AND ps.service_id = p_service_id
  ) INTO professional_exists;
  
  IF NOT professional_exists THEN
    RETURN QUERY SELECT false, 'Profissional não oferece este serviço', '{}'::JSONB;
    RETURN;
  END IF;
  
  -- Verificar horário de funcionamento
  SELECT * INTO working_hours
  FROM public.barbershop_working_hours wh
  WHERE wh.barbershop_id = p_barbershop_id
    AND wh.day_of_week = EXTRACT(DOW FROM p_start_time)
    AND wh.is_open = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Barbearia fechada neste dia', '{}'::JSONB;
    RETURN;
  END IF;
  
  -- Verificar se horário está dentro do funcionamento
  IF p_start_time::TIME < working_hours.open_time OR 
     (p_start_time + (p_duration_minutes || ' minutes')::INTERVAL)::TIME > working_hours.close_time THEN
    RETURN QUERY SELECT false, 'Horário fora do expediente', 
      jsonb_build_object(
        'open_time', working_hours.open_time,
        'close_time', working_hours.close_time,
        'requested_time', p_start_time::TIME,
        'end_time', (p_start_time + (p_duration_minutes || ' minutes')::INTERVAL)::TIME
      );
    RETURN;
  END IF;
  
  -- Verificar conflitos com outros agendamentos
  SELECT * INTO existing_appointments
  FROM public.appointments a
  WHERE a.professional_id = p_professional_id
    AND a.barbershop_id = p_barbershop_id
    AND a.status NOT IN ('cancelled', 'no_show')
    AND (
      (a.start_time <= p_start_time AND a.start_time + (a.duration_minutes || ' minutes')::INTERVAL > p_start_time) OR
      (p_start_time <= a.start_time AND p_start_time + (p_duration_minutes || ' minutes')::INTERVAL > a.start_time) OR
      (a.start_time >= p_start_time AND a.start_time < p_start_time + (p_duration_minutes || ' minutes')::INTERVAL)
    );
  
  IF FOUND THEN
    RETURN QUERY SELECT false, 'Conflito com agendamento existente',
      jsonb_build_object(
        'conflicting_appointment_id', existing_appointments.id,
        'conflicting_start_time', existing_appointments.start_time,
        'conflicting_end_time', existing_appointments.start_time + (existing_appointments.duration_minutes || ' minutes')::INTERVAL,
        'requested_start_time', p_start_time,
        'requested_end_time', p_start_time + (p_duration_minutes || ' minutes')::INTERVAL
      );
    RETURN;
  END IF;
  
  -- Se passou por todas as validações, está disponível
  RETURN QUERY SELECT true, 'Disponível', '{}'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar política de INSERT para agendamentos
DROP POLICY IF EXISTS "Clients can insert own appointments" ON public.appointments;

CREATE POLICY "Clients can insert own appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    client_user_id = auth.uid() AND
    -- Validações robustas
    EXISTS (
      SELECT 1 FROM public.validate_appointment_availability(
        professional_id, 
        service_id, 
        barbershop_id, 
        start_time, 
        duration_minutes
      )
      WHERE is_available = true
    )
  );

-- 3. Atualizar política de UPDATE para agendamentos
DROP POLICY IF EXISTS "Clients can update own appointments" ON public.appointments;

CREATE POLICY "Clients can update own appointments" ON public.appointments
  FOR UPDATE USING (
    client_user_id = auth.uid() AND
    -- Só permitir atualizar campos seguros
    (status, notes, updated_at) AND
    -- Não permitir alterar horário se já confirmado
    (status NOT IN ('confirmed', 'in_progress') OR start_time IS NOT DISTINCT FROM old.start_time)
  );

-- 4. Criar trigger para validação automática
CREATE OR REPLACE FUNCTION public.auto_validate_appointment()
RETURNS TRIGGER AS $$
DECLARE
  validation_result RECORD;
BEGIN
  -- Para INSERT, validar disponibilidade
  IF TG_OP = 'INSERT' THEN
    SELECT * INTO validation_result
    FROM public.validate_appointment_availability(
      NEW.professional_id,
      NEW.service_id,
      NEW.barbershop_id,
      NEW.start_time,
      NEW.duration_minutes
    )
    LIMIT 1;
    
    IF NOT validation_result.is_available THEN
      RAISE EXCEPTION 'Agendamento inválido: %', validation_result.conflict_reason;
    END IF;
  END IF;
  
  -- Para UPDATE, validar mudanças críticas
  IF TG_OP = 'UPDATE' THEN
    -- Se mudou horário, profissional ou serviço, validar novamente
    IF (NEW.professional_id IS DISTINCT FROM OLD.professional_id) OR
       (NEW.service_id IS DISTINCT FROM OLD.service_id) OR
       (NEW.start_time IS DISTINCT FROM OLD.start_time) THEN
      
      SELECT * INTO validation_result
      FROM public.validate_appointment_availability(
        NEW.professional_id,
        NEW.service_id,
        NEW.barbershop_id,
        NEW.start_time,
        NEW.duration_minutes
      )
      LIMIT 1;
      
      IF NOT validation_result.is_available THEN
        RAISE EXCEPTION 'Alteração inválida: %', validation_result.conflict_reason;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Adicionar triggers de validação
DROP TRIGGER IF EXISTS validate_appointment_insert ON public.appointments;
CREATE TRIGGER validate_appointment_insert
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_appointment();

DROP TRIGGER IF EXISTS validate_appointment_update ON public.appointments;
CREATE TRIGGER validate_appointment_update
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_appointment();

-- 6. Criar função para verificar disponibilidade (para frontend)
CREATE OR REPLACE FUNCTION public.check_appointment_availability(
  p_professional_id UUID,
  p_service_id UUID,
  p_barbershop_id UUID,
  p_start_time TIMESTAMPTZ
)
RETURNS TABLE(
  available BOOLEAN,
  reason TEXT,
  details JSONB
) AS $$
DECLARE
  service_record RECORD;
BEGIN
  -- Buscar duração do serviço
  SELECT * INTO service_record
  FROM public.services
  WHERE id = p_service_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Serviço não encontrado', '{}'::JSONB;
    RETURN;
  END IF;
  
  -- Usar função de validação principal
  RETURN QUERY
  SELECT *
  FROM public.validate_appointment_availability(
    p_professional_id,
    p_service_id,
    p_barbershop_id,
    p_start_time,
    service_record.duration_minutes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
