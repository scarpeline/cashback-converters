// Hook para WhatsApp Integration
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  sendWhatsAppMessage, 
  getWhatsAppHistory, 
  processWhatsAppWebhook,
  sendAutomatedMessage,
  getWhatsAppStatus,
  sendWelcomeMessage,
  sendAppointmentReminder,
  sendReactivationMessage,
  type WhatsAppMessage 
} from '@/services/whatsappService';

// Chaves de query para cache
export const whatsappKeys = {
  all: ['whatsapp'] as const,
  history: (clientId: string) => [...whatsappKeys.all, 'history', clientId] as const,
  status: () => [...whatsappKeys.all, 'status'] as const,
};

/**
 * Hook para enviar mensagens
 */
export function useWhatsApp() {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (
    to: string,
    message: string,
    type: 'text' | 'audio' = 'text'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsSending(true);
    try {
      const result = await sendWhatsAppMessage(to, message, type);
      return result;
    } finally {
      setIsSending(false);
    }
  }, []);

  return {
    sendMessage,
    isSending,
  };
}

/**
 * Hook para histórico de mensagens
 */
export function useWhatsAppHistory(clientId?: string) {
  return useQuery({
    queryKey: whatsappKeys.history(clientId || ''),
    queryFn: () => getWhatsAppHistory(clientId || '', 50),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para status do WhatsApp
 */
export function useWhatsAppStatus() {
  return useQuery({
    queryKey: whatsappKeys.status(),
    queryFn: getWhatsAppStatus,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para processar webhook
 */
export function useWhatsAppWebhook() {
  const processMessage = useCallback(async (body: any): Promise<{ ok: boolean; response?: string }> => {
    try {
      const result = await processWhatsAppWebhook(body);
      return result;
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return { ok: false, response: 'Erro ao processar mensagem' };
    }
  }, []);

  return { processMessage };
}

/**
 * Hook para mensagens automatizadas
 */
export function useAutomatedMessages() {
  const sendAutomated = useCallback(async (
    to: string,
    template: string,
    variables: Record<string, string> = {}
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await sendAutomatedMessage(to, template, variables);
      return result;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem automatizada:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return { sendAutomated };
}

/**
 * Hook para mensagens de sistema
 */
export function useSystemMessages() {
  const sendWelcome = useCallback(async (to: string, name: string): Promise<void> => {
    await sendWelcomeMessage(to, name);
  }, []);

  const sendReminder = useCallback(async (
    to: string,
    serviceName: string,
    date: string,
    time: string
  ): Promise<void> => {
    await sendAppointmentReminder(to, serviceName, date, time);
  }, []);

  const sendReactivation = useCallback(async (to: string, daysInactive: number): Promise<void> => {
    await sendReactivationMessage(to, daysInactive);
  }, []);

  return {
    sendWelcome,
    sendReminder,
    sendReactivation,
  };
}

/**
 * Hook para chat com WhatsApp
 */
export function useWhatsAppChat(clientId?: string) {
  const { sendMessage, isSending } = useWhatsApp();
  const { data: history, isLoading } = useWhatsAppHistory(clientId);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);

  // Carregar histórico
  useState(() => {
    if (history && history.length > 0) {
      setMessages(history);
    }
  });

  const handleSendMessage = useCallback(async (text: string): Promise<void> => {
    if (!text.trim() || !clientId) return;

    // Adicionar mensagem do usuário
    const userMessage: WhatsAppMessage = {
      id: Date.now().toString(),
      from: clientId,
      to: 'system',
      message: text,
      type: 'text',
      status: 'sent',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Enviar mensagem
      const result = await sendMessage(clientId, text);

      if (result.success) {
        // Adicionar resposta da IA
        const aiMessage: WhatsAppMessage = {
          id: (Date.now() + 1).toString(),
          from: 'system',
          to: clientId,
          message: result.message_id || 'Mensagem enviada',
          type: 'text',
          status: 'sent',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Mensagem de erro
        const errorMessage: WhatsAppMessage = {
          id: (Date.now() + 1).toString(),
          from: 'system',
          to: clientId,
          message: `Erro: ${result.error}`,
          type: 'text',
          status: 'failed',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }, [clientId, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    handleSendMessage,
    clearChat,
    isSending,
    isLoading,
    hasHistory: history && history.length > 0,
  };
}