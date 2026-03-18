/**
 * Serviço de Reativação de Clientes
 * Automação inteligente para reativar clientes inativos
 */

import { supabase } from "@/integrations/supabase/client";
import { sendWhatsAppMessage } from "./whatsappService";
import { processarMensagemAprimorada } from "./aiEnhancedService";
import { saveConversation } from "./aiMemoryService";

export interface InactiveClient {
  id: string;
  user_id: string;
  name: string;
  whatsapp: string;
  email: string;
  last_visit: Date;
  days_inactive: number;
  total_visits: number;
  average_ticket: number;
  favorite_service?: string;
}

export interface ReactivationCampaign {
  id: string;
  name: string;
  target_days_inactive: number;
  message_template: string;
  enabled: boolean;
  created_at: Date;
}

/**
 * Buscar clientes inativos
 */
export async function getInactiveClients(
  daysInactive: number = 15,
  limit: number = 100
): Promise<InactiveClient[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('client_user_id, scheduled_at, services(price)')
      .eq('status', 'completed')
      .lte('scheduled_at', cutoffDate.toISOString())
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clientes inativos:', error);
      return [];
    }

    // Agrupar por cliente
    const clientMap = new Map<string, any>();
    
    appointments?.forEach((apt: any) => {
      if (!apt.client_user_id) return;
      
      if (!clientMap.has(apt.client_user_id)) {
        clientMap.set(apt.client_user_id, {
          user_id: apt.client_user_id,
          visits: [],
          total_spent: 0,
        });
      }
      
      const client = clientMap.get(apt.client_user_id);
      client.visits.push(new Date(apt.scheduled_at));
      if (apt.services?.price) {
        client.total_spent += apt.services.price;
      }
    });

    // Buscar dados dos clientes
    const inactiveClients: InactiveClient[] = [];
    
    for (const [userId, data] of clientMap.entries()) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, whatsapp, email')
        .eq('user_id', userId)
        .single();

      if (!profile) continue;

      const lastVisit = data.visits[0];
      const daysInactive = Math.floor(
        (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysInactive >= daysInactive) {
        inactiveClients.push({
          id: profile.id,
          user_id: userId,
          name: profile.name,
          whatsapp: profile.whatsapp,
          email: profile.email,
          last_visit: lastVisit,
          days_inactive: daysInactive,
          total_visits: data.visits.length,
          average_ticket: data.total_spent / data.visits.length,
        });
      }
    }

    return inactiveClients.slice(0, limit);
  } catch (error) {
    console.error('Erro ao buscar clientes inativos:', error);
    return [];
  }
}

/**
 * Gerar mensagem personalizada de reativação
 */
export function generateReactivationMessage(client: InactiveClient): string {
  const messages = [
    `👋 Olá ${client.name}! Sentimos sua falta! Faz ${client.days_inactive} dias que você não vem. Que tal agendar um retorno? 💈`,
    `😊 ${client.name}, você é um cliente especial! Temos uma surpresa para você. Volte em breve! 🎁`,
    `🎯 ${client.name}, baseado no seu histórico, você gosta muito de nossos serviços. Que tal agendar agora? ✂️`,
    `💰 ${client.name}, temos desconto especial para clientes que retornam! Aproveite! 🏷️`,
    `📅 ${client.name}, sua agenda está vazia! Que tal marcar um horário conosco? 📱`,
  ];

  // Selecionar mensagem baseada no perfil
  if (client.days_inactive > 30) {
    return messages[1]; // Mensagem mais agressiva
  } else if (client.average_ticket > 100) {
    return messages[2]; // Mensagem personalizada
  } else if (client.total_visits > 10) {
    return messages[3]; // Desconto para cliente frequente
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Enviar mensagem de reativação via WhatsApp
 */
export async function sendReactivationMessage(
  client: InactiveClient,
  customMessage?: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const message = customMessage || generateReactivationMessage(client);

    // Enviar via WhatsApp
    const result = await sendWhatsAppMessage(client.whatsapp, message);

    if (result.success) {
      // Salvar na memória da IA
      await saveConversation(
        client.user_id,
        'reactivation_message_sent',
        message,
        'reactivation_campaign',
        {
          client_id: client.id,
          days_inactive: client.days_inactive,
          timestamp: new Date().toISOString(),
        }
      );

      // Registrar no banco de dados
      await supabase.from('reactivation_campaigns_log').insert({
        client_id: client.id,
        message: message,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    }

    return result;
  } catch (error) {
    console.error('Erro ao enviar mensagem de reativação:', error);
    return { success: false };
  }
}

/**
 * Executar campanha de reativação
 */
export async function runReactivationCampaign(
  daysInactive: number = 15,
  limit: number = 50
): Promise<{
  total: number;
  sent: number;
  failed: number;
}> {
  try {
    const inactiveClients = await getInactiveClients(daysInactive, limit);
    
    let sent = 0;
    let failed = 0;

    for (const client of inactiveClients) {
      const result = await sendReactivationMessage(client);
      
      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      total: inactiveClients.length,
      sent,
      failed,
    };
  } catch (error) {
    console.error('Erro ao executar campanha de reativação:', error);
    return { total: 0, sent: 0, failed: 0 };
  }
}

/**
 * Agendar campanha de reativação automática
 */
export async function scheduleReactivationCampaign(
  daysInactive: number = 15,
  intervalHours: number = 24
): Promise<void> {
  try {
    // Executar imediatamente
    await runReactivationCampaign(daysInactive);

    // Agendar para executar periodicamente
    setInterval(async () => {
      await runReactivationCampaign(daysInactive);
    }, intervalHours * 60 * 60 * 1000);

    console.log(`✅ Campanha de reativação agendada a cada ${intervalHours} horas`);
  } catch (error) {
    console.error('Erro ao agendar campanha de reativação:', error);
  }
}

/**
 * Obter estatísticas de reativação
 */
export async function getReactivationStats(): Promise<{
  total_campaigns: number;
  total_sent: number;
  total_successful: number;
  success_rate: number;
  avg_response_time: number;
}> {
  try {
    const { data: logs, error } = await supabase
      .from('reactivation_campaigns_log')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total_campaigns: 0,
        total_sent: 0,
        total_successful: 0,
        success_rate: 0,
        avg_response_time: 0,
      };
    }

    const totalSent = logs?.length || 0;
    const totalSuccessful = logs?.filter((l: any) => l.status === 'sent').length || 0;
    const successRate = totalSent > 0 ? (totalSuccessful / totalSent) * 100 : 0;

    return {
      total_campaigns: totalSent,
      total_sent: totalSent,
      total_successful: totalSuccessful,
      success_rate: Math.round(successRate),
      avg_response_time: 0, // Será calculado quando houver respostas
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      total_campaigns: 0,
      total_sent: 0,
      total_successful: 0,
      success_rate: 0,
      avg_response_time: 0,
    };
  }
}

/**
 * Rastrear resposta de cliente reativado
 */
export async function trackReactivationResponse(
  clientId: string,
  responseType: 'scheduled' | 'declined' | 'no_response'
): Promise<void> {
  try {
    await supabase
      .from('reactivation_campaigns_log')
      .update({
        response_type: responseType,
        responded_at: new Date().toISOString(),
      })
      .eq('client_id', clientId)
      .order('sent_at', { ascending: false })
      .limit(1);
  } catch (error) {
    console.error('Erro ao rastrear resposta:', error);
  }
}
