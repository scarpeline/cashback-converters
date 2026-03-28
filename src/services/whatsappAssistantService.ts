/**
 * WhatsApp AI Assistant — Orquestrador Principal
 * 
 * Conecta serviços existentes para atendimento automatizado via WhatsApp:
 * - aiService.ts → detecção de intenção e sugestões
 * - aiAssistantService.ts → detecção avançada de intenção com regex
 * - schedulingService.ts → horários disponíveis e agendamento
 * - clientService.ts → busca/cadastro de clientes
 * - clientReactivationService.ts → reativação de inativos
 * - aiMemoryService.ts → histórico de conversas
 * - whatsAppAutomationService.ts → envio de mensagens
 * - paymentService.ts → geração de cobranças
 */

import { supabase } from '@/integrations/supabase/client';
import { getClientByWhatsApp, createClient } from './clientService';
import { getAvailableSlots, createAppointment } from './schedulingService';
import { saveConversation, getClientHistory, analyzeClientPreferences } from './aiMemoryService';
import { sendAutomationMessage } from './whatsAppAutomationService';
import { detectIntent } from '@/modules/ai-assistant/services/aiAssistantService';
import type { AIIntentType } from '@/modules/ai-assistant/types';

// ==================== TIPOS ====================

export interface ConversationState {
  id: string;
  barbershop_id: string;
  client_phone: string;
  client_id?: string;
  client_name?: string;
  current_step: ConversationStep;
  intent?: AIIntentType;
  context: ConversationContext;
  last_message_at: string;
  created_at: string;
}

type ConversationStep =
  | 'idle'
  | 'greeting'
  | 'awaiting_service'
  | 'awaiting_date'
  | 'awaiting_time'
  | 'awaiting_confirmation'
  | 'awaiting_cancel_confirm'
  | 'completed';

interface ConversationContext {
  service_id?: string;
  service_name?: string;
  professional_id?: string;
  professional_name?: string;
  selected_date?: string;
  selected_time?: string;
  available_slots?: string[];
  personality?: 'formal' | 'friendly' | 'premium';
}

interface AssistantResponse {
  message: string;
  action?: 'none' | 'booked' | 'cancelled' | 'payment_sent' | 'reactivation';
  data?: Record<string, unknown>;
}

// ==================== ESTADO DA CONVERSA ====================

async function getConversationState(barbershopId: string, phone: string): Promise<ConversationState | null> {
  const fiveMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30min timeout
  const { data } = await (supabase as any)
    .from('ai_conversation_states')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .eq('client_phone', phone)
    .gte('last_message_at', fiveMinAgo)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function upsertConversationState(state: Partial<ConversationState> & { barbershop_id: string; client_phone: string }): Promise<void> {
  await (supabase as any)
    .from('ai_conversation_states')
    .upsert({
      ...state,
      last_message_at: new Date().toISOString(),
    }, { onConflict: 'barbershop_id,client_phone' });
}

// ==================== BUSCA/CADASTRO DE CLIENTE ====================

async function ensureClient(barbershopId: string, phone: string, name?: string) {
  let client = await getClientByWhatsApp(phone);
  if (!client && name) {
    client = await createClient({
      barbershop_id: barbershopId,
      name,
      whatsapp: phone,
      email: '',
    });
  }
  return client;
}

// ==================== PERSONALIDADE ====================

function getGreeting(name: string, personality: string): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  
  switch (personality) {
    case 'formal':
      return `${period}, ${name}. Como posso ajudá-lo(a) hoje?`;
    case 'premium':
      return `${period}, ${name}! É um prazer atendê-lo(a). Em que posso ser útil?`;
    default:
      return `${period}, ${name}! 😊 Como posso te ajudar?`;
  }
}

function formatSlots(slots: string[], personality: string): string {
  if (slots.length === 0) {
    return personality === 'formal'
      ? 'Infelizmente não temos horários disponíveis nesta data. Gostaria de verificar outro dia?'
      : 'Poxa, não temos horários livres nesse dia 😕 Quer ver outro dia?';
  }
  const formatted = slots.slice(0, 5).map(s => `• ${s}`).join('\n');
  return personality === 'formal'
    ? `Temos os seguintes horários disponíveis:\n${formatted}\n\nQual horário o(a) senhor(a) prefere?`
    : `Temos esses horários:\n${formatted}\n\nQual prefere? 😄`;
}

// ==================== PROCESSADOR PRINCIPAL ====================

export async function processIncomingMessage(params: {
  barbershopId: string;
  clientPhone: string;
  clientName?: string;
  message: string;
  messageType?: 'text' | 'audio';
}): Promise<AssistantResponse> {
  const { barbershopId, clientPhone, message, messageType = 'text' } = params;

  try {
    // 1. Buscar config da barbearia (personalidade, serviços)
    const { data: config } = await (supabase as any)
      .from('ai_config')
      .select('personality, auto_booking, auto_register_client, auto_reactivation')
      .eq('barbershop_id', barbershopId)
      .maybeSingle();

    const personality = (config?.personality || 'friendly') as 'formal' | 'friendly' | 'premium';
    const autoBooking = config?.auto_booking !== false;
    const autoRegister = config?.auto_register_client !== false;

    // 2. Buscar/criar cliente
    const client = await ensureClient(
      barbershopId,
      clientPhone,
      autoRegister ? (params.clientName || 'Cliente') : undefined
    );
    const clientName = client?.name || params.clientName || 'Cliente';

    // 3. Buscar estado da conversa
    let state = await getConversationState(barbershopId, clientPhone);

    // 4. Detectar intenção
    const { intent, confidence } = detectIntent(message);

    // 5. Processar baseado no estado + intenção
    let response: AssistantResponse;

    if (!state || state.current_step === 'idle' || state.current_step === 'completed') {
      // Nova conversa
      response = await handleNewConversation(barbershopId, clientPhone, clientName, message, intent, personality, autoBooking);
    } else {
      // Conversa em andamento
      response = await handleOngoingConversation(state, message, intent, personality, barbershopId);
    }

    // 6. Salvar na memória
    await saveConversation(client?.id || clientPhone, message, response.message, intent);

    return response;
  } catch (error) {
    console.error('[AI_ASSISTANT] Erro ao processar mensagem:', error);
    return {
      message: 'Desculpe, tive um probleminha aqui. Pode repetir?',
      action: 'none',
    };
  }
}

// ==================== NOVA CONVERSA ====================

async function handleNewConversation(
  barbershopId: string, phone: string, name: string,
  message: string, intent: AIIntentType, personality: 'formal' | 'friendly' | 'premium', autoBooking: boolean
): Promise<AssistantResponse> {

  switch (intent) {
    case 'AGENDAR_SERVICO':
    case 'CONSULTAR_HORARIO': {
      // Buscar serviços disponíveis
      const { data: services } = await (supabase as any)
        .from('services').select('id, name, price, duration_minutes')
        .eq('barbershop_id', barbershopId).eq('is_active', true).order('name');

      if (!services || services.length === 0) {
        return { message: 'No momento não temos serviços cadastrados. Entre em contato diretamente.', action: 'none' };
      }

      const serviceList = services.map((s: any, i: number) => `${i + 1}. ${s.name} - R$ ${Number(s.price).toFixed(2)}`).join('\n');

      await upsertConversationState({
        barbershop_id: barbershopId,
        client_phone: phone,
        client_name: name,
        current_step: 'awaiting_service',
        intent,
        context: { personality },
      });

      return {
        message: personality === 'formal'
          ? `${getGreeting(name, personality)}\n\nTemos os seguintes serviços:\n${serviceList}\n\nQual serviço deseja agendar?`
          : `${getGreeting(name, personality)}\n\nNossos serviços:\n${serviceList}\n\nQual você quer? 😊`,
        action: 'none',
      };
    }

    case 'CONSULTAR_PRECO': {
      const { data: services } = await (supabase as any)
        .from('services').select('name, price')
        .eq('barbershop_id', barbershopId).eq('is_active', true).order('name');

      const list = (services || []).map((s: any) => `• ${s.name}: R$ ${Number(s.price).toFixed(2)}`).join('\n');
      return {
        message: list
          ? `Nossos valores:\n${list}\n\nQuer agendar algum?`
          : 'Ainda não temos serviços cadastrados.',
        action: 'none',
      };
    }

    case 'CANCELAR_AGENDAMENTO':
    case 'REMARCAR_AGENDAMENTO': {
      // Buscar próximo agendamento do cliente
      const { data: nextApt } = await (supabase as any)
        .from('appointments')
        .select('id, scheduled_at, services(name)')
        .eq('barbershop_id', barbershopId)
        .eq('client_whatsapp', phone)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!nextApt) {
        return { message: 'Não encontrei nenhum agendamento ativo no seu nome. Quer marcar um novo?', action: 'none' };
      }

      const dateStr = new Date(nextApt.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      const action = intent === 'CANCELAR_AGENDAMENTO' ? 'cancelar' : 'remarcar';

      await upsertConversationState({
        barbershop_id: barbershopId,
        client_phone: phone,
        client_name: name,
        current_step: 'awaiting_cancel_confirm',
        intent,
        context: { personality, service_name: nextApt.services?.name },
      });

      return {
        message: `Encontrei seu agendamento de ${nextApt.services?.name || 'serviço'} para ${dateStr}. Confirma que quer ${action}?`,
        action: 'none',
      };
    }

    case 'FALAR_COM_ATENDENTE':
      return { message: 'Vou transferir para um atendente. Aguarde um momento, por favor.', action: 'none' };

    default:
      // Saudação ou conversa genérica — sempre conduzir para conversão
      return {
        message: `${getGreeting(name, personality)}\n\nPosso te ajudar com:\n• Agendar um horário\n• Ver preços dos serviços\n• Remarcar ou cancelar\n\nO que precisa?`,
        action: 'none',
      };
  }
}

// ==================== CONVERSA EM ANDAMENTO ====================

async function handleOngoingConversation(
  state: ConversationState, message: string, intent: AIIntentType,
  personality: string, barbershopId: string
): Promise<AssistantResponse> {
  const msg = message.toLowerCase().trim();
  const ctx = state.context || {};

  switch (state.current_step) {
    case 'awaiting_service': {
      // Cliente escolheu serviço (por número ou nome)
      const { data: services } = await (supabase as any)
        .from('services').select('id, name, price, duration_minutes')
        .eq('barbershop_id', barbershopId).eq('is_active', true).order('name');

      const num = parseInt(msg);
      const service = num > 0 && num <= (services?.length || 0)
        ? services[num - 1]
        : services?.find((s: any) => s.name.toLowerCase().includes(msg));

      if (!service) {
        return { message: 'Não entendi qual serviço. Pode digitar o número ou o nome?', action: 'none' };
      }

      await upsertConversationState({
        barbershop_id: barbershopId,
        client_phone: state.client_phone,
        current_step: 'awaiting_date',
        context: { ...ctx, service_id: service.id, service_name: service.name },
      });

      return {
        message: personality === 'formal'
          ? `Ótima escolha! ${service.name} por R$ ${Number(service.price).toFixed(2)}.\n\nPara qual dia gostaria de agendar? (Ex: amanhã, segunda, 15/04)`
          : `${service.name} por R$ ${Number(service.price).toFixed(2)} 👍\n\nQual dia? (amanhã, segunda, 15/04...)`,
        action: 'none',
      };
    }

    case 'awaiting_date': {
      const date = parseDate(msg);
      if (!date) {
        return { message: 'Não entendi a data. Pode digitar assim: amanhã, segunda, ou 15/04?', action: 'none' };
      }

      // Buscar profissionais
      const { data: professionals } = await (supabase as any)
        .from('professionals').select('id, name')
        .eq('barbershop_id', barbershopId).eq('is_active', true).limit(1);

      const profId = professionals?.[0]?.id;
      if (!profId) {
        return { message: 'Não temos profissionais disponíveis no momento. Tente novamente mais tarde.', action: 'none' };
      }

      const slots = await getAvailableSlots(barbershopId, profId, date);

      await upsertConversationState({
        barbershop_id: barbershopId,
        client_phone: state.client_phone,
        current_step: 'awaiting_time',
        context: {
          ...ctx,
          selected_date: date.toISOString().split('T')[0],
          professional_id: profId,
          professional_name: professionals[0].name,
          available_slots: slots,
        },
      });

      return { message: formatSlots(slots, personality), action: 'none' };
    }

    case 'awaiting_time': {
      const time = parseTime(msg);
      if (!time || !(ctx.available_slots || []).some((s: string) => s.includes(time))) {
        return { message: 'Horário não disponível. Escolha um dos horários listados acima.', action: 'none' };
      }

      await upsertConversationState({
        barbershop_id: barbershopId,
        client_phone: state.client_phone,
        current_step: 'awaiting_confirmation',
        context: { ...ctx, selected_time: time },
      });

      const dateFormatted = ctx.selected_date
        ? new Date(ctx.selected_date + 'T00:00:00').toLocaleDateString('pt-BR')
        : 'data selecionada';

      return {
        message: personality === 'formal'
          ? `Confirma o agendamento?\n\n📋 ${ctx.service_name}\n📅 ${dateFormatted} às ${time}\n👤 ${ctx.professional_name || 'Profissional'}\n\nResponda SIM para confirmar.`
          : `Confirma?\n\n✂️ ${ctx.service_name}\n📅 ${dateFormatted} às ${time}\n💈 ${ctx.professional_name || 'Profissional'}\n\nDigita SIM pra confirmar! 🙌`,
        action: 'none',
      };
    }

    case 'awaiting_confirmation': {
      const isYes = /^(sim|s|yes|confirmo|confirma|ok|pode|bora|vamos)$/i.test(msg);
      const isNo = /^(n[aã]o|n|nao|cancela|desisto)$/i.test(msg);

      if (isNo) {
        await upsertConversationState({
          barbershop_id: barbershopId,
          client_phone: state.client_phone,
          current_step: 'completed',
          context: {},
        });
        return { message: 'Tudo bem! Se precisar, é só chamar. 😊', action: 'none' };
      }

      if (!isYes) {
        return { message: 'Responda SIM para confirmar ou NÃO para cancelar.', action: 'none' };
      }

      // Criar agendamento
      const scheduledAt = new Date(`${ctx.selected_date}T${ctx.selected_time}:00`);
      const appointment = await createAppointment(
        barbershopId,
        ctx.professional_id!,
        ctx.service_id!,
        '',
        state.client_name || 'Cliente',
        state.client_phone,
        scheduledAt,
        'Agendado via WhatsApp IA'
      );

      await upsertConversationState({
        barbershop_id: barbershopId,
        client_phone: state.client_phone,
        current_step: 'completed',
        context: {},
      });

      if (appointment) {
        const dateStr = scheduledAt.toLocaleDateString('pt-BR');
        return {
          message: personality === 'formal'
            ? `Agendamento confirmado! ✅\n\n${ctx.service_name} em ${dateStr} às ${ctx.selected_time}.\n\nAguardamos sua presença.`
            : `Pronto, agendado! ✅\n\n${ctx.service_name} dia ${dateStr} às ${ctx.selected_time}.\n\nTe esperamos! 💈`,
          action: 'booked',
          data: { appointment_id: appointment.id },
        };
      }

      return { message: 'Houve um erro ao agendar. Tente novamente ou entre em contato.', action: 'none' };
    }

    case 'awaiting_cancel_confirm': {
      const isYes = /^(sim|s|yes|confirmo|ok)$/i.test(msg);
      if (!isYes) {
        await upsertConversationState({
          barbershop_id: barbershopId,
          client_phone: state.client_phone,
          current_step: 'completed',
          context: {},
        });
        return { message: 'Ok, mantive seu agendamento. 👍', action: 'none' };
      }

      // Cancelar agendamento
      const { data: apt } = await (supabase as any)
        .from('appointments')
        .select('id')
        .eq('barbershop_id', barbershopId)
        .eq('client_whatsapp', state.client_phone)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (apt) {
        await (supabase as any).from('appointments').update({ status: 'cancelled' }).eq('id', apt.id);
      }

      await upsertConversationState({
        barbershop_id: barbershopId,
        client_phone: state.client_phone,
        current_step: 'completed',
        context: {},
      });

      return {
        message: state.intent === 'REMARCAR_AGENDAMENTO'
          ? 'Agendamento cancelado. Quer marcar um novo horário?'
          : 'Agendamento cancelado. Se precisar, é só chamar! 😊',
        action: 'cancelled',
      };
    }

    default:
      return { message: 'Como posso te ajudar?', action: 'none' };
  }
}

// ==================== HELPERS DE PARSING ====================

function parseDate(input: string): Date | null {
  const today = new Date();
  const normalized = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (/^hoje$/.test(normalized)) return today;
  if (/^amanha$/.test(normalized)) {
    const d = new Date(today); d.setDate(d.getDate() + 1); return d;
  }

  const dayMap: Record<string, number> = {
    domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
  };
  for (const [name, dayNum] of Object.entries(dayMap)) {
    if (normalized.includes(name)) {
      const d = new Date(today);
      const diff = (dayNum - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return d;
    }
  }

  // dd/mm ou dd/mm/yyyy
  const match = normalized.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = match[3] ? (match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3])) : today.getFullYear();
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function parseTime(input: string): string | null {
  const match = input.match(/(\d{1,2})[:\s]?(\d{2})?/);
  if (!match) return null;
  const hour = parseInt(match[1]);
  const min = match[2] ? parseInt(match[2]) : 0;
  if (hour < 0 || hour > 23 || min < 0 || min > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// ==================== ENVIO DE RESPOSTA VIA WHATSAPP ====================

export async function sendAssistantReply(params: {
  barbershopId: string;
  clientPhone: string;
  message: string;
}): Promise<boolean> {
  const result = await sendAutomationMessage({
    barbershopId: params.barbershopId,
    recipientPhone: params.clientPhone,
    messageContent: params.message,
    messageType: 'automation',
    automationType: 'ai_assistant',
  });
  return result.success;
}

// ==================== WEBHOOK HANDLER (para Edge Function) ====================

export async function handleWhatsAppWebhook(params: {
  barbershopId: string;
  from: string;
  body: string;
  fromName?: string;
  messageType?: 'text' | 'audio';
}): Promise<{ reply: string; action: string }> {
  const response = await processIncomingMessage({
    barbershopId: params.barbershopId,
    clientPhone: params.from,
    clientName: params.fromName,
    message: params.body,
    messageType: params.messageType,
  });

  // Enviar resposta automaticamente
  await sendAssistantReply({
    barbershopId: params.barbershopId,
    clientPhone: params.from,
    message: response.message,
  });

  return { reply: response.message, action: response.action || 'none' };
}
