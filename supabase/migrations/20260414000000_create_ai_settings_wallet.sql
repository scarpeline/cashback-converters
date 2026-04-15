-- Migration: Configurações de IA e Carteira Separada
-- Data: 2026-04-14
-- Criação de uma tabela isolada para armazenar de forma segura o saldo de IA e as chaves de API

CREATE TABLE IF NOT EXISTS public.barbershop_ai_settings (
    barbershop_id UUID PRIMARY KEY REFERENCES public.barbershops(id) ON DELETE CASCADE,
    ai_enabled BOOLEAN NOT NULL DEFAULT false,
    use_platform_ai BOOLEAN NOT NULL DEFAULT false,
    
    -- Carteira de Créditos Exclusiva para a IA
    ai_credits_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ai_cost_per_message DECIMAL(5,2) NOT NULL DEFAULT 0.05,
    
    -- Cascata de Fallback de IAs (Traga sua Chave ou Plataforma)
    ai_providers_cascade JSONB NOT NULL DEFAULT '["gemini", "groq", "openai"]'::jsonb,
    
    -- Chave do assinante (se ele decidir pagar direto para a OpenAI/Gemini e fugir das taxas)
    ai_subscriber_key TEXT,
    
    -- Contexto da barbearia ("aja como uma secretária descontraída", "seja formal")
    ai_prompt_context TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SEGURANÇA E RLS (Row Level Security)
-- =====================================================
-- Diferente da barbershops, esta tabela NÃO pode ser lida publicamente devido a chaves de API.
ALTER TABLE public.barbershop_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own AI settings" ON public.barbershop_ai_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops
            WHERE barbershops.id = barbershop_ai_settings.barbershop_id
            AND barbershops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can manage all AI settings" ON public.barbershop_ai_settings
    FOR ALL USING (public.is_super_admin(auth.uid()));

-- =====================================================
-- TRIGGERS E FUNÇÕES AUXILIARES
-- =====================================================
-- Mantém a coluna updated_at sincronizada
CREATE TRIGGER set_barbershop_ai_settings_updated_at BEFORE UPDATE ON public.barbershop_ai_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Cria as configurações padrões de IA assim que uma nova barbearia se cadastrar
CREATE OR REPLACE FUNCTION public.create_default_ai_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.barbershop_ai_settings (barbershop_id)
    VALUES (NEW.id)
    ON CONFLICT (barbershop_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_ai_settings
    AFTER INSERT ON public.barbershops
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_ai_settings();

-- =====================================================
-- DADOS INICIAIS DE MIGRAÇÃO
-- =====================================================
-- Cria as configurações para as barbearias que já estão cadastradas hoje no sistema
INSERT INTO public.barbershop_ai_settings (barbershop_id)
SELECT id FROM public.barbershops
ON CONFLICT (barbershop_id) DO NOTHING;
