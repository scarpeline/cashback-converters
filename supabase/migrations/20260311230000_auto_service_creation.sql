-- Migração para Criação Automática de Serviços Padrão
-- Criada em: 2026-03-11
-- Objetivo: Criar serviços padrão automaticamente ao criar nova barbearia

-- Tabela para templates de serviços padrão
CREATE TABLE IF NOT EXISTS public.default_service_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category TEXT DEFAULT 'hair' CHECK (category IN ('hair', 'beard', 'combo', 'treatment', 'other')),
    is_popular BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    icon_name TEXT DEFAULT 'scissors',
    color_hex TEXT DEFAULT '#000000',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para configurações de criação automática por barbearia
CREATE TABLE IF NOT EXISTS public.barbershop_service_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    auto_create_services BOOLEAN DEFAULT true,
    use_default_templates BOOLEAN DEFAULT true,
    custom_templates JSONB DEFAULT '{}',
    price_multiplier DECIMAL(3,2) DEFAULT 1.0,
    duration_multiplier DECIMAL(3,2) DEFAULT 1.0,
    exclude_categories TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(barbershop_id)
);

-- Tabela para logs de criação de serviços
CREATE TABLE IF NOT EXISTS public.service_creation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.default_service_templates(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    creation_type TEXT NOT NULL CHECK (creation_type IN ('auto', 'manual', 'import')),
    original_price DECIMAL(10,2),
    adjusted_price DECIMAL(10,2),
    original_duration INTEGER,
    adjusted_duration INTEGER,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_default_service_templates_updated_at
    BEFORE UPDATE ON public.default_service_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_barbershop_service_config_updated_at
    BEFORE UPDATE ON public.barbershop_service_config
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar serviços padrão para uma barbearia
CREATE OR REPLACE FUNCTION public.create_default_services(
    p_barbershop_id UUID,
    p_price_multiplier DECIMAL(3,2) DEFAULT 1.0,
    p_duration_multiplier DECIMAL(3,2) DEFAULT 1.0,
    p_exclude_categories TEXT[] DEFAULT '{}'
)
RETURNS TABLE(
    services_created INTEGER,
    services_updated INTEGER,
    errors TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_template RECORD;
    v_created_count INTEGER := 0;
    v_updated_count INTEGER := 0;
    v_errors TEXT[] := '{}';
    v_existing_service UUID;
    v_new_price DECIMAL(10,2);
    v_new_duration INTEGER;
BEGIN
    -- Verificar se a barbearia existe
    IF NOT EXISTS (SELECT 1 FROM public.barbershops WHERE id = p_barbershop_id) THEN
        v_errors := array_append(v_errors, 'Barbearia não encontrada');
        RETURN QUERY SELECT 0, 0, v_errors;
    END IF;
    
    -- Buscar templates padrão
    FOR v_template IN 
        SELECT * FROM public.default_service_templates
        WHERE is_required = true
        OR (SELECT COUNT(*) FROM public.barbershops WHERE id = p_barbershop_id AND created_at > NOW() - INTERVAL '7 days') > 0
        ORDER BY display_order, service_name
    LOOP
        -- Verificar se deve excluir esta categoria
        IF p_exclude_categories IS NOT NULL AND v_template.category = ANY(p_exclude_categories) THEN
            CONTINUE;
        END IF;
        
        -- Calcular preço e duração ajustados
        v_new_price := v_template.price * p_price_multiplier;
        v_new_duration := v_template.duration_minutes * p_duration_multiplier;
        
        -- Verificar se serviço já existe
        SELECT id INTO v_existing_service
        FROM public.services
        WHERE barbershop_id = p_barbershop_id
        AND LOWER(name) = LOWER(v_template.service_name)
        LIMIT 1;
        
        IF v_existing_service IS NOT NULL THEN
            -- Atualizar serviço existente
            UPDATE public.services
            SET 
                description = COALESCE(v_template.description, description),
                price = v_new_price,
                duration_minutes = v_new_duration,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_existing_service;
            
            v_updated_count := v_updated_count + 1;
            
            -- Registrar log de atualização
            INSERT INTO public.service_creation_logs (
                barbershop_id,
                template_id,
                service_id,
                creation_type,
                original_price,
                adjusted_price,
                original_duration,
                adjusted_duration
            ) VALUES (
                p_barbershop_id,
                v_template.id,
                v_existing_service,
                'auto',
                v_template.price,
                v_new_price,
                v_template.duration_minutes,
                v_new_duration
            );
        ELSE
            -- Criar novo serviço
            INSERT INTO public.services (
                barbershop_id,
                name,
                description,
                price,
                duration_minutes,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                p_barbershop_id,
                v_template.service_name,
                v_template.description,
                v_new_price,
                v_new_duration,
                true,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            ) RETURNING id INTO v_existing_service;
            
            v_created_count := v_created_count + 1;
            
            -- Registrar log de criação
            INSERT INTO public.service_creation_logs (
                barbershop_id,
                template_id,
                service_id,
                creation_type,
                original_price,
                adjusted_price,
                original_duration,
                adjusted_duration
            ) VALUES (
                p_barbershop_id,
                v_template.id,
                v_existing_service,
                'auto',
                v_template.price,
                v_new_price,
                v_template.duration_minutes,
                v_new_duration
            );
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT v_created_count, v_updated_count, v_errors;
END;
$$;

-- Função para inicializar templates de serviços padrão
CREATE OR REPLACE FUNCTION public.initialize_default_service_templates()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_templates_count INTEGER := 0;
BEGIN
    -- Inserir templates padrão se não existirem
    INSERT INTO public.default_service_templates (
        service_name,
        description,
        price,
        duration_minutes,
        category,
        is_popular,
        is_required,
        display_order,
        icon_name,
        color_hex,
        tags
    ) VALUES
    -- Serviços de Cabelo
    ('Corte Masculino', 'Corte de cabelo tradicional com máquina ou tesoura', 35.00, 30, 'hair', true, true, 1, 'scissors', '#2563eb', ARRAY['corte', 'masculino', 'tradicional']),
    ('Corte Degradê', 'Corte com degradê moderno e acabamento perfeito', 45.00, 45, 'hair', true, false, 2, 'trending-up', '#7c3aed', ARRAY['corte', 'degrade', 'moderno']),
    ('Corte Infantil', 'Corte especial para crianças com paciência extra', 25.00, 20, 'hair', false, false, 3, 'users', '#10b981', ARRAY['corte', 'infantil', 'kids']),
    ('Pigmentação', 'Aplicação de pigmento para cobertura de cabelos brancos', 30.00, 20, 'hair', false, false, 4, 'droplet', '#f59e0b', ARRAY['pigmentacao', 'cobertura', 'brancos']),
    
    -- Serviços de Barba
    ('Barba Completa', 'Barba completa com navalha e toalha quente', 25.00, 30, 'beard', true, true, 5, 'shield', '#059669', ARRAY['barba', 'navalha', 'completa']),
    ('Barba Máquina', 'Barba feita com máquina para acabamento rápido', 15.00, 15, 'beard', false, false, 6, 'zap', '#64748b', ARRAY['barba', 'maquina', 'rapido']),
    ('Alinhamento de Barba', 'Apenas alinhamento e detalhamento da barba', 10.00, 10, 'beard', false, false, 7, 'align-left', '#8b5cf6', ARRAY['barba', 'alinhamento', 'detalhe']),
    ('Hidratação de Barba', 'Tratamento hidratante para barba e pele', 20.00, 15, 'beard', false, false, 8, 'droplets', '#06b6d4', ARRAY['barba', 'hidratacao', 'tratamento']),
    
    -- Serviços Combinados
    ('Corte + Barba', 'Pacote completo: corte e barba com desconto', 55.00, 60, 'combo', true, true, 9, 'package', '#dc2626', ARRAY['combo', 'pacote', 'economia']),
    ('Corte + Sobrancelha', 'Corte com design de sobrancelha', 50.00, 50, 'combo', false, false, 10, 'eye', '#ea580c', ARRAY['combo', 'sobrancelha', 'design']),
    ('Barba + Sobrancelha', 'Barba completa com sobrancelha alinhada', 35.00, 40, 'combo', false, false, 11, 'eye-off', '#0d9488', ARRAY['combo', 'barba', 'sobrancelha']),
    ('Serviço Completo', 'Corte + Barba + Sobrancelha + Pigmentação', 80.00, 90, 'combo', true, false, 12, 'star', '#7c2d12', ARRAY['combo', 'completo', 'premium']),
    
    -- Sobrancelha
    ('Sobrancelha Masculina', 'Design e alinhamento de sobrancelha masculina', 20.00, 20, 'other', false, false, 13, 'eye', '#9333ea', ARRAY['sobrancelha', 'design', 'masculina']),
    ('Sobrancelha Infantil', 'Sobrancelha cuidadosa para crianças', 15.00, 15, 'other', false, false, 14, 'users-2', '#ec4899', ARRAY['sobrancelha', 'infantil', 'kids']),
    
    -- Tratamentos
    ('Limpeza de Pele', 'Limpeza profunda com produtos especiais', 30.00, 30, 'treatment', false, false, 15, 'sparkles', '#0891b2', ARRAY['tratamento', 'limpeza', 'pele']),
    ('Máscara Capilar', 'Tratamento de hidratação capilar intensiva', 40.00, 25, 'treatment', false, false, 16, 'heart', '#e11d48', ARRAY['tratamento', 'mascara', 'hidratacao']),
    ('Relaxamento', 'Massagem relaxante no couro cabeludo', 35.00, 20, 'treatment', false, false, 17, 'wind', '#0ea5e9', ARRAY['tratamento', 'massagem', 'relaxamento']),
    
    -- Outros
    ('Pezinho', 'Aparar e cuidar dos pés', 20.00, 20, 'other', false, false, 18, 'footprints', '#84cc16', ARRAY['pezinho', 'pes', 'cuidado']),
    ('Bigode', 'Modelar e alinhar bigode', 15.00, 15, 'other', false, false, 19, 'mustache', '#f97316', ARRAY['bigode', 'modelagem', 'alinhamento'])
    ON CONFLICT (service_name) DO NOTHING;
    
    GET DIAGNOSTICS v_templates_count = ROW_COUNT;
    
    RETURN v_templates_count;
END;
$$;

-- Função para criar serviços personalizados baseados em configuração
CREATE OR REPLACE FUNCTION public.create_custom_services(
    p_barbershop_id UUID,
    p_custom_templates JSONB
)
RETURNS TABLE(
    services_created INTEGER,
    errors TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_template JSONB;
    v_service_name TEXT;
    v_description TEXT;
    v_price DECIMAL(10,2);
    v_duration INTEGER;
    v_created_count INTEGER := 0;
    v_errors TEXT[] := '{}';
    v_existing_service UUID;
BEGIN
    -- Processar cada template personalizado
    FOR v_template IN SELECT * FROM jsonb_array_elements(p_custom_templates)
    LOOP
        v_service_name := v_template->>'service_name';
        v_description := v_template->>'description';
        v_price := (v_template->>'price')::DECIMAL(10,2);
        v_duration := (v_template->>'duration_minutes')::INTEGER;
        
        -- Validar dados obrigatórios
        IF v_service_name IS NULL OR v_price IS NULL OR v_duration IS NULL THEN
            v_errors := array_append(v_errors, 'Template inválido: ' || COALESCE(v_service_name, 'sem nome'));
            CONTINUE;
        END IF;
        
        -- Verificar se já existe
        SELECT id INTO v_existing_service
        FROM public.services
        WHERE barbershop_id = p_barbershop_id
        AND LOWER(name) = LOWER(v_service_name)
        LIMIT 1;
        
        IF v_existing_service IS NULL THEN
            -- Criar novo serviço
            INSERT INTO public.services (
                barbershop_id,
                name,
                description,
                price,
                duration_minutes,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                p_barbershop_id,
                v_service_name,
                v_description,
                v_price,
                v_duration,
                true,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            ) RETURNING id INTO v_existing_service;
            
            v_created_count := v_created_count + 1;
            
            -- Registrar log
            INSERT INTO public.service_creation_logs (
                barbershop_id,
                service_id,
                creation_type,
                original_price,
                adjusted_price,
                original_duration,
                adjusted_duration
            ) VALUES (
                p_barbershop_id,
                v_existing_service,
                'manual',
                v_price,
                v_price,
                v_duration,
                v_duration
            );
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT v_created_count, v_errors;
END;
$$;

-- Trigger automático para criar serviços quando nova barbearia é criada
CREATE OR REPLACE FUNCTION public.auto_create_services_on_barbershop_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar configuração padrão
    INSERT INTO public.barbershop_service_config (
        barbershop_id,
        auto_create_services,
        use_default_templates,
        price_multiplier,
        duration_multiplier
    ) VALUES (
        NEW.id,
        true,
        true,
        1.0,
        1.0
    );
    
    -- Criar serviços padrão
    PERFORM public.create_default_services(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
CREATE TRIGGER auto_create_services_trigger
    AFTER INSERT ON public.barbershops
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_create_services_on_barbershop_creation();

-- Função para recriar serviços com base em configuração atualizada
CREATE OR REPLACE FUNCTION public.recreate_services_from_config(
    p_barbershop_id UUID
)
RETURNS TABLE(
    services_created INTEGER,
    services_updated INTEGER,
    errors TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_config RECORD;
    v_result RECORD;
BEGIN
    -- Buscar configuração da barbearia
    SELECT * INTO v_config
    FROM public.barbershop_service_config
    WHERE barbershop_id = p_barbershop_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, 0, ARRAY['Configuração não encontrada'];
    END IF;
    
    -- Se usa templates padrão
    IF v_config.use_default_templates THEN
        SELECT * INTO v_result
        FROM public.create_default_services(
            p_barbershop_id,
            v_config.price_multiplier,
            v_config.duration_multiplier,
            v_config.exclude_categories
        );
    END IF;
    
    -- Se tem templates personalizados
    IF v_config.custom_templates IS NOT NULL AND jsonb_array_length(v_config.custom_templates) > 0 THEN
        SELECT * INTO v_result
        FROM public.create_custom_services(p_barbershop_id, v_config.custom_templates);
    END IF;
    
    RETURN QUERY SELECT 
        COALESCE(v_result.services_created, 0),
        COALESCE(v_result.services_updated, 0),
        COALESCE(v_result.errors, ARRAY[]::TEXT[]);
END;
$$;

-- Função para obter estatísticas de criação de serviços
CREATE OR REPLACE FUNCTION public.get_service_creation_stats(
    p_barbershop_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_services INTEGER,
    auto_created INTEGER,
    manually_created INTEGER,
    from_templates INTEGER,
    last_created_at TIMESTAMPTZ,
    most_common_category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH service_stats AS (
        SELECT 
            COUNT(*) as total_services,
            COUNT(*) FILTER (WHERE scl.creation_type = 'auto') as auto_created,
            COUNT(*) FILTER (WHERE scl.creation_type = 'manual') as manually_created,
            COUNT(*) FILTER (WHERE scl.template_id IS NOT NULL) as from_templates,
            MAX(scl.created_at) as last_created_at,
            (SELECT mode() WITHIN GROUP (ORDER BY dst.category) 
             FROM public.services s 
             LEFT JOIN public.service_creation_logs scl ON s.id = scl.service_id
             LEFT JOIN public.default_service_templates dst ON scl.template_id = dst.id
             WHERE s.barbershop_id = COALESCE(p_barbershop_id, s.barbershop_id)
             AND dst.category IS NOT NULL) as most_common_category
        FROM public.services s
        LEFT JOIN public.service_creation_logs scl ON s.id = scl.service_id
        WHERE (p_barbershop_id IS NULL OR s.barbershop_id = p_barbershop_id)
    )
    SELECT * FROM service_stats;
END;
$$;

-- Políticas RLS
ALTER TABLE public.default_service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_service_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_creation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para default_service_templates (apenas super admins)
CREATE POLICY "Super admins podem gerenciar templates" ON public.default_service_templates
    FOR ALL USING (is_super_admin(auth.uid()));

-- Políticas para barbershop_service_config
CREATE POLICY "Donos podem gerenciar configurações de sua barbearia" ON public.barbershop_service_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops 
            WHERE id = barbershop_id 
            AND owner_user_id = auth.uid()
        )
    );

-- Políticas para service_creation_logs
CREATE POLICY "Donos podem ver logs de sua barbearia" ON public.service_creation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.barbershops 
            WHERE id = barbershop_id 
            AND owner_user_id = auth.uid()
        )
    );

-- Inicializar templates padrão
SELECT public.initialize_default_service_templates();

-- Comentários
COMMENT ON TABLE public.default_service_templates IS 'Templates de serviços padrão para criação automática';
COMMENT ON TABLE public.barbershop_service_config IS 'Configurações de criação automática de serviços por barbearia';
COMMENT ON TABLE public.service_creation_logs IS 'Histórico de criação e atualização de serviços';
