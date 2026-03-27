// Serviço de memória da IA - Versão simplificada e segura
import { supabase } from "@/integrations/supabase/client";

export interface AIMemory {
  id: string;
  client_id: string;
  message: string;
  response: string;
  intent?: string;
  metadata?: any;
  created_at: string;
}

export interface ClientPreferences {
  total_visits: number;
  average_ticket: number;
  favorite_service?: string;
  last_visit?: Date;
  visit_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'occasional';
}

/**
 * Salvar conversa na memória da IA
 */
export async function saveConversation(
  clientId: string,
  message: string,
  response: string,
  intent?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('ai_memory')
      .insert({
        client_id: clientId,
        message: message.substring(0, 500), // Limitar tamanho
        response: response.substring(0, 1000), // Limitar tamanho
        intent: intent || 'unknown',
        metadata: metadata || {}
      });

    if (error) {
      console.error('Erro ao salvar na memória:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar conversa:', error);
    return false;
  }
}

/**
 * Buscar histórico de conversas do cliente
 */
export async function getClientHistory(
  clientId: string,
  limit: number = 10
): Promise<AIMemory[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('ai_memory')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
}

/**
 * Analisar preferências do cliente
 */
export async function analyzeClientPreferences(clientId: string): Promise<ClientPreferences> {
  try {
    // Buscar histórico do cliente
    const history = await getClientHistory(clientId, 50);
    
    // Buscar agendamentos do cliente (se houver tabela de agendamentos)
    const { data: appointments } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('client_user_id', clientId)
      .order('scheduled_at', { ascending: false });

    const preferences: ClientPreferences = {
      total_visits: appointments?.length || 0,
      average_ticket: 0,
      favorite_service: undefined,
      last_visit: undefined,
      visit_frequency: 'occasional'
    };

    // Cálculos básicos (em produção, calcularia valores reais)
    if (appointments && appointments.length > 0) {
      // Aqui você implementaria a lógica para calcular:
      // - Ticket médio
      // - Serviço favorito
      // - Frequência de visitas
      // - Última visita
    }

    return preferences;
  } catch (error) {
    console.error('Erro ao analisar preferências:', error);
    return {
      total_visits: 0,
      average_ticket: 0,
      favorite_service: undefined,
      last_visit: undefined,
      visit_frequency: 'occasional'
    };
  }
}

/**
 * Detectar intenção da mensagem (simplificado)
 */
export function detectIntent(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('horário') || msg.includes('horario') || msg.includes('agenda')) {
    return 'check_schedule';
  }
  if (msg.includes('preço') || msg.includes('valor') || msg.includes('quanto custa')) {
    return 'check_price';
  }
  if (msg.includes('agendar') || msg.includes('marcar') || msg.includes('marcação')) {
    return 'schedule_appointment';
  }
  if (msg.includes('cancelar') || msg.includes('desmarcar')) {
    return 'cancel_appointment';
  }
  if (msg.includes('serviço') || msg.includes('servico') || msg.includes('corte') || msg.includes('barba')) {
    return 'service_info';
  }
  if (msg.includes('ola') || msg.includes('oi') || msg.includes('olá') || msg.includes('bom dia') || msg.includes('boa tarde') || msg.includes('boa noite')) {
    return 'greeting';
  }
  
  return 'general_inquiry';
}

/**
 * Buscar respostas similares no histórico
 */
export async function findSimilarResponse(
  clientId: string,
  message: string
): Promise<string | null> {
  try {
    const history = await getClientHistory(clientId, 20);
    
    // Buscar mensagens similares no histórico
    const similar = history.find(item => 
      item.message.toLowerCase().includes(message.toLowerCase().substring(0, 20)) ||
      message.toLowerCase().includes(item.message.toLowerCase().substring(0, 20))
    );
    
    return similar?.response || null;
  } catch (error) {
    console.error('Erro ao buscar respostas similares:', error);
    return null;
  }
}

/**
 * Limpar histórico antigo (manutenção)
 */
export async function cleanupOldMemories(daysToKeep: number = 90): Promise<void> {
  try {
    const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const { error } = await (supabase as any)
      .from('ai_memory')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Erro ao limpar histórico antigo:', error);
    }
  } catch (error) {
    console.error('Erro na limpeza do histórico:', error);
  }
}

/**
 * Obter estatísticas de uso da IA
 */
export async function getAIStats(): Promise<{
  total_conversations: number;
  unique_clients: number;
  most_common_intent: string;
}> {
  try {
    // Contar conversas totais
    const { count: totalConversations, error: countError } = await (supabase as any)
      .from('ai_memory')
      .select('*', { count: 'exact', head: true });

    // Contar clientes únicos
    const { data: uniqueClients, error: clientError } = await (supabase as any)
      .from('ai_memory')
      .select('client_id')
      .limit(1000);

    // Intenção mais comum (simplificado)
    const { data: intents } = await (supabase as any)
      .from('ai_memory')
      .select('intent')
      .not('intent', 'is', null)
      .limit(100);

    const intentCount: Record<string, number> = {};
    intents?.forEach(item => {
      if (item.intent) {
        intentCount[item.intent] = (intentCount[item.intent] || 0) + 1;
      }
    });

    let mostCommonIntent = 'general_inquiry';
    let maxCount = 0;
    for (const [intent, count] of Object.entries(intentCount)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonIntent = intent;
      }
    }

    return {
      total_conversations: totalConversations || 0,
      unique_clients: new Set(uniqueClients?.map(c => c.client_id)).size,
      most_common_intent: mostCommonIntent
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      total_conversations: 0,
      unique_clients: 0,
      most_common_intent: 'unknown'
    };
  }
}