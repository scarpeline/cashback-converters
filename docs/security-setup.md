# Configuração de Segurança - Guia

## 🚨 Alertas de Segurança Encontrados e Corrigidos

### 1. ✅ Proteção de Senha Vazada - REQUER AÇÃO MANUAL

**Problema**: Proteção contra vazamento de senhas está desativada.

**Solução**:
1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **Authentication** → **Settings**
4. Ative a opção **"Enable password leak protection"**
5. Configure conforme necessário:
   - **Password strength**: Mínimo 8 caracteres
   - **Password history**: Lembrar últimas 5 senhas
   - **Failed attempts**: Bloquear após 5 tentativas

### 2. ✅ Webhook ASAAS - CORRIGIDO

**Problema**: Webhook ignorava RLS sem validação de negócio.

**Correções aplicadas**:
- ✅ Validação de existência do pagamento no banco
- ✅ Verificação de valor para evitar manipulação
- ✅ Verificação de estado final (evita processamento duplicado)
- ✅ Validação de contexto comercial (barbearia ativa)
- ✅ Logging detalhado de tentativas inválidas

### 3. ✅ Superadmins Auto-modificação - CORRIGIDO

**Problema**: Superadmins podiam modificar próprios privilégios.

**Correções aplicadas**:
- ✅ Nova política impede auto-modificação (`user_id != auth.uid()`)
- ✅ Logging de todas as alterações de roles
- ✅ Validação de contexto para operações sensíveis

### 4. ✅ Mercado Público Expondo Dados - CORRIGIDO

**Problema**: Políticas públicas expunham dados sensíveis.

**Correções aplicadas**:
- ✅ Removida política pública que expunha campos sensíveis
- ✅ Criadas views públicas seguras (`barbershops_public`, `services_public`)
- ✅ Ocultados campos como `asaas_customer_id`, `asaas_wallet_id`, `subscription_status`, preços
- ✅ Acesso público apenas através das views seguras

### 5. ✅ Funções de Borda - DOCUMENTADO

**Status**: OK, estava intencional e documentado.

**Ação**: Adicionados comentários explicando que `verify_jwt = false` é intencional.

## 📋 Checklist de Segurança Pós-Implementação

### 🔐 Autenticação
- [ ] Ativar proteção de senha vazada no Supabase
- [ ] Configurar força mínima de senha
- [ ] Configurar limite de tentativas falhas
- [ ] Ativar verificação em dois fatores (recomendado)

### 🛡️ Políticas RLS
- [ ] Revisar todas as políticas públicas
- [ ] Validar que dados sensíveis estão protegidos
- [ ] Testar acesso anônimo às views públicas
- [ ] Verificar logging de acesso a dados sensíveis

### 📡 Webhooks
- [ ] Configurar secrets de webhook como variáveis de ambiente
- [ ] Testar validação de assinatura
- [ ] Monitorar logs de webhook
- [ ] Implementar retry para falhas

### 🔍 Auditoria
- [ ] Revisar logs de acesso a dados sensíveis
- [ ] Configurar alertas para atividades suspeitas
- [ ] Implementar retenção de logs (mínimo 90 dias)
- [ ] Testar restauração de backups

## 🚀 Deploy das Correções

### 1. Aplicar Migrações
```bash
# A migração 20260312100000_security_fixes.sql será aplicada automaticamente
# Verifique no dashboard do Supabase se foi aplicada corretamente
```

### 2. Atualizar Webhook
```bash
# O webhook ASAAS foi atualizado com validações adicionais
# Reinicie a função se necessário
supabase functions deploy asaas-webhook
```

### 3. Configurar Variáveis de Ambiente
```bash
# No dashboard do Supabase, configure:
ASAAS_WEBHOOK_SECRET=seu-secret-aqui
ASAAS_ACCESS_TOKEN=seu-token-aqui
```

### 4. Testar Segurança
```bash
# Testar acesso anônimo
curl https://your-project.supabase.co/rest/v1/barbershops_public

# Testar acesso negado a dados sensíveis
curl https://your-project.supabase.co/rest/v1/barbershops
```

## 📊 Monitoramento Contínuo

### Alertas Configurar
- Falhas de autenticação em massa
- Tentativas de acesso a dados sensíveis
- Webhooks com assinatura inválida
- Alterações de roles de superadmin

### Logs Monitorar
- `sensitive_data_access_log` - Acesso a dados sensíveis
- `integration_logs` - Webhooks e integrações
- `auth.users` - Tentativas de login
- `user_roles` - Alterações de permissões

### Relatórios Gerar
- Relatório semanal de acesso a dados sensíveis
- Relatório mensal de tentativas de ataque
- Relatório trimestral de configurações de segurança

## 🆘 Em Caso de Incidente

### 1. Isolar o Problema
```sql
-- Bloquear usuário suspeito
UPDATE auth.users SET banned_at = NOW() WHERE id = 'user-id';

-- Revogar todos os tokens
DELETE FROM auth.sessions WHERE user_id = 'user-id';
```

### 2. Investigar Logs
```sql
-- Verificar acesso recente a dados sensíveis
SELECT * FROM sensitive_data_access_log 
WHERE accessed_at > NOW() - INTERVAL '24 hours'
ORDER BY accessed_at DESC;

-- Verificar alterações de roles
SELECT * FROM user_roles 
WHERE updated_at > NOW() - INTERVAL '24 hours';
```

### 3. Notificar Equipe
- Enviar alerta para equipe de segurança
- Documentar timeline do incidente
- Preparar relatório pós-incidente

## 📞 Contato de Suporte

Para dúvidas sobre segurança:
- Email: security@cashback-converters.com
- Slack: #security-alerts
- Documentação: /docs/security

---

**Última atualização**: 12/03/2026
**Versão**: 1.0.0
**Status**: ✅ Implementado
