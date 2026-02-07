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