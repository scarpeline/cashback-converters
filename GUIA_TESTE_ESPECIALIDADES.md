# Guia de Teste - Sistema de Especialidades

## 🎯 Objetivo
Testar o sistema completo de especialidades desde o onboarding até a aplicação dos presets.

## 📋 Pré-requisitos

1. **Banco de dados configurado**
   - Supabase rodando
   - Migrations executadas
   - Especialidades cadastradas

2. **Aplicação rodando**
   ```bash
   npm install
   npm run dev
   ```

3. **Usuário de teste**
   - Email: teste@exemplo.com
   - Senha: teste123

## 🧪 Testes Passo a Passo

### Teste 1: Verificar Especialidades no Banco

1. Acesse o Supabase SQL Editor
2. Execute o script `verificar_especialidades.sql`
3. Verifique se retorna **28 especialidades**
4. Confirme que todos os setores têm especialidades:
   - beleza_estetica: 5
   - saude_bem_estar: 5
   - educacao_mentorias: 3
   - automotivo: 3
   - pets: 3
   - servicos_domiciliares: 3
   - juridico_financeiro: 3
   - espacos_locacao: 3

**Resultado esperado**: ✅ 28 especialidades cadastradas

---

### Teste 2: Onboarding Completo

#### Passo 1: Acessar Onboarding
1. Abra o navegador em `http://localhost:5173/onboarding`
2. Verifique se a página carrega sem erros

**Resultado esperado**: ✅ Página de onboarding carrega

#### Passo 2: Selecionar Tipo de Usuário
1. Clique em "Dono de Negócio"
2. Verifique se avança para a próxima etapa

**Resultado esperado**: ✅ Avança para seleção de setor

#### Passo 3: Selecionar Setor
1. Escolha um setor (ex: "Beleza & Estética")
2. Verifique se avança para especialidades

**Resultado esperado**: ✅ Avança para seleção de especialidade

#### Passo 4: Selecionar Especialidade
1. Verifique se aparecem as especialidades do setor escolhido
2. Para "Beleza & Estética" deve mostrar:
   - Barbearia
   - Salão de Beleza
   - Nail Designer
   - Esteticista
   - Maquiadora
3. Clique em uma especialidade (ex: "Barbearia")
4. Verifique se mostra quantos serviços estão inclusos

**Resultado esperado**: ✅ Especialidades carregam corretamente

#### Passo 5: Preencher Dados do Negócio
1. Preencha os campos:
   - Nome: "Barbearia Teste"
   - Endereço: "Rua Teste, 123"
   - CPF/CNPJ: "123.456.789-00"
   - WhatsApp: "(11) 99999-9999"
2. Verifique se mostra o resumo do que será configurado
3. Clique em "Finalizar Cadastro"

**Resultado esperado**: ✅ Cadastro finalizado com sucesso

---

### Teste 3: Verificar Dados Criados

#### No Supabase SQL Editor, execute:

```sql
-- 1. Verificar barbearia criada
SELECT 
    id,
    name,
    sector,
    specialty,
    onboarding_status,
    booking_policies
FROM barbershops
WHERE name = 'Barbearia Teste';
```

**Resultado esperado**: 
- ✅ Barbearia criada
- ✅ sector = 'beleza_estetica'
- ✅ specialty = 'barbearia'
- ✅ onboarding_status = 'configured'
- ✅ booking_policies preenchido

```sql
-- 2. Verificar serviços criados
SELECT 
    name,
    price,
    duration_minutes,
    is_active
FROM services
WHERE barbershop_id = 'ID_DA_BARBEARIA';
```

**Resultado esperado**:
- ✅ 3 serviços criados:
  - Corte Masculino (R$ 50, 45 min)
  - Barba (R$ 35, 30 min)
  - Corte + Barba (R$ 80, 75 min)

```sql
-- 3. Verificar automações criadas
SELECT 
    name,
    trigger_type,
    action_type,
    template_message,
    is_active
FROM automations
WHERE barbershop_id = 'ID_DA_BARBEARIA';
```

**Resultado esperado**:
- ✅ Automações criadas (lembretes, confirmações)
- ✅ is_active = true

---

### Teste 4: Acessar Dashboard do Dono

1. Após finalizar onboarding, deve redirecionar para `/painel-dono`
2. Verifique se o dashboard carrega
3. Acesse "Hub de Gestão"
4. Clique na aba "Serviços"
5. Verifique se os 3 serviços aparecem

**Resultado esperado**: ✅ Serviços aparecem no dashboard

---

### Teste 5: Testar Diferentes Especialidades

Repita o Teste 2 para cada setor:

#### Saúde & Bem-Estar → Fisioterapia
**Serviços esperados**:
- Sessão de Fisioterapia (R$ 120, 50 min)
- Avaliação (R$ 150, 60 min)

#### Educação & Mentorias → Coaching
**Serviços esperados**:
- Sessão de Coaching (R$ 250, 60 min)
- Mentoria (R$ 400, 90 min)

#### Automotivo → Oficina Mecânica
**Serviços esperados**:
- Revisão Geral (R$ 200, 120 min)
- Troca de Óleo (R$ 80, 30 min)

#### Pets → Banho & Tosa
**Serviços esperados**:
- Banho (R$ 60, 60 min)
- Tosa (R$ 80, 90 min)
- Banho + Tosa (R$ 120, 120 min)

---

### Teste 6: Verificar Labels Dinâmicos

1. Crie uma barbearia com setor "saude_bem_estar"
2. Acesse o dashboard
3. Verifique se os labels mudaram:
   - "Profissionais" → "Especialistas"
   - "Serviços" → "Sessões/Consultas"
   - "Agendamentos" → "Consultas"
   - "Clientes" → "Pacientes"

**Resultado esperado**: ✅ Labels personalizados por setor

---

### Teste 7: Testar Políticas de Agendamento

1. Crie uma barbearia com especialidade "maquiadora"
2. Verifique no banco se `booking_policies` contém:
   ```json
   {
     "deposit_required": true,
     "deposit_percentage": 30,
     "cancellation_window_hours": 48
   }
   ```

**Resultado esperado**: ✅ Políticas aplicadas corretamente

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: Especialidades não aparecem
**Solução**: 
1. Verificar se a migration foi executada
2. Executar `verificar_especialidades.sql`
3. Se necessário, executar novamente a migration `20260409_fix_sector_presets_display_name.sql`

### Problema 2: Serviços não são criados
**Solução**:
1. Verificar logs do console (F12)
2. Verificar se `applyInitialPreset()` está sendo chamado
3. Verificar permissões RLS no Supabase

### Problema 3: Erro ao finalizar cadastro
**Solução**:
1. Verificar se o usuário está autenticado
2. Verificar se o CPF/CNPJ está no formato correto
3. Verificar logs do Supabase

### Problema 4: Dashboard não carrega
**Solução**:
1. Verificar se o onboarding_status = 'configured'
2. Verificar se a barbearia foi criada
3. Limpar cache do navegador

---

## ✅ Checklist de Validação

### Banco de Dados
- [ ] 28 especialidades cadastradas
- [ ] Todos os setores têm especialidades
- [ ] Cada especialidade tem serviços padrão
- [ ] Cada especialidade tem automações
- [ ] Cada especialidade tem políticas

### Frontend
- [ ] Página de onboarding carrega
- [ ] Seleção de setor funciona
- [ ] Especialidades carregam dinamicamente
- [ ] Formulário de dados valida corretamente
- [ ] Redirecionamento após cadastro funciona

### Backend
- [ ] Barbearia é criada com setor/especialidade
- [ ] Serviços são inseridos automaticamente
- [ ] Automações são criadas
- [ ] Políticas são aplicadas
- [ ] Labels dinâmicos são salvos

### Integração
- [ ] Onboarding → Dashboard funciona
- [ ] Serviços aparecem no dashboard
- [ ] Automações estão ativas
- [ ] Políticas são respeitadas

---

## 📊 Relatório de Teste

Após executar todos os testes, preencha:

```
Data do Teste: ___/___/______
Testador: _________________

Resultados:
- Teste 1 (Banco): [ ] ✅ [ ] ❌
- Teste 2 (Onboarding): [ ] ✅ [ ] ❌
- Teste 3 (Dados): [ ] ✅ [ ] ❌
- Teste 4 (Dashboard): [ ] ✅ [ ] ❌
- Teste 5 (Especialidades): [ ] ✅ [ ] ❌
- Teste 6 (Labels): [ ] ✅ [ ] ❌
- Teste 7 (Políticas): [ ] ✅ [ ] ❌

Bugs Encontrados:
1. _______________________________
2. _______________________________
3. _______________________________

Observações:
_________________________________
_________________________________
_________________________________
```

---

## 🚀 Próximos Passos

Após validar todos os testes:

1. **Documentar bugs** encontrados
2. **Corrigir problemas** críticos
3. **Otimizar performance** se necessário
4. **Preparar para produção**
5. **Treinar usuários** no sistema

---

**Última atualização**: 09/04/2026
