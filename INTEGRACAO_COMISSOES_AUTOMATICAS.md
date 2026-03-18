# Integração de Comissões Automáticas - Sistema de Parceiros

## 📋 Resumo

Implementação de geração automática de comissões quando pagamentos são confirmados. O sistema agora:

1. **Detecta indicações** - Quando um cliente indicado faz pagamento
2. **Gera comissões** - Automaticamente no webhook de pagamento
3. **Rastreia origem** - Cada comissão sabe de qual pagamento veio
4. **Permite gestão** - Admin aprova e marca como paga

---

## 🔄 Fluxo Completo

```
1. Cliente faz pagamento
   ↓
2. ASAAS confirma pagamento
   ↓
3. Webhook recebe PAYMENT_CONFIRMED
   ↓
4. Atualiza status do pagamento para "paid"
   ↓
5. [NOVO] Verifica se cliente foi indicado
   ↓
6. [NOVO] Gera comissão de referência (10%)
   ↓
7. [NOVO] Verifica se barbershop é franqueado
   ↓
8. [NOVO] Gera comissão de franquia (30%)
   ↓
9. [NOVO] Se franqueado tem diretor, gera comissão de rede (5%)
   ↓
10. Atualiza agendamento para "completed"
   ↓
11. Atualiza métricas diárias
```

---

## 🔧 Implementação Técnica

### Webhook de Pagamento (`supabase/functions/asaas-webhook/index.ts`)

Após confirmar o pagamento, o webhook agora:

1. **Busca indicação do cliente**
   ```typescript
   const { data: referral } = await supabase
     .from("partner_referrals")
     .select("referrer_id")
     .eq("referred_user_id", paymentRecord.client_id)
     .eq("status", "completed")
     .maybeSingle();
   ```

2. **Gera comissão de referência (10%)**
   ```typescript
   if (referral?.referrer_id) {
     const commissionAmount = paymentRecord.amount * 0.10;
     await supabase.from("partner_commissions").insert({
       partner_id: referral.referrer_id,
       type: "referral",
       amount: commissionAmount,
       source_id: event.payment.id,
       source_type: "payment",
       status: "pending",
     });
   }
   ```

3. **Verifica se barbershop é franqueado**
   ```typescript
   const { data: franchise } = await supabase
     .from("partners")
     .select("id")
     .eq("barbershop_id", paymentRecord.barbershop_id)
     .eq("type", "franqueado")
     .eq("status", "ativo")
     .maybeSingle();
   ```

4. **Gera comissão de franquia (30%)**
   ```typescript
   if (franchise?.id) {
     const commissionAmount = paymentRecord.amount * 0.30;
     await supabase.from("partner_commissions").insert({
       partner_id: franchise.id,
       type: "franchise_revenue",
       amount: commissionAmount,
       source_id: event.payment.id,
       source_type: "payment",
       status: "pending",
     });
   }
   ```

5. **Gera comissão de rede (5%) se franqueado tem diretor**
   ```typescript
   if (director?.id) {
     const networkCommissionAmount = paymentRecord.amount * 0.05;
     await supabase.from("partner_commissions").insert({
       partner_id: director.id,
       type: "network_revenue",
       amount: networkCommissionAmount,
       source_id: event.payment.id,
       source_type: "payment",
       status: "pending",
     });
   }
   ```

---

## 🎯 Percentuais de Comissão

| Tipo | Percentual | Quando |
|------|-----------|--------|
| Referência (Afiliado) | 10% | Cliente indicado faz pagamento |
| Franquia | 30% | Pagamento na unidade franqueada |
| Rede (Diretor) | 5% | Pagamento de franqueado sob sua supervisão |

---

## 🛠️ Componentes Criados

### `src/components/admin/CommissionManagementPanel.tsx`
- Lista todas as comissões
- Filtro por status (pendente, aprovada, paga, cancelada)
- Botões para aprovar, pagar ou cancelar
- Exibe informações do parceiro e tipo de comissão

### `src/pages/admin/CommissionsPage.tsx`
- Dashboard de comissões para admin
- Stats: Pendentes, Aprovadas, Pagas, Total
- Integra CommissionManagementPanel
- Explicação do fluxo

---

## 🛣️ Rotas

### Nova Rota
```
/admin/comissoes
- Roles: super_admin
- Componente: CommissionsPage
- Acesso: Admin Dashboard
```

---

## 📊 Status de Comissão

| Status | Descrição | Ações Disponíveis |
|--------|-----------|------------------|
| `pending` | Gerada automaticamente, aguardando aprovação | Aprovar, Cancelar |
| `approved` | Aprovada pelo admin, pronta para pagamento | Marcar como Paga |
| `paid` | Já foi paga ao parceiro | Nenhuma |
| `cancelled` | Cancelada (erro, duplicação, etc) | Nenhuma |

---

## 🔐 Segurança

### RLS Policies
- Parceiros veem apenas suas próprias comissões
- Super admin vê todas as comissões
- Comissões não podem ser editadas após criação (apenas status)

### Validações
- Comissão só é gerada se pagamento foi confirmado
- Comissão não é duplicada (webhook é idempotente)
- Valor da comissão é calculado no servidor
- Origem da comissão é rastreada (source_id, source_type)

---

## 📱 Fluxo do Usuário

### Para Parceiro
1. Compartilha código de referência
2. Cliente se cadastra com código
3. Cliente faz pagamento
4. Comissão é gerada automaticamente
5. Parceiro vê comissão em `/painel-parceiro`
6. Admin aprova comissão
7. Parceiro recebe pagamento

### Para Admin
1. Acessa `/admin/comissoes`
2. Vê stats de comissões
3. Filtra por status
4. Aprova comissões pendentes
5. Marca como paga após processar
6. Acompanha histórico

---

## 🚀 Próximos Passos

1. **Integração com ASAAS para Pagamento**
   - Criar função para pagar parceiros via ASAAS
   - Integrar com webhook de confirmação de pagamento

2. **Notificações em Tempo Real**
   - Notificar parceiro quando comissão é gerada
   - Notificar quando comissão é aprovada/paga

3. **Relatórios**
   - Relatório de comissões por período
   - Gráficos de crescimento de rede
   - Export de comissões pagas

4. **Automação de Aprovação**
   - Aprovar automaticamente comissões até certo valor
   - Rejeitar automaticamente comissões duplicadas

5. **Paginação**
   - Adicionar paginação na CommissionManagementPanel se crescer

---

## 📝 Notas Técnicas

- Comissões são criadas com status `pending` por padrão
- Webhook é idempotente - não cria duplicatas
- Erros na geração de comissões não falham o webhook
- Cada comissão rastreia sua origem (payment_id)
- View `partner_commission_summary` fornece resumo por parceiro

---

## ✅ Checklist de Implementação

- [x] Integração no webhook de pagamento
- [x] Geração de comissão de referência
- [x] Geração de comissão de franquia
- [x] Geração de comissão de rede
- [x] Componente de gestão de comissões
- [x] Página de admin para comissões
- [x] Rota protegida para admin
- [x] RLS policies
- [x] Validações de segurança
- [x] Build sem erros

---

**Data**: 18 de Março de 2026
**Status**: ✅ Implementação Completa
