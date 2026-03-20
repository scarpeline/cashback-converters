// Message Report Service
// Relatórios de envios e custos de mensagens

import { supabase } from '@/integrations/supabase/client';

export interface MessageUsage {
  id: string;
  barbershop_id: string;
  whatsapp_account_id: string;
  professional_id?: string;
  recipient_phone: string;
  message_type: string;
  message_content?: string;
  template_id?: string;
  twilio_message_sid?: string;
  twilio_status?: string;
  cost_per_message: number;
  total_cost: number;
  owner_cost_share: number;
  professional_cost_share: number;
  split_percentage_owner: number;
  split_percentage_professional: number;
  automation_type?: string;
  campaign_id?: string;
  created_at: string;
  sent_at?: string;
}

export interface MessageReportSummary {
  period: string;
  total_sent: number;
  total_cost: number;
  owner_cost: number;
  professional_cost: number;
  by_type: Record<string, { count: number; cost: number }>;
  by_account: Record<string, { count: number; cost: number }>;
  by_professional: Record<string, { count: number; cost: number }>;
  success_rate: number;
}

export interface DailyUsage {
  date: string;
  messages_sent: number;
  total_cost: number;
}

export async function logMessageUsage(params: {
  barbershopId: string;
  whatsappAccountId: string;
  professionalId?: string;
  recipientPhone: string;
  messageType: string;
  messageContent?: string;
  templateId?: string;
  costPerMessage: number;
  totalCost: number;
  ownerCostShare: number;
  professionalCostShare: number;
  twilioMessageSid?: string;
  twilioStatus?: string;
  automationType?: string;
  campaignId?: string;
  errorMessage?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('message_usage')
      .insert({
        barbershop_id: params.barbershopId,
        whatsapp_account_id: params.whatsappAccountId,
        professional_id: params.professionalId || null,
        recipient_phone: params.recipientPhone,
        message_type: params.messageType,
        message_content: params.messageContent ? params.messageContent.substring(0, 1000) : null,
        template_id: params.templateId || null,
        twilio_message_sid: params.twilioMessageSid || null,
        twilio_status: params.twilioStatus || 'pending',
        cost_per_message: params.costPerMessage,
        total_cost: params.totalCost,
        owner_cost_share: params.ownerCostShare,
        professional_cost_share: params.professionalCostShare,
        split_percentage_owner: params.professionalId ? Math.round((params.ownerCostShare / params.totalCost) * 100) : 100,
        split_percentage_professional: params.professionalId ? Math.round((params.professionalCostShare / params.totalCost) * 100) : 0,
        automation_type: params.automationType || null,
        campaign_id: params.campaignId || null,
        sent_at: params.twilioStatus === 'sent' || params.twilioStatus === 'delivered' ? new Date().toISOString() : null,
      });

    if (error) {
      console.error('Erro ao registrar uso de mensagem:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao registrar uso:', error);
    return false;
  }
}

export async function getMessageUsage(
  barbershopId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    professionalId?: string;
    whatsappAccountId?: string;
    messageType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: MessageUsage[]; total: number }> {
  try {
    let query = supabase
      .from('message_usage')
      .select('*', { count: 'exact' })
      .eq('barbershop_id', barbershopId);

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }
    if (options?.professionalId) {
      query = query.eq('professional_id', options.professionalId);
    }
    if (options?.whatsappAccountId) {
      query = query.eq('whatsapp_account_id', options.whatsappAccountId);
    }
    if (options?.messageType) {
      query = query.eq('message_type', options.messageType);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return { data: data || [], total: count || 0 };
  } catch (error) {
    console.error('Erro ao buscar uso de mensagens:', error);
    return { data: [], total: 0 };
  }
}

export async function getReportSummary(
  barbershopId: string,
  startDate: Date,
  endDate: Date
): Promise<MessageReportSummary> {
  try {
    const { data, error } = await supabase
      .from('message_usage')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const messages = data || [];

    const byType: Record<string, { count: number; cost: number }> = {};
    const byAccount: Record<string, { count: number; cost: number }> = {};
    const byProfessional: Record<string, { count: number; cost: number }> = {};

    let totalCost = 0;
    let ownerCost = 0;
    let professionalCost = 0;
    let successful = 0;

    for (const msg of messages) {
      totalCost += msg.total_cost || 0;
      ownerCost += msg.owner_cost_share || 0;
      professionalCost += msg.professional_cost_share || 0;

      if (msg.twilio_status === 'sent' || msg.twilio_status === 'delivered') {
        successful++;
      }

      if (!byType[msg.message_type]) {
        byType[msg.message_type] = { count: 0, cost: 0 };
      }
      byType[msg.message_type].count++;
      byType[msg.message_type].cost += msg.total_cost || 0;

      if (!byAccount[msg.whatsapp_account_id]) {
        byAccount[msg.whatsapp_account_id] = { count: 0, cost: 0 };
      }
      byAccount[msg.whatsapp_account_id].count++;
      byAccount[msg.whatsapp_account_id].cost += msg.total_cost || 0;

      if (msg.professional_id) {
        if (!byProfessional[msg.professional_id]) {
          byProfessional[msg.professional_id] = { count: 0, cost: 0 };
        }
        byProfessional[msg.professional_id].count++;
        byProfessional[msg.professional_id].cost += msg.professional_cost_share || 0;
      }
    }

    return {
      period: `${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`,
      total_sent: messages.length,
      total_cost: Number(totalCost.toFixed(2)),
      owner_cost: Number(ownerCost.toFixed(2)),
      professional_cost: Number(professionalCost.toFixed(2)),
      by_type: byType,
      by_account: byAccount,
      by_professional: byProfessional,
      success_rate: messages.length > 0 ? Math.round((successful / messages.length) * 100) : 0,
    };
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return {
      period: '',
      total_sent: 0,
      total_cost: 0,
      owner_cost: 0,
      professional_cost: 0,
      by_type: {},
      by_account: {},
      by_professional: {},
      success_rate: 0,
    };
  }
}

export async function getDailyUsage(
  barbershopId: string,
  days: number = 30
): Promise<DailyUsage[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('message_usage')
      .select('created_at, total_cost')
      .eq('barbershop_id', barbershopId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const dailyMap: Record<string, { messages: number; cost: number }> = {};

    for (const msg of data || []) {
      const date = msg.created_at.split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { messages: 0, cost: 0 };
      }
      dailyMap[date].messages++;
      dailyMap[date].cost += msg.total_cost || 0;
    }

    return Object.entries(dailyMap).map(([date, values]) => ({
      date,
      messages_sent: values.messages,
      total_cost: Number(values.cost.toFixed(2)),
    }));
  } catch (error) {
    console.error('Erro ao buscar uso diário:', error);
    return [];
  }
}

export async function getTopRecipients(
  barbershopId: string,
  limit: number = 10
): Promise<{ phone: string; count: number; last_sent: string }[]> {
  try {
    const { data, error } = await supabase
      .from('message_usage')
      .select('recipient_phone, created_at')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const recipientMap: Record<string, { count: number; last_sent: string }> = {};

    for (const msg of data || []) {
      if (!recipientMap[msg.recipient_phone]) {
        recipientMap[msg.recipient_phone] = { count: 0, last_sent: msg.created_at };
      }
      recipientMap[msg.recipient_phone].count++;
    }

    return Object.entries(recipientMap)
      .map(([phone, values]) => ({
        phone,
        count: values.count,
        last_sent: values.last_sent,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Erro ao buscar principais destinatários:', error);
    return [];
  }
}

export async function getCampaignReport(
  campaignId: string
): Promise<{
  total: number;
  sent: number;
  failed: number;
  total_cost: number;
  by_status: Record<string, number>;
}> {
  try {
    const { data, error } = await supabase
      .from('message_usage')
      .select('twilio_status, total_cost')
      .eq('campaign_id', campaignId);

    if (error) throw error;

    const stats = {
      total: 0,
      sent: 0,
      failed: 0,
      total_cost: 0,
      by_status: {} as Record<string, number>,
    };

    for (const msg of data || []) {
      stats.total++;
      stats.total_cost += msg.total_cost || 0;

      const status = msg.twilio_status || 'unknown';
      stats.by_status[status] = (stats.by_status[status] || 0) + 1;

      if (status === 'sent' || status === 'delivered') {
        stats.sent++;
      } else if (status === 'failed') {
        stats.failed++;
      }
    }

    return stats;
  } catch (error) {
    console.error('Erro ao buscar relatório de campanha:', error);
    return { total: 0, sent: 0, failed: 0, total_cost: 0, by_status: {} };
  }
}

export async function exportMessageUsage(
  barbershopId: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('message_usage')
      .select(`
        created_at,
        recipient_phone,
        message_type,
        total_cost,
        owner_cost_share,
        professional_cost_share,
        twilio_status,
        automation_type
      `)
      .eq('barbershop_id', barbershopId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const headers = ['Data', 'Telefone', 'Tipo', 'Custo Total', 'Custo Dono', 'Custo Profissional', 'Status', 'Automação'];
    const rows = (data || []).map(msg => [
      msg.created_at,
      msg.recipient_phone,
      msg.message_type,
      msg.total_cost?.toFixed(2) || '0.00',
      msg.owner_cost_share?.toFixed(2) || '0.00',
      msg.professional_cost_share?.toFixed(2) || '0.00',
      msg.twilio_status || 'unknown',
      msg.automation_type || '-',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  } catch (error) {
    console.error('Erro ao exportar uso:', error);
    return '';
  }
}
