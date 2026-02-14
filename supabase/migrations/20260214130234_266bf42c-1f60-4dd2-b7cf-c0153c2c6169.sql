
-- Fix RLS on authorized_super_admins: allow anon to check if email is authorized (for login page)
CREATE POLICY "Anyone can check authorized emails"
ON public.authorized_super_admins
FOR SELECT
TO anon, authenticated
USING (true);
