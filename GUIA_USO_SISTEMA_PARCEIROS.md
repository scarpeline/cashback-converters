# Guia de Uso - Sistema de Parceiros

## 🎯 Para Parceiros (Afiliados, Franqueados, Diretores)

### Acessar o Painel
1. Faça login em `/login`
2. Acesse `/painel-parceiro`

### Ver Seu Código de Referência
1. No painel, você verá seu código único (ex: `ABC12345`)
2. Copie o código ou o link de indicação
3. Compartilhe com amigos/clientes

### Compartilhar Indicação
- **Copiar Código**: Clique no ícone de cópia ao lado do código
- **Copiar Link**: Clique no ícone de cópia ao lado do link completo
- **Compartilhar**: Clique em "Compartilhar" para usar Web Share API

### Acompanhar Indicações
1. Vá para a seção "Pessoas Indicadas"
2. Veja quem se cadastrou com seu código
3. Status: Pendente, Concluída ou Cancelada

### Ver Comissões
1. Vá para a seção "Histórico de Comissões"
2. Veja todas as suas comissões
3. Filtro por status: Pendente, Aprovada, Paga

### Entender Sua Hierarquia
1. Vá para a seção "Hierarquia de Parceiros"
2. Veja sua posição na rede
3. Veja quem indicou você (se aplicável)

---

## 👨‍💼 Para Donos/Gerentes

### Acessar Gestão de Parceiros
1. Faça login como dono
2. Acesse `/gestao-parceiros`

### Gerenciar Parceiros
1. **Ver Todos**: Clique em "Todos os Parceiros"
2. **Filtrar por Tipo**: Use as tabs (Afiliados, Franqueados, Diretores)
3. **Buscar**: Use o campo de busca (nome, email, WhatsApp)

### Criar Novo Parceiro
1. Clique em "Novo Parceiro"
2. Preencha os dados:
   - Selecione o usuário
   - Escolha o tipo (Afiliado, Franqueado, Diretor)
   - Se franqueado, selecione o diretor (opcional)
3. Clique em "Criar"

### Gerenciar Status
1. Clique no menu (⋮) do parceiro
2. Escolha "Bloquear" ou "Ativar"
3. Confirme a ação

### Exportar Lista
1. Clique em "Exportar CSV"
2. Arquivo será baixado com todos os parceiros

### Ver Estatísticas
- **Total de Parceiros**: Número total
- **Indicados Totais**: Soma de todas as indicações
- **Diretores**: Quantidade de diretores
- **Franqueados**: Quantidade de franqueados

---

## 🔧 Para Admin/Super Admin

### Acessar Gestão de Comissões
1. Faça login como super_admin
2. Acesse `/admin/comissoes`

### Ver Estatísticas de Comissões
- **Pendentes**: Comissões aguardando aprovação
- **Aprovadas**: Comissões prontas para pagamento
- **Pagas**: Comissões já processadas
- **Total**: Soma de todas as comissões

### Gerenciar Comissões
1. **Filtrar**: Use os botões para filtrar por status
2. **Aprovar**: Clique em "Aprovar" para comissões pendentes
3. **Pagar**: Clique em "Marcar como Paga" para comissões aprovadas
4. **Cancelar**: Clique em "Cancelar" para rejeitar comissão

### Entender o Fluxo
1. **Pendente**: Gerada automaticamente quando pagamento é confirmado
2. **Aprovada**: Admin aprova após validação
3. **Paga**: Comissão foi processada e transferida

### Informações da Comissão
- **Parceiro**: Nome e email
- **Tipo**: Indicação, Franquia ou Rede
- **Valor**: Valor da comissão
- **Data**: Quando foi gerada
- **Descrição**: Detalhes da origem

---

## 💡 Exemplos de Uso

### Exemplo 1: Afiliado Ganha Comissão
```
1. João é afiliado
2. João compartilha seu código: ABC12345
3. Maria se cadastra com código ABC12345
4. Maria faz pagamento de R$ 100
5. Sistema gera comissão de R$ 10 (10%) para João
6. Comissão fica pendente
7. Admin aprova comissão
8. Admin marca como paga
9. João recebe R$ 10
```

### Exemplo 2: Franqueado Ganha Comissão
```
1. Pedro é franqueado
2. Cliente faz pagamento de R$ 200 na unidade de Pedro
3. Sistema gera comissão de R$ 60 (30%) para Pedro
4. Comissão fica pendente
5. Admin aprova comissão
6. Admin marca como paga
7. Pedro recebe R$ 60
```

### Exemplo 3: Diretor Ganha Comissão
```
1. Carlos é diretor
2. Pedro é franqueado sob supervisão de Carlos
3. Cliente faz pagamento de R$ 200 na unidade de Pedro
4. Sistema gera comissão de R$ 10 (5%) para Carlos
5. Comissão fica pendente
6. Admin aprova comissão
7. Admin marca como paga
8. Carlos recebe R$ 10
```

---

## ❓ Perguntas Frequentes

### P: Como funciona o código de referência?
**R**: Cada parceiro tem um código único de 8 caracteres. Quando alguém se cadastra com esse código, fica registrado como indicação. Quando essa pessoa faz um pagamento, o parceiro ganha comissão.

### P: Quanto tempo leva para receber a comissão?
**R**: A comissão é gerada automaticamente quando o pagamento é confirmado. Depois, o admin aprova e marca como paga. O tempo depende da aprovação do admin.

### P: Posso ter múltiplos códigos?
**R**: Não, cada parceiro tem apenas um código. Se precisar de mais, crie outro parceiro.

### P: O que acontece se cancelar uma comissão?
**R**: A comissão fica marcada como cancelada e não será paga. Isso é útil para corrigir erros ou duplicações.

### P: Como vejo minha hierarquia?
**R**: No painel do parceiro, há uma seção "Hierarquia de Parceiros" que mostra sua posição na rede.

### P: Posso editar um parceiro?
**R**: Sim, clique no menu (⋮) do parceiro e escolha "Ver detalhes" para editar.

### P: Como exporto a lista de parceiros?
**R**: Na página de gestão de parceiros, clique em "Exportar CSV". Um arquivo será baixado.

---

## 🔐 Segurança

### Dados Protegidos
- Cada parceiro vê apenas suas próprias comissões
- Admin vê todas as comissões
- Códigos de referência são únicos
- Comissões não podem ser editadas após criação

### Validações
- Comissão só é gerada se pagamento foi confirmado
- Valor da comissão é calculado no servidor
- Origem da comissão é rastreada

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique este guia
2. Contate o admin do sistema
3. Verifique os logs de erro

---

## 📚 Documentação Técnica

Para informações técnicas, consulte:
- `SISTEMA_PARCEIROS_IMPLEMENTADO.md` - Documentação do sistema
- `INTEGRACAO_COMISSOES_AUTOMATICAS.md` - Documentação de integração
- `RESUMO_IMPLEMENTACOES_SESSAO.md` - Resumo de implementações

---

**Última atualização**: 18 de Março de 2026
**Versão**: 1.0
