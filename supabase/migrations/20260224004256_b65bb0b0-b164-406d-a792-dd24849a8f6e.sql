
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
