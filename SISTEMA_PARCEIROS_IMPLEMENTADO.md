# Sistema de Parceiros - Implementação Completa

## 📋 Resumo

Sistema completo de gestão de parceiros (afiliados, franqueados, diretores) com:
- Códigos de referência únicos
- Rastreamento de indicações
- Sistema de comissões automático
- Dashboard para parceiros
- Exportação de dados em CSV

---

## 🗄️ Banco de Dados

### Migrations Criadas

#### 1. `20260318020000_add_referral_code.sql`
- Adiciona coluna `referral_code` (VARCHAR 12, UNIQUE) à tabela `partners`
- Cria tabela `partner_referrals` para rastrear quem foi indicado por quem
- Campos: `referrer_id`, `referred_user_id`, `status` (pending/completed/cancelled)
- RLS policies para segurança

#### 2. `20260318030000_partner_commissions.sql`
- Cria tabela `partner_commissions` com campos:
  - `partner_id`: Parceiro que recebe a comissão
  - `type`: 'referral', 'franchise_revenue', 'network_revenue'
  - `amount`: Valor da comissão
  - `status`: pending/approved/paid/cancelled
  - `source_id`, `source_type`: Rastreamento da origem
- View `partner_commission_summary` para resumo por parceiro
- RLS policies para segurança

---

## 🔧 Backend (Services)

### `src/services/partnersService.ts`
Novas funções:
- `getPartnerByReferralCode()` - Buscar parceiro por código
- `createPartnerReferral()` - Registrar indicação
- `getPartnerCommissions()` - Listar comissões
- `getPartnerCommissionSummary()` - Resumo de comissões
- `createPartnerCommission()` - Criar comissão

### `src/services/partnerCommissionService.ts` (NOVO)
Funções para automação:
- `generateReferralCommission()` - Comissão de indicação (10%)
- `generateFranchiseCommission()` - Comissão de franquia (30%)
- `generateNetworkCommission()` - Comissão de rede (5%)
- `getPendingCommissions()` - Comissões pendentes
- `approveCommission()` - Aprovar comissão
- `markCommissionAsPaid()` - Marcar como paga
- `cancelCommission()` - Cancelar comissão

---

## ⚛️ Frontend (React)

### Hooks (`src/hooks/usePartners.ts`)
Novos hooks:
- `usePartnerCommissions()` - Buscar comissões
- `usePartnerCommissionSummary()` - Resumo de comissões
- `useCreatePartnerCommission()` - Criar comissão

### Componentes

#### `src/components/partners/ReferralCodeDisplay.tsx`
- Exibe código de referência único
- Botão para copiar código
- Link de indicação completo
- Botão de compartilhamento (Web Share API)

#### `src/components/partners/CommissionsPanel.tsx`
- Cards com resumo: Pendentes, Aprovadas, Pagas, Total
- Histórico de comissões com status
- Formatação de moeda

#### `src/components/partners/ReferralsPanel.tsx`
- Lista de pessoas indicadas
- Status de cada indicação
- Data de indicação

#### `src/components/partners/PartnerHierarchyTree.tsx`
- Visualiza posição na hierarquia
- Mostra tipo e nível de cada parceiro

#### `src/components/partners/PartnerDashboard.tsx` (NOVO)
- Dashboard completo para parceiros
- Stats: Indicados, Tipo, Status
- Integra todos os componentes acima
- Rota: `/painel-parceiro`

### Páginas

#### `src/pages/dashboards/PartnerManagementPage.tsx` (ATUALIZADO)
- Tabs agora filtram corretamente por tipo
- Botão de exportar CSV
- Stats em cards

---

## 📊 Utilitários

### `src/lib/csvExporter.ts` (NOVO)
- `exportToCSV()` - Função genérica de export
- `exportPartnersToCSV()` - Export de parceiros
- `exportCommissionsToCSV()` - Export de comissões
- Escape correto de valores CSV

---

## 🛣️ Rotas

### Nova Rota Protegida
```
/painel-parceiro
- Roles: afiliado_saas, afiliado_barbearia
- Componente: PartnerDashboard
```

### Rota Existente (Atualizada)
```
/gestao-parceiros
- Roles: dono, super_admin
- Componente: PartnerManagementPage
- Agora com export CSV e tabs funcionando
```

---

## 💰 Sistema de Comissões

### Percentuais Padrão
- **Afiliados**: 10% primeira compra, 5% recorrente
- **Franqueados**: 30% sobre faturamento da unidade
- **Diretores**: 5% sobre faturamento da rede

### Fluxo de Comissão
1. Evento (pagamento, indicação, etc)
2. Criar comissão com status `pending`
3. Admin aprova → status `approved`
4. Pagamento processado → status `paid`

---

## 🔐 Segurança

### RLS Policies
- Parceiros veem apenas suas próprias comissões
- Super admin vê tudo
- Referências protegidas por RLS

### Validações
- Código de referência único
- Usuário não pode indicar a si mesmo
- Comissões rastreáveis por source_id

---

## 📱 Funcionalidades

### Para Parceiros
✅ Ver código de referência único
✅ Compartilhar link de indicação
✅ Ver pessoas indicadas
✅ Acompanhar comissões em tempo real
✅ Ver histórico de comissões
✅ Visualizar posição na hierarquia

### Para Donos/Admin
✅ Gerenciar parceiros (criar, editar, bloquear)
✅ Filtrar por tipo (afiliado, franqueado, diretor)
✅ Buscar por nome, email, WhatsApp
✅ Exportar lista em CSV
✅ Ver stats de parceiros
✅ Gerenciar comissões

---

## 🚀 Próximos Passos (Sugestões)

1. **Integração com Pagamentos**
   - Chamar `generateReferralCommission()` quando pagamento é confirmado
   - Chamar `generateFranchiseCommission()` para franqueados

2. **Notificações**
   - Notificar parceiro quando comissão é gerada
   - Notificar quando comissão é aprovada/paga

3. **Relatórios**
   - Dashboard de comissões por período
   - Gráficos de crescimento de rede

4. **Paginação**
   - Adicionar paginação na PartnerList se crescer muito

5. **Validações**
   - Verificar se usuário já é parceiro antes de criar
   - Impedir duplicação de tipos

---

## 📝 Notas Técnicas

- Todas as migrations seguem padrão de timestamp
- RLS policies garantem segurança de dados
- Hooks usam React Query para cache eficiente
- CSV export funciona no navegador (sem servidor)
- Componentes são reutilizáveis e compostos

---

## ✅ Checklist de Implementação

- [x] Migrations de banco de dados
- [x] Serviços de parceiros e comissões
- [x] Hooks React Query
- [x] Componentes de UI
- [x] Dashboard de parceiros
- [x] Exportação CSV
- [x] Rotas protegidas
- [x] RLS policies
- [x] Sem duplicação de código
- [x] Build sem erros

---

**Data**: 18 de Março de 2026
**Status**: ✅ Implementação Completa
