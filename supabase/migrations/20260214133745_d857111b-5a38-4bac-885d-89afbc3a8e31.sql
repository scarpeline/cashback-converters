
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
