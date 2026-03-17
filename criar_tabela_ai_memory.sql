-- ============================================================================
-- TABELA: ai_memory (Memória da IA)
-- ============================================================================
-- Armazena histórico de conversas para a IA aprender com o tempo
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  intent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_memory_client_id ON public.ai_memory(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_created_at ON public.ai_memory(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_memory_intent ON public.ai_memory(intent);

-- RLS (Row Level Security)
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY IF NOT EXISTS "Users can view own AI memory"
ON public.ai_memory FOR SELECT
USING (client_id = auth.uid());

CREATE POLICY IF NOT EXISTS "System can insert AI memory"
ON public.ai_memory FOR INSERT
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Super admins can view all AI memory"
ON public.ai_memory FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- ============================================================================
-- FUNÇÃO: Limpar histórico antigo automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_ai_memory()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  -- Deletar registros com mais de 90 dias
  DELETE FROM public.ai_memory
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
/*
-- Verificar se a tabela foi criada
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'ai_memory' 
  AND table_schema = 'public'
) as tabela_criada;

-- Verificar estrutura
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_memory'
ORDER BY ordinal_position;
*/