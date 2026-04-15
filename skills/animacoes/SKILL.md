# Animações Skill

## Princípios

1. **Propósito** — toda animação deve ter função: feedback, orientação, hierarquia
2. **Sutileza** — animações discretas, nunca distrativas
3. **Performance** — preferir `transform` e `opacity` (GPU-accelerated)
4. **Respeitar preferências** — usar `prefers-reduced-motion` quando possível

## Biblioteca Principal: Tailwind CSS Animate

### Entradas de página/componente
```tsx
// Fade in suave
className="animate-in fade-in duration-300"

// Slide de baixo para cima
className="animate-in fade-in slide-in-from-bottom-4 duration-300"

// Slide da esquerda
className="animate-in fade-in slide-in-from-left-4 duration-300"

// Zoom in (modais, dropdowns)
className="animate-in fade-in zoom-in-95 duration-150"
```

### Transições de estado
```tsx
// Hover suave em botões/cards
className="transition-colors duration-200"

// Hover com transform
className="transition-all duration-200 hover:scale-[1.02]"

// Sidebar collapse
className="transition-all duration-300"
```

### Loading states
```tsx
// Spinner
<Loader2 className="w-4 h-4 animate-spin" />

// Pulse (skeleton)
className="animate-pulse bg-slate-100 rounded-xl"

// Ping (notificação)
className="animate-ping"
```

### Chevron/seta rotacionável
```tsx
<ChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
```

## Durações Recomendadas

| Tipo | Duração |
|------|---------|
| Hover/focus | 150-200ms |
| Dropdown/tooltip | 150ms |
| Modal/sheet | 200-300ms |
| Page transition | 300ms |
| Sidebar collapse | 300ms |
| Toast | 300ms entrada, 200ms saída |

## Framer Motion (quando necessário)

Usar apenas para animações complexas que o Tailwind não suporta:

```tsx
import { motion, AnimatePresence } from "framer-motion"

// Entrada/saída de elementos
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
  >
    {content}
  </motion.div>
</AnimatePresence>

// Stagger de lista
const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }
```

## O que EVITAR

- Animações longas (>500ms) em interações frequentes
- `animate-bounce` em elementos de UI (só para notificações pontuais)
- Rotações 360° em ícones de navegação
- Múltiplas animações simultâneas no mesmo elemento
- Classes como `diamond-glow`, `ease-premium` sem definição clara
- Efeitos de brilho/shimmer em texto de conteúdo

## Skeleton Loading Padrão

```tsx
const SkeletonLine = ({ w = "w-full" }: { w?: string }) => (
  <div className={`h-4 ${w} bg-slate-100 rounded-lg animate-pulse`} />
)

const SkeletonCard = () => (
  <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3 animate-pulse">
    <div className="h-5 w-1/3 bg-slate-100 rounded-lg" />
    <div className="h-4 w-2/3 bg-slate-100 rounded-lg" />
    <div className="h-4 w-1/2 bg-slate-100 rounded-lg" />
  </div>
)
```
