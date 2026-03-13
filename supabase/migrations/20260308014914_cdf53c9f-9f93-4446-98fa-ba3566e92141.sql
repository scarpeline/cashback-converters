-- Fix RLS recursion loop between barbershops <-> professionals
-- Root cause: professionals policy queried barbershops, while barbershops policy queried professionals.
-- Solution: use SECURITY DEFINER helper to avoid recursive policy evaluation.

DROP POLICY IF EXISTS "Owners can manage professionals" ON public.professionals;

CREATE POLICY "Owners can manage professionals"
ON public.professionals
FOR ALL
TO authenticated
USING (public.owns_barbershop(auth.uid(), barbershop_id))
WITH CHECK (public.owns_barbershop(auth.uid(), barbershop_id));