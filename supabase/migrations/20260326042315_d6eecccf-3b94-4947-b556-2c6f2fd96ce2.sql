
-- Tabela de avaliações de clientes
CREATE TABLE public.client_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL,
  professional_id UUID REFERENCES public.professionals(id),
  appointment_id UUID REFERENCES public.appointments(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create reviews" ON public.client_reviews FOR INSERT TO authenticated WITH CHECK (client_user_id = auth.uid());
CREATE POLICY "Clients can view own reviews" ON public.client_reviews FOR SELECT TO authenticated USING (client_user_id = auth.uid());
CREATE POLICY "Public can view public reviews" ON public.client_reviews FOR SELECT TO public USING (is_public = true);
CREATE POLICY "Owners manage reviews" ON public.client_reviews FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage reviews" ON public.client_reviews FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- Tabela de gamificação / pontos de fidelidade
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'bronze',
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, barbershop_id)
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own points" ON public.loyalty_points FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners manage points" ON public.loyalty_points FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage points" ON public.loyalty_points FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- Tabela de controle de armazenamento por plano
CREATE TABLE public.storage_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE UNIQUE,
  used_bytes BIGINT NOT NULL DEFAULT 0,
  max_bytes BIGINT NOT NULL DEFAULT 524288000, -- 500MB default
  file_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own storage" ON public.storage_usage FOR SELECT TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Owners update own storage" ON public.storage_usage FOR UPDATE TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage storage" ON public.storage_usage FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- Tabela de configuração de IA por barbearia
CREATE TABLE public.ai_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE UNIQUE,
  response_type TEXT NOT NULL DEFAULT 'text', -- text, audio, auto
  personality TEXT NOT NULL DEFAULT 'friendly', -- formal, friendly, premium
  voice_id TEXT, -- ElevenLabs voice ID
  language TEXT NOT NULL DEFAULT 'pt-BR',
  auto_booking BOOLEAN DEFAULT true,
  auto_register_client BOOLEAN DEFAULT true,
  auto_reactivation BOOLEAN DEFAULT true,
  auto_billing BOOLEAN DEFAULT false,
  greeting_message TEXT DEFAULT 'Olá! Sou o assistente virtual. Como posso ajudar?',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage ai config" ON public.ai_config FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage ai config" ON public.ai_config FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- Tabela de ciclo semanal de mensagens
CREATE TABLE public.message_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}', -- 0=Dom, 6=Sab
  send_time TIME NOT NULL DEFAULT '09:00',
  channel TEXT NOT NULL DEFAULT 'whatsapp', -- whatsapp, sms, notification
  target_audience TEXT NOT NULL DEFAULT 'all', -- all, active, inactive, vip
  message_template TEXT NOT NULL,
  use_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.message_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage schedules" ON public.message_schedules FOR ALL TO authenticated USING (owns_barbershop(auth.uid(), barbershop_id)) WITH CHECK (owns_barbershop(auth.uid(), barbershop_id));
CREATE POLICY "Super admins manage schedules" ON public.message_schedules FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

-- Storage bucket para uploads de mídia
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "Anyone can view media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');
CREATE POLICY "Owners can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');
