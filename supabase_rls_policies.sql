-- ============ RLS POLICIES PARA NOVAS TABELAS ============

-- 1. STOCK_ITEMS - Apenas dono da barbearia pode ver/editar
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_items_select_owner" ON stock_items
  FOR SELECT USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "stock_items_insert_owner" ON stock_items
  FOR INSERT WITH CHECK (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "stock_items_update_owner" ON stock_items
  FOR UPDATE USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

-- 2. RAFFLES - Apenas dono pode gerenciar, clientes podem ver
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "raffles_select_all" ON raffles
  FOR SELECT USING (true);

CREATE POLICY "raffles_insert_owner" ON raffles
  FOR INSERT WITH CHECK (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "raffles_update_owner" ON raffles
  FOR UPDATE USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

-- 3. RAFFLE_TICKETS - Usuário pode ver seus próprios bilhetes
ALTER TABLE raffle_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "raffle_tickets_select_own" ON raffle_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "raffle_tickets_insert_own" ON raffle_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. DEBTS - Profissional pode ver/editar suas dívidas
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "debts_select_own" ON debts
  FOR SELECT USING (professional_user_id = auth.uid());

CREATE POLICY "debts_insert_own" ON debts
  FOR INSERT WITH CHECK (professional_user_id = auth.uid());

CREATE POLICY "debts_update_own" ON debts
  FOR UPDATE USING (professional_user_id = auth.uid());

-- 5. FISCAL_SERVICE_TYPES - Apenas super_admin pode gerenciar
ALTER TABLE fiscal_service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiscal_service_types_select_all" ON fiscal_service_types
  FOR SELECT USING (true);

CREATE POLICY "fiscal_service_types_admin_only" ON fiscal_service_types
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 6. FISCAL_SERVICE_REQUESTS - Cliente vê seus pedidos, contador vê seus clientes
ALTER TABLE fiscal_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiscal_requests_select_own" ON fiscal_service_requests
  FOR SELECT USING (
    client_user_id = auth.uid() OR
    accountant_id IN (
      SELECT id FROM accountants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "fiscal_requests_insert_own" ON fiscal_service_requests
  FOR INSERT WITH CHECK (client_user_id = auth.uid());

CREATE POLICY "fiscal_requests_update_own" ON fiscal_service_requests
  FOR UPDATE USING (
    client_user_id = auth.uid() OR
    accountant_id IN (
      SELECT id FROM accountants WHERE user_id = auth.uid()
    )
  );

-- 7. SUBSCRIPTION_PLANS - Todos podem ver, apenas admin pode editar
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select_all" ON subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "subscription_plans_admin_only" ON subscription_plans
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 8. MESSAGING_PACKAGES - Todos podem ver, apenas admin pode editar
ALTER TABLE messaging_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messaging_packages_select_all" ON messaging_packages
  FOR SELECT USING (true);

CREATE POLICY "messaging_packages_admin_only" ON messaging_packages
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 9. INTERNAL_SYSTEM_MESSAGES - Todos podem ver, apenas admin pode editar
ALTER TABLE internal_system_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal_messages_select_all" ON internal_system_messages
  FOR SELECT USING (true);

CREATE POLICY "internal_messages_admin_only" ON internal_system_messages
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );
