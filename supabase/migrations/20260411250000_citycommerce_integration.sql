-- =============================================
-- Migration: CityCommerce Integration Settings
-- Created: 2026-04-11
-- =============================================

-- Salva as credenciais de integração no integration_settings
INSERT INTO public.integration_settings (service_name, environment, is_active, base_url)
VALUES 
  ('citycommerce_api_key',     'production', true, 'CONFIGURE_VIA_SUPABASE_SECRETS'),
  ('citycommerce_shared_secret','production', true, 'CONFIGURE_VIA_SUPABASE_SECRETS')
ON CONFLICT (service_name, environment) DO NOTHING;

-- Índice para busca rápida por external_id
CREATE INDEX IF NOT EXISTS idx_appointments_source_metadata 
ON public.appointments USING gin(source_metadata);

-- View para facilitar consulta de agendamentos do CityCommerce
CREATE OR REPLACE VIEW public.citycommerce_appointments AS
SELECT 
  a.id,
  a.status,
  a.scheduled_at,
  a.client_name,
  a.client_whatsapp,
  a.source_metadata->>'external_id' as external_id,
  a.source_metadata->>'client_email' as client_email,
  a.source_metadata->>'notes' as notes,
  s.name as service_name,
  s.price as service_price,
  p.name as professional_name,
  b.name as barbershop_name,
  b.slug as barbershop_slug,
  a.created_at
FROM public.appointments a
LEFT JOIN public.services s ON a.service_id = s.id
LEFT JOIN public.professionals p ON a.professional_id = p.id
LEFT JOIN public.barbershops b ON a.barbershop_id = b.id
WHERE a.source = 'citycommerce';
