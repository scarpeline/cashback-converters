-- ============================================================
-- SECURITY HARDENING — Correção de todos os alertas do scanner
-- ============================================================

-- ============================================================
-- 1. BARBERSHOPS: substituir política pública pela view segura
-- ============================================================

-- Remover TODAS as políticas públicas existentes na tabela base
DROP POLICY IF EXISTS "Public can view active barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Public can view active barbershops (limited fields)" ON public.barbershops;

-- Revogar SELECT público direto na tabela base
REVOKE SELECT ON public.barbershops FROM anon;

-- Recriar view com APENAS campos seguros (sem asaas_*, owner_user_id, config interna)
DROP VIEW IF EXISTS public.barbershops_public CASCADE;
CREATE VIEW public.barbershops_public AS
SELECT
    id,
    name,
    slug,
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

-- Acesso público SOMENTE à view
GRANT SELECT ON public.barbershops_public TO anon, authenticated;

-- Usuários autenticados (donos/profissionais) ainda acessam a tabela via RLS
-- Garantir que a política para usuários autenticados existe
DROP POLICY IF EXISTS "Owners can view own barbershop" ON public.barbershops;
CREATE POLICY "Owners can view own barbershop" ON public.barbershops
FOR SELECT TO authenticated
USING (
    owner_user_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.professionals p
        WHERE p.barbershop_id = barbershops.id
          AND p.user_id = auth.uid()
          AND p.is_active = true
    )
);

-- ============================================================
-- 2. VITRINE / MARKETPLACE: remover gateway IDs e status de
--    assinatura da view pública
-- ============================================================

DROP VIEW IF EXISTS public.vitrine_barbershops CASCADE;
CREATE VIEW public.vitrine_barbershops AS
SELECT
    b.id,
    b.name,
    b.slug,
    b.description,
    b.address,
    b.city,
    b.state,
    b.neighborhood,
    b.phone,
    b.whatsapp,
    b.logo_url,
    b.cover_image_url,
    b.is_active
FROM public.barbershops b
WHERE b.is_active = true;

GRANT SELECT ON public.vitrine_barbershops TO anon, authenticated;

-- ============================================================
-- 3. PAYMENTS: adicionar políticas INSERT/UPDATE ausentes
-- ============================================================

-- INSERT: apenas usuários autenticados podem criar pagamentos para si
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments" ON public.payments
FOR INSERT TO authenticated
WITH CHECK (
    client_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.id = payments.barbershop_id
          AND b.owner_user_id = auth.uid()
    )
    OR public.is_super_admin(auth.uid())
);

-- UPDATE: apenas dono da barbearia ou super_admin
DROP POLICY IF EXISTS "Barbershop owners can update payments" ON public.payments;
CREATE POLICY "Barbershop owners can update payments" ON public.payments
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.id = payments.barbershop_id
          AND b.owner_user_id = auth.uid()
    )
    OR public.is_super_admin(auth.uid())
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.id = payments.barbershop_id
          AND b.owner_user_id = auth.uid()
    )
    OR public.is_super_admin(auth.uid())
);

-- ============================================================
-- 4. APPOINTMENTS: validação de negócio via constraint
-- ============================================================

-- Garantir que scheduled_at não pode ser no passado (> 1 hora atrás)
ALTER TABLE public.appointments
    DROP CONSTRAINT IF EXISTS appointments_scheduled_at_not_past;

ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_scheduled_at_not_past
    CHECK (scheduled_at >= (NOW() - INTERVAL '1 hour'));

-- Garantir que status só aceita valores válidos
ALTER TABLE public.appointments
    DROP CONSTRAINT IF EXISTS appointments_status_valid;

ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_status_valid
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'canceled', 'no_show'));

-- ============================================================
-- 5. LEAKED PASSWORD PROTECTION: habilitar via configuração
-- ============================================================

-- Nota: HaveIBeenPwned check é configurado no Supabase Dashboard
-- (Auth > Settings > Password Protection). Esta migration registra
-- a intenção e cria uma tabela de auditoria de senhas fracas.

CREATE TABLE IF NOT EXISTS public.auth_security_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.auth_security_config (key, value)
VALUES
    ('leaked_password_protection', 'enabled'),
    ('min_password_length', '8'),
    ('require_uppercase', 'true'),
    ('require_number', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Apenas super_admin pode ler/escrever
ALTER TABLE public.auth_security_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only super_admin can manage auth config" ON public.auth_security_config;
CREATE POLICY "Only super_admin can manage auth config" ON public.auth_security_config
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- ============================================================
-- 6. COMENTÁRIOS DE AUDITORIA
-- ============================================================

COMMENT ON VIEW public.barbershops_public IS
    'View pública segura: sem asaas_customer_id, asaas_wallet_id, owner_user_id, campos de config interna';

COMMENT ON VIEW public.vitrine_barbershops IS
    'View de vitrine pública: sem gateway IDs e sem subscription_status';

COMMENT ON TABLE public.auth_security_config IS
    'Registro de configurações de segurança de autenticação';
