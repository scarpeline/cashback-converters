# Implementação de IA Aprimorada com Áudio e Aprendizado

## 📋 Resumo

Implementação completa de um sistema de IA que:
- 🎧 Ouve áudio do cliente (speech-to-text com OpenAI Whisper)
- 🧠 Aprende com histórico de conversas
- 🎯 Personaliza respostas baseado no perfil do cliente
- 📱 Integra com WhatsApp
- 🔊 Responde em áudio (text-to-speech)

## 🏗️ Arquitetura

### Serviços Implementados

#### 1. **aiEnhancedService.ts** - Núcleo da IA Aprimorada
```
processarMensagemAprimorada()
├── Transcreve áudio (se necessário)
├── Busca histórico do cliente
├── Detecta intenção
├── Personaliza resposta
└── Salva na memória
```

**Funções principais:**
- `processarMensagemAprimorada()` - Processa texto ou áudio com IA
- `transcreverAudio()` - Converte áudio em texto (Whisper)
- `gerarRespostaAudio()` - Converte texto em áudio (TTS)
- `generateProactiveSuggestion()` - Sugere ações baseado no comportamento
- `analyzeConversationPatterns()` - Analisa padrões de conversa
- `needsReactivation()` - Identifica clientes inativos
- `getAdvancedAIStats()` - Estatísticas de uso da IA

#### 2. **aiMemoryService.ts** - Memória da IA
- `saveConversation()` - Salva conversa no histórico
- `getClientHistory()` - Busca histórico do cliente
- `detectIntent()` - Detecta intenção da mensagem
- `analyzeClientPreferences()` - Analisa preferências do cliente
- `getAIStats()` - Estatísticas gerais

#### 3. **aiService.ts** - IA Básica
- `processarMensagem()` - Processa mensagem com intenção
- `analisarPerfilCliente()` - Analisa perfil do cliente
- `gerarSugestaoPersonalizada()` - Gera sugestão personalizada

#### 4. **whatsappService.ts** - Integração WhatsApp
- `sendWhatsAppMessage()` - Envia mensagem
- `sendAudioMessage()` - Envia áudio
- `receiveWhatsAppMessage()` - Recebe mensagem
- `sendReactivationMessage()` - Envia mensagem de reativação

### Hooks React

#### **useEnhancedAI.ts**
```typescript
// Processar mensagem com IA
const { processMessage, processAudio, isProcessing } = useEnhancedAI(clientId);

// Buscar histórico
const { data: history } = useAIHistory(clientId);

// Sugestão proativa
const { data: suggestion } = useProactiveSuggestion(clientId);

// Padrões de conversa
const { data: patterns } = useConversationPatterns(clientId);

// Verificar reativação
const { data: needsReactivation } = useReactivationCheck(clientId);

// Estatísticas avançadas
const { stats, loadStats } = useAdvancedAIStats();

// Chat com IA
const { messages, sendMessage, isProcessing } = useAIChat(clientId);

// Enviar via WhatsApp com IA
const { sendMessage, isSending } = useSendWhatsAppWithAI(clientId);
```

## 🔄 Fluxo de Funcionamento

### 1. Cliente Envia Áudio via WhatsApp
```
Cliente envia áudio
    ↓
Webhook recebe arquivo
    ↓
transcreverAudio() - Whisper API
    ↓
Texto transcrito
```

### 2. IA Processa Mensagem
```
Texto recebido
    ↓
detectIntent() - Identifica intenção
    ↓
getClientHistory() - Busca histórico
    ↓
analisarPerfilCliente() - Analisa perfil
    ↓
personalizarResposta() - Personaliza
    ↓
saveConversation() - Salva na memória
```

### 3. IA Aprende com Histórico
```
Cada conversa salva
    ↓
Padrões identificados
    ↓
Respostas similares encontradas
    ↓
Próximas respostas mais precisas
```

### 4. Resposta em Áudio
```
Texto da resposta
    ↓
gerarRespostaAudio() - TTS API
    ↓
Áudio gerado
    ↓
Enviado via WhatsApp
```

## 📊 Tabela de Dados

### ai_memory
```sql
CREATE TABLE ai_memory (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id),
  message TEXT,
  response TEXT,
  intent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
);
```

**Índices:**
- `idx_ai_memory_client_id` - Para buscar histórico do cliente
- `idx_ai_memory_created_at` - Para ordenar por data
- `idx_ai_memory_intent` - Para análise de intenções

## 🎯 Casos de Uso

### 1. Cliente Frequente
```
Cliente: "Oi, quero agendar"
IA: "Olá João! 😊 Baseado no seu histórico, você gosta muito do serviço 'Corte + Barba'.
Temos horários disponíveis amanhã às 14h. Quer confirmar?"
```

### 2. Cliente Inativo
```
Sistema detecta: Cliente não vem há 20 dias
IA envia: "👋 Sentimos sua falta! Faz 20 dias que você não vem. 
Que tal agendar um retorno? Temos desconto especial para você!"
```

### 3. Cliente Novo
```
Cliente: "Qual é o preço do corte?"
IA: "📋 Serviços Disponíveis:
1. Corte - R$ 50,00 (30 min)
2. Barba - R$ 40,00 (20 min)
3. Corte + Barba - R$ 80,00 (50 min)

Qual serviço você gostaria de agendar?"
```

## 🔐 Segurança

### RLS Policies
```sql
-- Usuários veem seu próprio histórico
SELECT: client_id = auth.uid()

-- Sistema pode inserir
INSERT: true

-- Super admins veem tudo
SELECT: is_super_admin(auth.uid())
```

## 📈 Métricas

### Estatísticas Disponíveis
- Total de conversas
- Clientes únicos
- Conversas por áudio vs texto
- Confiança média das respostas
- Intenções mais comuns
- Taxa de satisfação

## 🚀 Próximos Passos

1. **Treinar modelo customizado** - Usar histórico para treinar modelo específico
2. **Análise de sentimento** - Detectar satisfação do cliente
3. **Recomendações inteligentes** - Sugerir serviços baseado em padrões
4. **Integração com CRM** - Sincronizar dados com sistema de CRM
5. **Dashboard de IA** - Visualizar métricas e padrões

## 🔧 Configuração

### Variáveis de Ambiente
```env
OPENAI_API_KEY=sk-...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

### Instalação de Dependências
```bash
npm install @supabase/supabase-js @tanstack/react-query
```

## 📝 Exemplo de Uso

```typescript
import { useEnhancedAI } from '@/hooks/useEnhancedAI';

export function ChatComponent({ clientId }: { clientId: string }) {
  const { processMessage, isProcessing } = useEnhancedAI(clientId);
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    const response = await processMessage(message);
    console.log('Resposta:', response.message);
    console.log('Personalizada:', response.personalized);
    console.log('Intenção:', response.intent);
  };

  return (
    <div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Digite sua mensagem..."
      />
      <button onClick={handleSend} disabled={isProcessing}>
        {isProcessing ? 'Processando...' : 'Enviar'}
      </button>
    </div>
  );
}
```

## ✅ Status

- ✅ Transcrição de áudio (Whisper)
- ✅ Geração de áudio (TTS)
- ✅ Aprendizado com histórico
- ✅ Personalização de respostas
- ✅ Sugestões proativas
- ✅ Análise de padrões
- ✅ Integração com WhatsApp
- ⏳ Dashboard de IA (próximo)
- ⏳ Modelo customizado (próximo)
