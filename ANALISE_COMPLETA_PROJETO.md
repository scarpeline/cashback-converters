# ANÁLISE COMPLETA DO PROJETO - SISTEMA SAAS BARBEARIA

**Data:** 11/03/2026  
**Objetivo:** Implementar módulo completo de contabilidade e pagamentos

---

## 📊 ESTRUTURA ATUAL DO BANCO DE DADOS

### Tabelas Existentes - Contabilidade

1. **accountants** ✅
   - Campos: id, user_id, name, email, whatsapp, cpf_cnpj, asaas_customer_id, asaas_wallet_id
   - Comissões: commission_mei, commission_me, commission_declaration
   - Status: is_active

2. **accountant_barbershop_links** ✅
   - Vínculo contador-barbearia
   - Status: pending, active, revoked
   - Campos: requested_by_user_id, requested_at, accepted_at, revoked_at

3. **fiscal_service_requests** ✅
   - Pedidos de serviços contábeis
   - Campos: client_user_id, accountant_id, service_type, status, amount
   - Status: pending, accepted, in_progress, completed, rejected

4. **fiscal_service_types** ✅
   - Tipos de serviços configuráveis
   - Campos: service_type, label, price, required_fields, status

5. **accounting_documents** ✅
   - Documentos contábeis
   - Campos: barbershop_id, accountant_id, fiscal_service_request_id, storage_path

6. **accounting_messages** ✅
   - Mensagens contador-cliente
   - Campos: barbershop_id, accountant_id, sender_user_id, body

7. **accounting_tax_guides** ✅
   - Guias de impostos
   - Campos: barbershop_id, accountant_id, tax_type, amount, status

8. **accounting_audit_logs** ✅
   - Logs de auditoria
   - Campos: actor_user_id, action, entity_table, metadata

### Tabelas de Pagamento

9. **payments** ✅
   - Pagamentos gerais
   - Campos: appointment_id, barbershop_id, amount, payment_method, status
   - Integração: asaas_payment_id, asaas_pix_qr_code, asaas_pix_copy_paste
   - Split: split_data (JSONB)

---

## 🎯 PAINÉIS EXISTENTES

1. **SuperAdminDashboard.tsx** ✅
2. **DonoDashboard.tsx** ✅
3. **ProfissionalDashboard.tsx** ✅
4. **AfiliadoDashboard.tsx** ✅
5. **ClienteDashboard.tsx** ✅
6. **ContadorDashboard.tsx** ✅

---

## 🔧 EDGE FUNCTIONS EXISTENTES

1. **process-payment** - Processamento de pagamentos
2. **asaas-webhook** - Webhook ASAAS
3. **accounting-docs** - Documentos contábeis
4. **manage-subscriptions** - Gerenciamento de assinaturas
5. **send-email** - Envio de emails
6. **send-sms** - Envio de SMS

---

## ❌ GAPS IDENTIFICADOS (O QUE FALTA IMPLEMENTAR)

### 1️⃣ CADASTRO DE CONTADOR AUTORIZADO
**Status:** ⚠️ PARCIALMENTE IMPLEMENTADO
- ✅ Tabela `accountants` existe
- ❌ Falta: crc_registro_contador, empresa_contabil, endereco, cidade, estado, status_verificado
- ❌ Falta: Interface de cadastro completa no Super Admin
- ❌ Falta: Validação de CRC

### 2️⃣ VÍNCULO COM CONTADOR
**Status:** ⚠️ IMPLEMENTADO MAS PRECISA REFATORAÇÃO
- ✅ Tabela `accountant_barbershop_links` existe
- ✅ Sistema de aprovação existe
- ❌ Falta: Busca interna de contadores (atualmente usa email manual)
- ❌ Falta: Sistema de notificações para aprovação
- ❌ Falta: Interface de seleção de contador

### 3️⃣ PAGAMENTO ANTECIPADO DE SERVIÇOS
**Status:** ⚠️ PARCIALMENTE IMPLEMENTADO
- ✅ Tabela `fiscal_service_requests` existe
- ✅ Tabela `fiscal_service_types` existe
- ❌ Falta: Integração de pagamento antecipado
- ❌ Falta: Tabela `pedidos_contabeis` com dados_formulario
- ❌ Falta: Fluxo de pagamento antes do envio ao contador
- ❌ Falta: Status de pagamento separado

### 4️⃣ ASSINATURA RECORRENTE
**Status:** ❌ NÃO IMPLEMENTADO
- ❌ Falta: Tabela `assinaturas_contabeis`
- ❌ Falta: Sistema de cobrança recorrente
- ❌ Falta: Histórico de pagamentos de assinatura
- ❌ Falta: Integração com gateway para recorrência

### 5️⃣ CHAT PRÉ-CONTRATAÇÃO
**Status:** ⚠️ PARCIALMENTE IMPLEMENTADO
- ✅ Tabela `accounting_messages` existe
- ❌ Falta: Interface de chat antes da contratação
- ❌ Falta: Botão "Falar com contador"
- ❌ Falta: Sistema de notificação em tempo real

### 6️⃣ CONFIGURAÇÃO DE COMISSÕES
**Status:** ⚠️ PARCIALMENTE IMPLEMENTADO
- ✅ Campos de comissão existem em `accountants`
- ❌ Falta: Tabela `config_comissoes` global
- ❌ Falta: Interface no Super Admin
- ❌ Falta: Aplicação automática em pagamentos
- ❌ Falta: Split automático app/contador

### 7️⃣ PAGAMENTO NFC
**Status:** ❌ PRECISA DIAGNÓSTICO
- ⚠️ Integração ASAAS existe
- ❌ Precisa: Verificar implementação NFC
- ❌ Precisa: Testar QR Code
- ❌ Precisa: Testar PIX

### 8️⃣ QR CODE/NFC NO PAINEL PROFISSIONAL
**Status:** ❌ NÃO IMPLEMENTADO
- ✅ Existe no painel Dono
- ❌ Falta: Duplicar para Profissional
- ❌ Falta: Permissões adequadas

### 9️⃣ DUPLICAR SISTEMA CONTÁBIL
**Status:** ❌ NÃO IMPLEMENTADO
- ✅ Sistema existe no painel Dono
- ❌ Falta: Copiar para Profissional
- ❌ Falta: Copiar para Afiliado
- ❌ Falta: Ajustar permissões

### 🔟 SINCRONIZAÇÃO CONTÁBIL
**Status:** ❌ PRECISA DIAGNÓSTICO
- ❌ Precisa: Identificar erros
- ❌ Precisa: Verificar APIs
- ❌ Precisa: Corrigir inconsistências

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### FASE 1: CORREÇÕES E MELHORIAS (Prioridade Alta)
1. Completar cadastro de contador com todos os campos
2. Refatorar vínculo com busca interna
3. Diagnosticar e corrigir NFC/QR Code
4. Corrigir sincronização contábil

### FASE 2: NOVOS RECURSOS (Prioridade Alta)
5. Implementar pagamento antecipado de serviços
6. Criar sistema de assinatura recorrente
7. Implementar chat pré-contratação
8. Criar configuração de comissões no Super Admin

### FASE 3: DUPLICAÇÃO (Prioridade Média)
9. Duplicar QR Code/NFC para Profissional
10. Duplicar sistema contábil para Profissional e Afiliado

### FASE 4: TESTES E VALIDAÇÃO (Prioridade Alta)
11. Criar testes de integração
12. Debug completo de todos os painéis
13. Validação final

---

## 🔍 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ Análise completa concluída
2. ⏭️ Criar migrações SQL para novos campos e tabelas
3. ⏭️ Implementar interfaces de cadastro
4. ⏭️ Criar edge functions para pagamentos
5. ⏭️ Implementar testes
