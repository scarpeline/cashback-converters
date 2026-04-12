-- =============================================
-- Migration: Integration Tokens for external apps
-- Created: 2026-04-11
-- =============================================

CREATE TABLE IF NOT EXISTS public.integration_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Token de Integração',
  permissions text[] NOT NULL DEFAULT ARRAY['booking:create', 'booking:read', 'services:read'],
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_token_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES public.integration_tokens(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Agendamentos com contexto de integração
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS source_token_id uuid REFERENCES public.integration_tokens(id),
  ADD COLUMN IF NOT EXISTS source_metadata jsonb;

ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_token_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage tokens" ON public.integration_tokens
  FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Public read active tokens" ON public.integration_tokens
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Owners read logs" ON public.integration_token_logs
  FOR SELECT TO authenticated
  USING (token_id IN (
    SELECT id FROM public.integration_tokens
    WHERE barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  ));

CREATE INDEX IF NOT EXISTS idx_integration_tokens_barbershop ON public.integration_tokens(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_integration_tokens_token ON public.integration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_integration_token_logs_token ON public.integration_token_logs(token_id);
