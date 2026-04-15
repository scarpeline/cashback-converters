-- =============================================
-- Migration: SMS Config per barbershop
-- Created: 2026-04-11
-- =============================================

CREATE TABLE IF NOT EXISTS public.sms_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL UNIQUE REFERENCES public.barbershops(id) ON DELETE CASCADE,

  -- Agendamento
  agendamento_enabled boolean DEFAULT false,
  agendamento_horas integer DEFAULT 4,
  agendamento_msg text DEFAULT 'Ola @CLIENTE, voce tem @NOMESERVICO com @NOMEEMPRESA, dia @DIA as @HORA com @NOMEPROFISSIONAL.',

  -- Retorno
  retorno_enabled boolean DEFAULT false,
  retorno_dias integer DEFAULT 7,
  retorno_msg text DEFAULT 'Ola @CLIENTE, seu retorno de @NOMESERVICO se aproxima. Garanta ja seu horario acessando nossa Agenda Online.',

  -- Aniversário
  aniversario_enabled boolean DEFAULT false,
  aniversario_msg text DEFAULT 'Ola @CLIENTE, hoje eh o seu dia, feliz aniversario! Desejamos muita saude, paz e sabedoria. Equipe @NOMEEMPRESA.',

  -- Saldo
  saldo_sms integer DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage sms_config" ON public.sms_config
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_sms_config_barbershop ON public.sms_config(barbershop_id);
