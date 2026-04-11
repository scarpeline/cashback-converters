-- =============================================
-- Migration: Contas a Pagar/Receber + Fichas de Anamnese
-- Created: 2026-04-11
-- =============================================

-- Tabela de Contas a Pagar e a Receber
CREATE TABLE IF NOT EXISTS public.contas_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  descricao text NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0),
  vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  categoria text NOT NULL DEFAULT 'Outros',
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage contas" ON public.contas_financeiras
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_contas_barbershop ON public.contas_financeiras(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_contas_vencimento ON public.contas_financeiras(vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_status ON public.contas_financeiras(status);

-- Auto-update vencidas
CREATE OR REPLACE FUNCTION public.update_contas_vencidas()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.contas_financeiras
  SET status = 'vencido'
  WHERE status = 'pendente'
  AND vencimento < CURRENT_DATE;
END;
$$;

-- Tabela de Fichas de Anamnese
CREATE TABLE IF NOT EXISTS public.fichas_anamnese (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  cliente_nome text NOT NULL,
  cliente_telefone text,
  data_nascimento date,
  alergias text,
  medicamentos text,
  condicoes_saude text,
  observacoes text,
  assinatura_digital boolean DEFAULT false,
  assinado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fichas_anamnese ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage fichas" ON public.fichas_anamnese
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_fichas_barbershop ON public.fichas_anamnese(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_fichas_cliente ON public.fichas_anamnese(cliente_nome);
