-- Migration: Sistema de Loja Interna
-- Data: 2026-03-19
-- Funcionalidades:
--   - Venda de produtos
--   - Venda de cursos
--   - Pacotes de serviços
--   - Gestão de estoque
--   - Processamento de pedidos

-- =====================================================
-- TABELA: store_products
-- Produtos vendidos na loja interna
-- =====================================================
CREATE TABLE IF NOT EXISTS public.store_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    cost DECIMAL(10,2) DEFAULT 0,
    sku TEXT,
    barcode TEXT,
    category TEXT,
    product_type TEXT NOT NULL CHECK (product_type IN ('product', 'course', 'package')),
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    stock_quantity INTEGER DEFAULT 0,
    stock_alert_threshold INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    weight_kg DECIMAL(10,2),
    dimensions JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_products_barbershop ON public.store_products(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_store_products_type ON public.store_products(product_type);
CREATE INDEX IF NOT EXISTS idx_store_products_category ON public.store_products(category);
CREATE INDEX IF NOT EXISTS idx_store_products_active ON public.store_products(is_active);

-- =====================================================
-- TABELA: store_orders
-- Pedidos realizados na loja
-- =====================================================
CREATE TABLE IF NOT EXISTS public.store_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
    payment_id TEXT,
    paid_at TIMESTAMPTZ,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    shipping_address JSONB,
    notes TEXT,
    referral_source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_orders_barbershop ON public.store_orders(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_client ON public.store_orders(client_user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_orders_payment_status ON public.store_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_store_orders_created ON public.store_orders(created_at DESC);

-- =====================================================
-- TABELA: store_order_items
-- Itens de cada pedido
-- =====================================================
CREATE TABLE IF NOT EXISTS public.store_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.store_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    discounts JSONB DEFAULT '[]'::jsonb,
    is_delivered BOOLEAN DEFAULT false,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_order_items_order ON public.store_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_store_order_items_product ON public.store_order_items(product_id);

-- =====================================================
-- TABELA: store_packages
-- Pacotes de serviços (10 sessões, 4 cortes, etc)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.store_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    package_type TEXT NOT NULL CHECK (package_type IN ('sessions', 'monthly', 'prepaid')),
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_sessions INTEGER NOT NULL,
    remaining_sessions INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    validity_days INTEGER NOT NULL DEFAULT 90,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    max_purchases_per_client INTEGER,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_packages_barbershop ON public.store_packages(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_store_packages_type ON public.store_packages(package_type);
CREATE INDEX IF NOT EXISTS idx_store_packages_active ON public.store_packages(is_active);

-- =====================================================
-- TABELA: client_packages
-- Pacotes adquiridos pelos clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.client_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.store_packages(id) ON DELETE RESTRICT,
    purchase_order_id UUID REFERENCES public.store_orders(id) ON DELETE SET NULL,
    remaining_sessions INTEGER NOT NULL,
    total_sessions INTEGER NOT NULL,
    original_value DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'exhausted', 'cancelled')),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    used_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_packages_client ON public.client_packages(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_packages_barbershop ON public.client_packages(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_client_packages_status ON public.client_packages(status);

-- =====================================================
-- TABELA: client_package_usage
-- Histórico de uso de pacotes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.client_package_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_package_id UUID NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    session_number INTEGER NOT NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_package_usage_package ON public.client_package_usage(client_package_id);

-- =====================================================
-- TABELA: store_categories
-- Categorias de produtos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.store_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.store_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_store_categories_barbershop ON public.store_categories(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_parent ON public.store_categories(parent_id);

-- =====================================================
-- TABELA: store_coupons
-- Cupons de desconto
-- =====================================================
CREATE TABLE IF NOT EXISTS public.store_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    per_client_limit INTEGER DEFAULT 1,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    applicable_products JSONB DEFAULT '[]'::jsonb,
    applicable_categories JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_coupons_barbershop ON public.store_coupons(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_store_coupons_code ON public.store_coupons(code);
CREATE INDEX IF NOT EXISTS idx_store_coupons_active ON public.store_coupons(is_active);

-- =====================================================
-- TABELA: store_cart
-- Carrinho de compras temporário
-- =====================================================
CREATE TABLE IF NOT EXISTS public.store_cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    coupon_code TEXT,
    coupon_discount DECIMAL(10,2) DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_cart_client ON public.store_cart(client_user_id);
CREATE INDEX IF NOT EXISTS idx_store_cart_expires ON public.store_cart(expires_at);

-- =====================================================
-- HABILITAR RLS NAS NOVAS TABELAS
-- =====================================================
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_package_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_cart ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES RLS - store_products
-- =====================================================
CREATE POLICY "Public can view active products" ON public.store_products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage products" ON public.store_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = store_products.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

-- =====================================================
-- POLICIES RLS - store_orders
-- =====================================================
CREATE POLICY "Clients can view own orders" ON public.store_orders
    FOR SELECT USING (client_user_id = auth.uid());

CREATE POLICY "Owners can view orders" ON public.store_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = store_orders.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can create orders" ON public.store_orders
    FOR INSERT WITH CHECK (client_user_id = auth.uid());

-- =====================================================
-- POLICIES RLS - client_packages
-- =====================================================
CREATE POLICY "Clients can view own packages" ON public.client_packages
    FOR SELECT USING (client_user_id = auth.uid());

CREATE POLICY "Owners can manage packages" ON public.client_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = client_packages.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para gerar número de pedido
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('store_orders_seq')::TEXT, 6, '0');
END;
$$;

CREATE SEQUENCE IF NOT EXISTS store_orders_seq START 1;

-- Função para verificar e expirar pacotes
CREATE OR REPLACE FUNCTION public.expire_client_packages()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.client_packages
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < now();
END;
$$;

-- Função para decrementar sessões do pacote
CREATE OR REPLACE FUNCTION public.use_package_session(p_client_package_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_package client_packages%ROWTYPE;
BEGIN
    SELECT * INTO v_package FROM client_packages WHERE id = p_client_package_id;

    IF v_package.remaining_sessions > 0 THEN
        UPDATE client_packages
        SET
            remaining_sessions = remaining_sessions - 1,
            used_sessions = used_sessions + 1,
            last_used_at = now(),
            status = CASE
                WHEN remaining_sessions - 1 = 0 THEN 'exhausted'
                WHEN expires_at < now() THEN 'expired'
                ELSE 'active'
            END
        WHERE id = p_client_package_id;

        INSERT INTO public.client_package_usage (client_package_id, session_number)
        VALUES (p_client_package_id, v_package.used_sessions + 1);
    END IF;
END;
$$;

-- Trigger para criar carrinho ao criar usuário
CREATE OR REPLACE FUNCTION public.create_user_cart()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.store_cart (client_user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_user_cart
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_cart();

-- =====================================================
-- DADOS INICIAIS - Categorias padrão
-- =====================================================
-- INSERT INTO public.store_categories (barbershop_id, name, slug, sort_order)
-- SELECT id, 'Produtos', 'produtos', 1 FROM public.barbershops;
-- INSERT INTO public.store_categories (barbershop_id, name, slug, sort_order)
-- SELECT id, 'Cursos', 'cursos', 2 FROM public.barbershops;
