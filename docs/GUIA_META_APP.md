# Guia: Criar App na Meta (Facebook/Instagram)

## 📋 Pré-requisitos

- Conta de negócios na Meta (Business Manager)
- Página do Facebook vinculada ao Instagram Business
- Conta de desenvolvedor Meta (gratuita)

---

## 🚀 Passo a Passo

### 1. Criar Conta de Desenvolvedor

1. Acesse: https://developers.facebook.com/
2. Clique em **"Get Started"** ou **"Meus Apps"**
3. Faça login com sua conta do Facebook
4. Complete o cadastro de desenvolvedor (nome, email, etc.)

### 2. Criar Novo App

1. No dashboard, clique em **"Create App"**
2. Selecione tipo: **"Business"**
3. Preencha:
   - **App Name**: `Salão Cashback`
   - **App Contact Email**: seu email
   - **Business Account**: Selecione sua conta
4. Clique em **"Create App"**

### 3. Adicionar Produtos (APIs)

No app criado, adicione estes produtos:

#### Instagram Basic Display
1. Clique em **"Add Product"**
2. Encontre **"Instagram Basic Display"**
3. Clique em **"Set Up"**
4. Configure:
   - **Valid OAuth Redirect URIs**: 
     ```
     https://seudominio.com/auth/meta/callback
     https://hyvmvkwczhodhpjjazop.supabase.co/functions/v1/meta-webhook
     ```

#### Instagram Graph API
1. Adicione **"Instagram Graph API"**
2. Esta dá acesso a:
   - Ler comentários
   - Responder comentários
   - Enviar mensagens (DM)

#### Messenger API (para Facebook)
1. Adicione **"Messenger"**
2. Configure webhook

### 4. Configurar Permissões (Scopes)

No menu **"App Review" > "Permissions and Features"**, solicite:

| Permissão | Uso |
|-----------|-----|
| `instagram_basic` | Ler perfil do Instagram |
| `instagram_manage_comments` | Responder comentários |
| `instagram_manage_messages` | Enviar DMs |
| `pages_show_list` | Listar páginas do Facebook |
| `pages_messaging` | Mensagens via página |

### 5. Configurar Webhook

1. Vá em **"Webhooks"** no menu do app
2. Clique em **"Subscribe to this object"**
3. Selecione **"Instagram"**
4. Configure:
   - **Callback URL**: `https://hyvmvkwczhodhpjjazop.supabase.co/functions/v1/meta-webhook`
   - **Verify Token**: (gerar token seguro)
   - **Fields**: `mentions`, `comments`, `messaging`

### 6. Configurar URLs

Em **"Settings" > "Basic"**:

- **App Domains**: `seudominio.com`
- **Privacy Policy URL**: `https://seudominio.com/privacidade`
- **Terms of Service URL**: `https://seudominio.com/termos`
- **User Data Deletion**: `https://seudominio.com/delete-data`
- **App Icon**: Upload logo (1024x1024)
- **Category**: `Business and Pages`

### 7. Colocar App em Modo Live

1. Vá em **"App Review" > "Permissions and Features"**
2. Para cada permissão, clique **"Request Advanced Access"**
3. Preencha o formulário justificando o uso
4. Aguarde aprovação (2-3 dias úteis)

---

## ⚙️ Configuração no Seu Projeto

### 1. Pegar App ID

Em **"Settings" > "Basic"**, copie:
- **App ID**: `123456789012345`

### 2. Atualizar .env

```env
# .env
VITE_META_APP_ID="123456789012345"
```

### 3. Ativar Feature Flag

No Supabase, execute:

```sql
UPDATE public.feature_flags 
SET enabled = true 
WHERE feature_key = 'meta_social_integration';
```

### 4. Criar Edge Function (Webhook Handler)

Crie o arquivo `supabase/functions/meta-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Verificação do webhook (Meta)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    
    if (mode === 'subscribe' && token === 'SEU_VERIFY_TOKEN') {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  // Processar evento
  if (req.method === 'POST') {
    const body = await req.json()
    
    // Salvar evento no banco
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.value?.item === 'comment') {
          // Processar comentário
          await processComment(supabase, change.value)
        }
      }
    }
    
    return new Response('OK', { status: 200 })
  }

  return new Response('Method not allowed', { status: 405 })
})

async function processComment(supabase: any, commentData: any) {
  // Buscar automações ativas
  const { data: automations } = await supabase
    .from('meta_comment_automations')
    .select('*')
    .eq('is_active', true)
  
  // Verificar gatilhos e executar ações
  // TODO: Implementar lógica de resposta
}
```

Deploy:
```bash
supabase functions deploy meta-webhook
```

---

## 🔒 Política de Privacidade (Exemplo)

Crie página `/privacidade` no seu site:

```html
<h1>Política de Privacidade</h1>
<p>Esta aplicação acessa dados do Instagram/Facebook apenas para:
- Responder comentários automaticamente
- Enviar mensagens diretas quando solicitado
- Gerar relatórios de interação</p>
<p>Os dados não são compartilhados com terceiros.</p>
```

---

## ✅ Checklist Final

- [ ] App criado na Meta
- [ ] Produtos Instagram e Messenger adicionados
- [ ] Permissões solicitadas
- [ ] Webhook configurado
- [ ] URLs de privacidade/termos criadas
- [ ] App ID adicionado ao `.env`
- [ ] Feature flag ativada
- [ ] Edge Function deployada
- [ ] Teste de integração realizado

---

## 🆘 Links Úteis

- **Developers**: https://developers.facebook.com/
- **Instagram API Docs**: https://developers.facebook.com/docs/instagram-api
- **Webhook Reference**: https://developers.facebook.com/docs/messenger-platform/webhooks
- **App Review**: https://developers.facebook.com/docs/app-review

---

## ⚠️ Dicas Importantes

1. **Nunca** exponha o App Secret no frontend
2. Use HTTPS em produção (obrigatório pela Meta)
3. Tenha uma página de privacidade válida
4. O app precisa passar por review para ficar público
5. Em desenvolvimento, adicione contas de teste no "Roles"

**Tempo estimado**: 2-3 horas de configuração + 2-3 dias de aprovação
