-- messaging_packages: allow recurring add-on
ALTER TABLE public.messaging_packages ADD COLUMN IF NOT EXISTS allow_recurring boolean DEFAULT false;

-- fiscal_service_types: configurable prices and required fields (contador edits, super admin approves)
CREATE TABLE IF NOT EXISTS public.fiscal_service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL UNIQUE,
  label text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  required_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  proposed_price numeric,
  proposed_required_fields jsonb,
  proposed_by uuid REFERENCES auth.users(id),
  proposed_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fiscal_service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved service types" ON public.fiscal_service_types
  FOR SELECT USING (status = 'approved' AND is_active = true);

CREATE POLICY "Accountants can view all" ON public.fiscal_service_types
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.accountants WHERE user_id = auth.uid())
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Accountants can propose changes" ON public.fiscal_service_types
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.accountants WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.accountants WHERE user_id = auth.uid()));

CREATE POLICY "Super admins full access" ON public.fiscal_service_types
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()));

INSERT INTO public.fiscal_service_types (service_type, label, price, required_fields, status) VALUES
  ('cnpj_opening', 'Abertura de CNPJ (MEI/ME)', 150, '[{"key":"full_name","label":"Nome Completo","required":true},{"key":"cpf","label":"CPF","required":true},{"key":"company_type","label":"Tipo de Empresa","required":true}]', 'approved'),
  ('mei_declaration', 'Declaração Anual MEI', 80, '[{"key":"cnpj","label":"CNPJ MEI","required":true},{"key":"year","label":"Ano-Calendário","required":true},{"key":"annual_revenue","label":"Faturamento Bruto Anual","required":true}]', 'approved'),
  ('me_declaration', 'Declaração ME / Simples', 120, '[{"key":"cnpj","label":"CNPJ","required":true},{"key":"year","label":"Ano-Calendário","required":true},{"key":"annual_revenue","label":"Faturamento Bruto Anual","required":true}]', 'approved'),
  ('income_tax', 'Imposto de Renda (IRPF)', 200, '[{"key":"cpf","label":"CPF","required":true},{"key":"full_name","label":"Nome Completo","required":true},{"key":"year","label":"Ano-Calendário","required":true}]', 'approved'),
  ('cnpj_migration', 'Migração CPF → CNPJ', 180, '[{"key":"cpf","label":"CPF","required":true},{"key":"full_name","label":"Nome Completo","required":true},{"key":"target_type","label":"Migrar Para","required":true}]', 'approved'),
  ('cnpj_closing', 'Encerramento de CNPJ', 100, '[{"key":"cnpj","label":"CNPJ","required":true},{"key":"company_name","label":"Razão Social","required":true}]', 'approved'),
  ('other', 'Outro Serviço', 50, '[{"key":"description","label":"Descreva o Serviço","required":true}]', 'approved')
ON CONFLICT (service_type) DO NOTHING;
