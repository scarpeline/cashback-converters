-- Sistema de Feature Flags - Controle Central de Módulos
-- Criada em: 2026-03-11
-- Objetivo: Controlar ativação/desativação de módulos avançados sem quebrar sistema existente

-- Tabela de controle de features
CREATE TABLE IF NOT EXISTS public.system_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key TEXT NOT NULL UNIQUE,
    feature_name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir features iniciais (desativadas por padrão)
INSERT INTO public.system_features (feature_key, feature_name, description) VALUES
    ('franchise_system', 'Sistema de Franquias', 'Permite cadastro e gestão de franqueados'),
    ('master_system', 'Sistema de Masters', 'Permite recrutamento de rede de franqueados'),
    ('backup_system', 'Backup Automático', 'Backup diário criptografado do banco de dados'),
    ('antifraud_system', 'Sistema Anti-Fraude', 'Detecção automática de atividades suspeitas'),
    ('growth_intelligence', 'Inteligência de Crescimento', 'Análise avançada de métricas e insights'),
    ('advanced_security', 'Segurança Avançada', 'Logs de segurança e monitoramento avançado'),
    ('video_sales_pages', 'Páginas de Venda com Vídeo', 'Páginas de venda com vídeos configuráveis'),
    ('commission_system', 'Sistema de Comissões Avançado', 'Cálculo automático de comissões em cascata'),
    ('regional_analysis', 'Análise Regional', 'Análise de mercado por cidade/estado'),
    ('affiliate_network', 'Rede de Afiliados Avançada', 'Gestão completa de rede de afiliados')
ON CONFLICT (feature_key) DO NOTHING;

-- Função global para verificar se feature está ativa
CREATE OR REPLACE FUNCTION public.is_feature_enabled(p_feature_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.system_features 
        WHERE feature_key = p_feature_key 
        AND enabled = true
    );
END;
$$;

-- Função para ativar/desativar feature (super admin only)
CREATE OR REPLACE FUNCTION public.toggle_feature(p_feature_key TEXT, p_enabled BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se é super admin
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: apenas super admin pode alterar features';
    END IF;
    
    UPDATE public.system_features 
    SET enabled = p_enabled, updated_at = now()
    WHERE feature_key = p_feature_key;
    
    RETURN FOUND;
END;
$$;

-- Função para listar todas as features (super admin only)
CREATE OR REPLACE FUNCTION public.get_all_features()
RETURNS TABLE (
    id UUID,
    feature_key TEXT,
    feature_name TEXT,
    description TEXT,
    enabled BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se é super admin
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: apenas super admin pode ver features';
    END IF;
    
    RETURN QUERY
    SELECT sf.id, sf.feature_key, sf.feature_name, sf.description, sf.enabled, sf.created_at, sf.updated_at
    FROM public.system_features sf
    ORDER BY sf.feature_name;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_system_features_updated_at
    BEFORE UPDATE ON public.system_features
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Políticas RLS
ALTER TABLE public.system_features ENABLE ROW LEVEL SECURITY;

-- Apenas super admins podem ver features
CREATE POLICY "Super admins can view features" ON public.system_features
    FOR SELECT USING (is_super_admin(auth.uid()));

-- Apenas super admins podem atualizar features
CREATE POLICY "Super admins can update features" ON public.system_features
    FOR UPDATE USING (is_super_admin(auth.uid()));

-- Ninguém pode inserir diretamente (apenas via migração)

-- Comentários
COMMENT ON TABLE public.system_features IS 'Controle central de features do sistema';
COMMENT ON FUNCTION public.is_feature_enabled IS 'Verifica se uma feature está ativa';
COMMENT ON FUNCTION public.toggle_feature IS 'Ativa/desativa uma feature (super admin only)';
COMMENT ON FUNCTION public.get_all_features IS 'Lista todas as features (super admin only)';
