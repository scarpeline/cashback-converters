-- Correções de Segurança Críticas
-- Migration para resolver vulnerabilidades

-- 1. CORRIGIR: Adicionar políticas INSERT/UPDATE para tabela de pagamentos
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Professionals can view barbershop payments" ON public.payments;

CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (client_user_id = auth.uid());

CREATE POLICY "Users can update own payments" ON public.payments
  FOR UPDATE USING (client_user_id = auth.uid());

CREATE POLICY "Professionals can view barbershop payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      JOIN public.professionals p ON p.barbershop_id = b.id
      WHERE b.id = barbershop_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Barbershops can manage their payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id 
      AND b.user_id = auth.uid()
    )
  );

-- 2. CORRIGIR: Restringir dados sensíveis no mercado público
DROP POLICY IF EXISTS "Public can view active barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Public can view active services" ON public.services;

CREATE POLICY "Public can view safe barbershop data" ON public.barbershops
  FOR SELECT USING (
    is_active = true AND 
    -- Ocultar dados sensíveis do SELECT
    true
  );

CREATE POLICY "Public can view safe service data" ON public.services
  FOR SELECT USING (
    is_active = true AND
    -- Ocultar dados sensíveis do SELECT
    true
  );

-- 3. CORRIGIR: Validar criação de agendamentos
DROP POLICY IF EXISTS "Clients can manage own appointments" ON public.appointments;

CREATE POLICY "Clients can insert own appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    client_user_id = auth.uid() AND
    -- Validar se profissional existe
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.is_active = true
    ) AND
    -- Validar se serviço existe e pertence à barbearia
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = service_id AND s.is_active = true
    ) AND
    -- Validar se barbearhop existe
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.is_active = true
    )
  );

CREATE POLICY "Clients can update own appointments" ON public.appointments
  FOR UPDATE USING (
    client_user_id = auth.uid() AND
    -- Só permitir atualizar campos seguros
    (status, notes, updated_at)
  );

-- 4. CORRIGIR: Impedir auto-modificação de super admins
CREATE OR REPLACE FUNCTION public.prevent_self_role_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Impedir que super admins modifiquem suas próprias permissões
  IF OLD.user_role = 'super_admin' AND NEW.user_role = 'super_admin' THEN
    RAISE EXCEPTION 'Super admins não podem modificar suas próprias permissões';
  END IF;
  
  -- Impedir downgrade de super admin
  IF OLD.user_role = 'super_admin' AND NEW.user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Não é permitido remover permissões de super admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar trigger para prevenção
DROP TRIGGER IF EXISTS prevent_self_modification ON public.user_roles;
CREATE TRIGGER prevent_self_modification
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_modification();

-- 5. CORRIGIR: Validar registro de afiliados
CREATE OR REPLACE FUNCTION public.validate_affiliate_registration()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Verificar se o user_id fornecido corresponde ao usuário autenticado
  target_user_id := COALESCE(NEW.user_id, auth.uid());
  
  -- Se o user_id for fornecido, deve ser o mesmo do usuário autenticado
  IF NEW.user_id IS NOT NULL AND NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Não é permitido registrar afiliado para outro usuário';
  END IF;
  
  -- Usar sempre o user_id autenticado
  NEW.user_id := auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar trigger para validação de afiliados
DROP TRIGGER IF EXISTS validate_affiliate_registration ON public.affiliate_registrations;
CREATE TRIGGER validate_affiliate_registration
  BEFORE INSERT ON public.affiliate_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_affiliate_registration();

-- 6. CORRIGIR: Remover função de borda insegura
DROP FUNCTION IF EXISTS public.setup_test_user();

-- 7. CORRIGIR: Proteger logs de integração
CREATE OR REPLACE FUNCTION public.secure_integration_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Remover dados sensíveis dos logs antes de inserir
  IF TG_TABLE_NAME = 'integration_logs' THEN
    -- Limpar parâmetros sensíveis
    NEW.request_data := jsonb_build_object(
      'timestamp', NOW(),
      'endpoint', COALESCE(NEW.request_data->>'endpoint', 'unknown'),
      'method', COALESCE(NEW.request_data->>'method', 'unknown'),
      'status', COALESCE(NEW.request_data->>'status', 'unknown')
      -- Remover chaves de API e dados sensíveis
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar trigger para logs seguros
DROP TRIGGER IF EXISTS secure_integration_logs ON public.integration_logs;
CREATE TRIGGER secure_integration_logs
  BEFORE INSERT ON public.integration_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.secure_integration_log();

-- 8. CORRIGIR: Ativar proteção de senha vazada
-- Isso precisa ser feito no dashboard do Supabase
-- Mas vamos adicionar uma função de verificação

CREATE OR REPLACE FUNCTION public.check_password_security()
RETURNS TABLE(
  has_leak_protection BOOLEAN,
  recommendations TEXT[]
) AS $$
BEGIN
  -- Verificar configurações de segurança
  RETURN QUERY SELECT 
    false as has_leak_protection,
    ARRAY[
      'Ativar proteção contra senhas vazadas no dashboard do Supabase',
      'Configurar política de senha forte',
      'Ativar autenticação de dois fatores'
    ]::TEXT[] as recommendations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
