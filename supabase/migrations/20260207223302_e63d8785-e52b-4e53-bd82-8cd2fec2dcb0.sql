-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'whatsapp'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Add RLS policies for authorized_super_admins (only super admins can view)
CREATE POLICY "Super admins can view authorized emails" ON public.authorized_super_admins
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- Add RLS policies for fiscal_records
CREATE POLICY "Accountants can view fiscal records" ON public.fiscal_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accountants 
      WHERE accountants.id = fiscal_records.accountant_id 
      AND accountants.user_id = auth.uid()
    )
  );

CREATE POLICY "Entity users can view own fiscal records" ON public.fiscal_records
  FOR SELECT USING (entity_user_id = auth.uid());

CREATE POLICY "Super admins can manage all fiscal records" ON public.fiscal_records
  FOR ALL USING (public.is_super_admin(auth.uid()));