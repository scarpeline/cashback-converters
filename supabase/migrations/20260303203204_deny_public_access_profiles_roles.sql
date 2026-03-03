-- Policy to deny public select access to profiles
CREATE POLICY "Deny public access" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy to deny public select access to user_roles
CREATE POLICY "Deny public access" ON user_roles FOR SELECT USING (auth.uid() IS NOT NULL);
