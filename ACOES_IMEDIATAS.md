# Ações Imediatas - Checklist

## 📅 Data: 09/04/2026

## 🎯 Objetivo
Lista de ações prioritárias para validar e colocar o sistema em produção.

---

## ✅ FASE 1: VALIDAÇÃO (HOJE - 2h)

### 1. Verificar Banco de Dados
- [ ] Acessar Supabase Dashboard
- [ ] Abrir SQL Editor
- [ ] Executar `verificar_especialidades.sql`
- [ ] Confirmar 28 especialidades cadastradas
- [ ] Verificar se não há duplicatas
- [ ] Validar estrutura da tabela `sector_presets`

**Tempo estimado**: 15 minutos

---

### 2. Instalar Dependências
```bash
# No terminal do projeto
npm install
```
- [ ] Aguardar instalação completa
- [ ] Verificar se não há erros
- [ ] Confirmar que node_modules foi criado

**Tempo estimado**: 5-10 minutos

---

### 3. Executar Build
```bash
npm run build
```
- [ ] Aguardar build completo
- [ ] Verificar se não há erros de TypeScript
- [ ] Confirmar que pasta `dist` foi criada
- [ ] Anotar warnings (se houver)

**Tempo estimado**: 2-3 minutos

---

### 4. Executar em Desenvolvimento
```bash
npm run dev
```
- [ ] Aguardar servidor iniciar
- [ ] Abrir navegador em `http://localhost:5173`
- [ ] Verificar se página inicial carrega
- [ ] Verificar console do navegador (F12)
- [ ] Confirmar que não há erros críticos

**Tempo estimado**: 2 minutos

---

### 5. Testar Login
- [ ] Acessar `/login`
- [ ] Fazer login com usuário de teste
- [ ] Verificar se redireciona corretamente
- [ ] Confirmar que dashboard carrega
- [ ] Fazer logout

**Tempo estimado**: 3 minutos

---

### 6. Testar Onboarding Completo
- [ ] Acessar `/onboarding`
- [ ] Selecionar "Dono de Negócio"
- [ ] Escolher setor "Beleza & Estética"
- [ ] Verificar se especialidades carregam
- [ ] Selecionar "Barbearia"
- [ ] Preencher dados do negócio:
  - Nome: "Teste Barbearia"
  - Endereço: "Rua Teste, 123"
  - CPF: "123.456.789-00"
  - WhatsApp: "(11) 99999-9999"
- [ ] Clicar em "Finalizar Cadastro"
- [ ] Verificar se redireciona para `/painel-dono`
- [ ] Confirmar que dashboard carrega

**Tempo estimado**: 5 minutos

---

### 7. Verificar Dados Criados
No Supabase SQL Editor:

```sql
-- Verificar barbearia
SELECT * FROM barbershops 
WHERE name = 'Teste Barbearia';

-- Verificar serviços
SELECT * FROM services 
WHERE barbershop_id = 'ID_DA_BARBEARIA';

-- Verificar automações
SELECT * FROM automations 
WHERE barbershop_id = 'ID_DA_BARBEARIA';
```

- [ ] Barbearia criada com setor e especialidade
- [ ] 3 serviços criados (Corte, Barba, Corte+Barba)
- [ ] Automações criadas
- [ ] Políticas aplicadas

**Tempo estimado**: 5 minutos

---

### 8. Testar Dashboard do Dono
- [ ] Acessar "Hub de Gestão"
- [ ] Clicar na aba "Serviços"
- [ ] Verificar se os 3 serviços aparecem
- [ ] Tentar adicionar um novo serviço
- [ ] Verificar se salva corretamente
- [ ] Acessar "Hub de Configurações"
- [ ] Verificar se dados da barbearia aparecem

**Tempo estimado**: 5 minutos

---

### 9. Testar Outras Especialidades
Repetir teste de onboarding para:

- [ ] Saúde & Bem-Estar → Fisioterapia
- [ ] Educação & Mentorias → Coaching
- [ ] Pets → Banho & Tosa

**Tempo estimado**: 15 minutos (5 min cada)

---

### 10. Documentar Bugs
Se encontrar problemas:

```
BUG #1
Descrição: _______________________________
Passos para reproduzir: __________________
Severidade: [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo
Screenshot: _______________________________

BUG #2
Descrição: _______________________________
Passos para reproduzir: __________________
Severidade: [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo
Screenshot: _______________________________
```

**Tempo estimado**: Conforme necessário

---

## ✅ FASE 2: CORREÇÕES (SE NECESSÁRIO - 1-2h)

### Se encontrou bugs críticos:
- [ ] Listar todos os bugs encontrados
- [ ] Priorizar por severidade
- [ ] Corrigir bugs críticos primeiro
- [ ] Testar novamente após correções
- [ ] Documentar correções aplicadas

---

## ✅ FASE 3: OTIMIZAÇÃO (OPCIONAL - 1h)

### Performance
- [ ] Analisar tempo de carregamento
- [ ] Otimizar queries lentas
- [ ] Adicionar loading states
- [ ] Implementar cache se necessário

### UX
- [ ] Melhorar mensagens de erro
- [ ] Adicionar tooltips
- [ ] Melhorar feedback visual
- [ ] Testar em mobile

---

## ✅ FASE 4: PREPARAÇÃO PARA PRODUÇÃO (30min)

### Configurações
- [ ] Verificar variáveis de ambiente
- [ ] Configurar domínio
- [ ] Configurar SSL
- [ ] Configurar backup automático

### Segurança
- [ ] Revisar RLS policies
- [ ] Testar permissões
- [ ] Configurar rate limiting
- [ ] Ativar logs de auditoria

### Monitoramento
- [ ] Configurar Sentry (erros)
- [ ] Configurar analytics
- [ ] Configurar alertas
- [ ] Configurar dashboard de métricas

---

## ✅ FASE 5: DEPLOY (15min)

### Deploy
- [ ] Fazer commit das alterações
- [ ] Push para repositório
- [ ] Executar deploy (Vercel/Netlify)
- [ ] Aguardar build
- [ ] Verificar se deploy foi bem-sucedido

### Validação em Produção
- [ ] Acessar URL de produção
- [ ] Testar login
- [ ] Testar onboarding
- [ ] Verificar se dados são salvos
- [ ] Confirmar que tudo funciona

---

## 📊 Resumo de Tempo

| Fase | Tempo Estimado | Status |
|------|----------------|--------|
| Fase 1: Validação | 2h | [ ] |
| Fase 2: Correções | 1-2h | [ ] |
| Fase 3: Otimização | 1h | [ ] |
| Fase 4: Preparação | 30min | [ ] |
| Fase 5: Deploy | 15min | [ ] |
| **TOTAL** | **4-5h** | [ ] |

---

## 🚨 Critérios de Bloqueio

**NÃO FAZER DEPLOY SE**:
- ❌ Build falha
- ❌ Há erros críticos no console
- ❌ Onboarding não funciona
- ❌ Dados não são salvos no banco
- ❌ Dashboard não carrega

**PODE FAZER DEPLOY SE**:
- ✅ Build passa
- ✅ Onboarding funciona
- ✅ Dados são salvos corretamente
- ✅ Dashboard carrega
- ⚠️ Há apenas warnings não críticos

---

## 📞 Contatos de Emergência

**Se encontrar problemas críticos**:
- Tech Lead: _________________
- DevOps: _________________
- Product Owner: _________________

**Canais de Comunicação**:
- Slack: #tech-emergencias
- WhatsApp: Grupo Dev Team
- Email: tech@empresa.com

---

## ✅ Checklist Final

Antes de considerar concluído:

- [ ] Todas as fases foram executadas
- [ ] Bugs críticos foram corrigidos
- [ ] Testes passaram com sucesso
- [ ] Documentação está atualizada
- [ ] Deploy foi realizado
- [ ] Produção está funcionando
- [ ] Equipe foi notificada
- [ ] Monitoramento está ativo

---

## 🎉 Conclusão

Quando todos os itens estiverem marcados:

**✅ SISTEMA PRONTO PARA PRODUÇÃO**

Parabéns! O sistema de especialidades está validado e operacional.

---

**Data de Início**: ___/___/_____ às _____  
**Data de Conclusão**: ___/___/_____ às _____  
**Tempo Total**: _____ horas  
**Responsável**: _________________  
**Status Final**: [ ] ✅ Aprovado [ ] ❌ Bloqueado

---

**Observações**:
_________________________________
_________________________________
_________________________________
_________________________________

---

**Última atualização**: 09/04/2026
