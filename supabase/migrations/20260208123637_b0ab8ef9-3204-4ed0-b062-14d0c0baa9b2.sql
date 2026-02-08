-- Remove old restrictive insert policy if exists
DROP POLICY IF EXISTS "Users can insert initial role" ON public.user_roles;

-- Create policy allowing users to insert their own role during signup
-- Only allows safe roles (cliente, dono, afiliado_saas)
-- Profissional and contador roles must be assigned by admins/owners
CREATE POLICY "Users can insert own initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('cliente', 'dono', 'afiliado_saas')
);