-- Migration: Sistema de Parcerias e Leads
-- Data: 2026-03-12
-- Descrição: Implementação completa do sistema de parcerias com leads, comissões e regras de atividade

-- Tabela de leads de parceria
CREATE TABLE IF NOT EXISTS leads_parceria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    whatsapp VARCHAR(20) NOT NULL,
    interesse VARCHAR(50) NOT NULL CHECK (interesse IN ('afiliado', 'franqueado', 'diretor_franqueado')),
    ip_address INET,
    user_agent TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    status VARCHAR(50) DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'qualificado', 'convertido', 'perdido')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_contato TIMESTAMP WITH TIME ZONE,
    data_conversao TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    token_demo VARCHAR(255) UNIQUE,
    token_expira TIMESTAMP WITH TIME ZONE,
    demo_acessada BOOLEAN DEFAULT FALSE
);

-- Tabela de parceiros
CREATE TABLE IF NOT EXISTS parceiros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_parceria VARCHAR(50) NOT NULL CHECK (tipo_parceria IN ('afiliado', 'franqueado', 'diretor_franqueado')),
    status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso', 'penalizado')),
    comissao_padrao DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_ultima_indicacao TIMESTAMP WITH TIME ZONE,
    dias_parado INTEGER DEFAULT 0,
    nivel_penalidade INTEGER DEFAULT 0,
    meta_mensual INTEGER DEFAULT 5,
    indicacoes_diretas INTEGER DEFAULT 0,
    indicacoes_indiretas INTEGER DEFAULT 0,
    total_comissoes DECIMAL(12,2) DEFAULT 0.00,
    plano_assinatura VARCHAR(20) DEFAULT 'mensal' CHECK (plano_assinatura IN ('mensal', 'trimestral', 'semestral', 'anual')),
    data_renovacao TIMESTAMP WITH TIME ZONE,
    avisos_enviados TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de comissões
CREATE TABLE IF NOT EXISTS comissoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parceiro_id UUID REFERENCES parceiros(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
    tipo_comissao VARCHAR(50) NOT NULL CHECK (tipo_comissao IN ('adesao', 'recorrente', 'indicacao_direta', 'indicacao_indireta')),
    valor_comissao DECIMAL(10,2) NOT NULL,
    percentual_aplicado DECIMAL(5,2) NOT NULL,
    valor_base DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'paga', 'cancelada')),
    data_comissao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_pagamento TIMESTAMP WITH TIME ZONE,
    data_vencimento TIMESTAMP WITH TIME ZONE,
    periodo_referencia DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de rede de indicações
CREATE TABLE IF NOT EXISTS rede_indicacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parceiro_id UUID REFERENCES parceiros(id) ON DELETE CASCADE,
    indicado_id UUID REFERENCES parceiros(id) ON DELETE CASCADE,
    nivel INTEGER NOT NULL CHECK (nivel IN (1, 2, 3)),
    data_indicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'cancelada')),
    comissao_percentual DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de rankings de parceiros
CREATE TABLE IF NOT EXISTS rankings_parceiros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parceiro_id UUID REFERENCES parceiros(id) ON DELETE CASCADE,
    tipo_ranking VARCHAR(50) NOT NULL CHECK (tipo_ranking IN ('afiliado', 'franqueado', 'diretor_franqueado')),
    posicao INTEGER NOT NULL,
    pontuacao DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    periodo_referencia VARCHAR(20) NOT NULL, -- '2026-03', '2026-03-semana1', etc.
    indicacoes_totais INTEGER DEFAULT 0,
    comissoes_totais DECIMAL(12,2) DEFAULT 0.00,
    meta_batingida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de atividade de parceiros
CREATE TABLE IF NOT EXISTS logs_atividade_parceiros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parceiro_id UUID REFERENCES parceiros(id) ON DELETE CASCADE,
    tipo_acao VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    dados_adicionais JSONB,
    ip_address INET,
    data_acao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de comissões
CREATE TABLE IF NOT EXISTS config_comissoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo_parceria VARCHAR(50) NOT NULL CHECK (tipo_parceria IN ('afiliado', 'franqueado', 'diretor_franqueado')),
    tipo_comissao VARCHAR(50) NOT NULL CHECK (tipo_comissao IN ('adesao', 'recorrente', 'indicacao_direta', 'indicacao_indireta')),
    percentual_padrao DECIMAL(5,2) NOT NULL,
    valor_minimo DECIMAL(10,2) DEFAULT 0.00,
    valor_maximo DECIMAL(10,2),
    regras JSONB,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tipo_parceria, tipo_comissao)
);

-- Tabela de planos de assinatura de parceiros
CREATE TABLE IF NOT EXISTS planos_parceiros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    duracao_meses INTEGER NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    desconto_percentual DECIMAL(5,2) DEFAULT 0.00,
    beneficios JSONB,
    ativo BOOLEAN DEFAULT TRUE,
    ordem_exibicao INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_parceria_email ON leads_parceria(email);
CREATE INDEX IF NOT EXISTS idx_leads_parceria_status ON leads_parceria(status);
CREATE INDEX IF NOT EXISTS idx_leads_parceria_data ON leads_parceria(data_criacao);
CREATE INDEX IF NOT EXISTS idx_parceiros_user_id ON parceiros(user_id);
CREATE INDEX IF NOT EXISTS idx_parceiros_tipo ON parceiros(tipo_parceria);
CREATE INDEX IF NOT EXISTS idx_parceiros_status ON parceiros(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_parceiro ON comissoes(parceiro_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_status ON comissoes(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_data ON comissoes(data_comissao);
CREATE INDEX IF NOT EXISTS idx_rede_parceiro ON rede_indicacoes(parceiro_id);
CREATE INDEX IF NOT EXISTS idx_rede_indicado ON rede_indicacoes(indicado_id);
CREATE INDEX IF NOT EXISTS idx_rankings_tipo ON rankings_parceiros(tipo_ranking);
CREATE INDEX IF NOT EXISTS idx_rankings_periodo ON rankings_parceiros(periodo_referencia);
CREATE INDEX IF NOT EXISTS idx_logs_parceiro ON logs_atividade_parceiros(parceiro_id);
CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_atividade_parceiros(data_acao);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parceiros_updated_at BEFORE UPDATE ON parceiros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rankings_updated_at BEFORE UPDATE ON rankings_parceiros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_comissoes_updated_at BEFORE UPDATE ON config_comissoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planos_parceiros_updated_at BEFORE UPDATE ON planos_parceiros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE leads_parceria ENABLE ROW LEVEL SECURITY;
ALTER TABLE parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rede_indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings_parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_atividade_parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_parceiros ENABLE ROW LEVEL SECURITY;

-- Políticas para leads_parceria
CREATE POLICY "Leads visíveis publicamente para inserção" ON leads_parceria
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Leads visíveis para super admins" ON leads_parceria
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND EXISTS (
                SELECT 1 FROM super_admins 
                WHERE super_admins.user_id = auth.users.id
            )
        )
    );

-- Políticas para parceiros
CREATE POLICY "Parceiros visíveis para si mesmo" ON parceiros
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Parceiros visíveis para super admins" ON parceiros
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND EXISTS (
                SELECT 1 FROM super_admins 
                WHERE super_admins.user_id = auth.users.id
            )
        )
    );

-- Políticas para comissões
CREATE POLICY "Comissões visíveis para parceiro" ON comissoes
    FOR ALL USING (
        parceiro_id IN (
            SELECT id FROM parceiros WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Comissões visíveis para super admins" ON comissoes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND EXISTS (
                SELECT 1 FROM super_admins 
                WHERE super_admins.user_id = auth.users.id
            )
        )
    );

-- Políticas para outras tabelas (apenas super admins)
CREATE POLICY "Rede indicações visível para super admins" ON rede_indicacoes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND EXISTS (
                SELECT 1 FROM super_admins 
                WHERE super_admins.user_id = auth.users.id
            )
        )
    );

CREATE POLICY "Rankings visível para super admins" ON rankings_parceiros
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND EXISTS (
                SELECT 1 FROM super_admins 
                WHERE super_admins.user_id = auth.users.id
            )
        )
    );

CREATE POLICY "Logs visível para super admins" ON logs_atividade_parceiros
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND EXISTS (
                SELECT 1 FROM super_admins 
                WHERE super_admins.user_id = auth.users.id
            )
        )
    );

CREATE POLICY "Config comissões visível publicamente" ON config_comissoes
    FOR SELECT USING (ativo = true);

CREATE POLICY "Config comissões gerenciável por super admins" ON config_comissoes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND EXISTS (
                SELECT 1 FROM super_admins 
                WHERE super_admins.user_id = auth.users.id
            )
        )
    );

CREATE POLICY "Planos visível publicamente" ON planos_parceiros
    FOR SELECT USING (ativo = true);

CREATE POLICY "Planos gerenciável por super admins" ON planos_parceiros
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND EXISTS (
                SELECT 1 FROM super_admins 
                WHERE super_admins.user_id = auth.users.id
            )
        )
    );

-- Inserir configurações padrão de comissões
INSERT INTO config_comissoes (tipo_parceria, tipo_comissao, percentual_padrao, regras) VALUES
('afiliado', 'adesao', 50.00, '{"minimo_indicacoes": 0, "valor_minimo": 0}'),
('afiliado', 'recorrente', 25.00, '{"minimo_indicacoes": 0, "valor_minimo": 0}'),
('franqueado', 'adesao', 65.00, '{"minimo_indicacoes": 0, "valor_minimo": 0}'),
('franqueado', 'recorrente', 0.00, '{"minimo_indicacoes": 0, "valor_minimo": 0}'),
('diretor_franqueado', 'adesao', 0.00, '{"minimo_indicacoes": 0, "valor_minimo": 0}'),
('diretor_franqueado', 'recorrente', 0.00, '{"minimo_indicacoes": 0, "valor_minimo": 0}'),
('diretor_franqueado', 'indicacao_direta', 15.00, '{"minimo_indicacoes": 0, "valor_minimo": 0}'),
('diretor_franqueado', 'indicacao_indireta', 10.00, '{"minimo_indicacoes": 0, "valor_minimo": 0}')
ON CONFLICT (tipo_parceria, tipo_comissao) DO NOTHING;

-- Inserir planos de assinatura
INSERT INTO planos_parceiros (nome, duracao_meses, preco, desconto_percentual, beneficios, ordem_exibicao) VALUES
('Mensal', 1, 97.00, 0.00, '{"suporte_basico": true, "relatorios_simples": true}', 1),
('Trimestral', 3, 267.30, 8.00, '{"suporte_prioritario": true, "relatorios_completos": true, "webinars_exclusivos": true}', 2),
('Semestral', 6, 511.20, 12.00, '{"suporte_prioritario": true, "relatorios_completos": true, "webinars_exclusivos": true, "consultoria_mensal": true}', 3),
('Anual', 12, 931.40, 20.00, '{"suporte_dedicado": true, "relatorios_avancados": true, "eventos_exclusivos": true, "consultoria_quinzenal": true, "co_branding": true}', 4)
ON CONFLICT DO NOTHING;

-- Função para calcular penalidades de atividade
CREATE OR REPLACE FUNCTION calcular_penalidade_atividade(
    p_parceiro_id UUID,
    p_dias_parado INTEGER
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_penalidade DECIMAL(5,2) := 0.00;
BEGIN
    -- Regras de penalidade
    IF p_dias_parado >= 40 AND p_dias_parado < 60 THEN
        v_penalidade := 10.00;
    ELSIF p_dias_parado >= 60 AND p_dias_parado < 90 THEN
        v_penalidade := 15.00;
    ELSIF p_dias_parado >= 90 AND p_dias_parado < 120 THEN
        v_penalidade := 25.00;
    ELSIF p_dias_parado >= 120 THEN
        v_penalidade := 40.00 + ((p_dias_parado - 120) / 30 * 10.00);
        -- Limitar a 90%
        IF v_penalidade > 90.00 THEN
            v_penalidade := 90.00;
        END IF;
    END IF;
    
    RETURN v_penalidade;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar token de demo
CREATE OR REPLACE FUNCTION gerar_token_demo(p_lead_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_token VARCHAR(255);
    v_expira TIMESTAMP WITH TIME ZONE;
BEGIN
    v_token := encode(decode(md5(p_lead_id::TEXT || NOW()::TEXT), 'hex'), 'base64');
    v_expira := NOW() + INTERVAL '24 hours';
    
    UPDATE leads_parceria 
    SET token_demo = v_token, token_expira = v_expira
    WHERE id = p_lead_id;
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- Função para validar token de demo
CREATE OR REPLACE FUNCTION validar_token_demo(p_token VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_valido BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM leads_parceria 
        WHERE token_demo = p_token 
        AND token_expira > NOW()
        AND demo_acessada = FALSE
    ) INTO v_valido;
    
    IF v_valido THEN
        UPDATE leads_parceria 
        SET demo_acessada = TRUE 
        WHERE token_demo = p_token;
    END IF;
    
    RETURN v_valido;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE leads_parceria IS 'Leads de parceria capturados na landing page';
COMMENT ON TABLE parceiros IS 'Parceiros afiliados, franqueados e diretores';
COMMENT ON TABLE comissoes IS 'Comissões geradas pelos parceiros';
COMMENT ON TABLE rede_indicacoes IS 'Rede de indicações entre parceiros';
COMMENT ON TABLE rankings_parceiros IS 'Rankings mensais de performance dos parceiros';
COMMENT ON TABLE logs_atividade_parceiros IS 'Logs de atividade dos parceiros';
COMMENT ON TABLE config_comissoes IS 'Configurações de comissões do sistema';
COMMENT ON TABLE planos_parceiros IS 'Planos de assinatura para parceiros';
