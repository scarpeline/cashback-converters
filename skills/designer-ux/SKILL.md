# Designer UX Skill

## Identidade Visual do Projeto

**Paleta de cores:**
- Primária: `orange-500` (#f97316) — botões principais, itens ativos, destaques
- Fundo claro: `white` / `slate-50` — backgrounds de página e conteúdo
- Texto principal: `slate-900` — títulos e valores
- Texto secundário: `slate-500` — labels, descrições, placeholders
- Bordas: `slate-100` / `slate-200` — divisores e bordas de input
- Sucesso: `emerald-500` — confirmações
- Erro: `red-500` — erros e alertas
- Aviso: `amber-500` — alertas moderados

**Regras de contraste (NUNCA violar):**
- Texto escuro (`slate-900`, `slate-800`) sempre em fundo claro (`white`, `slate-50`, `orange-50`)
- Texto branco (`white`) apenas em fundo escuro ou colorido (`orange-500`, `slate-800`, `slate-900`)
- Texto `slate-500` apenas em fundo `white` ou `slate-50` — nunca em fundo colorido
- Texto `orange-600` em fundo `orange-50` — contraste adequado
- NUNCA: texto claro em fundo claro, texto escuro em fundo escuro

**Tipografia:**
- Fonte: Inter (system-ui fallback)
- Tamanho base: 15px
- Títulos de página: `text-2xl font-semibold text-slate-900`
- Subtítulos de seção: `text-lg font-semibold text-slate-900`
- Labels de campo: `text-sm font-medium text-slate-700`
- Texto de apoio: `text-sm text-slate-500`
- Valores numéricos: `text-xl font-bold text-slate-900`
- Badges/tags: `text-xs font-medium`

**Espaçamento:**
- Padding de página: `p-6`
- Gap entre seções: `space-y-8`
- Gap entre cards: `gap-4` ou `gap-6`
- Padding de card: `p-4` ou `p-6`

**Bordas e raios:**
- Inputs: `rounded-xl`
- Botões: `rounded-xl`
- Cards: `rounded-2xl`
- Modais: `rounded-2xl`
- Badges: `rounded-full`

## Componentes Padrão

**Botão primário:**
```tsx
<button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors">
  Ação
</button>
```

**Botão secundário:**
```tsx
<button className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
  Cancelar
</button>
```

**Input:**
```tsx
<input className="w-full h-11 px-3 text-slate-900 border border-slate-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all" />
```

**Card:**
```tsx
<div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
  ...
</div>
```

**Divisor de seção:**
```tsx
<hr className="border-slate-100" />
```

**Badge ativo:**
```tsx
<span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Ativo</span>
```

**Badge inativo:**
```tsx
<span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">Inativo</span>
```

## Sidebar

- Fundo: `bg-white` com `border-r border-slate-100`
- Item ativo: `bg-orange-500 text-white font-semibold rounded-xl`
- Item inativo: `text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl`
- Ícone ativo: `text-white`
- Ícone inativo: `text-slate-400 group-hover:text-orange-500`
- Subitens: `text-xs text-slate-500 hover:text-orange-500 hover:bg-orange-50`

## Header

- Fundo: `bg-white border-b border-slate-100`
- Altura: `h-16`
- Busca: `bg-slate-50 border border-slate-200 rounded-xl focus-within:border-orange-400`

## Princípios UX

1. **Clareza primeiro** — cada tela tem uma ação principal clara
2. **Feedback imediato** — toda ação tem toast de sucesso/erro
3. **Estados de loading** — skeleton ou spinner em toda busca assíncrona
4. **Estados vazios** — mensagem amigável quando não há dados
5. **Confirmação destrutiva** — `confirm()` antes de deletar
6. **Formulários inline** — preferir expandir na própria tela a abrir modal
7. **Navegação por tabs** — para seções com múltiplas visões
8. **Responsividade** — mobile-first, sidebar colapsável
