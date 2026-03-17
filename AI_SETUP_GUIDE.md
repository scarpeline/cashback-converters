# Guia de Setup - IA Aprimorada com Áudio

## 🎯 Objetivo

Configurar o sistema de IA que ouve, aprende e responde com áudio via WhatsApp.

## 📋 Pré-requisitos

- Node.js 18+
- Conta Supabase
- Conta OpenAI (para Whisper e TTS)
- Conta WhatsApp Business (opcional)

## 🚀 Passo 1: Configurar Variáveis de Ambiente

### 1.1 Copiar arquivo de exemplo
```bash
cp .env.example .env
```

### 1.2 Preencher variáveis Supabase
```env
VITE_SUPABASE_PROJECT_ID="seu_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_publishable_key"
VITE_SUPABASE_URL="https://seu-project.supabase.co"
```

### 1.3 Configurar OpenAI
```env
OPENAI_API_KEY="sk-seu-api-key"
```

**Como obter:**
1. Ir para https://platform.openai.com/api-keys
2. Criar nova chave
3. Copiar e colar no .env

## 🗄️ Passo 2: Criar Tabelas no Supabase

### 2.1 Executar SQL para criar tabela ai_memory
```sql
-- Copiar conteúdo de criar_tabela_ai_memory.sql
-- Executar no Supabase SQL Editor
```

### 2.2 Verificar se tabela foi criada
```sql
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'ai_memory' 
  AND table_schema = 'public'
) as tabela_criada;
```

## 📦 Passo 3: Instalar Dependências

```bash
npm install
```

## 🧪 Passo 4: Testar Funcionalidades

### 4.1 Testar Transcrição de Áudio
```typescript
import { transcreverAudio } from '@/services/aiEnhancedService';

const texto = await transcreverAudio('https://url-do-audio.mp3');
console.log('Texto transcrito:', texto);
```

### 4.2 Testar Geração de Áudio
```typescript
import { gerarRespostaAudio } from '@/services/aiEnhancedService';

const audioUrl = await gerarRespostaAudio('Olá, como posso ajudar?');
console.log('Áudio gerado:', audioUrl);
```

### 4.3 Testar Processamento com IA
```typescript
import { processarMensagemAprimorada } from '@/services/aiEnhancedService';

const resposta = await processarMensagemAprimorada(
  { id: 'client-id', name: 'João' },
  'Quero agendar um horário'
);
console.log('Resposta:', resposta.message);
console.log('Personalizada:', resposta.personalized);
```

## 🔌 Passo 5: Integrar com WhatsApp (Opcional)

### 5.1 Configurar Webhook
```typescript
import { setupWebhook } from '@/services/whatsappService';

await setupWebhook(
  'https://seu-dominio.com/api/webhook',
  'seu-verify-token'
);
```

### 5.2 Receber Mensagens
```typescript
// Em seu backend/API
import { receiveWhatsAppMessage } from '@/services/whatsappService';

app.post('/api/webhook', async (req, res) => {
  const { from, message, type } = req.body;
  
  const response = await receiveWhatsAppMessage(from, message, type);
  
  res.json({ ok: true, response });
});
```

## 📊 Passo 6: Monitorar Estatísticas

### 6.1 Usar Hook para Estatísticas
```typescript
import { useAdvancedAIStats } from '@/hooks/useEnhancedAI';

export function AIStatsComponent() {
  const { stats, loadStats } = useAdvancedAIStats();
  
  useEffect(() => {
    loadStats();
  }, []);
  
  return (
    <div>
      <p>Total de conversas: {stats.totalConversations}</p>
      <p>Clientes únicos: {stats.uniqueClients}</p>
      <p>Conversas por áudio: {stats.audioConversations}</p>
      <p>Confiança média: {stats.averageConfidence.toFixed(2)}</p>
    </div>
  );
}
```

## 🐛 Troubleshooting

### Erro: "OpenAI API Key não configurada"
**Solução:** Verificar se `OPENAI_API_KEY` está no `.env`

### Erro: "Tabela ai_memory não encontrada"
**Solução:** Executar SQL de criação da tabela no Supabase

### Erro: "Falha ao transcrever áudio"
**Solução:** 
- Verificar se arquivo de áudio é válido
- Verificar se API key do OpenAI tem créditos
- Verificar se URL do áudio é acessível

### Erro: "Falha ao enviar mensagem WhatsApp"
**Solução:**
- Verificar se webhook está configurado
- Verificar se número de telefone é válido
- Verificar se API key do WhatsApp é válida

## 📈 Próximos Passos

1. **Treinar modelo customizado**
   ```typescript
   // Usar histórico para treinar modelo específico
   const historico = await getClientHistory(clientId, 1000);
   // Enviar para treinamento
   ```

2. **Implementar análise de sentimento**
   ```typescript
   // Detectar satisfação do cliente
   const sentiment = await analyzeSentiment(message);
   ```

3. **Criar dashboard de IA**
   - Visualizar métricas
   - Analisar padrões
   - Gerenciar configurações

4. **Integrar com CRM**
   - Sincronizar dados de clientes
   - Atualizar histórico automaticamente

## 🔐 Segurança

### Boas Práticas
- ✅ Nunca commitar `.env` com chaves reais
- ✅ Usar variáveis de ambiente para dados sensíveis
- ✅ Validar entrada de usuário
- ✅ Limitar taxa de requisições à API
- ✅ Usar HTTPS para webhooks

### RLS Policies
```sql
-- Usuários veem seu próprio histórico
CREATE POLICY "Users can view own AI memory"
ON ai_memory FOR SELECT
USING (client_id = auth.uid());

-- Sistema pode inserir
CREATE POLICY "System can insert AI memory"
ON ai_memory FOR INSERT
WITH CHECK (true);
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs do console
2. Consultar documentação do OpenAI
3. Verificar status do Supabase
4. Verificar status da API do WhatsApp

## ✅ Checklist de Setup

- [ ] Variáveis de ambiente configuradas
- [ ] Tabela ai_memory criada no Supabase
- [ ] OpenAI API key válida
- [ ] Dependências instaladas
- [ ] Testes básicos passando
- [ ] Webhook configurado (se usando WhatsApp)
- [ ] RLS policies ativas
- [ ] Backups configurados

## 🎉 Pronto!

Seu sistema de IA aprimorada está configurado e pronto para usar!

Comece a testar com:
```bash
npm run dev
```
