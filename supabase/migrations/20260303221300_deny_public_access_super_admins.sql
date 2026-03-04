-- Adiciona política estrita para barrar acesso anônimo em authorized_super_admins
DROP POLICY IF EXISTS "Deny public access" ON authorized_super_admins;
CREATE POLICY "Deny public access" ON authorized_super_admins 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);
