-- Adiciona política estrita para barrar acesso anônimo em profiles
DROP POLICY IF EXISTS "Deny public access" ON profiles;
CREATE POLICY "Deny public access" ON profiles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Adiciona política estrita para barrar acesso anônimo em user_roles
DROP POLICY IF EXISTS "Deny public access" ON user_roles;
CREATE POLICY "Deny public access" ON user_roles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);
