
-- Fix RESTRICTIVE RLS policies on user_roles that block ALL access
-- The "Deny anonymous" RESTRICTIVE policies combine with AND, blocking even authenticated users

-- Drop broken restrictive policies on user_roles
DROP POLICY IF EXISTS "Deny anonymous access to user_roles" ON public.user_roles;

-- Drop broken restrictive policies on profiles  
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Recreate as PERMISSIVE policies that only block anonymous (unauthenticated) users
-- For user_roles: the existing "Users can view own roles" already limits to own data
-- We just need to ensure anon can't access - but PERMISSIVE "Users can view own roles" 
-- already handles this since auth.uid() is null for anon users

-- For profiles: same logic applies
-- The existing permissive SELECT policies (Users can view own profile, Super admins can view all profiles) 
-- already correctly restrict access. No additional deny policy needed.
