-- Create role enum for the system
CREATE TYPE public.app_role AS ENUM ('cliente', 'dono', 'profissional', 'afiliado_barbearia', 'afiliado_saas', 'contador', 'super_admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  cpf_cnpj TEXT,
  pix_key TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create barbershops table
CREATE TABLE public.barbershops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  address TEXT,
  phone TEXT,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_status TEXT DEFAULT 'trial',
  subscription_ends_at TIMESTAMPTZ,
  asaas_customer_id TEXT,
  asaas_wallet_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create professionals table
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  cpf_cnpj TEXT,
  pix_key TEXT,
  commission_percentage DECIMAL(5,2) DEFAULT 60.00,
  is_active BOOLEAN DEFAULT true,
  asaas_customer_id TEXT,
  asaas_wallet_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT,
  client_whatsapp TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  asaas_payment_id TEXT,
  asaas_pix_qr_code TEXT,
  asaas_pix_copy_paste TEXT,
  split_data JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create affiliates table
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('barbearia', 'saas', 'sub')),
  parent_affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  commission_first DECIMAL(5,2) DEFAULT 60.00,
  commission_recurring DECIMAL(5,2) DEFAULT 20.00,
  commission_saas_tax DECIMAL(5,2) DEFAULT 10.00,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  pending_earnings DECIMAL(10,2) DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  anti_fraud_accepted BOOLEAN DEFAULT false,
  anti_fraud_accepted_at TIMESTAMPTZ,
  asaas_customer_id TEXT,
  asaas_wallet_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create affiliate_commissions table
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  percentage_applied DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create accountants table
CREATE TABLE public.accountants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  cpf_cnpj TEXT,
  commission_mei DECIMAL(10,2) DEFAULT 0,
  commission_me DECIMAL(10,2) DEFAULT 0,
  commission_declaration DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  asaas_customer_id TEXT,
  asaas_wallet_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fiscal_records table
CREATE TABLE public.fiscal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accountant_id UUID REFERENCES public.accountants(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL,
  data JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  priority TEXT NOT NULL DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create support_chats table
CREATE TABLE public.support_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create support_messages table
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_support BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pixel_configurations table
CREATE TABLE public.pixel_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false,
  platform TEXT NOT NULL,
  pixel_id TEXT NOT NULL,
  events JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create authorized_super_admins table
CREATE TABLE public.authorized_super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert authorized super admin emails
INSERT INTO public.authorized_super_admins (email) VALUES 
  ('escarpelineparticular@gmail.com'),
  ('escarpelineparticular2@gmail.com');

-- Create cashback_credits table
CREATE TABLE public.cashback_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  expires_at TIMESTAMPTZ,
  used_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_credits ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Create function to check if user owns barbershop
CREATE OR REPLACE FUNCTION public.owns_barbershop(_user_id UUID, _barbershop_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = _barbershop_id AND owner_user_id = _user_id
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for barbershops
CREATE POLICY "Owners can manage own barbershops" ON public.barbershops
  FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY "Professionals can view their barbershop" ON public.barbershops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.professionals 
      WHERE professionals.barbershop_id = barbershops.id 
      AND professionals.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active barbershops" ON public.barbershops
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage all barbershops" ON public.barbershops
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for professionals
CREATE POLICY "Owners can manage professionals" ON public.professionals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.barbershops 
      WHERE barbershops.id = professionals.barbershop_id 
      AND barbershops.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can view own data" ON public.professionals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all professionals" ON public.professionals
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for services
CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.barbershops 
      WHERE barbershops.id = services.barbershop_id 
      AND barbershops.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for appointments
CREATE POLICY "Clients can view own appointments" ON public.appointments
  FOR SELECT USING (client_user_id = auth.uid());

CREATE POLICY "Clients can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (client_user_id = auth.uid());

CREATE POLICY "Clients can update own appointments" ON public.appointments
  FOR UPDATE USING (client_user_id = auth.uid());

CREATE POLICY "Professionals can view their appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.professionals 
      WHERE professionals.id = appointments.professional_id 
      AND professionals.user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can update their appointments" ON public.appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.professionals 
      WHERE professionals.id = appointments.professional_id 
      AND professionals.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage barbershop appointments" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.barbershops 
      WHERE barbershops.id = appointments.barbershop_id 
      AND barbershops.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for payments
CREATE POLICY "Clients can view own payments" ON public.payments
  FOR SELECT USING (client_user_id = auth.uid());

CREATE POLICY "Owners can view barbershop payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbershops 
      WHERE barbershops.id = payments.barbershop_id 
      AND barbershops.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for affiliates
CREATE POLICY "Users can view own affiliate data" ON public.affiliates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own affiliate data" ON public.affiliates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all affiliates" ON public.affiliates
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for affiliate_commissions
CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliates 
      WHERE affiliates.id = affiliate_commissions.affiliate_id 
      AND affiliates.user_id = auth.uid()
    )
  );

-- RLS Policies for accountants
CREATE POLICY "Accountants can view own data" ON public.accountants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage accountants" ON public.accountants
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all notifications" ON public.notifications
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for support_chats
CREATE POLICY "Users can view own chats" ON public.support_chats
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create chats" ON public.support_chats
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can manage all chats" ON public.support_chats
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages in their chats" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_chats 
      WHERE support_chats.id = support_messages.chat_id 
      AND support_chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their chats" ON public.support_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.support_chats 
      WHERE support_chats.id = support_messages.chat_id 
      AND support_chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all messages" ON public.support_messages
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for pixel_configurations
CREATE POLICY "Owners can manage own pixels" ON public.pixel_configurations
  FOR ALL USING (
    barbershop_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.barbershops 
      WHERE barbershops.id = pixel_configurations.barbershop_id 
      AND barbershops.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all pixels" ON public.pixel_configurations
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for cashback_credits
CREATE POLICY "Users can view own cashback" ON public.cashback_credits
  FOR SELECT USING (user_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_barbershops_updated_at BEFORE UPDATE ON public.barbershops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_professionals_updated_at BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_affiliates_updated_at BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_accountants_updated_at BEFORE UPDATE ON public.accountants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_fiscal_records_updated_at BEFORE UPDATE ON public.fiscal_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_support_chats_updated_at BEFORE UPDATE ON public.support_chats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_pixel_configurations_updated_at BEFORE UPDATE ON public.pixel_configurations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate unique referral code function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;
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
-- Create integration_settings table for API key management
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL, -- 'asaas', 'resend'
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  api_key_hash TEXT, -- Stored as hash for security
  webhook_secret_hash TEXT,
  base_url TEXT,
  from_email TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_name, environment)
);

-- Enable RLS
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admin can manage integration settings
CREATE POLICY "Super admins can view integration settings"
ON public.integration_settings FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert integration settings"
ON public.integration_settings FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update integration settings"
ON public.integration_settings FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete integration settings"
ON public.integration_settings FOR DELETE
USING (public.is_super_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_integration_settings_updated_at
BEFORE UPDATE ON public.integration_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create current_app_environment table to track global env
CREATE TABLE public.app_environment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_env TEXT NOT NULL DEFAULT 'sandbox' CHECK (current_env IN ('sandbox', 'production')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_environment ENABLE ROW LEVEL SECURITY;

-- Super admins can manage environment
CREATE POLICY "Super admins can view app environment"
ON public.app_environment FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update app environment"
ON public.app_environment FOR UPDATE
USING (public.is_super_admin(auth.uid()));

-- Insert initial sandbox environment
INSERT INTO public.app_environment (current_env) VALUES ('sandbox');

-- Create integration_logs table for API call logging
CREATE TABLE public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service TEXT NOT NULL,
  environment TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'API_CALL', 'API_FAIL', 'WEBHOOK'
  status TEXT, -- 'success', 'error'
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can view logs
CREATE POLICY "Super admins can view integration logs"
ON public.integration_logs FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Service role can insert logs (for edge functions)
CREATE POLICY "Service role can insert integration logs"
ON public.integration_logs FOR INSERT
WITH CHECK (true);
-- Fix permissive RLS policy for integration_logs
-- Replace WITH CHECK (true) with proper service role check

DROP POLICY IF EXISTS "Service role can insert integration logs" ON public.integration_logs;

-- Create a more restrictive policy that allows system inserts via service role
-- Edge functions use service role key, so this is appropriate
CREATE POLICY "Authenticated system can insert logs"
ON public.integration_logs FOR INSERT
WITH CHECK (
  -- Allow super admins
  public.is_super_admin(auth.uid())
  OR 
  -- Allow service role (edge functions) - detected by null uid when using service key
  auth.uid() IS NULL
);

-- Fix RLS on authorized_super_admins: allow anon to check if email is authorized (for login page)
CREATE POLICY "Anyone can check authorized emails"
ON public.authorized_super_admins
FOR SELECT
TO anon, authenticated
USING (true);

-- 1. Deny anonymous access to profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 2. Deny anonymous access to user_roles
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);

-- 1. SECURITY DEFINER function to lookup email by whatsapp (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_email_by_whatsapp(_whatsapp text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles
  WHERE whatsapp = _whatsapp
  LIMIT 1
$$;

-- 2. INTEGRATIONS MODULE TABLES

-- Main integrations table
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('payment','sms','whatsapp','pixel','webhook','storage','antifraud','email')),
  provider_name text NOT NULL,
  api_key_encrypted text,
  api_secret_encrypted text,
  base_url text,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive')),
  config_json jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage integrations"
ON public.integrations FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Deny anon access to integrations"
ON public.integrations FOR SELECT
TO anon
USING (false);

-- Integration endpoints table
CREATE TABLE public.integration_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  endpoint_url text NOT NULL,
  method text NOT NULL DEFAULT 'POST' CHECK (method IN ('POST','GET','PUT','PATCH','DELETE')),
  headers_json jsonb DEFAULT '{}'::jsonb,
  retry_enabled boolean DEFAULT false,
  retry_count integer DEFAULT 3,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage endpoints"
ON public.integration_endpoints FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Deny anon access to endpoints"
ON public.integration_endpoints FOR SELECT
TO anon
USING (false);

-- Enhanced pixels table (keeps existing pixel_configurations, adds new)
CREATE TABLE public.pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('platform','salon','affiliate')),
  owner_id uuid,
  pixel_type text NOT NULL CHECK (pixel_type IN ('meta','google','tiktok','ga4','google_ads')),
  pixel_id text NOT NULL,
  events_json jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pixels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all pixels"
ON public.pixels FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Owners can manage own salon pixels"
ON public.pixels FOR ALL
TO authenticated
USING (
  owner_type = 'salon' AND owner_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM barbershops WHERE id = pixels.owner_id AND owner_user_id = auth.uid())
);

CREATE POLICY "Deny anon access to pixels"
ON public.pixels FOR SELECT
TO anon
USING (false);

-- Webhooks log table
CREATE TABLE public.webhooks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  payload_json jsonb,
  target_url text NOT NULL,
  response_code integer,
  response_body text,
  success boolean DEFAULT false,
  integration_id uuid REFERENCES public.integrations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view webhook logs"
ON public.webhooks_log FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "System can insert webhook logs"
ON public.webhooks_log FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Deny anon access to webhook logs"
ON public.webhooks_log FOR SELECT
TO anon
USING (false);

-- Custom API keys table
CREATE TABLE public.api_keys_custom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  owner_type text NOT NULL CHECK (owner_type IN ('platform','salon','affiliate','accountant')),
  label text NOT NULL,
  key_hash text NOT NULL,
  permissions_json jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys_custom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all api keys"
ON public.api_keys_custom FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Deny anon access to api keys"
ON public.api_keys_custom FOR SELECT
TO anon
USING (false);

-- Triggers for updated_at
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_integration_endpoints_updated_at BEFORE UPDATE ON public.integration_endpoints
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_pixels_updated_at BEFORE UPDATE ON public.pixels
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_api_keys_custom_updated_at BEFORE UPDATE ON public.api_keys_custom
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_integrations_type ON public.integrations(type);
CREATE INDEX idx_integrations_status ON public.integrations(status);
CREATE INDEX idx_integration_endpoints_integration_id ON public.integration_endpoints(integration_id);
CREATE INDEX idx_pixels_owner ON public.pixels(owner_type, owner_id);
CREATE INDEX idx_webhooks_log_created_at ON public.webhooks_log(created_at DESC);
CREATE INDEX idx_webhooks_log_integration_id ON public.webhooks_log(integration_id);
CREATE INDEX idx_api_keys_custom_owner ON public.api_keys_custom(owner_id, owner_type);

-- Fix overly permissive INSERT policy on webhooks_log
DROP POLICY "System can insert webhook logs" ON public.webhooks_log;

CREATE POLICY "Authenticated users can insert webhook logs"
ON public.webhooks_log FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

-- Allow service role inserts on webhooks_log (used by webhook-dispatcher edge function)
-- Drop existing restrictive INSERT policy and create a more permissive one for authenticated + service role
DROP POLICY IF EXISTS "Authenticated users can insert webhook logs" ON public.webhooks_log;

CREATE POLICY "System can insert webhook logs"
ON public.webhooks_log
FOR INSERT
WITH CHECK (true);

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

-- ============================================
-- FIX: Drop ALL RESTRICTIVE policies and recreate as PERMISSIVE
-- Root cause: RESTRICTIVE policies use AND logic, blocking normal users
-- ============================================

-- ==================== user_roles ====================
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own initial role" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can insert own initial role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND role = ANY(ARRAY['cliente'::app_role, 'dono'::app_role, 'afiliado_saas'::app_role])
  );

-- ==================== profiles ====================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ==================== authorized_super_admins ====================
DROP POLICY IF EXISTS "Anyone can check authorized emails" ON public.authorized_super_admins;
DROP POLICY IF EXISTS "Super admins can view authorized emails" ON public.authorized_super_admins;

CREATE POLICY "Anyone can check authorized emails" ON public.authorized_super_admins
  FOR SELECT USING (true);

-- ==================== accountants ====================
DROP POLICY IF EXISTS "Accountants can view own data" ON public.accountants;
DROP POLICY IF EXISTS "Super admins can manage accountants" ON public.accountants;

CREATE POLICY "Accountants can view own data" ON public.accountants
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage accountants" ON public.accountants
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ==================== affiliates ====================
DROP POLICY IF EXISTS "Users can view own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Users can update own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Super admins can manage all affiliates" ON public.affiliates;

CREATE POLICY "Users can view own affiliate data" ON public.affiliates
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own affiliate data" ON public.affiliates
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all affiliates" ON public.affiliates
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ==================== affiliate_commissions ====================
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;

CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_commissions.affiliate_id AND affiliates.user_id = auth.uid()
  ));

-- ==================== barbershops ====================
DROP POLICY IF EXISTS "Owners can manage own barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Professionals can view their barbershop" ON public.barbershops;
DROP POLICY IF EXISTS "Public can view active barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Super admins can manage all barbershops" ON public.barbershops;

CREATE POLICY "Owners can manage own barbershops" ON public.barbershops
  FOR ALL TO authenticated USING (owner_user_id = auth.uid());

CREATE POLICY "Professionals can view their barbershop" ON public.barbershops
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM professionals WHERE professionals.barbershop_id = barbershops.id AND professionals.user_id = auth.uid()));

CREATE POLICY "Public can view active barbershops" ON public.barbershops
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage all barbershops" ON public.barbershops
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ==================== appointments ====================
DROP POLICY IF EXISTS "Clients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owners can manage barbershop appointments" ON public.appointments;
DROP POLICY IF EXISTS "Professionals can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Professionals can update their appointments" ON public.appointments;

CREATE POLICY "Clients can view own appointments" ON public.appointments
  FOR SELECT TO authenticated USING (client_user_id = auth.uid());

CREATE POLICY "Clients can create appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (client_user_id = auth.uid());

CREATE POLICY "Clients can update own appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (client_user_id = auth.uid());

CREATE POLICY "Owners can manage barbershop appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = appointments.barbershop_id AND barbershops.owner_user_id = auth.uid()));

CREATE POLICY "Professionals can view their appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM professionals WHERE professionals.id = appointments.professional_id AND professionals.user_id = auth.uid()));

CREATE POLICY "Professionals can update their appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM professionals WHERE professionals.id = appointments.professional_id AND professionals.user_id = auth.uid()));

-- ==================== notifications ====================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Super admins can manage all notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all notifications" ON public.notifications
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ==================== cashback_credits ====================
DROP POLICY IF EXISTS "Users can view own cashback" ON public.cashback_credits;

CREATE POLICY "Users can view own cashback" ON public.cashback_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ==================== payments ====================
DROP POLICY IF EXISTS "Clients can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Owners can view barbershop payments" ON public.payments;

CREATE POLICY "Clients can view own payments" ON public.payments
  FOR SELECT TO authenticated USING (client_user_id = auth.uid());

CREATE POLICY "Owners can view barbershop payments" ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = payments.barbershop_id AND barbershops.owner_user_id = auth.uid()));

-- ==================== professionals ====================
DROP POLICY IF EXISTS "Professionals can view own data" ON public.professionals;
DROP POLICY IF EXISTS "Owners can manage professionals" ON public.professionals;
DROP POLICY IF EXISTS "Super admins can manage all professionals" ON public.professionals;

CREATE POLICY "Professionals can view own data" ON public.professionals
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Owners can manage professionals" ON public.professionals
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = professionals.barbershop_id AND barbershops.owner_user_id = auth.uid()));

CREATE POLICY "Super admins can manage all professionals" ON public.professionals
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ==================== services ====================
DROP POLICY IF EXISTS "Owners can manage services" ON public.services;
DROP POLICY IF EXISTS "Public can view active services" ON public.services;

CREATE POLICY "Owners can manage services" ON public.services
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = services.barbershop_id AND barbershops.owner_user_id = auth.uid()));

CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT USING (is_active = true);

-- ==================== fiscal_records ====================
DROP POLICY IF EXISTS "Accountants can view fiscal records" ON public.fiscal_records;
DROP POLICY IF EXISTS "Entity users can view own fiscal records" ON public.fiscal_records;
DROP POLICY IF EXISTS "Super admins can manage all fiscal records" ON public.fiscal_records;

CREATE POLICY "Accountants can view fiscal records" ON public.fiscal_records
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM accountants WHERE accountants.id = fiscal_records.accountant_id AND accountants.user_id = auth.uid()));

CREATE POLICY "Entity users can view own fiscal records" ON public.fiscal_records
  FOR SELECT TO authenticated USING (entity_user_id = auth.uid());

CREATE POLICY "Super admins can manage all fiscal records" ON public.fiscal_records
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ==================== support_chats ====================
DROP POLICY IF EXISTS "Users can view own chats" ON public.support_chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.support_chats;
DROP POLICY IF EXISTS "Super admins can manage all chats" ON public.support_chats;

CREATE POLICY "Users can view own chats" ON public.support_chats
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create chats" ON public.support_chats
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can manage all chats" ON public.support_chats
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ==================== support_messages ====================
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.support_messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.support_messages;
DROP POLICY IF EXISTS "Super admins can manage all messages" ON public.support_messages;

CREATE POLICY "Users can view messages in their chats" ON public.support_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM support_chats WHERE support_chats.id = support_messages.chat_id AND support_chats.user_id = auth.uid()));

CREATE POLICY "Users can send messages in their chats" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM support_chats WHERE support_chats.id = support_messages.chat_id AND support_chats.user_id = auth.uid()));

CREATE POLICY "Super admins can manage all messages" ON public.support_messages
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ==================== integration tables (admin only) ====================
DROP POLICY IF EXISTS "Deny anon access to api keys" ON public.api_keys_custom;
DROP POLICY IF EXISTS "Super admins can manage all api keys" ON public.api_keys_custom;

CREATE POLICY "Super admins can manage all api keys" ON public.api_keys_custom
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view app environment" ON public.app_environment;
DROP POLICY IF EXISTS "Super admins can update app environment" ON public.app_environment;

CREATE POLICY "Super admins can view app environment" ON public.app_environment
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update app environment" ON public.app_environment
  FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Super admins can insert integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Super admins can update integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Super admins can delete integration settings" ON public.integration_settings;

CREATE POLICY "Super admins can manage integration settings" ON public.integration_settings
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Deny anon access to integrations" ON public.integrations;
DROP POLICY IF EXISTS "Super admins can manage integrations" ON public.integrations;

CREATE POLICY "Super admins can manage integrations" ON public.integrations
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Deny anon access to endpoints" ON public.integration_endpoints;
DROP POLICY IF EXISTS "Super admins can manage endpoints" ON public.integration_endpoints;

CREATE POLICY "Super admins can manage endpoints" ON public.integration_endpoints
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view integration logs" ON public.integration_logs;
DROP POLICY IF EXISTS "Authenticated system can insert logs" ON public.integration_logs;

CREATE POLICY "Super admins can view integration logs" ON public.integration_logs
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "System can insert integration logs" ON public.integration_logs
  FOR INSERT WITH CHECK (true);

-- ==================== pixels ====================
DROP POLICY IF EXISTS "Deny anon access to pixels" ON public.pixels;
DROP POLICY IF EXISTS "Owners can manage own salon pixels" ON public.pixels;
DROP POLICY IF EXISTS "Super admins can manage all pixels" ON public.pixels;

CREATE POLICY "Owners can manage own salon pixels" ON public.pixels
  FOR ALL TO authenticated
  USING (owner_type = 'salon' AND owner_id IS NOT NULL AND EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = pixels.owner_id AND barbershops.owner_user_id = auth.uid()));

CREATE POLICY "Super admins can manage all pixels" ON public.pixels
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ==================== pixel_configurations ====================
DROP POLICY IF EXISTS "Owners can manage own pixels" ON public.pixel_configurations;
DROP POLICY IF EXISTS "Super admins can manage all pixels" ON public.pixel_configurations;

CREATE POLICY "Owners can manage own pixel configs" ON public.pixel_configurations
  FOR ALL TO authenticated
  USING (barbershop_id IS NOT NULL AND EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = pixel_configurations.barbershop_id AND barbershops.owner_user_id = auth.uid()));

CREATE POLICY "Super admins can manage all pixel configs" ON public.pixel_configurations
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ==================== webhooks_log ====================
DROP POLICY IF EXISTS "Deny anon access to webhook logs" ON public.webhooks_log;
DROP POLICY IF EXISTS "Super admins can view webhook logs" ON public.webhooks_log;
DROP POLICY IF EXISTS "System can insert webhook logs" ON public.webhooks_log;

CREATE POLICY "Super admins can view webhook logs" ON public.webhooks_log
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "System can insert webhook logs" ON public.webhooks_log
  FOR INSERT WITH CHECK (true);

-- ============================================
-- RESTORE MISSING TRIGGERS
-- ============================================

-- Trigger: auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: auto-update updated_at on profiles
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: auto-update updated_at on barbershops
CREATE OR REPLACE TRIGGER update_barbershops_updated_at
  BEFORE UPDATE ON public.barbershops
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: auto-update updated_at on professionals
CREATE OR REPLACE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: auto-update updated_at on services
CREATE OR REPLACE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: auto-update updated_at on appointments
CREATE OR REPLACE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: auto-update updated_at on affiliates
CREATE OR REPLACE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: auto-update updated_at on accountants
CREATE OR REPLACE TRIGGER update_accountants_updated_at
  BEFORE UPDATE ON public.accountants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- FIX: Convert ALL RESTRICTIVE policies to PERMISSIVE
-- and restore ALL missing triggers
-- =============================================

-- ============ USER_ROLES ============
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own initial role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own initial role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role = ANY(ARRAY['cliente'::app_role, 'dono'::app_role, 'afiliado_saas'::app_role]));
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ BARBERSHOPS ============
DROP POLICY IF EXISTS "Owners can manage own barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Professionals can view their barbershop" ON public.barbershops;
DROP POLICY IF EXISTS "Public can view active barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Super admins can manage all barbershops" ON public.barbershops;

CREATE POLICY "Owners can manage own barbershops" ON public.barbershops FOR ALL TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Professionals can view their barbershop" ON public.barbershops FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM professionals WHERE professionals.barbershop_id = barbershops.id AND professionals.user_id = auth.uid()));
CREATE POLICY "Public can view active barbershops" ON public.barbershops FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage all barbershops" ON public.barbershops FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ APPOINTMENTS ============
DROP POLICY IF EXISTS "Clients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owners can manage barbershop appointments" ON public.appointments;
DROP POLICY IF EXISTS "Professionals can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Professionals can update their appointments" ON public.appointments;

CREATE POLICY "Clients can view own appointments" ON public.appointments FOR SELECT TO authenticated USING (client_user_id = auth.uid());
CREATE POLICY "Clients can create appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (client_user_id = auth.uid());
CREATE POLICY "Clients can update own appointments" ON public.appointments FOR UPDATE TO authenticated USING (client_user_id = auth.uid());
CREATE POLICY "Owners can manage barbershop appointments" ON public.appointments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = appointments.barbershop_id AND barbershops.owner_user_id = auth.uid()));
CREATE POLICY "Professionals can view their appointments" ON public.appointments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM professionals WHERE professionals.id = appointments.professional_id AND professionals.user_id = auth.uid()));
CREATE POLICY "Professionals can update their appointments" ON public.appointments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM professionals WHERE professionals.id = appointments.professional_id AND professionals.user_id = auth.uid()));

-- ============ AFFILIATES ============
DROP POLICY IF EXISTS "Users can view own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Users can update own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Super admins can manage all affiliates" ON public.affiliates;

CREATE POLICY "Users can view own affiliate data" ON public.affiliates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own affiliate data" ON public.affiliates FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Super admins can manage all affiliates" ON public.affiliates FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ AFFILIATE_COMMISSIONS ============
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;

CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_commissions.affiliate_id AND affiliates.user_id = auth.uid()));

-- ============ ACCOUNTANTS ============
DROP POLICY IF EXISTS "Accountants can view own data" ON public.accountants;
DROP POLICY IF EXISTS "Super admins can manage accountants" ON public.accountants;

CREATE POLICY "Accountants can view own data" ON public.accountants FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Super admins can manage accountants" ON public.accountants FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ NOTIFICATIONS ============
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Super admins can manage all notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Super admins can manage all notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ PAYMENTS ============
DROP POLICY IF EXISTS "Clients can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Owners can view barbershop payments" ON public.payments;

CREATE POLICY "Clients can view own payments" ON public.payments FOR SELECT TO authenticated USING (client_user_id = auth.uid());
CREATE POLICY "Owners can view barbershop payments" ON public.payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = payments.barbershop_id AND barbershops.owner_user_id = auth.uid()));

-- ============ PROFESSIONALS ============
DROP POLICY IF EXISTS "Professionals can view own data" ON public.professionals;
DROP POLICY IF EXISTS "Owners can manage professionals" ON public.professionals;
DROP POLICY IF EXISTS "Super admins can manage all professionals" ON public.professionals;

CREATE POLICY "Professionals can view own data" ON public.professionals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners can manage professionals" ON public.professionals FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = professionals.barbershop_id AND barbershops.owner_user_id = auth.uid()));
CREATE POLICY "Super admins can manage all professionals" ON public.professionals FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ SERVICES ============
DROP POLICY IF EXISTS "Owners can manage services" ON public.services;
DROP POLICY IF EXISTS "Public can view active services" ON public.services;

CREATE POLICY "Owners can manage services" ON public.services FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = services.barbershop_id AND barbershops.owner_user_id = auth.uid()));
CREATE POLICY "Public can view active services" ON public.services FOR SELECT USING (is_active = true);

-- ============ CASHBACK_CREDITS ============
DROP POLICY IF EXISTS "Users can view own cashback" ON public.cashback_credits;

CREATE POLICY "Users can view own cashback" ON public.cashback_credits FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============ FISCAL_RECORDS ============
DROP POLICY IF EXISTS "Entity users can view own fiscal records" ON public.fiscal_records;
DROP POLICY IF EXISTS "Accountants can view fiscal records" ON public.fiscal_records;
DROP POLICY IF EXISTS "Super admins can manage all fiscal records" ON public.fiscal_records;

CREATE POLICY "Entity users can view own fiscal records" ON public.fiscal_records FOR SELECT TO authenticated USING (entity_user_id = auth.uid());
CREATE POLICY "Accountants can view fiscal records" ON public.fiscal_records FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM accountants WHERE accountants.id = fiscal_records.accountant_id AND accountants.user_id = auth.uid()));
CREATE POLICY "Super admins can manage all fiscal records" ON public.fiscal_records FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ AUTHORIZED_SUPER_ADMINS ============
DROP POLICY IF EXISTS "Anyone can check authorized emails" ON public.authorized_super_admins;

CREATE POLICY "Anyone can check authorized emails" ON public.authorized_super_admins FOR SELECT USING (true);

-- ============ INTEGRATION_SETTINGS ============
DROP POLICY IF EXISTS "Super admins can manage integration settings" ON public.integration_settings;

CREATE POLICY "Super admins can manage integration settings" ON public.integration_settings FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ INTEGRATIONS ============
DROP POLICY IF EXISTS "Super admins can manage integrations" ON public.integrations;

CREATE POLICY "Super admins can manage integrations" ON public.integrations FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ INTEGRATION_ENDPOINTS ============
DROP POLICY IF EXISTS "Super admins can manage endpoints" ON public.integration_endpoints;

CREATE POLICY "Super admins can manage endpoints" ON public.integration_endpoints FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ INTEGRATION_LOGS ============
DROP POLICY IF EXISTS "Super admins can view integration logs" ON public.integration_logs;
DROP POLICY IF EXISTS "System can insert integration logs" ON public.integration_logs;

CREATE POLICY "Super admins can view integration logs" ON public.integration_logs FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "System can insert integration logs" ON public.integration_logs FOR INSERT WITH CHECK (true);

-- ============ API_KEYS_CUSTOM ============
DROP POLICY IF EXISTS "Super admins can manage all api keys" ON public.api_keys_custom;

CREATE POLICY "Super admins can manage all api keys" ON public.api_keys_custom FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ APP_ENVIRONMENT ============
DROP POLICY IF EXISTS "Super admins can view app environment" ON public.app_environment;
DROP POLICY IF EXISTS "Super admins can update app environment" ON public.app_environment;

CREATE POLICY "Super admins can view app environment" ON public.app_environment FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins can update app environment" ON public.app_environment FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ PIXEL_CONFIGURATIONS ============
DROP POLICY IF EXISTS "Owners can manage own pixel configs" ON public.pixel_configurations;
DROP POLICY IF EXISTS "Super admins can manage all pixel configs" ON public.pixel_configurations;

CREATE POLICY "Owners can manage own pixel configs" ON public.pixel_configurations FOR ALL TO authenticated USING (barbershop_id IS NOT NULL AND EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = pixel_configurations.barbershop_id AND barbershops.owner_user_id = auth.uid()));
CREATE POLICY "Super admins can manage all pixel configs" ON public.pixel_configurations FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ PIXELS ============
DROP POLICY IF EXISTS "Owners can manage own salon pixels" ON public.pixels;
DROP POLICY IF EXISTS "Super admins can manage all pixels" ON public.pixels;

CREATE POLICY "Owners can manage own salon pixels" ON public.pixels FOR ALL TO authenticated USING (owner_type = 'salon' AND owner_id IS NOT NULL AND EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = pixels.owner_id AND barbershops.owner_user_id = auth.uid()));
CREATE POLICY "Super admins can manage all pixels" ON public.pixels FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ SUPPORT_CHATS ============
DROP POLICY IF EXISTS "Users can view own chats" ON public.support_chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.support_chats;
DROP POLICY IF EXISTS "Super admins can manage all chats" ON public.support_chats;

CREATE POLICY "Users can view own chats" ON public.support_chats FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create chats" ON public.support_chats FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Super admins can manage all chats" ON public.support_chats FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ SUPPORT_MESSAGES ============
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.support_messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.support_messages;
DROP POLICY IF EXISTS "Super admins can manage all messages" ON public.support_messages;

CREATE POLICY "Users can view messages in their chats" ON public.support_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM support_chats WHERE support_chats.id = support_messages.chat_id AND support_chats.user_id = auth.uid()));
CREATE POLICY "Users can send messages in their chats" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM support_chats WHERE support_chats.id = support_messages.chat_id AND support_chats.user_id = auth.uid()));
CREATE POLICY "Super admins can manage all messages" ON public.support_messages FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- ============ WEBHOOKS_LOG ============
DROP POLICY IF EXISTS "Super admins can view webhook logs" ON public.webhooks_log;
DROP POLICY IF EXISTS "System can insert webhook logs" ON public.webhooks_log;

CREATE POLICY "Super admins can view webhook logs" ON public.webhooks_log FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "System can insert webhook logs" ON public.webhooks_log FOR INSERT WITH CHECK (true);

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers to all relevant tables
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.barbershops;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.barbershops FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.professionals;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.services;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.appointments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.payments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.affiliates;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.accountants;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.accountants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.fiscal_records;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.fiscal_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.integrations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.integration_settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.integration_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.integration_endpoints;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.integration_endpoints FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.pixel_configurations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pixel_configurations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.pixels;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pixels FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.api_keys_custom;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.api_keys_custom FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.support_chats;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.support_chats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- Policy to deny public select access to profiles
CREATE POLICY "Deny public access" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy to deny public select access to user_roles
CREATE POLICY "Deny public access" ON user_roles FOR SELECT USING (auth.uid() IS NOT NULL);
-- Adiciona polÃ­tica estrita para barrar acesso anÃ´nimo em profiles
DROP POLICY IF EXISTS "Deny public access" ON profiles;
CREATE POLICY "Deny public access" ON profiles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Adiciona polÃ­tica estrita para barrar acesso anÃ´nimo em user_roles
DROP POLICY IF EXISTS "Deny public access" ON user_roles;
CREATE POLICY "Deny public access" ON user_roles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);
-- Adiciona polÃ­tica estrita para barrar acesso anÃ´nimo em authorized_super_admins
DROP POLICY IF EXISTS "Deny public access" ON authorized_super_admins;
CREATE POLICY "Deny public access" ON authorized_super_admins 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);
-- AdiÃ§Ã£o de colunas extras no cadastro da barbearia
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS affiliate_reward_type TEXT DEFAULT 'commission' CHECK (affiliate_reward_type IN ('commission', 'credit'));
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS marketing_flows JSONB DEFAULT '[]';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS pixels_config JSONB DEFAULT '{}';

-- Tabela de Rifas
CREATE TABLE IF NOT EXISTS raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ticket_price DECIMAL(10,2) DEFAULT 0,
  credit_award DECIMAL(10,2) DEFAULT 0,
  max_tickets INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_user_id UUID REFERENCES profiles(user_id),
  draw_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Bilhetes da Rifa
CREATE TABLE IF NOT EXISTS raffle_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID REFERENCES raffles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_tickets ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas de RLS para Rifas
CREATE POLICY "Qualquer usuÃ¡rio autenticado pode ver rifas" ON raffles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Donos podem gerenciar suas rifas" ON raffles FOR ALL USING (
  EXISTS (SELECT 1 FROM barbershops WHERE id = raffles.barbershop_id AND owner_user_id = auth.uid())
);

-- PolÃ­ticas de RLS para Bilhetes
CREATE POLICY "UsuÃ¡rios podem ver seus prÃ³prios bilhetes" ON raffle_tickets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Donos podem ver bilhetes das suas rifas" ON raffle_tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM raffles JOIN barbershops ON raffles.barbershop_id = barbershops.id WHERE raffles.id = raffle_tickets.raffle_id AND barbershops.owner_user_id = auth.uid())
);
CREATE POLICY "UsuÃ¡rios podem comprar bilhetes" ON raffle_tickets FOR INSERT WITH CHECK (user_id = auth.uid());

-- Tabela de Mensagens Internas do Sistema
CREATE TABLE IF NOT EXISTS internal_system_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(user_id),
  target_role TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE internal_system_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins gerenciam mensagens" ON internal_system_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM authorized_super_admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND is_active = true)
);
CREATE POLICY "UsuÃ¡rios veem mensagens filtradas por role" ON internal_system_messages FOR SELECT USING (auth.uid() IS NOT NULL);
