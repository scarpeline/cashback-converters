# Ícones Skill

## Biblioteca: Lucide React

Única biblioteca de ícones do projeto. Importar sempre de `lucide-react`.

```tsx
import { Calendar, Users, Wallet, Settings } from "lucide-react"
```

## Tamanhos Padrão

| Contexto | Tamanho | Classe |
|----------|---------|--------|
| Inline em texto | 14px | `size={14}` ou `w-3.5 h-3.5` |
| Botão pequeno | 16px | `size={16}` ou `w-4 h-4` |
| Botão padrão | 18px | `size={18}` ou `w-4.5 h-4.5` |
| Sidebar nav | 17px | `size={17}` |
| Card/seção | 20px | `w-5 h-5` |
| Header/destaque | 24px | `w-6 h-6` |
| Empty state | 40px | `w-10 h-10` |
| Hero/onboarding | 48px | `w-12 h-12` |

## Mapeamento por Seção

### Navegação principal
```
LayoutDashboard → Geral/Dashboard
Calendar        → Operações/Agenda
Users           → Gestão/Equipe
Wallet          → Financeiro
TrendingUp      → Crescimento
MessageCircle   → Comunicação
Bot             → IA & Automação
Settings        → Ajustes/Configurações
LogOut          → Sair
```

### Ações
```
Plus      → Adicionar/Novo
Edit      → Editar
Trash2    → Excluir
Save      → Salvar
Check     → Confirmar/Concluído
X         → Cancelar/Fechar
Search    → Buscar
Filter    → Filtrar
Download  → Exportar
Upload    → Importar
```

### Status
```
CheckCircle   → Sucesso/Ativo
XCircle       → Erro/Inativo
AlertCircle   → Aviso
Info          → Informação
Loader2       → Carregando (com animate-spin)
```

### Comunicação
```
Smartphone    → WhatsApp/Mobile
Mail          → E-mail
Bell          → Notificações
MessageSquare → Mensagem/Chat
Phone         → Telefone
```

### Negócio
```
Scissors      → Barbearia/Corte
Star          → Avaliação/Favorito
Gift          → Cashback/Presente
Zap           → Automação/Rápido
Shield        → Segurança
Lock          → Bloqueado/Privado
Globe         → Link público/Web
```

## Cores de Ícones

```tsx
// Ativo/destaque
<Icon className="text-orange-500" />

// Neutro/inativo
<Icon className="text-slate-400" />

// Em fundo laranja (botão primário)
<Icon className="text-white" />

// Sucesso
<Icon className="text-emerald-500" />

// Erro
<Icon className="text-red-500" />

// Aviso
<Icon className="text-amber-500" />
```

## Padrão de Ícone em Container

```tsx
// Container pequeno (sidebar, lista)
<div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
  <Icon className="w-4 h-4 text-orange-600" />
</div>

// Container médio (card, seção)
<div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
  <Icon className="w-5 h-5 text-orange-600" />
</div>

// Container grande (onboarding, empty state)
<div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
  <Icon className="w-7 h-7 text-orange-600" />
</div>
```

## Empty States

```tsx
// Padrão de empty state
<div className="text-center py-12">
  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
    <Calendar className="w-6 h-6 text-slate-400" />
  </div>
  <p className="text-sm font-medium text-slate-700">Nenhum agendamento</p>
  <p className="text-xs text-slate-400 mt-1">Crie o primeiro agendamento do dia</p>
</div>
```

## O que EVITAR

- Misturar bibliotecas (não usar heroicons, feather, etc.)
- Ícones sem tamanho explícito
- Ícones muito grandes em contextos de lista (>20px)
- `fill-*` em ícones de linha (exceto Star para avaliação)
- Ícones decorativos sem `aria-hidden="true"`
