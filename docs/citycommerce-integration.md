# Integração CityCommerce ↔ SalãoCashBack

## 1. Credenciais de Integração

Configure estas variáveis no CityCommerce:

```env
# URL base da API deste app (Supabase Edge Functions)
SCHEDULING_APP_URL=https://hyvmvkwczhodhpjjazop.supabase.co/functions/v1/citycommerce-integration

# Segredo compartilhado para assinar/verificar webhooks via HMAC-SHA256
SCHEDULING_SHARED_SECRET=757d7afd1d8dc207c60aed646ee2db20589832ffc3d32ef3198f3a877bdaccc2

# Bearer Token para autenticar requisições do CityCommerce → este app
MOBILITY_API_TOKEN=sck_live_13034679726a24195596ea75d83bebaa5901bb37464f562e4c373cc2f0f25f3644d9dbd972ccebe1b46fef22c205136e

# URL da página de agendamento público
MOBILITY_API_URL=https://hyvmvkwczhodhpjjazop.supabase.co/functions/v1/citycommerce-integration
```

> ⚠️ **IMPORTANTE:** Configure também no Supabase Dashboard → Edge Functions → Secrets:
> - `CITYCOMMERCE_API_KEY` = valor de `MOBILITY_API_TOKEN` acima
> - `CITYCOMMERCE_SHARED_SECRET` = valor de `SCHEDULING_SHARED_SECRET` acima
> - `APP_URL` = URL do seu frontend (ex: `https://seudominio.com`)

---

## 2. URL Base da API

```
https://hyvmvkwczhodhpjjazop.supabase.co/functions/v1/citycommerce-integration
```

---

## 3. Endpoints Disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/deliveries` | Criar agendamento |
| `GET`  | `/deliveries/:id` | Consultar status |
| `POST` | `/deliveries/estimate` | Estimar preço/tempo |
| `POST` | `/deliveries/:id/cancel` | Cancelar agendamento |
| `GET`  | `/agendar/:slug?token=...` | Página de agendamento (frontend) |

---

## 4. Autenticação

Toda requisição deve incluir:

```http
Authorization: Bearer sck_live_13034679726a24195596ea75d83bebaa5901bb37464f562e4c373cc2f0f25f3644d9dbd972ccebe1b46fef22c205136e
Content-Type: application/json
```

### Assinatura HMAC-SHA256 (recomendado para webhooks)

```http
X-Signature: <hmac_sha256(SHARED_SECRET, timestamp + "." + body)>
X-Timestamp: <unix_timestamp>
```

**Exemplo em Node.js:**
```js
const crypto = require('crypto');
const timestamp = Date.now().toString();
const signature = crypto
  .createHmac('sha256', SHARED_SECRET)
  .update(`${timestamp}.${JSON.stringify(body)}`)
  .digest('hex');
```

---

## 5. Formato JSON dos Endpoints

### POST /deliveries — Criar agendamento

**Request:**
```json
{
  "external_id": "order_abc123",
  "barbershop_slug": "barbearia-do-joao",
  "service_id": "uuid-do-servico",
  "professional_id": "uuid-do-profissional",
  "scheduled_at": "2026-04-15T14:00:00",
  "client_name": "Maria Silva",
  "client_phone": "+5511999990000",
  "client_email": "maria@email.com",
  "notes": "Prefere profissional feminino",
  "source": "citycommerce"
}
```

**Response 201:**
```json
{
  "id": "uuid-do-agendamento",
  "external_id": "order_abc123",
  "status": "scheduled",
  "scheduled_at": "2026-04-15T14:00:00",
  "barbershop": "Barbearia do João",
  "booking_url": "https://seudominio.com/agendar/barbearia-do-joao",
  "created_at": "2026-04-11T20:00:00Z"
}
```

**Erros possíveis:**
```json
{ "error": "Missing required fields", "required": ["external_id","barbershop_slug",...] }  // 422
{ "error": "Barbershop not found", "slug": "slug-invalido" }                               // 404
{ "error": "Time slot already booked", "code": "SLOT_UNAVAILABLE" }                       // 409
{ "error": "Unauthorized", "code": "INVALID_CREDENTIALS" }                                // 401
```

---

### GET /deliveries/:id — Consultar status

**Response 200:**
```json
{
  "id": "uuid-do-agendamento",
  "external_id": "order_abc123",
  "status": "scheduled",
  "scheduled_at": "2026-04-15T14:00:00",
  "client_name": "Maria Silva",
  "service": "Corte Feminino",
  "price": 45.00,
  "professional": "Ana Costa"
}
```

**Status possíveis:** `scheduled` | `confirmed` | `completed` | `cancelled` | `no_show`

---

### POST /deliveries/estimate — Estimar preço/tempo

**Request:**
```json
{
  "barbershop_slug": "barbearia-do-joao",
  "service_id": "uuid-do-servico",
  "preferred_date": "2026-04-15"
}
```

**Response 200:**
```json
{
  "service": "Corte Masculino",
  "price": 35.00,
  "duration_minutes": 30,
  "available_slots_today": 8,
  "next_available": "2026-04-15T09:00:00",
  "currency": "BRL"
}
```

---

### POST /deliveries/:id/cancel — Cancelar

**Request:**
```json
{
  "reason": "Cliente solicitou cancelamento"
}
```

**Response 200:**
```json
{
  "id": "uuid-do-agendamento",
  "status": "cancelled",
  "cancelled_at": "2026-04-11T20:00:00Z"
}
```

---

## 6. Link Dinâmico de Agendamento (Rota /agendar)

Para enviar o usuário do CityCommerce direto para o agendamento pré-preenchido:

```
https://seudominio.com/agendar/{barbershop_slug}
  ?token=sck_live_13034679726a24195596ea75d83bebaa5901bb37464f562e4c373cc2f0f25f3644d9dbd972ccebe1b46fef22c205136e
  &service={service_id}
  &prof={professional_id}
  &ref={external_order_id}
  &source=citycommerce
  &return_url=https://citycommerce.com.br/pedido/{order_id}/confirmado
```

O usuário chega com empresa e serviço pré-selecionados, escolhe o horário e ao confirmar é redirecionado de volta ao CityCommerce com:
```
?appointment_id=UUID&status=confirmed&ref=external_order_id&service=Nome+do+Servico
```

---

## 7. Variáveis de Ambiente — Resumo Final

```env
# No CityCommerce:
SCHEDULING_APP_URL=https://hyvmvkwczhodhpjjazop.supabase.co/functions/v1/citycommerce-integration
SCHEDULING_SHARED_SECRET=757d7afd1d8dc207c60aed646ee2db20589832ffc3d32ef3198f3a877bdaccc2
MOBILITY_API_URL=https://hyvmvkwczhodhpjjazop.supabase.co/functions/v1/citycommerce-integration
MOBILITY_API_TOKEN=sck_live_13034679726a24195596ea75d83bebaa5901bb37464f562e4c373cc2f0f25f3644d9dbd972ccebe1b46fef22c205136e

# No Supabase (Edge Function Secrets):
CITYCOMMERCE_API_KEY=sck_live_13034679726a24195596ea75d83bebaa5901bb37464f562e4c373cc2f0f25f3644d9dbd972ccebe1b46fef22c205136e
CITYCOMMERCE_SHARED_SECRET=757d7afd1d8dc207c60aed646ee2db20589832ffc3d32ef3198f3a877bdaccc2
APP_URL=https://seudominio.com
```
