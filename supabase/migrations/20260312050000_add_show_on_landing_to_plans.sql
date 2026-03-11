-- Adicionar coluna show_on_landing na tabela subscription_plans
-- Criada em: 2026-03-12
-- Objetivo: Permitir controlar visibilidade dos planos na landing page

-- Verificar se a tabela existe antes de adicionar a coluna
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans'
    ) THEN
        -- Adicionar coluna show_on_landing se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'subscription_plans' 
            AND column_name = 'show_on_landing'
        ) THEN
            ALTER TABLE public.subscription_plans 
            ADD COLUMN show_on_landing BOOLEAN DEFAULT true;
            
            -- Atualizar planos existentes para serem visíveis por padrão
            UPDATE public.subscription_plans 
            SET show_on_landing = true 
            WHERE show_on_landing IS NULL;
            
            -- Adicionar comentário na coluna
            COMMENT ON COLUMN public.subscription_plans.show_on_landing IS 'Indica se o plano deve ser exibido na landing page para novos clientes';
        END IF;
    END IF;
END $$;

-- Criar índice para melhor performance
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans'
    ) THEN
        -- Criar índice se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename = 'subscription_plans' 
            AND indexname = 'idx_subscription_plans_show_on_landing'
        ) THEN
            CREATE INDEX idx_subscription_plans_show_on_landing 
            ON public.subscription_plans(show_on_landing);
        END IF;
    END IF;
END $$;
