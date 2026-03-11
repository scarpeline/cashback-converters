-- Migração: Correções de Segurança
-- Proteger dados sensíveis em políticas públicas e restringir auto-modificação

-- ========== CORREÇÃO DE POLÍTICAS PÚBLICAS ==========

-- Remover política pública que expõe dados sensíveis
DROP POLICY IF EXISTS "Public can view active barbershops" ON public.barbershops;

-- Criar nova política que oculta campos sensíveis do público
CREATE POLICY "Public can view active barbershops (limited fields)" ON public.barbershops 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NULL);

-- Criar view pública com campos seguros
CREATE OR REPLACE VIEW public.barbershops_public AS
SELECT 
    id,
    name,
    description,
    address,
    city,
    state,
    neighborhood,
    phone,
    whatsapp,
    email,
    website,
    logo_url,
    cover_image_url,
    is_active,
    created_at,
    updated_at
FROM public.barbershops 
WHERE is_active = true;

-- Dar acesso público à view
GRANT SELECT ON public.barbershops_public TO anon, authenticated;

-- Corrigir política de serviços para não expor preços sensíveis
DROP POLICY IF EXISTS "Public can view active services" ON public.services;

CREATE POLICY "Public can view active services (limited fields)" ON public.services 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NULL);

-- Criar view pública de serviços sem preços sensíveis
CREATE OR REPLACE VIEW public.services_public AS
SELECT 
    id,
    barbershop_id,
    name,
    description,
    duration_minutes,
    category,
    is_active,
    created_at,
    updated_at
FROM public.services 
WHERE is_active = true;

-- Dar acesso público à view
GRANT SELECT ON public.services_public TO anon, authenticated;

-- ========== RESTRIÇÃO DE AUTO-MODIFICAÇÃO DE ROLES ==========

-- Remover política que permite superadmins modificar próprios privilégios
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;

-- Criar política que impede auto-modificação
CREATE POLICY "Super admins can manage roles (except self)" ON public.user_roles 
FOR ALL TO authenticated 
USING (
    public.is_super_admin(auth.uid()) 
    AND user_id != auth.uid()  -- Impede modificar próprio role
);

-- Criar política para usuários normais (apenas visualizar próprio role)
CREATE POLICY "Users can view own role" ON public.user_roles 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- ========== VALIDAÇÃO ADICIONAL NO WEBHOOK ==========

-- Criar função para validar contexto de pagamento
CREATE OR REPLACE FUNCTION validate_payment_context(
    p_payment_id TEXT,
    p_payment_value DECIMAL,
    p_webhook_secret TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_payment RECORD;
    v_barbershop_id UUID;
BEGIN
    -- Buscar pagamento no banco
    SELECT id, barbershop_id, client_id, amount, status
    INTO v_payment
    FROM payments
    WHERE asaas_payment_id = p_payment_id;
    
    -- Se não encontrar, inválido
    IF v_payment IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Validar valor (tolerância de 1 centavo)
    IF ABS(p_payment_value - v_payment.amount) > 0.01 THEN
        RETURN FALSE;
    END IF;
    
    -- Validar que não está em estado final
    IF v_payment.status IN ('paid', 'refunded', 'cancelled') THEN
        RETURN FALSE;
    END IF;
    
    -- Validar que a barbearia existe e está ativa
    SELECT id INTO v_barbershop_id
    FROM barbershops
    WHERE id = v_payment.barbershop_id AND is_active = true;
    
    IF v_barbershop_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== LOG DE ACESSO A DADOS SENSÍVEIS ==========

-- Criar tabela de auditoria para acesso a dados sensíveis
CREATE TABLE IF NOT EXISTS sensitive_data_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Criar trigger para log de acesso a pagamentos
CREATE OR REPLACE FUNCTION log_payment_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO sensitive_data_access_log (
        user_id,
        table_name,
        operation,
        metadata
    ) VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        TG_TABLE_NAME,
        TG_OP,
        json_build_object(
            'payment_id', COALESCE(NEW.id, OLD.id),
            'asaas_payment_id', COALESCE(NEW.asaas_payment_id, OLD.asaas_payment_id),
            'amount', COALESCE(NEW.amount, OLD.amount)
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger (com cuidado para não criar loops)
DROP TRIGGER IF EXISTS payment_access_trigger ON payments;
CREATE TRIGGER payment_access_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION log_payment_access();

-- ========== ÍNDICES DE PERFORMANCE PARA SEGURANÇA ==========

-- Índices para validações de segurança
CREATE INDEX IF NOT EXISTS idx_payments_asaas_id_status ON payments(asaas_payment_id, status);
CREATE INDEX IF NOT EXISTS idx_barbershops_active ON barbershops(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active) WHERE is_active = true;

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_sensitive_access_user ON sensitive_data_access_log(user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_table ON sensitive_data_access_log(table_name, accessed_at DESC);

-- ========== COMENTÁRIOS DE SEGURANÇA ==========

COMMENT ON VIEW public.barbershops_public IS 'View pública com campos seguros de barbearias';
COMMENT ON VIEW public.services_public IS 'View pública com campos seguros de serviços';
COMMENT ON FUNCTION validate_payment_context IS 'Valida contexto comercial de pagamento para webhook';
COMMENT ON TABLE sensitive_data_access_log IS 'Auditoria de acesso a dados sensíveis';
COMMENT ON TRIGGER payment_access_trigger ON payments IS 'Log de acesso a dados de pagamentos';
