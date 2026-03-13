# Módulos do Sistema

Estrutura modular da plataforma SaaS. Cada módulo é independente e segue a separação em camadas.

## Estrutura de cada módulo
```
module-name/
  types/       → Interfaces e tipos TypeScript
  services/    → Lógica de negócio e comunicação com Supabase
  hooks/       → React hooks customizados
  components/  → Componentes visuais específicos do módulo
  utils/       → Funções utilitárias do módulo
```

## Módulos
- **security** — Segurança avançada, logs, detecção de invasão
- **ai-assistant** — IA para agendamento via WhatsApp
- **crm** — CRM inteligente, ranking de clientes
- **marketing** — Automações de marketing
- **marketplace** — Marketplace de profissionais
- **store** — Loja interna (produtos, cursos, pacotes)
- **franchise** — Sistema de franquias
- **analytics** — Analytics avançado e métricas
- **queue** — Sistema de filas assíncronas
- **notifications** — Notificações multicanal
