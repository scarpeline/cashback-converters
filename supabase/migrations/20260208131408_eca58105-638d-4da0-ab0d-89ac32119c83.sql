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