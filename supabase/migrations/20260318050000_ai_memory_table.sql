-- Tabela de memória da IA para histórico de conversas
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  intent text DEFAULT 'unknown',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_memory_client_id ON public.ai_memory(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_created_at ON public.ai_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_intent ON public.ai_memory(intent);

-- Super admins podem ver tudo
CREATE POLICY "Super admins can view ai_memory"
  ON public.ai_memory FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Qualquer autenticado pode inserir
CREATE POLICY "Authenticated can insert ai_memory"
  ON public.ai_memory FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Super admins podem deletar
CREATE POLICY "Super admins can delete ai_memory"
  ON public.ai_memory FOR DELETE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));
