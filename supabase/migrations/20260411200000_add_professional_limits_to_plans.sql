-- =============================================
-- Migration: Add professional limits to subscription plans
-- Created: 2026-04-11
-- Description: Adds max_professionals column to control how many professionals can be registered per plan
-- =============================================

-- Add max_professionals column to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS max_professionals INTEGER DEFAULT 1;

COMMENT ON COLUMN public.subscription_plans.max_professionals IS 'Maximum number of professionals allowed for this plan. NULL = unlimited';

-- Update existing plans with limits
UPDATE public.subscription_plans 
SET max_professionals = CASE 
  WHEN name ILIKE '%trial%' THEN 1
  WHEN name ILIKE '%mensal%' THEN 3
  WHEN name ILIKE '%trimestral%' THEN 5
  WHEN name ILIKE '%semestral%' THEN 10
  WHEN name ILIKE '%anual%' THEN NULL  -- unlimited
  ELSE 1
END;

-- Create function to check professional limit
CREATE OR REPLACE FUNCTION public.check_professional_limit(p_barbershop_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count INTEGER;
  v_max_allowed INTEGER;
  v_owner_id UUID;
BEGIN
  -- Get barbershop owner
  SELECT owner_user_id INTO v_owner_id
  FROM public.barbershops
  WHERE id = p_barbershop_id;

  IF v_owner_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get current professional count
  SELECT COUNT(*) INTO v_current_count
  FROM public.professionals
  WHERE barbershop_id = p_barbershop_id
  AND deleted_at IS NULL;

  -- Get max allowed from active subscription
  SELECT sp.max_professionals INTO v_max_allowed
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = v_owner_id
  AND us.status IN ('active', 'trial')
  AND us.ends_at > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- If no subscription found, use trial limit (1)
  IF v_max_allowed IS NULL THEN
    v_max_allowed := 1;
  END IF;

  -- NULL means unlimited
  IF v_max_allowed IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if under limit
  RETURN v_current_count < v_max_allowed;
END;
$$;

-- Create trigger function to enforce limit on insert
CREATE OR REPLACE FUNCTION public.enforce_professional_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.check_professional_limit(NEW.barbershop_id) THEN
    RAISE EXCEPTION 'Professional limit reached for current plan. Upgrade to add more professionals.';
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger to professionals table
DROP TRIGGER IF EXISTS trigger_enforce_professional_limit ON public.professionals;
CREATE TRIGGER trigger_enforce_professional_limit
  BEFORE INSERT ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_professional_limit();

-- Create helper function to get remaining slots
CREATE OR REPLACE FUNCTION public.get_professional_slots(p_barbershop_id UUID)
RETURNS TABLE(
  current_count INTEGER,
  max_allowed INTEGER,
  remaining INTEGER,
  is_unlimited BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Get barbershop owner
  SELECT owner_user_id INTO v_owner_id
  FROM public.barbershops
  WHERE id = p_barbershop_id;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER 
     FROM public.professionals 
     WHERE barbershop_id = p_barbershop_id 
     AND deleted_at IS NULL) as current_count,
    COALESCE(sp.max_professionals, 999)::INTEGER as max_allowed,
    CASE 
      WHEN sp.max_professionals IS NULL THEN 999
      ELSE GREATEST(0, sp.max_professionals - (
        SELECT COUNT(*)::INTEGER 
        FROM public.professionals 
        WHERE barbershop_id = p_barbershop_id 
        AND deleted_at IS NULL
      ))
    END as remaining,
    (sp.max_professionals IS NULL) as is_unlimited
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = v_owner_id
  AND us.status IN ('active', 'trial')
  AND us.ends_at > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_professional_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_professional_slots(UUID) TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_professionals_barbershop_active 
ON public.professionals(barbershop_id) 
WHERE deleted_at IS NULL;
