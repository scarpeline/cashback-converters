// Hook para WhatsApp Integration
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  sendWhatsAppMessage, 
  sendWhatsAppWithAI,
  receiveWhatsAppMessage,
  sendAudioMessage,
  getWhatsAppHistory,
  sendReactivationMessage,
  sendAppointmentReminder,
  type WhatsAppMessage 
} from '@/services/whatsappService';

// Chaves de query para cache
export const whatsappKeys = {
  all: ['whatsapp'] as const,
  history: (clientId: string) => [...whatsappKeys.all, 'history', clientId] as const,
  stats: () => [...whatsappKeys.all, 'stats'] as const,
};

/**
 * Hook para enviar mensagem via WhatsApp
 */
export function useSendWhatsApp() {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (
    to: string,
    message: string,
    type: 'text' | 'audio' = 'text'
  ) => {
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
 * Hook para enviar mensagem com IA
 */
export function useSendWhatsAppWithAI(clientId?: string) {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    if (!clientId) {
      throw new Error('Client ID é necessário');
    }

    setIsSending(true);
    try {
      const result = await sendWhatsAppWithAI(clientId, message, clientId);
      return result;
    } finally {
      setIsSending(false);
    }
  }, [clientId]);

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
 * Hook para enviar mensagem de reativação
 */
export function useReactivationMessage() {
  const [isSending, setIsSending] = useState(false);

  const sendReactivation = useCallback(async (clientId: string) => {
    setIsSending(true);
    try {
      const result = await sendReactivationMessage(clientId, 'Sentimos sua falta! Que tal agendar um horário?');
      return result;
    } finally {
      setIsSending(false);
    }
  }, []);

  return {
    sendReactivation,
    isSending,
  };
}

/**
 * Hook para enviar lembrete de agendamento
 */
export function useAppointmentReminder() {
  const [isSending, setIsSending] = useState(false);

  const sendReminder = useCallback(async (appointmentId: string, clientId: string) => {
    setIsSending(true);
    try {
      const result = await sendAppointmentReminder(appointmentId, clientId);
      return result;
    } finally {
      setIsSending(false);
    }
  }, []);

  return {
    sendReminder,
    isSending,
  };
}

/**
 * Hook para enviar mensagem de áudio
 */
export function useSendAudioMessage() {
  const [isSending, setIsSending] = useState(false);

  const sendAudio = useCallback(async (to: string, text: string) => {
    setIsSending(true);
    try {
      const result = await sendAudioMessage(to, text);
      return result;
    } finally {
      setIsSending(false);
    }
  }, []);

  return {
    sendAudio,
    isSending,
  };
}

/**
 * Hook para processar mensagem recebida
 */
export function useReceiveWhatsAppMessage() {
  const [isProcessing, setIsProcessing] = useState(false);

  const receiveMessage = useCallback(async (
    from: string,
    message: string,
    type: 'text' | 'audio' = 'text'
  ) => {
    setIsProcessing(true);
    try {
      const result = await receiveWhatsAppMessage(from, message, type);
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    receiveMessage,
    isProcessing,
  };
}

/**
 * Hook para estatísticas do WhatsApp
 */
export function useWhatsAppStats() {
  const [stats, setStats] = useState({
    totalMessages: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('whatsapp_messages')
        .select('status');

      if (error) {
        setStats({ totalMessages: 0, sent: 0, delivered: 0, read: 0, failed: 0 });
        return;
      }

      const messages = data || [];
      setStats({
        totalMessages: messages.length,
        sent: messages.filter((m: any) => m.status === 'sent').length,
        delivered: messages.filter((m: any) => m.status === 'delivered').length,
        read: messages.filter((m: any) => m.status === 'read').length,
        failed: messages.filter((m: any) => m.status === 'failed').length,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, []);

  return {
    stats,
    loadStats,
  };
}

/**
 * Hook para chat com WhatsApp
 */
export function useWhatsAppChat(clientId?: string) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const { sendMessage, isSending } = useSendWhatsApp();
  const { data: history } = useWhatsAppHistory(clientId);

  // Carregar histórico
  useState(() => {
    if (history) {
      setMessages(history);
    }
  });

  const addMessage = useCallback((message: WhatsAppMessage) => {
    setMessages(prev => [message, ...prev]);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    clearChat,
    isSending,
    hasHistory: history && history.length > 0,
  };
}