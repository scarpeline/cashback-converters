-- =====================================================
-- MIGRAÇÃO COMPLETA DO SISTEMA DE CONTABILIDADE
-- Data: 2026-03-12
-- =====================================================

-- =========================================
-- 1. COMPLETAR TABELA ACCOUNTANTS
-- =========================================
ALTER TABLE public.accountants
  ADD COLUMN IF NOT EXISTS crc_registro     text,
  ADD COLUMN IF NOT EXISTS empresa_contabil text,
  ADD COLUMN IF NOT EXISTS endereco         text,
  ADD COLUMN IF NOT EXISTS cidade           text,
  ADD COLUMN IF NOT EXISTS estado           text,
  ADD COLUMN IF NOT EXISTS telefone         text,
  ADD COLUMN IF NOT EXISTS status_verificado text NOT NULL DEFAULT 'pending'
    CHECK (status_verificado IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS bio              text,
  ADD COLUMN IF NOT EXISTS avatar_url       text,
  ADD COLUMN IF NOT EXISTS aceita_novos_clientes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS valor_mensalidade numeric(10,2) DEFAULT 0;

-- =========================================
-- 2. TABELA config_comissoes (SUPER ADMIN)
-- =========================================
CREATE TABLE IF NOT EXISTS public.config_comissoes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  porcentagem_app    numeric(5,2) NOT NULL DEFAULT 20.00
    CHECK (porcentagem_app BETWEEN 0 AND 100),
  porcentagem_contador numeric(5,2) NOT NULL DEFAULT 80.00
    CHECK (porcentagem_contador BETWEEN 0 AND 100),
  ativo              boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.config_comissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage comissoes" ON public.config_comissoes
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Authenticated read comissoes" ON public.config_comissoes
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.config_comissoes (porcentagem_app, porcentagem_contador)
  VALUES (20.00, 80.00)
  ON CONFLICT DO NOTHING;

-- =========================================
-- 3. TABELA pedidos_contabeis
-- =========================================
CREATE TABLE IF NOT EXISTS public.pedidos_contabeis (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contador_id         uuid NOT NULL REFERENCES public.accountants(id) ON DELETE RESTRICT,
  servico_id          uuid REFERENCES public.fiscal_service_types(id) ON DELETE SET NULL,
  nome_servico        text NOT NULL,
  dados_formulario    jsonb NOT NULL DEFAULT '{}',
  valor               numeric(10,2) NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'aguardando_pagamento'
    CHECK (status IN ('aguardando_pagamento','pagamento_confirmado','em_andamento','concluido','cancelado')),
  pagamento_status    text NOT NULL DEFAULT 'pending'
    CHECK (pagamento_status IN ('pending','processing','confirmed','failed','refunded')),
  asaas_payment_id    text,
  pix_qr_code         text,
  pix_copy_paste      text,
  payment_link        text,
  porcentagem_app     numeric(5,2) NOT NULL DEFAULT 20.00,
  porcentagem_contador numeric(5,2) NOT NULL DEFAULT 80.00,
  valor_app           numeric(10,2) NOT NULL DEFAULT 0,
  valor_contador      numeric(10,2) NOT NULL DEFAULT 0,
  notas               text,
  data_pedido         timestamptz NOT NULL DEFAULT now(),
  data_pagamento      timestamptz,
  data_conclusao      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pedidos_contabeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem seus pedidos" ON public.pedidos_contabeis
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios criam pedidos" ON public.pedidos_contabeis
  FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Contadores veem pedidos deles" ON public.pedidos_contabeis
  FOR SELECT TO authenticated USING (
    contador_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
  );

CREATE POLICY "Contadores atualizam pedidos deles" ON public.pedidos_contabeis
  FOR UPDATE TO authenticated USING (
    contador_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
  );

CREATE POLICY "Super admins gerenciam pedidos" ON public.pedidos_contabeis
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS pedidos_contabeis_usuario_id_idx   ON public.pedidos_contabeis(usuario_id);
CREATE INDEX IF NOT EXISTS pedidos_contabeis_contador_id_idx  ON public.pedidos_contabeis(contador_id);
CREATE INDEX IF NOT EXISTS pedidos_contabeis_status_idx       ON public.pedidos_contabeis(status);

-- =========================================
-- 4. TABELA assinaturas_contabeis
-- =========================================
CREATE TABLE IF NOT EXISTS public.assinaturas_contabeis (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contador_id              uuid NOT NULL REFERENCES public.accountants(id) ON DELETE RESTRICT,
  valor_mensal             numeric(10,2) NOT NULL,
  status                   text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','cancelled','past_due')),
  data_inicio              timestamptz NOT NULL DEFAULT now(),
  data_proxima_cobranca    timestamptz NOT NULL,
  data_cancelamento        timestamptz,
  asaas_subscription_id    text,
  porcentagem_app          numeric(5,2) NOT NULL DEFAULT 20.00,
  porcentagem_contador     numeric(5,2) NOT NULL DEFAULT 80.00,
  valor_app                numeric(10,2) NOT NULL DEFAULT 0,
  valor_contador           numeric(10,2) NOT NULL DEFAULT 0,
  notas                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas_contabeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem suas assinaturas" ON public.assinaturas_contabeis
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios criam assinaturas" ON public.assinaturas_contabeis
  FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuarios cancelam assinaturas" ON public.assinaturas_contabeis
  FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Contadores veem assinaturas deles" ON public.assinaturas_contabeis
  FOR SELECT TO authenticated USING (
    contador_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
  );

CREATE POLICY "Super admins gerenciam assinaturas" ON public.assinaturas_contabeis
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- Histórico de pagamentos das assinaturas
CREATE TABLE IF NOT EXISTS public.historico_assinaturas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id       uuid NOT NULL REFERENCES public.assinaturas_contabeis(id) ON DELETE CASCADE,
  usuario_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valor               numeric(10,2) NOT NULL,
  status              text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','failed','refunded')),
  asaas_payment_id    text,
  pix_qr_code         text,
  pix_copy_paste      text,
  data_vencimento     timestamptz NOT NULL,
  data_pagamento      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.historico_assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem historico" ON public.historico_assinaturas
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());

CREATE POLICY "Contadores veem historico deles" ON public.historico_assinaturas
  FOR SELECT TO authenticated USING (
    assinatura_id IN (
      SELECT id FROM public.assinaturas_contabeis
      WHERE contador_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Super admins historico" ON public.historico_assinaturas
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS assinaturas_usuario_id_idx  ON public.assinaturas_contabeis(usuario_id);
CREATE INDEX IF NOT EXISTS assinaturas_contador_id_idx ON public.assinaturas_contabeis(contador_id);
CREATE INDEX IF NOT EXISTS assinaturas_status_idx      ON public.assinaturas_contabeis(status);

-- =========================================
-- 5. TABELA chat_contador (PRÉ-CONTRATAÇÃO)
-- =========================================
CREATE TABLE IF NOT EXISTS public.chat_contador (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contador_id uuid NOT NULL REFERENCES public.accountants(id) ON DELETE CASCADE,
  mensagem    text NOT NULL,
  remetente   text NOT NULL CHECK (remetente IN ('usuario','contador','sistema')),
  lido        boolean NOT NULL DEFAULT false,
  data_envio  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_contador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem seu chat" ON public.chat_contador
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios enviam mensagens" ON public.chat_contador
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid() AND remetente = 'usuario');

CREATE POLICY "Contadores veem chats deles" ON public.chat_contador
  FOR SELECT TO authenticated USING (
    contador_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
  );

CREATE POLICY "Contadores enviam mensagens" ON public.chat_contador
  FOR INSERT TO authenticated
  WITH CHECK (
    contador_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
    AND remetente = 'contador'
  );

CREATE POLICY "Contadores marcam como lido" ON public.chat_contador
  FOR UPDATE TO authenticated
  USING (
    contador_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
  );

CREATE POLICY "Super admins chat" ON public.chat_contador
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS chat_contador_usuario_id_idx  ON public.chat_contador(usuario_id);
CREATE INDEX IF NOT EXISTS chat_contador_contador_id_idx ON public.chat_contador(contador_id);
CREATE INDEX IF NOT EXISTS chat_contador_data_idx        ON public.chat_contador(data_envio);

-- =========================================
-- 6. LOGS DE PAGAMENTOS CONTÁBEIS
-- =========================================
CREATE TABLE IF NOT EXISTS public.payment_logs_contabeis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid REFERENCES public.pedidos_contabeis(id) ON DELETE SET NULL,
  assinatura_id   uuid REFERENCES public.assinaturas_contabeis(id) ON DELETE SET NULL,
  usuario_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            text NOT NULL CHECK (tipo IN ('pedido','assinatura')),
  valor           numeric(10,2) NOT NULL,
  status          text NOT NULL,
  asaas_event     text,
  payload         jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_logs_contabeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins logs pagamentos" ON public.payment_logs_contabeis
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Usuarios veem logs deles" ON public.payment_logs_contabeis
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());

-- =========================================
-- 7. TRIGGERS updated_at
-- =========================================
DROP TRIGGER IF EXISTS set_updated_at_config_comissoes ON public.config_comissoes;
CREATE TRIGGER set_updated_at_config_comissoes
  BEFORE UPDATE ON public.config_comissoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_pedidos_contabeis ON public.pedidos_contabeis;
CREATE TRIGGER set_updated_at_pedidos_contabeis
  BEFORE UPDATE ON public.pedidos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_assinaturas ON public.assinaturas_contabeis;
CREATE TRIGGER set_updated_at_assinaturas
  BEFORE UPDATE ON public.assinaturas_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================
-- 8. FUNÇÕES AUXILIARES
-- =========================================

-- Buscar contadores verificados (para seleção no vínculo)
CREATE OR REPLACE FUNCTION public.search_contadores_verificados(
  _search text DEFAULT ''
)
RETURNS TABLE (
  id        uuid,
  name      text,
  email     text,
  whatsapp  text,
  crc_registro text,
  empresa_contabil text,
  cidade    text,
  estado    text,
  valor_mensalidade numeric,
  aceita_novos_clientes boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    a.id, a.name, a.email, a.whatsapp,
    a.crc_registro, a.empresa_contabil,
    a.cidade, a.estado, a.valor_mensalidade, a.aceita_novos_clientes
  FROM public.accountants a
  WHERE a.is_active = true
    AND a.status_verificado = 'verified'
    AND a.aceita_novos_clientes = true
    AND (
      _search = ''
      OR lower(a.name) LIKE '%' || lower(_search) || '%'
      OR lower(a.email) LIKE '%' || lower(_search) || '%'
      OR lower(a.cidade) LIKE '%' || lower(_search) || '%'
      OR lower(a.empresa_contabil) LIKE '%' || lower(_search) || '%'
    )
  ORDER BY a.name
  LIMIT 50;
$$;

-- Calcular split de comissão
CREATE OR REPLACE FUNCTION public.calcular_split_comissao(_valor numeric)
RETURNS TABLE (valor_app numeric, valor_contador numeric, pct_app numeric, pct_contador numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    ROUND(_valor * c.porcentagem_app / 100, 2),
    ROUND(_valor * c.porcentagem_contador / 100, 2),
    c.porcentagem_app,
    c.porcentagem_contador
  FROM public.config_comissoes c
  WHERE c.ativo = true
  ORDER BY c.created_at DESC
  LIMIT 1;
$$;

-- Contar mensagens não lidas do chat (para o contador)
CREATE OR REPLACE FUNCTION public.count_unread_chat_contador(_contador_id uuid)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*) FROM public.chat_contador
  WHERE contador_id = _contador_id
    AND remetente = 'usuario'
    AND lido = false;
$$;

-- =========================================
-- 9. ADICIONAR CAMPOS NFC/QR À TABELA PAYMENTS
-- =========================================
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS nfc_transaction_id  text,
  ADD COLUMN IF NOT EXISTS billing_type        text DEFAULT 'PIX',
  ADD COLUMN IF NOT EXISTS payment_link        text,
  ADD COLUMN IF NOT EXISTS professional_id     uuid REFERENCES public.professionals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_professional_id_idx ON public.payments(professional_id);

-- =========================================
-- 10. RLS POLICIES PARA PROFISSIONAIS VEREM PAGAMENTOS
-- =========================================
DROP POLICY IF EXISTS "Professionals see their payments" ON public.payments;
CREATE POLICY "Professionals see their payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    professional_id IN (
      SELECT id FROM public.professionals WHERE user_id = auth.uid()
    )
    OR barbershop_id IN (
      SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid()
    )
    OR client_user_id = auth.uid()
  );

-- =========================================
-- 11. VINCULAR CONTADOR COM USERS NÃO APENAS BARBERSHOPS
-- Adicionar suporte para profissionais e afiliados
-- =========================================
ALTER TABLE public.accountant_barbershop_links
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'barbershop'
    CHECK (user_type IN ('barbershop','profissional','afiliado'));

ALTER TABLE public.accountant_barbershop_links
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
