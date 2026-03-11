-- Migration: add professional_user_id to debts and config column to integration_settings

-- 1. Add professional_user_id to debts so professionals can track their own receivables
ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS professional_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Make barbershop_id optional so profissional-only debts don't need a barbershop
ALTER TABLE public.debts
  ALTER COLUMN barbershop_id DROP NOT NULL;

-- RLS: professionals can manage debts they created
CREATE POLICY "Professionals manage own debts"
ON public.debts
FOR ALL TO authenticated
USING (professional_user_id = auth.uid())
WITH CHECK (professional_user_id = auth.uid());

-- 2. Add config jsonb column to integration_settings for flexible key-value storage
ALTER TABLE public.integration_settings
  ADD COLUMN IF NOT EXISTS config jsonb;
