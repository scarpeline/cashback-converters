# 🚀 Guia de Configuração - Sistema SaaS Completo

## 1. LINKAR PROJETO AO SUPABASE

O projeto ainda não está linkado ao Supabase. Para executar as migrations:

```bash
# 1. Linkar ao projeto Supabase (substitua pelo seu project ref)
npx supabase link --project-ref SEU_PROJECT_REF

# 2. Push das migrations
npx supabase db push

# 3. Deploy das Edge Functions
supabase functions deploy queue-worker
supabase functions deploy check-blocked-numbers
```

---

## 2. CONFIGURAR CRON JOBS (SUPABASE DASHBOARD)

Acesse: https://app.supabase.com → Seu Projeto → Database → Extensions

### Cron Job 1: queue-worker (a cada 5 minutos)
```sql
SELECT cron.schedule(
  'process-whatsapp-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://SEU_PROJECT_REF.supabase.co/functions/v1/queue-worker',
    headers:='{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

### Cron Job 2: check-blocked-numbers (a cada 15 minutos)
```sql
SELECT cron.schedule(
  'check-blocked-whatsapp',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://SEU_PROJECT_REF.supabase.co/functions/v1/check-blocked-numbers',
    headers:='{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

---

## 3. MIGRATIONS CRIADAS (execute no Dashboard se preferir)

Copie e execute manualmente no Supabase SQL Editor:

### Migration 1: WhatsApp Multi-Conta
`supabase/migrations/20260319_whatsapp_multi_account_system.sql`

### Migration 2: Balanceamento e Filas
`supabase/migrations/20260319_whatsapp_balance_queue_system.sql`

### Migration 3: Loja Interna
`supabase/migrations/20260319_store_system.sql`

### Migration 4: Clube VIP
`supabase/migrations/20260319_membership_vip_system.sql`

### Migration 5: Sistema de Indicação
`supabase/migrations/20260319_client_referral_system.sql`

---

## 4. DEPLOY DAS EDGE FUNCTIONS

```bash
# Entre na pasta do projeto
cd "c:\Users\pattydoamaral\Desktop\novo atualização app agenda\cashback-converters"

# Login no Supabase
npx supabase login

# Linkar projeto
npx supabase link --project-ref SEU_PROJECT_REF

# Deploy das functions
supabase functions deploy queue-worker
supabase functions deploy check-blocked-numbers
```

---

## 5. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

No Supabase Dashboard → Settings → Edge Functions → Secrets:

```
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

---

## 6. VERIFICAR INTEGRAÇÃO

Após setup, teste:

1. Cadastre um número WhatsApp no painel
2. Verifique se aparece na tabela `whatsapp_accounts`
3. Compre um pacote de mensagens
4. Verifique o saldo em `message_balance`
5. Tente enviar uma mensagem de teste

---

## 7. ROTAS NO DASHBOARD DONO

Após as migrations, estas rotas estarão disponíveis:

- `/dono/whatsapp-contas` - Gerenciar números WhatsApp
- `/dono/whatsapp-pacotes` - Pacotes de mensagens
- `/dono/whatsapp-custos` - Divisão de custos
- `/dono/whatsapp-relatorios` - Relatórios
- `/dono/whatsapp-monitor` - Monitoramento
- `/dono/inteligencia-agenda` - IA para agenda
- `/dono/loja` - Loja interna
- `/dono/clube-vip` - Clube VIP

---

## 8. ESTRUTURA DE ARQUIVOS CRIADOS

### Migrations (5 novas)
```
supabase/migrations/
├── 20260319_whatsapp_multi_account_system.sql
├── 20260319_whatsapp_balance_queue_system.sql
├── 20260319_store_system.sql
├── 20260319_membership_vip_system.sql
└── 20260319_client_referral_system.sql
```

### Edge Functions (2 novas)
```
supabase/functions/
├── queue-worker/index.ts
└── check-blocked-numbers/index.ts
```

### Serviços (8 novos)
```
src/services/
├── whatsappAccountService.ts
├── messagePackageService.ts
├── twilioIntegrationService.ts
├── costSplitService.ts
├── messageReportService.ts
├── whatsAppAutomationService.ts
├── messageBalanceService.ts
├── jobQueueService.ts
├── whatsAppWorkerService.ts
├── blockingAlertService.ts
├── agendaOptimizerService.ts
├── storeService.ts
├── membershipService.ts
├── referralService.ts
└── analyticsService.ts
```

### Componentes (9 novos)
```
src/components/
├── whatsapp/
│   ├── WhatsAppAccountsPanel.tsx
│   ├── MessagePackagesPanel.tsx
│   ├── CostSplitConfigPanel.tsx
│   ├── MessageReportsPanel.tsx
│   ├── WhatsAppMonitoringPanel.tsx
│   └── index.ts
├── agenda/
│   └── AgendaIntelligencePanel.tsx
├── store/
│   └── StorePanel.tsx
├── membership/
│   └── MembershipVIPPanel.tsx
└── referral/
    └── ReferralPanel.tsx
```

---

## ❓ PROBLEMAS COMUNS

### "Cannot find project ref"
Execute: `npx supabase link --project-ref SEU_PROJECT_REF`

### "Migration failed"
Verifique se já existem tabelas com os mesmos nomes no banco.

### Edge Function não executa
Verifique se os cron jobs estão ativos em Database → Extensions → pg_cron

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Linkar projeto ao Supabase
2. ✅ Executar migrations
3. ✅ Deploy Edge Functions
4. ⏳ Configurar cron jobs
5. ⏳ Testar sistema

Qualquer dúvida, me chame!
