-- Migration: Extensões para Onboarding Genérico
-- Data: 2026-03-19
-- Funcionalidades:
--   - Adicionar coluna booking_policies (JSONB) na tabela barbershops
--   - Criar tabela public.automations para regras de automação por empresa
--   - Criar tabela public.resources para recursos não-humanos (salas, equipamentos)
--   - Configurar RLS para novas tabelas

-- =====================================================
-- 1. Adicionar coluna booking_policies na tabela barbershops
-- =====================================================
ALTER TABLE public.barbershops
ADD COLUMN IF NOT EXISTS booking_policies JSONB DEFAULT '{
    "deposit_required": false,
    "deposit_percentage": 0,
    "cancellation_window_hours": 24,
    "no_show_fee_percentage": 0,
    "advance_booking_hours_min": 1,
    "advance_booking_hours_max": 720,
    "buffer_minutes_before": 0,
    "buffer_minutes_after": 0,
    "allow_recurring": true,
    "max_instances_per_recurring": 12,
    "require_confirmation": true,
    "auto_confirm_after_hours": 24
}'::jsonb;

-- =====================================================
-- 2. Criar tabela public.automations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'booking_created',
        'booking_confirmed',
        'booking_cancelled',
        'booking_completed',
        'reminder_before',
        'no_show',
        'client_inactive',
        'payment_received',
        'payment_overdue'
    )),
    trigger_hours_before INTEGER,
    trigger_days_inactive INTEGER,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'send_whatsapp',
        'send_email',
        'send_sms',
        'create_booking',
        'update_status',
        'add_tag',
        'send_notification'
    )),
    action_config JSONB NOT NULL DEFAULT '{}',
    template_message TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automations_barbershop ON public.automations(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON public.automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automations_active ON public.automations(is_active) WHERE is_active = true;

-- =====================================================
-- 3. Criar tabela public.resources
-- =====================================================
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN (
        'room',
        'equipment',
        'assistant',
        'vehicle',
        'other'
    )),
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    color TEXT DEFAULT '#6366f1',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resources_barbershop ON public.resources(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_active ON public.resources(is_active) WHERE is_active = true;

-- =====================================================
-- 4. Habilitar RLS nas novas tabelas
-- =====================================================
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. Policies RLS - automations
-- =====================================================
CREATE POLICY "Owners can view automations" ON public.automations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = automations.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can insert automations" ON public.automations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = automations.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update automations" ON public.automations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = automations.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can delete automations" ON public.automations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = automations.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

-- =====================================================
-- 6. Policies RLS - resources
-- =====================================================
CREATE POLICY "Owners can view resources" ON public.resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = resources.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can insert resources" ON public.resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = resources.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update resources" ON public.resources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = resources.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can delete resources" ON public.resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = resources.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

-- =====================================================
-- 7. Policy para booking_policies na barbershops
-- (já coberto pela policy existente de barbershops,
-- mas garantimos que owners podem atualizar)
-- =====================================================
CREATE POLICY "Owners can update booking_policies" ON public.barbershops
    FOR UPDATE USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());