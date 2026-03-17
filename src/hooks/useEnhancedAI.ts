// Hook para IA aprimorada com memória
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  processEnhancedAI, 
  generateProactiveSuggestion,
  analyzeConversationPatterns,
  needsReactivation,
  type EnhancedAISuggestion 
} from '@/services/aiEnhancedService';
import { getClientHistory, getAIStats } from '@/services/aiMemoryService';

// Chaves de query para cache
export const aiKeys = {
  all: ['ai'] as const,
  conversation: (clientId: string) => [...aiKeys.all, 'conversation', clientId] as const,
  history: (clientId: string) => [...aiKeys.all, 'history', clientId] as const,
  patterns: (clientId: string) => [...aiKeys.all, 'patterns', clientId] as const,
  reactivation: (clientId: string) => [...aiKeys.all, 'reactivation', clientId] as const,
  stats: () => [...aiKeys.all, 'stats'] as const,
};

/**
 * Hook para processar mensagem com IA aprimorada
 */
export function useEnhancedAI(clientId?: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<EnhancedAISuggestion | null>(null);
  
  const processMessage = useCallback(async (
    message: string,
    clientName?: string
  ): Promise<EnhancedAISuggestion> => {
    if (!clientId) {
      throw new Error('Client ID é necessário para usar IA aprimorada');
    }
    
    setIsProcessing(true);
    try {
      const response = await processEnhancedAI(clientId, message, clientName);
      setLastResponse(response);
      return response;
    } finally {
      setIsProcessing(false);
    }
  }, [clientId]);
  
  return {
    processMessage,
    isProcessing,
    lastResponse,
  };
}

/**
 * Hook para buscar histórico de conversas do cliente
 */
export function useAIHistory(clientId?: string) {
  return useQuery({
    queryKey: aiKeys.history(clientId || ''),
    queryFn: () => getClientHistory(clientId || '', 20),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para gerar sugestão proativa
 */
export function useProactiveSuggestion(clientId?: string) {
  return useQuery({
    queryKey: aiKeys.conversation(clientId || ''),
    queryFn: () => generateProactiveSuggestion(clientId || ''),
    enabled: !!clientId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para analisar padrões de conversa
 */
export function useConversationPatterns(clientId?: string) {
  return useQuery({
    queryKey: aiKeys.patterns(clientId || ''),
    queryFn: () => analyzeConversationPatterns(clientId || ''),
    enabled: !!clientId,
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

/**
 * Hook para verificar necessidade de reativação
 */
export function useReactivationCheck(clientId?: string) {
  return useQuery({
    queryKey: aiKeys.reactivation(clientId || ''),
    queryFn: () => needsReactivation(clientId || ''),
    enabled: !!clientId,
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
  });
}

/**
 * Hook para estatísticas da IA
 */
export function useAIStats() {
  return useQuery({
    queryKey: aiKeys.stats(),
    queryFn: getAIStats,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para chat com IA aprimorada
 */
export function useAIChat(clientId?: string) {
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    personalized?: boolean;
  }>>([]);
  
  const { processMessage, isProcessing } = useEnhancedAI(clientId);
  const { data: history } = useAIHistory(clientId);
  
  // Carregar histórico quando disponível
  useState(() => {
    if (history && history.length > 0) {
      const historyMessages = history.map(item => ({
        id: item.id,
        text: item.message,
        sender: 'user' as const,
        timestamp: new Date(item.created_at),
      }));
      setMessages(historyMessages.slice(0, 10));
    }
  });
  
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !clientId) return;
    
    // Adicionar mensagem do usuário
    const userMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Processar com IA
      const response = await processMessage(text);
      
      // Adicionar resposta da IA
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai' as const,
        timestamp: new Date(),
        personalized: response.personalized,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      return response;
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Mensagem de erro
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        sender: 'ai' as const,
        timestamp: new Date(),
        personalized: false,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      throw error;
    }
  }, [clientId, processMessage]);
  
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);
  
  return {
    messages,
    sendMessage,
    clearChat,
    isProcessing,
    hasHistory: history && history.length > 0,
  };
}

/**
 * Hook para dashboard de IA
 */
export function useAIDashboard() {
  const { data: stats, isLoading: statsLoading } = useAIStats();
  
  const dashboardData = {
    stats: {
      totalConversations: stats?.total_conversations || 0,
      uniqueClients: stats?.unique_clients || 0,
      mostCommonIntent: stats?.most_common_intent || 'unknown',
    },
    isLoading: statsLoading,
  };
  
  return dashboardData;
}