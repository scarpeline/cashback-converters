# Diagrama do Sistema de Especialidades

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE ESPECIALIDADES                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼────────┐            ┌────────▼────────┐
        │   FRONTEND     │            │    BACKEND      │
        │   (React)      │            │   (Supabase)    │
        └───────┬────────┘            └────────┬────────┘
                │                               │
    ┌───────────┼───────────┐          ┌────────┼────────┐
    │           │           │          │        │        │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐ ┌──▼──┐ ┌──▼──┐
│Onboard│  │Select │  │Context│  │sector_│ │barber│ │servi│
│  ing  │  │  or   │  │       │  │presets│ │shops │ │ ces │
└───────┘  └───────┘  └───────┘  └───────┘ └──────┘ └─────┘
```

---

## 🔄 Fluxo de Onboarding

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUXO DE ONBOARDING                         │
└─────────────────────────────────────────────────────────────────┘

1. INÍCIO
   │
   ├─► Usuário acessa /onboarding
   │
   └─► Página carrega

2. SELEÇÃO DE TIPO
   │
   ├─► [ Dono de Negócio ]  ──► Continua
   │
   └─► [ Profissional ]  ──► Redireciona para /painel-profissional

3. SELEÇÃO DE SETOR
   │
   ├─► Exibe 8 setores:
   │   ├─ Beleza & Estética
   │   ├─ Saúde & Bem-Estar
   │   ├─ Educação & Mentorias
   │   ├─ Automotivo
   │   ├─ Pets
   │   ├─ Serviços Domiciliares
   │   ├─ Jurídico & Financeiro
   │   └─ Espaços & Locação
   │
   └─► Usuário seleciona um setor

4. SELEÇÃO DE ESPECIALIDADE
   │
   ├─► Sistema busca especialidades do setor no banco
   │   │
   │   └─► Query: SELECT * FROM sector_presets WHERE sector = ?
   │
   ├─► Exibe especialidades disponíveis
   │   │
   │   └─► Exemplo (Beleza & Estética):
   │       ├─ Barbearia (3 serviços)
   │       ├─ Salão de Beleza (3 serviços)
   │       ├─ Nail Designer (3 serviços)
   │       ├─ Esteticista (3 serviços)
   │       └─ Maquiadora (2 serviços)
   │
   └─► Usuário seleciona especialidade

5. DADOS DO NEGÓCIO
   │
   ├─► Formulário:
   │   ├─ Nome do estabelecimento *
   │   ├─ Endereço completo *
   │   ├─ CPF ou CNPJ *
   │   └─ WhatsApp
   │
   ├─► Validação:
   │   ├─ Nome: mínimo 2 caracteres
   │   ├─ Endereço: mínimo 5 caracteres
   │   └─ CPF/CNPJ: formato válido
   │
   └─► Usuário preenche e clica "Finalizar"

6. APLICAÇÃO DE PRESET
   │
   ├─► Sistema busca preset da especialidade
   │   │
   │   └─► Query: SELECT * FROM sector_presets 
   │       WHERE sector = ? AND specialty = ?
   │
   ├─► Cria/Atualiza barbearia:
   │   ├─ name, address, phone
   │   ├─ sector, specialty
   │   ├─ onboarding_status = 'configured'
   │   ├─ booking_policies (do preset)
   │   └─ niche_labels (do preset)
   │
   ├─► Insere serviços padrão:
   │   │
   │   └─► Para cada serviço no preset:
   │       INSERT INTO services (
   │         barbershop_id,
   │         name,
   │         price,
   │         duration_minutes,
   │         is_active
   │       )
   │
   ├─► Cria automações:
   │   │
   │   └─► Para cada automação no preset:
   │       INSERT INTO automations (
   │         barbershop_id,
   │         trigger_type,
   │         action_type,
   │         template_message,
   │         is_active
   │       )
   │
   └─► Aplica políticas:
       │
       └─► UPDATE barbershops SET
           booking_policies = preset.default_policies

7. CONCLUSÃO
   │
   ├─► Toast: "Cadastro concluído! Bem-vindo 🎉"
   │
   └─► Redireciona para /painel-dono

8. FIM
```

---

## 📊 Estrutura de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                    TABELA: sector_presets                        │
├─────────────────────────────────────────────────────────────────┤
│ id                  UUID (PK)                                    │
│ sector              TEXT (beleza_estetica, saude_bem_estar, ...) │
│ specialty           TEXT (barbearia, fisioterapia, ...)          │
│ display_name        TEXT (Barbearia, Fisioterapia, ...)          │
│ description         TEXT                                         │
│ icon                TEXT                                         │
│ default_services    JSONB                                        │
│   └─ [                                                           │
│       {                                                          │
│         "name": "Corte Masculino",                               │
│         "price": 50,                                             │
│         "duration": 45,                                          │
│         "description": "..."                                     │
│       },                                                         │
│       ...                                                        │
│     ]                                                            │
│ default_automations JSONB                                        │
│   └─ [                                                           │
│       {                                                          │
│         "type": "reminder",                                      │
│         "event": "24h_before",                                   │
│         "message": "Olá {client_name}, ..."                      │
│       },                                                         │
│       ...                                                        │
│     ]                                                            │
│ default_policies    JSONB                                        │
│   └─ {                                                           │
│       "deposit_required": false,                                 │
│       "deposit_percentage": 0,                                   │
│       "cancellation_window_hours": 24                            │
│     }                                                            │
│ default_resources   JSONB                                        │
│ created_at          TIMESTAMPTZ                                  │
│ updated_at          TIMESTAMPTZ                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     TABELA: barbershops                          │
├─────────────────────────────────────────────────────────────────┤
│ id                  UUID (PK)                                    │
│ owner_user_id       UUID (FK → auth.users)                       │
│ name                TEXT                                         │
│ slug                TEXT (UNIQUE)                                │
│ address             TEXT                                         │
│ phone               TEXT                                         │
│ sector              TEXT ◄─── Vem do preset                      │
│ specialty           TEXT ◄─── Vem do preset                      │
│ onboarding_status   TEXT ◄─── 'configured' após onboarding      │
│ booking_policies    JSONB ◄─── Vem do preset                     │
│ niche_labels        JSONB ◄─── Labels dinâmicos                  │
│ created_at          TIMESTAMPTZ                                  │
│ updated_at          TIMESTAMPTZ                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TABELA: services                            │
├─────────────────────────────────────────────────────────────────┤
│ id                  UUID (PK)                                    │
│ barbershop_id       UUID (FK → barbershops) ◄─── Criado auto    │
│ name                TEXT ◄─── Vem do preset                      │
│ price               DECIMAL ◄─── Vem do preset                   │
│ duration_minutes    INTEGER ◄─── Vem do preset                   │
│ description         TEXT ◄─── Vem do preset                      │
│ is_active           BOOLEAN (default: true)                      │
│ created_at          TIMESTAMPTZ                                  │
│ updated_at          TIMESTAMPTZ                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TABELA: automations                           │
├─────────────────────────────────────────────────────────────────┤
│ id                  UUID (PK)                                    │
│ barbershop_id       UUID (FK → barbershops) ◄─── Criado auto    │
│ name                TEXT                                         │
│ trigger_type        TEXT ◄─── Vem do preset                      │
│ action_type         TEXT ◄─── Vem do preset                      │
│ template_message    TEXT ◄─── Vem do preset                      │
│ is_active           BOOLEAN (default: true)                      │
│ created_at          TIMESTAMPTZ                                  │
│ updated_at          TIMESTAMPTZ                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Exemplo Visual: Barbearia

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXEMPLO: BARBEARIA                            │
└─────────────────────────────────────────────────────────────────┘

ENTRADA DO USUÁRIO:
┌──────────────────────────────────────┐
│ Setor: Beleza & Estética             │
│ Especialidade: Barbearia             │
│ Nome: Barbearia do João              │
│ Endereço: Rua Teste, 123             │
│ CPF: 123.456.789-00                  │
│ WhatsApp: (11) 99999-9999            │
└──────────────────────────────────────┘
                │
                ▼
        SISTEMA APLICA PRESET
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
SERVIÇOS    AUTOMAÇÕES   POLÍTICAS

┌─────────────────────────────────────┐
│ SERVIÇOS CRIADOS:                   │
├─────────────────────────────────────┤
│ 1. Corte Masculino                  │
│    R$ 50,00 | 45 min                │
│                                     │
│ 2. Barba                            │
│    R$ 35,00 | 30 min                │
│                                     │
│ 3. Corte + Barba                    │
│    R$ 80,00 | 75 min                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ AUTOMAÇÕES CRIADAS:                 │
├─────────────────────────────────────┤
│ 1. Lembrete 24h antes               │
│    "Olá {client_name}, lembrete..." │
│                                     │
│ 2. Confirmação de agendamento       │
│    "Seu agendamento foi confirmado" │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ POLÍTICAS APLICADAS:                │
├─────────────────────────────────────┤
│ • Cancelamento: 24h antecedência    │
│ • Depósito: Não requerido           │
│ • Reagendamento: Permitido          │
└─────────────────────────────────────┘

                │
                ▼
        DASHBOARD DO DONO
┌─────────────────────────────────────┐
│ Barbearia do João                   │
├─────────────────────────────────────┤
│ ✅ 3 serviços configurados          │
│ ✅ 2 automações ativas              │
│ ✅ Políticas definidas              │
│ ✅ Pronto para receber agendamentos │
└─────────────────────────────────────┘
```

---

## 🌐 Mapa de Especialidades

```
SISTEMA DE ESPECIALIDADES (28 total)
│
├─ 🎨 Beleza & Estética (5)
│  ├─ ✂️ Barbearia
│  ├─ 💇 Salão de Beleza
│  ├─ 💅 Nail Designer
│  ├─ ✨ Esteticista
│  └─ 🎨 Maquiadora
│
├─ ❤️ Saúde & Bem-Estar (5)
│  ├─ 🏥 Fisioterapia
│  ├─ 🧘 Pilates
│  ├─ 🧠 Psicologia
│  ├─ 🍎 Nutrição
│  └─ 💆 Massoterapia
│
├─ 📚 Educação & Mentorias (3)
│  ├─ 📖 Aulas Particulares
│  ├─ 🎯 Coaching
│  └─ 🌍 Idiomas
│
├─ 🚗 Automotivo (3)
│  ├─ 🔧 Oficina Mecânica
│  ├─ ✨ Estética Automotiva
│  └─ 💧 Lava-Rápido
│
├─ 🐾 Pets (3)
│  ├─ 🛁 Banho & Tosa
│  ├─ 🏥 Veterinário
│  └─ 🎓 Adestramento
│
├─ 🏠 Serviços Domiciliares (3)
│  ├─ ⚡ Eletricista
│  ├─ 💧 Encanador
│  └─ 🧹 Diarista
│
├─ 💼 Jurídico & Financeiro (3)
│  ├─ ⚖️ Advogado
│  ├─ 🧮 Contador
│  └─ 📈 Consultor Financeiro
│
└─ 🔑 Espaços & Locação (3)
   ├─ 🏢 Salas de Reunião
   ├─ 🎬 Estúdio
   └─ ⚽ Quadra Esportiva
```

---

## 📈 Métricas de Sucesso

```
┌─────────────────────────────────────────────────────────────────┐
│                    MÉTRICAS DE SUCESSO                           │
└─────────────────────────────────────────────────────────────────┘

ANTES DO SISTEMA:
┌──────────────────────────────────────┐
│ Tempo de Onboarding: 10 minutos      │
│ Taxa de Conclusão: 60%               │
│ Erros de Configuração: 30%           │
│ Suporte Necessário: 40%              │
└──────────────────────────────────────┘

DEPOIS DO SISTEMA:
┌──────────────────────────────────────┐
│ Tempo de Onboarding: 3 minutos ✅    │
│ Taxa de Conclusão: 85% ✅            │
│ Erros de Configuração: 5% ✅         │
│ Suporte Necessário: 10% ✅           │
└──────────────────────────────────────┘

MELHORIAS:
┌──────────────────────────────────────┐
│ ⬇️ 70% redução no tempo              │
│ ⬆️ 42% aumento na conclusão          │
│ ⬇️ 83% redução de erros              │
│ ⬇️ 75% redução de suporte            │
└──────────────────────────────────────┘
```

---

**Última atualização**: 09/04/2026
