-- =====================================================
-- MIGRAÇÃO DE CORREÇÃO E DESTRAVAMENTO DOS CHATS
-- Data: 2026-03-11
-- =====================================================

-- =========================================
-- 1. CORRIGIR POLÍTICAS DO CHAT_CONTADOR
-- =========================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuarios veem seu chat" ON public.chat_contador;
DROP POLICY IF EXISTS "Usuarios enviam mensagens" ON public.chat_contador;
DROP POLICY IF EXISTS "Contadores veem chats deles" ON public.chat_contador;
DROP POLICY IF EXISTS "Contadores enviam mensagens" ON public.chat_contador;
DROP POLICY IF EXISTS "Contadores marcam como lido" ON public.chat_contador;
DROP POLICY IF EXISTS "Super admins chat" ON public.chat_contador;

-- Recriar políticas corrigidas
CREATE POLICY "Usuarios veem seu chat" ON public.chat_contador
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios enviam mensagens" ON public.chat_contador
  FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id = auth.uid() 
    AND remetente = 'usuario'
  );

CREATE POLICY "Contadores veem chats deles" ON public.chat_contador
  FOR SELECT TO authenticated
  USING (
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
    AND remetente = 'usuario'
  )
  WITH CHECK (
    contador_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
    AND remetente = 'usuario'
  );

CREATE POLICY "Super admins gerenciam chat" ON public.chat_contador
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- =========================================
-- 2. CORRIGIR POLÍTICAS DO ACCOUNTING_MESSAGES
-- =========================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Super admins manage accounting_messages" ON public.accounting_messages;
DROP POLICY IF EXISTS "Owners view company accounting_messages" ON public.accounting_messages;
DROP POLICY IF EXISTS "Owners send company accounting_messages" ON public.accounting_messages;
DROP POLICY IF EXISTS "Accountants view linked accounting_messages" ON public.accounting_messages;
DROP POLICY IF EXISTS "Accountants send linked accounting_messages" ON public.accounting_messages;

-- Recriar políticas corrigidas
CREATE POLICY "Super admins manage accounting_messages" ON public.accounting_messages
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Owners view company accounting_messages" ON public.accounting_messages
  FOR SELECT TO authenticated
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
    OR (
      barbershop_id IN (
        SELECT barbershop_id FROM public.professionals 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Owners send company accounting_messages" ON public.accounting_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND (
      barbershop_id IN (SELECT id FROM public.barbershops WHERE owner_user_id = auth.uid())
      OR (
        barbershop_id IN (
          SELECT barbershop_id FROM public.professionals 
          WHERE user_id = auth.uid()
        )
      )
    )
    AND sender_role = 'owner'
  );

CREATE POLICY "Professionals send company accounting_messages" ON public.accounting_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND barbershop_id IN (
      SELECT barbershop_id FROM public.professionals 
      WHERE user_id = auth.uid()
    )
    AND sender_role = 'professional'
  );

CREATE POLICY "Accountants view linked accounting_messages" ON public.accounting_messages
  FOR SELECT TO authenticated
  USING (
    accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid()))
    OR (
      barbershop_id IS NOT NULL 
      AND public.has_active_accountant_link(auth.uid(), barbershop_id)
    )
  );

CREATE POLICY "Accountants send linked accounting_messages" ON public.accounting_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND (
      accountant_id IN (SELECT id FROM public.accountants WHERE user_id = auth.uid())
      OR (
        barbershop_id IS NOT NULL 
        AND public.has_active_accountant_link(auth.uid(), barbershop_id)
      )
    )
    AND sender_role = 'accountant'
  );

-- =========================================
-- 3. GARANTIR QUE A TABELA CHAT_CONTADOR EXISTA
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

-- =========================================
-- 4. ADICIONAR ÍNDICES MELHORADOS
-- =========================================
CREATE INDEX IF NOT EXISTS chat_contador_usuario_contador_idx ON public.chat_contador(usuario_id, contador_id);
CREATE INDEX IF NOT EXISTS chat_contador_nao_lidos_idx ON public.chat_contador(contador_id, lido) WHERE lido = false;

-- =========================================
-- 5. FUNÇÃO PARA VERIFICAR SE USUÁRIO PODE VER CHAT
-- =========================================
CREATE OR REPLACE FUNCTION public.can_view_chat(_user_id uuid, _usuario_id uuid, _contador_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (_user_id = _usuario_id) 
    OR (
      _user_id IN (SELECT user_id FROM public.accountants WHERE id = _contador_id)
    )
    OR public.is_super_admin(_user_id);
$$;

-- =========================================
-- 6. ATUALIZAR FUNÇÃO DE CONTAGEM DE MENSAGENS NÃO LIDAS
-- =========================================
CREATE OR REPLACE FUNCTION public.count_unread_chat_contador(_contador_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.chat_contador
  WHERE contador_id = _contador_id
    AND remetente = 'usuario'
    AND lido = false;
$$;

-- =========================================
-- 7. CORRIGIR PERMISSÕES PARA AFILIADOS E PROFISSIONAIS
-- =========================================

-- Adicionar suporte para afiliados e profissionais no chat
ALTER TABLE public.chat_contador
  ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'barbershop'
    CHECK (user_type IN ('barbershop','profissional','afiliado'));

-- Atualizar políticas para incluir user_type
CREATE POLICY "Professionals view their chats" ON public.chat_contador
  FOR SELECT TO authenticated
  USING (
    user_type = 'profissional'
    AND usuario_id = auth.uid()
  );

CREATE POLICY "Professionals send messages" ON public.chat_contador
  FOR INSERT TO authenticated
  WITH CHECK (
    user_type = 'profissional'
    AND usuario_id = auth.uid()
    AND remetente = 'usuario'
  );

CREATE POLICY "Affiliates view their chats" ON public.chat_contador
  FOR SELECT TO authenticated
  USING (
    user_type = 'afiliado'
    AND usuario_id = auth.uid()
  );

CREATE POLICY "Affiliates send messages" ON public.chat_contador
  FOR INSERT TO authenticated
  WITH CHECK (
    user_type = 'afiliado'
    AND usuario_id = auth.uid()
    AND remetente = 'usuario'
  );

-- =========================================
-- 8. CRIAR VIEW PARA MENSAGENS RECENTES
-- =========================================
CREATE OR REPLACE VIEW public.recent_chat_messages AS
SELECT 
  cc.id,
  cc.usuario_id,
  cc.contador_id,
  cc.mensagem,
  cc.remetente,
  cc.lido,
  cc.data_envio,
  u.email as usuario_email,
  u.user_metadata->>'name' as usuario_name,
  a.name as contador_name,
  a.email as contador_email,
  cc.user_type
FROM public.chat_contador cc
JOIN auth.users u ON cc.usuario_id = u.id
JOIN public.accountants a ON cc.contador_id = a.id
ORDER BY cc.data_envio DESC;

-- =========================================
-- 9. GRANT PERMISSÕES EXPLÍCITAS
-- =========================================
GRANT SELECT ON public.chat_contador TO authenticated;
GRANT INSERT ON public.chat_contador TO authenticated;
GRANT UPDATE ON public.chat_contador TO authenticated;
GRANT SELECT ON public.accounting_messages TO authenticated;
GRANT INSERT ON public.accounting_messages TO authenticated;
GRANT SELECT ON public.recent_chat_messages TO authenticated;

-- =========================================
-- 10. LIMPAR DADOS CORROMPIDOS (SE HOUVER)
-- =========================================
DELETE FROM public.chat_contador 
WHERE contador_id NOT IN (SELECT id FROM public.accountants WHERE is_active = true);

DELETE FROM public.chat_contador 
WHERE usuario_id NOT IN (SELECT id FROM auth.users);

-- =========================================
-- 11. ESTATÍSTICAS DO CHAT
-- =========================================
CREATE OR REPLACE FUNCTION public.chat_statistics(_contador_id uuid DEFAULT NULL)
RETURNS TABLE (
  total_messages bigint,
  unread_messages bigint,
  active_chats bigint,
  last_message timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    count(*) as total_messages,
    count(*) FILTER (WHERE lido = false AND remetente = 'usuario') as unread_messages,
    count(DISTINCT usuario_id) as active_chats,
    max(data_envio) as last_message
  FROM public.chat_contador
  WHERE (_contador_id IS NULL OR contador_id = _contador_id);
$$;

COMMIT;
