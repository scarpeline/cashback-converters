-- =====================================================
-- Mídia de serviços (fotos e vídeos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view service media" ON public.service_media FOR SELECT USING (true);
CREATE POLICY "Owners can manage service media" ON public.service_media FOR ALL USING (
  EXISTS (SELECT 1 FROM public.barbershops WHERE id = service_media.barbershop_id AND owner_user_id = auth.uid())
);

-- =====================================================
-- Produtos digitais (cursos, mentorias, e-books, etc)
-- Usa store_products existente + tabela de conteúdo
-- =====================================================
CREATE TABLE IF NOT EXISTS public.digital_product_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'audio', 'text', 'link')),
  url TEXT,
  body TEXT,
  duration_minutes INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.digital_product_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage digital content" ON public.digital_product_content FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.store_products sp
    JOIN public.barbershops b ON b.id = sp.barbershop_id
    WHERE sp.id = digital_product_content.product_id AND b.owner_user_id = auth.uid()
  )
);
CREATE POLICY "Buyers can view purchased content" ON public.digital_product_content FOR SELECT USING (
  is_free_preview = true OR
  EXISTS (
    SELECT 1 FROM public.store_order_items soi
    JOIN public.store_orders so ON so.id = soi.order_id
    WHERE soi.product_id = digital_product_content.product_id
      AND so.client_user_id = auth.uid()
      AND so.payment_status = 'paid'
  )
);

-- =====================================================
-- Links de cobrança (gerados via Asaas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  billing_type TEXT NOT NULL DEFAULT 'UNDEFINED' CHECK (billing_type IN ('BOLETO','CREDIT_CARD','PIX','UNDEFINED')),
  charge_type TEXT NOT NULL DEFAULT 'DETACHED' CHECK (charge_type IN ('DETACHED','RECURRENT','INSTALLMENT')),
  asaas_link_id TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','expired')),
  expires_at TIMESTAMPTZ,
  max_installments INTEGER DEFAULT 1,
  notify_customer BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage payment links" ON public.payment_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.barbershops WHERE id = payment_links.barbershop_id AND owner_user_id = auth.uid())
);

-- =====================================================
-- Taxas da plataforma (split de produtos digitais)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.store_orders(id),
  product_id UUID REFERENCES public.store_products(id),
  gross_amount DECIMAL(10,2) NOT NULL,
  fixed_fee DECIMAL(10,2) NOT NULL DEFAULT 2.50,
  percentage_fee DECIMAL(10,2) NOT NULL,
  total_fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  asaas_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view own fees" ON public.platform_fees FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.barbershops WHERE id = platform_fees.barbershop_id AND owner_user_id = auth.uid())
);

-- Adicionar colunas em store_products para produtos digitais
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS digital_type TEXT CHECK (digital_type IN ('course','mentoring','ebook','template','other')),
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS video_preview_url TEXT,
  ADD COLUMN IF NOT EXISTS access_duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS max_students INTEGER,
  ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT;
