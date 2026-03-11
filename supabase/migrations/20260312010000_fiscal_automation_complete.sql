-- =============================================================
-- MIGRAÇÃO: Módulo completo de automação contábil e financeira
-- Módulos 1-10 + automações avançadas
-- =============================================================

-- =============================================
-- MÓDULO 1 & 2: Faturamento mensal + Impostos
-- =============================================

-- Registro de regime tributário por barbearia
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS tax_regime text DEFAULT 'mei'
  CHECK (tax_regime IN ('mei', 'simples_nacional', 'lucro_presumido', 'lucro_real'));
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS company_name text;

-- Faturamento mensal calculado automaticamente
CREATE TABLE IF NOT EXISTS public.monthly_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  year_month text NOT NULL, -- formato: '2026-03'
  services_revenue numeric(12,2) NOT NULL DEFAULT 0,
  products_revenue numeric(12,2) NOT NULL DEFAULT 0,
  other_revenue numeric(12,2) NOT NULL DEFAULT 0,
  gross_revenue numeric(12,2) NOT NULL DEFAULT 0,
  services_count integer NOT NULL DEFAULT 0,
  payments_count integer NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(barbershop_id, year_month)
);

CREATE INDEX IF NOT EXISTS monthly_revenue_barbershop_idx ON public.monthly_revenue(barbershop_id);
CREATE INDEX IF NOT EXISTS monthly_revenue_year_month_idx ON public.monthly_revenue(year_month);

DROP TRIGGER IF EXISTS set_updated_at_monthly_revenue ON public.monthly_revenue;
CREATE TRIGGER set_updated_at_monthly_revenue
  BEFORE UPDATE ON public.monthly_revenue
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.monthly_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage monthly_revenue" ON public.monthly_revenue
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view own monthly_revenue" ON public.monthly_revenue
  FOR SELECT TO authenticated
  USING (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Accountants view linked monthly_revenue" ON public.monthly_revenue
  FOR SELECT TO authenticated
  USING (public.has_active_accountant_link(auth.uid(), barbershop_id));

-- Tabela de impostos calculados
CREATE TABLE IF NOT EXISTS public.taxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  year_month text NOT NULL, -- '2026-03'
  revenue_id uuid REFERENCES public.monthly_revenue(id) ON DELETE SET NULL,
  tax_regime text NOT NULL DEFAULT 'mei',
  gross_revenue numeric(12,2) NOT NULL DEFAULT 0,
  tax_type text NOT NULL, -- 'das_mei', 'das_simples', 'iss', 'irpj', 'csll', 'pis', 'cofins'
  tax_rate numeric(6,4) NOT NULL DEFAULT 0, -- percentual ex: 0.0600 = 6%
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at timestamptz,
  guide_url text,
  notes text,
  auto_calculated boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(barbershop_id, year_month, tax_type)
);

CREATE INDEX IF NOT EXISTS taxes_barbershop_idx ON public.taxes(barbershop_id);
CREATE INDEX IF NOT EXISTS taxes_year_month_idx ON public.taxes(year_month);
CREATE INDEX IF NOT EXISTS taxes_status_idx ON public.taxes(status);
CREATE INDEX IF NOT EXISTS taxes_due_date_idx ON public.taxes(due_date);

DROP TRIGGER IF EXISTS set_updated_at_taxes ON public.taxes;
CREATE TRIGGER set_updated_at_taxes
  BEFORE UPDATE ON public.taxes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage taxes" ON public.taxes
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view own taxes" ON public.taxes
  FOR SELECT TO authenticated
  USING (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Owners update own taxes" ON public.taxes
  FOR UPDATE TO authenticated
  USING (public.owns_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Accountants view linked taxes" ON public.taxes
  FOR SELECT TO authenticated
  USING (public.has_active_accountant_link(auth.uid(), barbershop_id));

CREATE POLICY "Accountants manage linked taxes" ON public.taxes
  FOR ALL TO authenticated
  USING (public.has_active_accountant_link(auth.uid(), barbershop_id))
  WITH CHECK (public.has_active_accountant_link(auth.uid(), barbershop_id));

-- =============================================
-- MÓDULO 4: Alertas fiscais automáticos
-- =============================================

CREATE TABLE IF NOT EXISTS public.fiscal_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN (
    'tax_due_7d', 'tax_due_3d', 'tax_due_1d', 'tax_overdue',
    'doc_pending', 'revenue_inconsistency', 'tax_bracket_change',
    'fiscal_risk', 'mei_limit_warning', 'regime_change_suggestion'
  )),
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  related_entity_table text,
  related_entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  is_dismissed boolean NOT NULL DEFAULT false,
  target_roles text[] NOT NULL DEFAULT '{"dono_barbearia"}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiscal_alerts_barbershop_idx ON public.fiscal_alerts(barbershop_id);
CREATE INDEX IF NOT EXISTS fiscal_alerts_type_idx ON public.fiscal_alerts(alert_type);
CREATE INDEX IF NOT EXISTS fiscal_alerts_created_idx ON public.fiscal_alerts(created_at DESC);

ALTER TABLE public.fiscal_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage fiscal_alerts" ON public.fiscal_alerts
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view own fiscal_alerts" ON public.fiscal_alerts
  FOR ALL TO authenticated
  USING (public.owns_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Accountants view linked fiscal_alerts" ON public.fiscal_alerts
  FOR SELECT TO authenticated
  USING (public.has_active_accountant_link(auth.uid(), barbershop_id));

-- =============================================
-- MÓDULO 5: Relatórios fiscais automáticos
-- =============================================

CREATE TABLE IF NOT EXISTS public.fiscal_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN (
    'monthly_summary', 'quarterly_summary', 'annual_summary',
    'tax_report', 'financial_health', 'revenue_analysis'
  )),
  period_start date NOT NULL,
  period_end date NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by_user_id uuid,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiscal_reports_barbershop_idx ON public.fiscal_reports(barbershop_id);
CREATE INDEX IF NOT EXISTS fiscal_reports_type_idx ON public.fiscal_reports(report_type);

ALTER TABLE public.fiscal_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage fiscal_reports" ON public.fiscal_reports
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view own fiscal_reports" ON public.fiscal_reports
  FOR ALL TO authenticated
  USING (public.owns_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Accountants view linked fiscal_reports" ON public.fiscal_reports
  FOR SELECT TO authenticated
  USING (public.has_active_accountant_link(auth.uid(), barbershop_id));

-- =============================================
-- MÓDULO 7: Checklist fiscal automático
-- =============================================

CREATE TABLE IF NOT EXISTS public.fiscal_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  year_month text NOT NULL,
  check_type text NOT NULL CHECK (check_type IN (
    'revenue_calculated', 'taxes_generated', 'das_paid', 'docs_complete',
    'notes_issued', 'bookkeeping_done', 'report_generated', 'accountant_reviewed'
  )),
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid,
  auto_checked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiscal_checklist_barbershop_idx ON public.fiscal_checklist_items(barbershop_id);
CREATE INDEX IF NOT EXISTS fiscal_checklist_month_idx ON public.fiscal_checklist_items(year_month);

ALTER TABLE public.fiscal_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage fiscal_checklist" ON public.fiscal_checklist_items
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners manage own fiscal_checklist" ON public.fiscal_checklist_items
  FOR ALL TO authenticated
  USING (public.owns_barbershop(auth.uid(), barbershop_id))
  WITH CHECK (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Accountants manage linked fiscal_checklist" ON public.fiscal_checklist_items
  FOR ALL TO authenticated
  USING (public.has_active_accountant_link(auth.uid(), barbershop_id))
  WITH CHECK (public.has_active_accountant_link(auth.uid(), barbershop_id));

-- =============================================
-- AUTOMAÇÕES AVANÇADAS: Score fiscal + Calendário
-- =============================================

CREATE TABLE IF NOT EXISTS public.fiscal_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  year_month text NOT NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- breakdown: { docs: 20, taxes_paid: 30, revenue_consistent: 20, checklist: 15, on_time: 15 }
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(barbershop_id, year_month)
);

ALTER TABLE public.fiscal_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage fiscal_scores" ON public.fiscal_scores
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view own fiscal_scores" ON public.fiscal_scores
  FOR SELECT TO authenticated
  USING (public.owns_barbershop(auth.uid(), barbershop_id));

CREATE POLICY "Accountants view linked fiscal_scores" ON public.fiscal_scores
  FOR SELECT TO authenticated
  USING (public.has_active_accountant_link(auth.uid(), barbershop_id));

-- Calendário fiscal
CREATE TABLE IF NOT EXISTS public.fiscal_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL CHECK (event_type IN (
    'das_payment', 'darf_payment', 'iss_payment', 'irpj_declaration',
    'csll_declaration', 'defis_annual', 'dasn_simei', 'ecf_delivery',
    'dirf_delivery', 'custom'
  )),
  due_day integer, -- dia do mês (ex: 20)
  due_month integer, -- mês (1-12), NULL = recorrente mensal
  tax_regimes text[] NOT NULL DEFAULT '{"mei","simples_nacional"}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fiscal_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read fiscal_calendar" ON public.fiscal_calendar
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage fiscal_calendar" ON public.fiscal_calendar
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Inserir eventos fiscais padrão do calendário brasileiro
INSERT INTO public.fiscal_calendar (title, description, event_type, due_day, due_month, tax_regimes) VALUES
  ('DAS MEI', 'Pagamento do DAS do Microempreendedor Individual', 'das_payment', 20, NULL, '{"mei"}'),
  ('DAS Simples Nacional', 'Pagamento do DAS do Simples Nacional', 'das_payment', 20, NULL, '{"simples_nacional"}'),
  ('ISS Municipal', 'Pagamento do ISS sobre serviços', 'iss_payment', 15, NULL, '{"simples_nacional","lucro_presumido"}'),
  ('DARF IRPJ', 'Pagamento do IRPJ trimestral', 'irpj_declaration', 30, NULL, '{"lucro_presumido","lucro_real"}'),
  ('DASN-SIMEI', 'Declaração Anual do MEI', 'dasn_simei', 31, 5, '{"mei"}'),
  ('DEFIS', 'Declaração de Informações Socioeconômicas e Fiscais', 'defis_annual', 31, 3, '{"simples_nacional"}'),
  ('DIRF', 'Declaração de Imposto de Renda Retido na Fonte', 'dirf_delivery', 28, 2, '{"simples_nacional","lucro_presumido","lucro_real"}')
ON CONFLICT DO NOTHING;

-- =============================================
-- FUNÇÕES DE CÁLCULO AUTOMÁTICO
-- =============================================

-- Função: calcular faturamento mensal de uma barbearia
CREATE OR REPLACE FUNCTION public.calculate_monthly_revenue(
  _barbershop_id uuid,
  _year_month text -- '2026-03'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _start_date date;
  _end_date date;
  _services_rev numeric(12,2);
  _services_cnt integer;
  _payments_rev numeric(12,2);
  _payments_cnt integer;
  _result_id uuid;
BEGIN
  _start_date := (_year_month || '-01')::date;
  _end_date := (_start_date + interval '1 month')::date;

  -- Somar serviços concluídos no período
  SELECT COALESCE(SUM(p.amount), 0), COUNT(*)
  INTO _services_rev, _services_cnt
  FROM public.payments p
  WHERE p.barbershop_id = _barbershop_id
    AND p.status = 'completed'
    AND p.created_at >= _start_date
    AND p.created_at < _end_date;

  -- Total de pagamentos
  _payments_rev := _services_rev;
  _payments_cnt := _services_cnt;

  INSERT INTO public.monthly_revenue (
    barbershop_id, year_month, services_revenue, products_revenue, other_revenue,
    gross_revenue, services_count, payments_count, calculated_at
  ) VALUES (
    _barbershop_id, _year_month, _services_rev, 0, 0,
    _services_rev, _services_cnt, _payments_cnt, now()
  )
  ON CONFLICT (barbershop_id, year_month)
  DO UPDATE SET
    services_revenue = EXCLUDED.services_revenue,
    gross_revenue = EXCLUDED.gross_revenue,
    services_count = EXCLUDED.services_count,
    payments_count = EXCLUDED.payments_count,
    calculated_at = now()
  RETURNING id INTO _result_id;

  RETURN _result_id;
END;
$$;

-- Função: calcular impostos com base no regime tributário
CREATE OR REPLACE FUNCTION public.calculate_monthly_taxes(
  _barbershop_id uuid,
  _year_month text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _regime text;
  _revenue numeric(12,2);
  _revenue_id uuid;
  _due date;
  _rate numeric(6,4);
  _tax_amt numeric(12,2);
BEGIN
  -- Buscar regime da barbearia
  SELECT COALESCE(tax_regime, 'mei') INTO _regime
  FROM public.barbershops WHERE id = _barbershop_id;

  -- Buscar faturamento do mês
  SELECT id, gross_revenue INTO _revenue_id, _revenue
  FROM public.monthly_revenue
  WHERE barbershop_id = _barbershop_id AND year_month = _year_month;

  IF _revenue IS NULL OR _revenue <= 0 THEN RETURN; END IF;

  -- Data de vencimento padrão: dia 20 do mês seguinte
  _due := ((_year_month || '-01')::date + interval '1 month' + interval '19 days')::date;

  IF _regime = 'mei' THEN
    -- DAS MEI valor fixo 2026: R$ 75,90 (comércio/serviço)
    _tax_amt := 75.90;
    _rate := CASE WHEN _revenue > 0 THEN (_tax_amt / _revenue) ELSE 0 END;

    INSERT INTO public.taxes (barbershop_id, year_month, revenue_id, tax_regime, gross_revenue, tax_type, tax_rate, tax_amount, due_date)
    VALUES (_barbershop_id, _year_month, _revenue_id, _regime, _revenue, 'das_mei', _rate, _tax_amt, _due)
    ON CONFLICT (barbershop_id, year_month, tax_type)
    DO UPDATE SET gross_revenue = EXCLUDED.gross_revenue, tax_rate = EXCLUDED.tax_rate, tax_amount = EXCLUDED.tax_amount, due_date = EXCLUDED.due_date;

  ELSIF _regime = 'simples_nacional' THEN
    -- Anexo III Simples Nacional (serviços) — faixas simplificadas
    IF _revenue <= 15000 THEN _rate := 0.0600;
    ELSIF _revenue <= 30000 THEN _rate := 0.1120;
    ELSIF _revenue <= 72000 THEN _rate := 0.1350;
    ELSE _rate := 0.1600;
    END IF;

    _tax_amt := ROUND(_revenue * _rate, 2);

    INSERT INTO public.taxes (barbershop_id, year_month, revenue_id, tax_regime, gross_revenue, tax_type, tax_rate, tax_amount, due_date)
    VALUES (_barbershop_id, _year_month, _revenue_id, _regime, _revenue, 'das_simples', _rate, _tax_amt, _due)
    ON CONFLICT (barbershop_id, year_month, tax_type)
    DO UPDATE SET gross_revenue = EXCLUDED.gross_revenue, tax_rate = EXCLUDED.tax_rate, tax_amount = EXCLUDED.tax_amount, due_date = EXCLUDED.due_date;

    -- ISS separado (5% padrão)
    INSERT INTO public.taxes (barbershop_id, year_month, revenue_id, tax_regime, gross_revenue, tax_type, tax_rate, tax_amount, due_date)
    VALUES (_barbershop_id, _year_month, _revenue_id, _regime, _revenue, 'iss', 0.0500, ROUND(_revenue * 0.05, 2), _due - interval '5 days')
    ON CONFLICT (barbershop_id, year_month, tax_type)
    DO UPDATE SET gross_revenue = EXCLUDED.gross_revenue, tax_amount = ROUND(EXCLUDED.gross_revenue * 0.05, 2), due_date = EXCLUDED.due_date;

  ELSIF _regime = 'lucro_presumido' THEN
    -- IRPJ: base presumida 32% x 15%
    INSERT INTO public.taxes (barbershop_id, year_month, revenue_id, tax_regime, gross_revenue, tax_type, tax_rate, tax_amount, due_date)
    VALUES (_barbershop_id, _year_month, _revenue_id, _regime, _revenue, 'irpj', 0.0480, ROUND(_revenue * 0.048, 2), _due)
    ON CONFLICT (barbershop_id, year_month, tax_type)
    DO UPDATE SET gross_revenue = EXCLUDED.gross_revenue, tax_amount = ROUND(EXCLUDED.gross_revenue * 0.048, 2);

    -- CSLL: base presumida 32% x 9%
    INSERT INTO public.taxes (barbershop_id, year_month, revenue_id, tax_regime, gross_revenue, tax_type, tax_rate, tax_amount, due_date)
    VALUES (_barbershop_id, _year_month, _revenue_id, _regime, _revenue, 'csll', 0.0288, ROUND(_revenue * 0.0288, 2), _due)
    ON CONFLICT (barbershop_id, year_month, tax_type)
    DO UPDATE SET gross_revenue = EXCLUDED.gross_revenue, tax_amount = ROUND(EXCLUDED.gross_revenue * 0.0288, 2);

    -- PIS 0.65%
    INSERT INTO public.taxes (barbershop_id, year_month, revenue_id, tax_regime, gross_revenue, tax_type, tax_rate, tax_amount, due_date)
    VALUES (_barbershop_id, _year_month, _revenue_id, _regime, _revenue, 'pis', 0.0065, ROUND(_revenue * 0.0065, 2), _due)
    ON CONFLICT (barbershop_id, year_month, tax_type)
    DO UPDATE SET gross_revenue = EXCLUDED.gross_revenue, tax_amount = ROUND(EXCLUDED.gross_revenue * 0.0065, 2);

    -- COFINS 3%
    INSERT INTO public.taxes (barbershop_id, year_month, revenue_id, tax_regime, gross_revenue, tax_type, tax_rate, tax_amount, due_date)
    VALUES (_barbershop_id, _year_month, _revenue_id, _regime, _revenue, 'cofins', 0.0300, ROUND(_revenue * 0.03, 2), _due)
    ON CONFLICT (barbershop_id, year_month, tax_type)
    DO UPDATE SET gross_revenue = EXCLUDED.gross_revenue, tax_amount = ROUND(EXCLUDED.gross_revenue * 0.03, 2);

    -- ISS 5%
    INSERT INTO public.taxes (barbershop_id, year_month, revenue_id, tax_regime, gross_revenue, tax_type, tax_rate, tax_amount, due_date)
    VALUES (_barbershop_id, _year_month, _revenue_id, _regime, _revenue, 'iss', 0.0500, ROUND(_revenue * 0.05, 2), _due - interval '5 days')
    ON CONFLICT (barbershop_id, year_month, tax_type)
    DO UPDATE SET gross_revenue = EXCLUDED.gross_revenue, tax_amount = ROUND(EXCLUDED.gross_revenue * 0.05, 2);
  END IF;
END;
$$;

-- Função: gerar checklist fiscal do mês
CREATE OR REPLACE FUNCTION public.generate_fiscal_checklist(
  _barbershop_id uuid,
  _year_month text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _checks text[][] := ARRAY[
    ['revenue_calculated', 'Faturamento mensal calculado'],
    ['taxes_generated', 'Impostos do mês gerados'],
    ['das_paid', 'DAS/guia principal paga'],
    ['docs_complete', 'Documentos fiscais completos'],
    ['notes_issued', 'Notas fiscais emitidas'],
    ['bookkeeping_done', 'Escrituração contábil feita'],
    ['report_generated', 'Relatório fiscal gerado'],
    ['accountant_reviewed', 'Revisado pelo contador']
  ];
  _i integer;
BEGIN
  FOR _i IN 1..array_length(_checks, 1) LOOP
    INSERT INTO public.fiscal_checklist_items (barbershop_id, year_month, check_type, title)
    VALUES (_barbershop_id, _year_month, _checks[_i][1], _checks[_i][2])
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Função: calcular score fiscal
CREATE OR REPLACE FUNCTION public.calculate_fiscal_score(
  _barbershop_id uuid,
  _year_month text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _score integer := 0;
  _breakdown jsonb := '{}'::jsonb;
  _checklist_total integer;
  _checklist_done integer;
  _taxes_total integer;
  _taxes_paid integer;
  _docs_total integer;
  _docs_approved integer;
  _has_revenue boolean;
BEGIN
  -- Checklist completude (30 pontos)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed) INTO _checklist_total, _checklist_done
  FROM public.fiscal_checklist_items WHERE barbershop_id = _barbershop_id AND year_month = _year_month;
  IF _checklist_total > 0 THEN
    _score := _score + ROUND(30.0 * _checklist_done / _checklist_total);
  END IF;
  _breakdown := _breakdown || jsonb_build_object('checklist', CASE WHEN _checklist_total > 0 THEN ROUND(30.0 * _checklist_done / _checklist_total) ELSE 0 END);

  -- Impostos em dia (30 pontos)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'paid') INTO _taxes_total, _taxes_paid
  FROM public.taxes WHERE barbershop_id = _barbershop_id AND year_month = _year_month;
  IF _taxes_total > 0 THEN
    _score := _score + ROUND(30.0 * _taxes_paid / _taxes_total);
  END IF;
  _breakdown := _breakdown || jsonb_build_object('taxes_paid', CASE WHEN _taxes_total > 0 THEN ROUND(30.0 * _taxes_paid / _taxes_total) ELSE 0 END);

  -- Documentos aprovados (20 pontos)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'approved') INTO _docs_total, _docs_approved
  FROM public.accounting_documents WHERE barbershop_id = _barbershop_id AND is_company_document = true;
  IF _docs_total > 0 THEN
    _score := _score + LEAST(20, ROUND(20.0 * _docs_approved / _docs_total));
  ELSE
    _score := _score + 10; -- sem docs = neutro
  END IF;
  _breakdown := _breakdown || jsonb_build_object('docs', CASE WHEN _docs_total > 0 THEN ROUND(20.0 * _docs_approved / _docs_total) ELSE 10 END);

  -- Faturamento registrado (20 pontos)
  SELECT EXISTS(SELECT 1 FROM public.monthly_revenue WHERE barbershop_id = _barbershop_id AND year_month = _year_month AND gross_revenue > 0)
  INTO _has_revenue;
  IF _has_revenue THEN _score := _score + 20; END IF;
  _breakdown := _breakdown || jsonb_build_object('revenue', CASE WHEN _has_revenue THEN 20 ELSE 0 END);

  -- Salvar score
  INSERT INTO public.fiscal_scores (barbershop_id, year_month, score, breakdown)
  VALUES (_barbershop_id, _year_month, LEAST(_score, 100), _breakdown)
  ON CONFLICT (barbershop_id, year_month)
  DO UPDATE SET score = LEAST(EXCLUDED.score, 100), breakdown = EXCLUDED.breakdown;

  RETURN LEAST(_score, 100);
END;
$$;

-- Função: marcar impostos vencidos como overdue
CREATE OR REPLACE FUNCTION public.mark_overdue_taxes()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.taxes
  SET status = 'overdue'
  WHERE status = 'pending' AND due_date < CURRENT_DATE;
$$;

-- Função: simular troca de regime tributário
CREATE OR REPLACE FUNCTION public.simulate_tax_regime(
  _barbershop_id uuid,
  _year_month text,
  _target_regime text
)
RETURNS TABLE(tax_type text, tax_rate numeric, tax_amount numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _revenue numeric(12,2);
  _rate numeric(6,4);
BEGIN
  SELECT gross_revenue INTO _revenue
  FROM public.monthly_revenue WHERE barbershop_id = _barbershop_id AND year_month = _year_month;

  IF _revenue IS NULL OR _revenue <= 0 THEN RETURN; END IF;

  IF _target_regime = 'mei' THEN
    RETURN QUERY SELECT 'das_mei'::text, (75.90 / _revenue)::numeric(6,4), 75.90::numeric;

  ELSIF _target_regime = 'simples_nacional' THEN
    IF _revenue <= 15000 THEN _rate := 0.0600;
    ELSIF _revenue <= 30000 THEN _rate := 0.1120;
    ELSIF _revenue <= 72000 THEN _rate := 0.1350;
    ELSE _rate := 0.1600;
    END IF;
    RETURN QUERY SELECT 'das_simples'::text, _rate, ROUND(_revenue * _rate, 2);
    RETURN QUERY SELECT 'iss'::text, 0.0500::numeric(6,4), ROUND(_revenue * 0.05, 2);

  ELSIF _target_regime = 'lucro_presumido' THEN
    RETURN QUERY SELECT 'irpj'::text, 0.0480::numeric(6,4), ROUND(_revenue * 0.048, 2);
    RETURN QUERY SELECT 'csll'::text, 0.0288::numeric(6,4), ROUND(_revenue * 0.0288, 2);
    RETURN QUERY SELECT 'pis'::text, 0.0065::numeric(6,4), ROUND(_revenue * 0.0065, 2);
    RETURN QUERY SELECT 'cofins'::text, 0.0300::numeric(6,4), ROUND(_revenue * 0.03, 2);
    RETURN QUERY SELECT 'iss'::text, 0.0500::numeric(6,4), ROUND(_revenue * 0.05, 2);
  END IF;
END;
$$;
