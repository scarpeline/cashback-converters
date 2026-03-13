
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  ORDER BY CASE ur.role
    WHEN 'super_admin'::public.app_role THEN 1
    WHEN 'contador'::public.app_role THEN 2
    WHEN 'dono'::public.app_role THEN 3
    WHEN 'profissional'::public.app_role THEN 4
    WHEN 'afiliado_saas'::public.app_role THEN 5
    WHEN 'afiliado_barbearia'::public.app_role THEN 6
    WHEN 'cliente'::public.app_role THEN 7
    ELSE 99
  END
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO authenticated;

ALTER TABLE public.accounting_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own accounting_audit_logs" ON public.accounting_audit_logs;

CREATE POLICY "Users insert own accounting_audit_logs" ON public.accounting_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
  );

CREATE OR REPLACE FUNCTION public.log_accounting_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_barbershop_id uuid;
  v_actor_role public.app_role;
  v_entity_id uuid;
  v_metadata jsonb;
BEGIN
  v_actor_role := public.get_primary_role(auth.uid());

  IF (TG_OP = 'DELETE') THEN
    v_entity_id := (OLD).id;
  ELSE
    v_entity_id := (NEW).id;
  END IF;

  v_barbershop_id := NULL;

  IF (TG_OP = 'DELETE') THEN
    BEGIN
      v_barbershop_id := (OLD).barbershop_id;
    EXCEPTION WHEN others THEN
      v_barbershop_id := NULL;
    END;
  ELSE
    BEGIN
      v_barbershop_id := (NEW).barbershop_id;
    EXCEPTION WHEN others THEN
      v_barbershop_id := NULL;
    END;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    v_metadata := jsonb_build_object('new', to_jsonb(NEW));
  ELSIF (TG_OP = 'UPDATE') THEN
    v_metadata := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    v_metadata := jsonb_build_object('old', to_jsonb(OLD));
  END IF;

  INSERT INTO public.accounting_audit_logs(
    barbershop_id,
    actor_user_id,
    actor_role,
    action,
    entity_table,
    entity_id,
    metadata,
    created_at
  ) VALUES (
    v_barbershop_id,
    auth.uid(),
    v_actor_role,
    TG_OP,
    TG_TABLE_NAME,
    v_entity_id,
    v_metadata,
    now()
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_accountant_barbershop_links ON public.accountant_barbershop_links;
CREATE TRIGGER trg_audit_accountant_barbershop_links
  AFTER INSERT OR UPDATE OR DELETE ON public.accountant_barbershop_links
  FOR EACH ROW
  EXECUTE FUNCTION public.log_accounting_audit();

DROP TRIGGER IF EXISTS trg_audit_accounting_documents ON public.accounting_documents;
CREATE TRIGGER trg_audit_accounting_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.accounting_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_accounting_audit();

DROP TRIGGER IF EXISTS trg_audit_accounting_tax_guides ON public.accounting_tax_guides;
CREATE TRIGGER trg_audit_accounting_tax_guides
  AFTER INSERT OR UPDATE OR DELETE ON public.accounting_tax_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.log_accounting_audit();

DROP TRIGGER IF EXISTS trg_audit_accounting_messages ON public.accounting_messages;
CREATE TRIGGER trg_audit_accounting_messages
  AFTER INSERT OR UPDATE OR DELETE ON public.accounting_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.log_accounting_audit();
