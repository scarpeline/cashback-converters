-- ============================================================
-- TABELA PARTNERS — Sistema de parceiros (afiliados/franqueados/diretores)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('afiliado', 'franqueado', 'diretor')),
    parent_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    level INTEGER NOT NULL DEFAULT 0,
    total_indicados INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'bloqueado')),
    commission_pct NUMERIC(5,2) DEFAULT 10.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_type ON public.partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_parent_id ON public.partners(parent_id);

-- RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Super admin vê tudo
DROP POLICY IF EXISTS "Super admin full access partners" ON public.partners;
CREATE POLICY "Super admin full access partners" ON public.partners
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Parceiro vê apenas o próprio registro
DROP POLICY IF EXISTS "Partner can view own record" ON public.partners;
CREATE POLICY "Partner can view own record" ON public.partners
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS partners_updated_at ON public.partners;
CREATE TRIGGER partners_updated_at
    BEFORE UPDATE ON public.partners
    FOR EACH ROW EXECUTE FUNCTION update_partners_updated_at();

-- View para join com profiles (evita expor dados sensíveis)
CREATE OR REPLACE VIEW public.partners_with_users AS
SELECT
    p.id,
    p.user_id,
    p.type,
    p.parent_id,
    p.level,
    p.total_indicados,
    p.status,
    p.commission_pct,
    p.created_at,
    p.updated_at,
    pr.name AS user_name,
    pr.email AS user_email,
    pr.whatsapp AS user_whatsapp
FROM public.partners p
LEFT JOIN public.profiles pr ON pr.user_id = p.user_id;

GRANT SELECT ON public.partners_with_users TO authenticated;

COMMENT ON TABLE public.partners IS 'Parceiros do sistema: afiliados, franqueados e diretores';
