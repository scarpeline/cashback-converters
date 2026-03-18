-- Tabela de Log de Campanhas de Reativação de Clientes
CREATE TABLE IF NOT EXISTS public.reactivation_campaigns_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  status varchar(50) DEFAULT 'sent',
  response_type varchar(50),
  sent_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reactivation_campaigns_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reactivation_client_id ON public.reactivation_campaigns_log(client_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_sent_at ON public.reactivation_campaigns_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactivation_status ON public.reactivation_campaigns_log(status);

-- Profissionais podem ver campanhas de seus clientes
CREATE POLICY "Profissionais podem ver campanhas de reativacao"
  ON public.reactivation_campaigns_log FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.profiles p ON p.id = reactivation_campaigns_log.client_id
      WHERE a.professional_user_id = auth.uid()
        AND a.client_user_id = p.user_id
    )
  );

-- Profissionais podem criar campanhas
CREATE POLICY "Profissionais podem criar campanhas de reativacao"
  ON public.reactivation_campaigns_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.profiles p ON p.id = reactivation_campaigns_log.client_id
      WHERE a.professional_user_id = auth.uid()
        AND a.client_user_id = p.user_id
    )
  );

-- Profissionais podem atualizar campanhas
CREATE POLICY "Profissionais podem atualizar campanhas de reativacao"
  ON public.reactivation_campaigns_log FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.profiles p ON p.id = reactivation_campaigns_log.client_id
      WHERE a.professional_user_id = auth.uid()
        AND a.client_user_id = p.user_id
    )
  );
