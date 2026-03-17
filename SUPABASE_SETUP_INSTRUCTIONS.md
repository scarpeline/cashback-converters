# Instruções de Setup do Supabase

## Tabelas Faltando

O projeto referencia 9 tabelas que precisam ser criadas no Supabase:

1. **stock_items** - Produtos/Estoque da barbearia
2. **raffles** - Ações entre amigos (rifas)
3. **raffle_tickets** - Bilhetes de rifa
4. **debts** - Dívidas/Fiado do profissional
5. **fiscal_service_types** - Tipos de serviços contábeis
6. **fiscal_service_requests** - Solicitações de serviços contábeis
7. **subscription_plans** - Planos de assinatura
8. **messaging_packages** - Pacotes de mensagens
9. **internal_system_messages** - Mensagens internas do sistema

## Como Criar as Tabelas

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `supabase_migrations_missing_tables.sql`
5. Cole no editor
6. Clique em **Run**

### Opção 2: Via Migrations (Para Produção)

```bash
# Copie o arquivo para a pasta de migrations
cp supabase_migrations_missing_tables.sql supabase/migrations/

# Execute as migrations
supabase migration up
```

## Verificar se as Tabelas Foram Criadas

No Supabase Dashboard:
1. Vá para **Table Editor**
2. Você deve ver as 9 novas tabelas na lista

## Próximos Passos

Após criar as tabelas:

1. **Verificar RLS (Row Level Security)**
   - Cada tabela deve ter políticas RLS apropriadas
   - Exemplo: `stock_items` deve ser acessível apenas pelo dono da barbearia

2. **Testar Queries**
   - Faça login no app
   - Navegue para cada dashboard
   - Verifique se os dados carregam sem erros

3. **Seed Data (Opcional)**
   - Adicione dados de teste para validar o funcionamento

## Troubleshooting

### Erro: "relation does not exist"
- Verifique se a tabela foi criada
- Confirme o nome exato da tabela (case-sensitive)

### Erro: "permission denied"
- Verifique as políticas RLS
- Certifique-se de que o usuário tem permissão para acessar a tabela

### Erro: "foreign key constraint"
- Verifique se as tabelas referenciadas existem
- Confirme os IDs das chaves estrangeiras
