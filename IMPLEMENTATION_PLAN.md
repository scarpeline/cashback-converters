# Plano de Implementação Completo

## Status Atual

✅ **Corrigido:**
- Erro `Wallet is not defined` no ProfissionalDashboard
- Imports faltando (Input, Label, etc)
- ErrorBoundary redesenhado
- i18n corrigido (createContext error)
- Build funcionando

❌ **Faltando:**
- 9 tabelas no Supabase
- RLS policies para as tabelas
- Tratamento de erro centralizado
- Hooks customizados para dados

## Etapa 1: Setup do Supabase (CRÍTICO)

### 1.1 Criar Tabelas
```bash
# No Supabase Dashboard > SQL Editor
# Cole o conteúdo de: supabase_migrations_missing_tables.sql
```

**Tabelas a criar:**
1. `stock_items` - Produtos/Estoque
2. `raffles` - Ações entre amigos
3. `raffle_tickets` - Bilhetes de rifa
4. `debts` - Dívidas do profissional
5. `fiscal_service_types` - Tipos de serviços contábeis
6. `fiscal_service_requests` - Solicitações de serviços
7. `subscription_plans` - Planos de assinatura
8. `messaging_packages` - Pacotes de mensagens
9. `internal_system_messages` - Mensagens internas

### 1.2 Aplicar RLS Policies
```bash
# No Supabase Dashboard > SQL Editor
# Cole o conteúdo de: supabase_rls_policies.sql
```

## Etapa 2: Melhorias no Frontend

### 2.1 Usar Hooks Customizados
Todos os dashboards devem usar `useSupabaseData` e `useSupabaseMutation`:

```typescript
// Antes (sem tratamento de erro)
const [data, setData] = useState([]);
useEffect(() => {
  supabase.from("table").select("*").then(({ data }) => setData(data || []));
}, []);

// Depois (com tratamento de erro)
const { data, loading, error } = useSupabaseData(
  () => supabase.from("table").select("*"),
  [],
  { fallbackData: [] }
);
```

### 2.2 Dashboards a Atualizar

**ProfissionalDashboard:**
- ✅ Wallet import corrigido
- ⏳ Usar `useSupabaseData` para debts
- ⏳ Adicionar fallback se tabela não existir

**ClienteDashboard:**
- ⏳ Usar `useSupabaseData` para raffles
- ⏳ Usar `useSupabaseData` para raffle_tickets
- ⏳ Adicionar fallback se tabelas não existirem

**ContadorDashboard:**
- ⏳ Usar `useSupabaseData` para fiscal_service_types
- ⏳ Usar `useSupabaseData` para fiscal_service_requests
- ⏳ Adicionar fallback se tabelas não existirem

**SuperAdminDashboard:**
- ⏳ Corrigir `pixels` → `pixel_configurations`
- ⏳ Usar `useSupabaseData` para subscription_plans
- ⏳ Usar `useSupabaseData` para messaging_packages
- ⏳ Usar `useSupabaseData` para internal_system_messages

**VitrinePage:**
- ⏳ Usar `useSupabaseData` para stock_items
- ⏳ Usar `useSupabaseData` para raffles
- ⏳ Adicionar fallback se tabelas não existirem

## Etapa 3: Validação

### 3.1 Checklist de Testes

- [ ] Landing page carrega sem erros
- [ ] Login funciona para todos os roles
- [ ] ClienteDashboard carrega sem erros
- [ ] DonoDashboard carrega sem erros
- [ ] ProfissionalDashboard carrega sem erros
- [ ] AfiliadoDashboard carrega sem erros
- [ ] ContadorDashboard carrega sem erros
- [ ] SuperAdminDashboard carrega sem erros
- [ ] VitrinePage carrega sem erros
- [ ] Nenhuma tela branca ocorre
- [ ] Console sem erros críticos

### 3.2 Testes de Dados

- [ ] Criar novo stock_item
- [ ] Criar nova rifa
- [ ] Comprar bilhete de rifa
- [ ] Registrar dívida
- [ ] Solicitar serviço contábil
- [ ] Visualizar planos de assinatura

## Etapa 4: Melhorias Futuras

### 4.1 Performance
- [ ] Implementar cache com React Query
- [ ] Lazy load de componentes pesados
- [ ] Paginação em listas grandes

### 4.2 UX
- [ ] Skeleton loaders enquanto carrega
- [ ] Empty states mais informativos
- [ ] Confirmação antes de deletar

### 4.3 Segurança
- [ ] Validar dados no frontend
- [ ] Sanitizar inputs
- [ ] Rate limiting em operações críticas

## Arquivos Criados

1. **supabase_migrations_missing_tables.sql** - DDL das tabelas
2. **supabase_rls_policies.sql** - Políticas de segurança
3. **src/lib/supabase-error-handler.ts** - Tratamento centralizado de erros
4. **src/hooks/useSupabaseData.ts** - Hooks customizados
5. **SUPABASE_SETUP_INSTRUCTIONS.md** - Instruções de setup
6. **IMPLEMENTATION_PLAN.md** - Este arquivo

## Próximos Passos

1. **Executar migrations no Supabase** (CRÍTICO)
2. **Testar cada dashboard**
3. **Atualizar dashboards para usar novos hooks**
4. **Validar que não há telas brancas**
5. **Fazer commit com todas as mudanças**

## Contato/Suporte

Se encontrar erros:
1. Verifique o console do navegador (F12)
2. Verifique os logs do Supabase
3. Confirme que as tabelas foram criadas
4. Confirme que as RLS policies foram aplicadas
