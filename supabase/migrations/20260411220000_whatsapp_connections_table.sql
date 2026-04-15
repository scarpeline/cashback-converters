-- =============================================
-- Migration: WhatsApp Connections (Web + API)
-- Created: 2026-04-11
-- =============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  nickname text NOT NULL DEFAULT 'WhatsApp',
  phone_number text NOT NULL,
  connection_type text NOT NULL DEFAULT 'web' CHECK (connection_type IN ('web', 'api')),
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
  is_primary boolean DEFAULT false,
  send_mode text DEFAULT 'fixed' CHECK (send_mode IN ('fixed', 'alternate')),
  qr_code text,
  twilio_sid text,
  twilio_auth_token text,
  twilio_phone text,
  notify_disconnect boolean DEFAULT true,
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage connections" ON public.whatsapp_connections
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  );

-- Máximo 3 conexões por barbershop
CREATE OR REPLACE FUNCTION public.check_whatsapp_connection_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.whatsapp_connections WHERE barbershop_id = NEW.barbershop_id) >= 3 THEN
    RAISE EXCEPTION 'Limite de 3 conexões WhatsApp atingido.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_whatsapp_limit ON public.whatsapp_connections;
CREATE TRIGGER trigger_whatsapp_limit
  BEFORE INSERT ON public.whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION public.check_whatsapp_connection_limit();

CREATE INDEX IF NOT EXISTS idx_wa_connections_barbershop ON public.whatsapp_connections(barbershop_id);
