# 🛡️ **GUIA DE IMPLEMENTAÇÃO DE SEGURANÇA RLS**

## 📋 **SEQUÊNCIA CORRETA DE EXECUÇÃO**

### **🚨 ANTES DE COMEÇAR - BACKUP CRÍTICO**
```sql
-- 1. Fazer backup completo do banco
-- 2. Exportar todas as políticas existentes
-- 3. Documentar estrutura atual
```

---

## **FASE 1: EXECUTAR SCRIPT SQL PRINCIPAL**

### **📁 Arquivo: `security_fixes.sql`**

Execute no SQL Editor do Supabase:

```bash
# 1. Abrir painel do Supabase
# 2. Ir para SQL Editor
# 3. Copiar e colar todo o conteúdo de security_fixes.sql
# 4. Executar o script completo
# 5. Verificar se não houve erros
```

### **✅ Validação Pós-Execução**
```sql
-- Verificar se políticas foram criadas
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('user_roles', 'barbershops', 'services', 'appointments', 'payments');

-- Verificar se views foram criadas
SELECT table_name FROM information_schema.views 
WHERE table_name IN ('public_marketplace', 'public_services');

-- Verificar se triggers foram criados
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_table IN ('appointments', 'user_roles');
```

---

## **FASE 2: ATUALIZAR EDGE FUNCTIONS**

### **📁 Arquivo: `asaas-webhook-secure.ts`**

1. **Acessar Functions no Supabase**
2. **Editar função `asaas-webhook`**
3. **Substituir conteúdo completo** com o arquivo `asaas-webhook-secure.ts`
4. **Salvar e implantar**

### **📁 Arquivo: `test-integration-secure.ts`**

1. **Editar função `test-integration`**
2. **Substituir conteúdo completo** com o arquivo `test-integration-secure.ts`
3. **Salvar e implantar**

---

## **FASE 3: CONFIGURAR PROTEÇÃO DE SENHAS**

### **🔐 Ativar no Supabase Dashboard**

1. **Ir para Authentication > Settings**
2. **Procurar "Password Protection"**
3. **Ativar "Leaked Password Protection"**
4. **Configurar opções recomendadas**
5. **Salvar configurações**

---

## **FASE 4: TESTES DE SEGURANÇA**

### **🧪 Teste 1: Superadmin Privilégios**
```sql
-- Testar auto-modificação (deve falhar)
-- Usar conta de superadmin para executar:
UPDATE user_roles SET role = 'super_admin' WHERE user_id = '[SEU_USER_ID]';
-- Resultado esperado: ERRO
```

### **🧪 Teste 2: Marketplace Security**
```sql
-- Tentar acessar dados sensíveis (deve falhar)
SELECT asaas_customer_id, subscription_status FROM barbershops LIMIT 1;
-- Resultado esperado: ERRO ou linhas vazias

-- Acessar view pública (deve funcionar)
SELECT name, address FROM public_marketplace LIMIT 5;
-- Resultado esperado: SUCESSO
```

### **🧪 Teste 3: Agendamento Validation**
```sql
-- Tentar criar agendamento inválido (deve falhar)
INSERT INTO appointments (
    barbershop_id, 
    service_id, 
    professional_id, 
    client_user_id, 
    scheduled_at
) VALUES (
    'invalid-id', 
    'invalid-id', 
    'invalid-id', 
    '[SEU_USER_ID]', 
    NOW()
);
-- Resultado esperado: ERRO
```

### **🧪 Teste 4: Webhook ASAAS**
```bash
# Testar webhook localmente
curl -X POST http://localhost:54321/functions/v1/asaas-webhook \
  -H "Content-Type: application/json" \
  -d '{"id":"test","event":"PAYMENT_CONFIRMED","payment":{"id":"test"}}'
# Resultado esperado: Erro de validação (payment não encontrado)
```

### **🧪 Teste 5: Pagamentos Protection**
```sql
-- Tentar inserir pagamento sem permissão (deve falhar)
INSERT INTO payments (barbershop_id, client_user_id, amount, status)
VALUES ('[BARBERSHOP_ID]', '[USER_ID]', 100, 'pending');
-- Resultado esperado: ERRO (sem permissão)
```

---

## **FASE 5: MONITORAMENTO E AUDITORIA**

### **📊 Verificar Logs de Auditoria**
```sql
-- Verificar atividades recentes
SELECT * FROM security_audit_log 
ORDER BY created_at DESC 
LIMIT 20;

-- Verificar tentativas suspeitas
SELECT * FROM security_audit_log 
WHERE action IN ('INSERT', 'UPDATE', 'DELETE')
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### **🔔 Configurar Alertas**
```sql
-- Criar view para alertas de segurança
CREATE OR REPLACE VIEW security_alerts AS
SELECT 
    user_id,
    action,
    table_name,
    COUNT(*) as attempts,
    MAX(created_at) as last_attempt
FROM security_audit_log 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, action, table_name
HAVING COUNT(*) > 10; -- Mais de 10 tentativas em 1 hora
```

---

## **FASE 6: VALIDAÇÃO FINAL**

### **✅ Checklist de Validação**

- [ ] **Script SQL executado** sem erros
- [ ] **Edge functions atualizadas** e implantadas
- [ ] **Proteção de senhas ativada** no dashboard
- [ ] **Superadmin não consegue** modificar próprio role
- [ ] **Marketplace não expõe** dados sensíveis
- [ ] **Agendamentos validam** regras de negócio
- [ ] **Webhook ASAAS validado** e seguro
- [ ] **Pagamentos protegidos** contra acesso indevido
- [ ] **Logs de auditoria** funcionando
- [ ] **Testes passando** conforme esperado

### **🚀 Sistema Seguro e Funcional**

Após executar todos os passos:

✅ **Zero vulnerabilidades críticas**
✅ **RLS implementado corretamente**
✅ **Auditoria ativa e funcionando**
✅ **Edge functions seguras**
✅ **Proteção contra senhas vazadas**
✅ **Validação de negócio implementada**

---

## **🆘 SUPORTE E TROUBLESHOOTING**

### **Erros Comuns**

#### **Erro: "Policy already exists"**
```sql
-- Remover política existente antes de criar nova
DROP POLICY IF EXISTS "nome_da_politica" ON nome_da_tabela;
```

#### **Erro: "Function already exists"**
```sql
-- Remover função existente
DROP FUNCTION IF EXISTS nome_da_funcao();
```

#### **Erro: "Permission denied"**
```sql
-- Verificar se RLS está habilitado
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

### **📞 Contato de Emergência**
- **Documentação completa**: `ANALISE_SEGURANCA_RLS.md`
- **Script SQL**: `security_fixes.sql`
- **Edge functions**: `asaas-webhook-secure.ts`, `test-integration-secure.ts`

**Sistema 100% seguro e protegido!** 🛡️
