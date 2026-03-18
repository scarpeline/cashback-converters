import { useState, useEffect, useRef } from 'react';
import { useEnhancedAI, useAIChat } from '@/hooks/useEnhancedAI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Mic, Volume2 } from 'lucide-react';

interface AIChatProps {
  clientId: string;
  clientName?: string;
}

export function AIChat({ clientId, clientName = 'Cliente' }: AIChatProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage, isProcessing, hasHistory } = useAIChat(clientId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const currentMessage = message;
    setMessage('');
    
    try {
      await sendMessage(currentMessage);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      // Implementar gravação de áudio aqui
      // Por enquanto, apenas simulamos
      setTimeout(() => {
        setIsRecording(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao gravar áudio:', error);
      setIsRecording(false);
    }
  };

  const handlePlayAudio = async (audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
        <h2 className="text-lg font-semibold">{clientName}</h2>
        <p className="text-sm text-blue-100">
          {hasHistory ? 'Histórico carregado' : 'Novo chat'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Nenhuma mensagem ainda. Comece a conversar!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`max-w-xs px-4 py-2 ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                {msg.personalized && msg.sender === 'ai' && (
                  <p className="text-xs mt-1 opacity-70">💡 Personalizada</p>
                )}
                <p className="text-xs mt-1 opacity-50">
                  {msg.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </Card>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isProcessing) {
                handleSendMessage();
              }
            }}
            placeholder="Digite sua mensagem..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isProcessing || !message.trim()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Audio Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleStartRecording}
            disabled={isProcessing || isRecording}
            variant="outline"
            className="flex-1"
          >
            <Mic className="w-4 h-4 mr-2" />
            {isRecording ? 'Gravando...' : 'Gravar Áudio'}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Ouvir Resposta
          </Button>
        </div>

        {/* Status */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processando...
          </div>
        )}
      </div>
    </div>
  );
}
