-- Correção de segurança: Ocultar dados sensíveis no mercado público
-- Migration para proteger informações comerciais

-- 1. Criar views seguras para o mercado público
DROP VIEW IF EXISTS public.public_barbershops;
CREATE VIEW public.public_barbershops AS
SELECT 
  b.id,
  b.name,
  b.description,
  b.address,
  b.neighborhood,
  b.city,
  b.state,
  b.phone,
  b.whatsapp,
  b.rating,
  b.total_reviews,
  b.is_active,
  b.created_at,
  b.updated_at,
  -- Dados seguros do perfil
  p.name as owner_name,
  p.avatar_url,
  -- Remover dados sensíveis
  NULL as asaas_customer_id,
  NULL as asaas_wallet_id,
  NULL as subscription_status,
  NULL as trial_ends_at,
  NULL as plan_id
FROM public.barbershops b
JOIN public.profiles p ON p.user_id = b.owner_user_id
WHERE b.is_active = true;

-- 2. Criar view segura para serviços
DROP VIEW IF EXISTS public.public_services;
CREATE VIEW public.public_services AS
SELECT 
  s.id,
  s.name,
  s.description,
  s.duration_minutes,
  -- Preços mascarados para não autenticados
  CASE 
    WHEN auth.role() = 'authenticated' THEN s.price
    ELSE NULL
  END as price,
  s.category,
  s.is_active,
  s.barbershop_id,
  s.created_at,
  s.updated_at,
  -- Remover dados sensíveis
  NULL as commission_rate,
  NULL as asaas_plan_id
FROM public.services s
JOIN public.barbershops b ON b.id = s.barbershop_id
WHERE s.is_active = true AND b.is_active = true;

-- 3. Atualizar políticas para usar views seguras
DROP POLICY IF EXISTS "Public can view safe barbershop data" ON public.barbershops;
DROP POLICY IF EXISTS "Public can view safe service data" ON public.services;

-- Política para barbearias públicas (usando view)
CREATE POLICY "Public can view barbershops" ON public.barbershops
  FOR SELECT USING (
    is_active = true AND
    -- Para não autenticados, apenas dados básicos
    (auth.role() = 'authenticated' OR (
      auth.role() IS NULL AND
      -- Verificar se está usando a view pública
      EXISTS (
        SELECT 1 FROM public.public_barbershops pb 
        WHERE pb.id = barbershops.id
      )
    ))
  );

-- Política para serviços públicos (usando view)
CREATE POLICY "Public can view services" ON public.services
  FOR SELECT USING (
    is_active = true AND
    -- Para não autenticados, sem preços
    (auth.role() = 'authenticated' OR (
      auth.role() IS NULL AND
      -- Verificar se está usando a view pública
      EXISTS (
        SELECT 1 FROM public.public_services ps 
        WHERE ps.id = services.id
      )
    ))
  );

-- 4. Criar função para mascarar dados sensíveis
CREATE OR REPLACE FUNCTION public.mask_sensitive_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Se usuário não autenticado, mascarar dados sensíveis
  IF auth.role() IS NULL THEN
    -- Mascarar dados financeiros
    NEW.asaas_customer_id := NULL;
    NEW.asaas_wallet_id := NULL;
    NEW.subscription_status := NULL;
    NEW.trial_ends_at := NULL;
    NEW.plan_id := NULL;
    NEW.commission_rate := NULL;
    NEW.price := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Adicionar triggers para mascarar dados
DROP TRIGGER IF EXISTS mask_barbershop_data ON public.barbershops;
CREATE TRIGGER mask_barbershop_data
  BEFORE SELECT ON public.barbershops
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.mask_sensitive_data();

DROP TRIGGER IF EXISTS mask_service_data ON public.services;
CREATE TRIGGER mask_service_data
  BEFORE SELECT ON public.services
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.mask_sensitive_data();

-- 6. Restringir acesso direto às tabelas originais
-- Criar políticas que negam acesso não autenticado
DROP POLICY IF EXISTS "Deny anonymous access to barbershops" ON public.barbershops;
CREATE POLICY "Deny anonymous access to barbershops" ON public.barbershops
  FOR SELECT USING (auth.role() IS NOT NULL);

DROP POLICY IF EXISTS "Deny anonymous access to services" ON public.services;
CREATE POLICY "Deny anonymous access to services" ON public.services
  FOR SELECT USING (auth.role() IS NOT NULL);

-- 7. Criar endpoint seguro para dados públicos
CREATE OR REPLACE FUNCTION public.get_public_barbershops(p_city TEXT DEFAULT NULL, p_state TEXT DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  whatsapp TEXT,
  rating DECIMAL,
  total_reviews INTEGER,
  owner_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id,
    pb.name,
    pb.description,
    pb.address,
    pb.neighborhood,
    pb.city,
    pb.state,
    pb.phone,
    pb.whatsapp,
    pb.rating,
    pb.total_reviews,
    pb.owner_name,
    pb.avatar_url
  FROM public.public_barbershops pb
  WHERE 
    (p_city IS NULL OR pb.city = p_city) AND
    (p_state IS NULL OR pb.state = p_state)
  ORDER BY pb.rating DESC, pb.total_reviews DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar endpoint seguro para serviços públicos
CREATE OR REPLACE FUNCTION public.get_public_services(p_barbershop_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  duration_minutes INTEGER,
  price DECIMAL,
  category TEXT,
  barbershop_id UUID
) AS $$
BEGIN
  -- Se não autenticado, retornar sem preços
  IF auth.role() IS NULL THEN
    RETURN QUERY
    SELECT 
      ps.id,
      ps.name,
      ps.description,
      ps.duration_minutes,
      NULL::DECIMAL as price, -- Preço oculto
      ps.category,
      ps.barbershop_id
    FROM public.public_services ps
    WHERE ps.barbershop_id = p_barbershop_id;
  ELSE
    RETURN QUERY
    SELECT 
      ps.id,
      ps.name,
      ps.description,
      ps.duration_minutes,
      ps.price,
      ps.category,
      ps.barbershop_id
    FROM public.public_services ps
    WHERE ps.barbershop_id = p_barbershop_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
