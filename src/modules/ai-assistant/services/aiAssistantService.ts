/**
 * Módulo IA Assistant — Service
 * Interpreta linguagem natural e gerencia agendamentos via WhatsApp
 */

import { supabase } from '@/integrations/supabase/client';
import type { AIIntentType, AIConversationState, AIConversationContext, AvailableSlot } from '../types';

// ==================== DETECÇÃO DE INTENÇÃO ====================

const INTENT_PATTERNS: Record<AIIntentType, RegExp[]> = {
  AGENDAR_SERVICO: [
    /\b(marcar|agendar|quero|gostaria|preciso)\b.*\b(corte|barba|servi[cç]o|hor[aá]rio|sess[aã]o)\b/i,
    /\b(marcar|agendar)\b/i,
    /\b(quero)\b.*\b(hor[aá]rio)\b/i,
    /\btem\b.*\b(hor[aá]rio|vaga)\b/i,
  ],
  CANCELAR_AGENDAMENTO: [
    /\b(cancelar|desmarcar|desistir)\b/i,
    /\b(n[aã]o)\b.*\b(ir|posso|vou|quero)\b/i,
  ],
  REMARCAR_AGENDAMENTO: [
    /\b(remarcar|reagendar|trocar|mudar)\b.*\b(hor[aá]rio|data|dia)\b/i,
    /\b(adiar|antecipar)\b/i,
  ],
  CONSULTAR_HORARIO: [
    /\b(hor[aá]rio|disponib|vagas?)\b/i,
    /\b(quando|que horas?)\b/i,
    /\b(agenda|dispon[ií]vel)\b/i,
  ],
  CONSULTAR_PRECO: [
    /\b(pre[cç]o|valor|quanto|custa)\b/i,
    /\b(tabela|lista)\b.*\b(pre[cç]o|servi[cç]o)\b/i,
  ],
  FALAR_COM_ATENDENTE: [
    /\b(atendente|humano|pessoa|falar com algu[eé]m)\b/i,
    /\b(ajuda|suporte|atendimento)\b/i,
  ],
  DESCONHECIDO: [],
};

export function detectIntent(message: string): { intent: AIIntentType; confidence: number } {
  const normalizedMsg = message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS) as [AIIntentType, RegExp[]][]) {
    if (intent === 'DESCONHECIDO') continue;
    
    for (const pattern of patterns) {
      if (pattern.test(normalizedMsg)) {
        return { intent, confidence: 0.85 };
      }
    }
  }

  return { intent: 'DESCONHECIDO', confidence: 0 };
}

// ==================== CONSULTA DE DISPONIBILIDADE ====================

export async function getAvailableSlots(params: {
  barbershopId: string;
  serviceId?: string;
  professionalId?: string;
  date?: string;
}): Promise<AvailableSlot[]> {
  const { barbershopId, serviceId, professionalId, date } = params;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // Buscar profissionais ativos
    let proQuery = supabase
      .from('professionals')
      .select('id, name')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true);

    if (professionalId) {
      proQuery = proQuery.eq('id', professionalId);
    }

    const { data: professionals, error: proError } = await proQuery;
    if (proError || !professionals?.length) return [];

    // Buscar agendamentos existentes no dia
    const dayStart = `${targetDate}T00:00:00`;
    const dayEnd = `${targetDate}T23:59:59`;

    const { data: appointments } = await supabase
      .from('appointments')
      .select('professional_id, scheduled_at, service_id')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .in('status', ['scheduled', 'confirmed']);

    // Buscar duração do serviço
    let serviceDuration = 30;
    if (serviceId) {
      const { data: service } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', serviceId)
        .single();
      if (service) serviceDuration = service.duration_minutes;
    }

    // Gerar slots disponíveis (8h-20h, intervalo = duração do serviço)
    const slots: AvailableSlot[] = [];
    const bookedSlots = new Set(
      (appointments || []).map(a => `${a.professional_id}-${new Date(a.scheduled_at).getHours()}:${String(new Date(a.scheduled_at).getMinutes()).padStart(2, '0')}`)
    );

    for (const pro of professionals) {
      for (let hour = 8; hour < 20; hour++) {
        for (let min = 0; min < 60; min += serviceDuration) {
          const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
          const slotKey = `${pro.id}-${hour}:${String(min).padStart(2, '0')}`;

          if (!bookedSlots.has(slotKey)) {
            slots.push({
              professional_id: pro.id,
              professional_name: pro.name,
              date: targetDate,
              time: timeStr,
              duration_minutes: serviceDuration,
            });
          }
        }
      }
    }

    return slots;
  } catch (err) {
    console.error('[AIAssistant] Erro ao buscar disponibilidade:', err);
    return [];
  }
}

// ==================== CRIAÇÃO DE AGENDAMENTO ====================

export async function createAIBooking(params: {
  barbershopId: string;
  professionalId: string;
  serviceId: string;
  clientPhone: string;
  clientName?: string;
  scheduledAt: string;
}): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  const { barbershopId, professionalId, serviceId, clientPhone, clientName, scheduledAt } = params;

  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        barbershop_id: barbershopId,
        professional_id: professionalId,
        service_id: serviceId,
        client_whatsapp: clientPhone,
        client_name: clientName || clientPhone,
        scheduled_at: scheduledAt,
        status: 'scheduled',
        notes: 'Agendado via IA WhatsApp',
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, appointmentId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==================== CANCELAMENTO ====================

export async function cancelAIBooking(appointmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', notes: 'Cancelado via IA WhatsApp' })
      .eq('id', appointmentId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==================== GERAÇÃO DE RESPOSTA ====================

export function generateResponse(state: AIConversationState, context: AIConversationContext, slots?: AvailableSlot[]): string {
  switch (state) {
    case 'awaiting_service':
      return '🔸 Qual serviço você deseja? (Ex: corte, barba, coloração…)';
    
    case 'awaiting_professional':
      return '🔸 Tem preferência por algum profissional? Ou pode ser qualquer um disponível?';
    
    case 'awaiting_date':
      return '🔸 Qual data? (Ex: hoje, amanhã, segunda, 15/04…)';
    
    case 'awaiting_time':
      if (slots && slots.length > 0) {
        const timeList = slots.slice(0, 6).map(s => `  ▪ ${s.time} - ${s.professional_name}`).join('\n');
        return `✅ Horários disponíveis:\n\n${timeList}\n\n🔸 Qual horário prefere?`;
      }
      return '❌ Não encontramos horários disponíveis nesta data. Gostaria de tentar outra data?';
    
    case 'awaiting_confirmation': {
      const confirmMsg = `📋 *Confirmação do Agendamento*\n\n` +
        `🔹 Serviço: ${context.service_name || 'N/D'}\n` +
        `🔹 Profissional: ${context.professional_name || 'N/D'}\n` +
        `🔹 Data: ${context.selected_date || 'N/D'}\n` +
        `🔹 Hora: ${context.selected_time || 'N/D'}\n\n` +
        `Confirma? (sim/não)`;
      return confirmMsg;
    }
    
    case 'completed':
      return `✅ Agendamento confirmado!\n\n` +
        `📌 Serviço: ${context.service_name}\n` +
        `👤 Profissional: ${context.professional_name}\n` +
        `📅 Data: ${context.selected_date}\n` +
        `⏰ Hora: ${context.selected_time}\n\n` +
        `Enviaremos um lembrete antes do horário. 😊`;
    
    case 'transferred_to_human':
      return '🔄 Transferindo para um atendente. Aguarde um momento…';
    
    case 'cancelled':
      return '✅ Agendamento cancelado com sucesso.';
    
    default:
      return '👋 Olá! Sou o assistente virtual. Como posso ajudar?\n\n' +
        '▪ Agendar serviço\n▪ Consultar horários\n▪ Consultar preços\n▪ Cancelar agendamento\n▪ Remarcar agendamento';
  }
}

// ==================== LOGGING DE INTERAÇÃO ====================

export async function logAIInteraction(interaction: {
  barbershop_id: string;
  client_phone: string;
  intent: AIIntentType;
  input_text: string;
  response_text: string;
  success: boolean;
  processing_time_ms: number;
}): Promise<void> {
  try {
    await supabase.from('ai_interactions' as any).insert(interaction);
  } catch (err) {
    console.warn('[AIAssistant] Erro ao logar interação:', err);
  }
}
