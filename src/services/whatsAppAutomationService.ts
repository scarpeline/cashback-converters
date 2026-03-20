// WhatsApp Automation Service
// Integração do WhatsApp multi-conta com automações existentes

import { supabase } from '@/integrations/supabase/client';
import { getBarbershopPrimaryAccount, WhatsAppAccount } from './whatsappAccountService';
import { sendWhatsAppMessage as sendTwilioMessage, SendMessageParams } from './twilioIntegrationService';
import { calculateCostSplit } from './costSplitService';
import { logMessageUsage } from './messageReportService';

export interface AutomationMessageParams {
  barbershopId: string;
  professionalId?: string;
  recipientPhone: string;
  recipientName?: string;
  messageContent: string;
  messageType: SendMessageParams['messageType'];
  automationType?: string;
  campaignId?: string;
}

export async function sendAutomationMessage(params: AutomationMessageParams): Promise<{ success: boolean; error?: string }> {
  try {
    const account = await getBarbershopPrimaryAccount(params.barbershopId);

    if (!account) {
      return { success: false, error: 'Nenhuma conta WhatsApp verificada encontrada' };
    }

    const personalizedMessage = params.messageContent
      .replace('{{nome}}', params.recipientName || 'Cliente')
      .replace('{{phone}}', params.recipientPhone);

    const result = await sendTwilioMessage({
      accountId: account.id,
      to: params.recipientPhone,
      body: personalizedMessage,
      professionalId: params.professionalId,
      messageType: params.messageType,
      automationType: params.automationType,
      campaignId: params.campaignId,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem de automação:', error);
    return { success: false, error: error.message };
  }
}

export async function sendBulkAutomationMessages(params: {
  barbershopId: string;
  messages: Array<{
    professionalId?: string;
    recipientPhone: string;
    recipientName?: string;
    messageContent: string;
  }>;
  messageType: SendMessageParams['messageType'];
  automationType?: string;
  campaignId?: string;
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const msg of params.messages) {
    const result = await sendAutomationMessage({
      barbershopId: params.barbershopId,
      professionalId: msg.professionalId,
      recipientPhone: msg.recipientPhone,
      recipientName: msg.recipientName,
      messageContent: msg.messageContent,
      messageType: params.messageType,
      automationType: params.automationType,
      campaignId: params.campaignId,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${msg.recipientPhone}: ${result.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return { sent, failed, errors };
}

export async function sendAppointmentReminder(params: {
  barbershopId: string;
  professionalId?: string;
  clientPhone: string;
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  professionalName: string;
}): Promise<{ success: boolean; error?: string }> {
  const message = `Olá {{nome}}! 👋

Lembrete do seu agendamento:

📅 Data: ${params.appointmentDate}
⏰ Hora: ${params.appointmentTime}
✂️ Serviço: ${params.serviceName}
👨‍💼 Profissional: ${params.professionalName}

Caso não possa comparecer, por favor avise com antecedência.

Obrigado! 😊`;

  return sendAutomationMessage({
    barbershopId: params.barbershopId,
    professionalId: params.professionalId,
    recipientPhone: params.clientPhone,
    recipientName: params.clientName,
    messageContent: message,
    messageType: 'reminder',
    automationType: 'appointment_reminder',
  });
}

export async function sendAppointmentConfirmation(params: {
  barbershopId: string;
  professionalId?: string;
  clientPhone: string;
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  professionalName: string;
  totalAmount: number;
}): Promise<{ success: boolean; error?: string }> {
  const message = `✅ Agendamento Confirmado!

Olá {{nome}}!

Seu horário foi confirmado:

📅 Data: ${params.appointmentDate}
⏰ Hora: ${params.appointmentTime}
✂️ Serviço: ${params.serviceName}
👨‍💼 Profissional: ${params.professionalName}
💰 Valor: R$ ${params.totalAmount.toFixed(2)}

Estamos te esperando! 😊`;

  return sendAutomationMessage({
    barbershopId: params.barbershopId,
    professionalId: params.professionalId,
    recipientPhone: params.clientPhone,
    recipientName: params.clientName,
    messageContent: message,
    messageType: 'confirmation',
    automationType: 'appointment_confirmation',
  });
}

export async function sendAppointmentCancellation(params: {
  barbershopId: string;
  clientPhone: string;
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
}): Promise<{ success: boolean; error?: string }> {
  const message = `❌ Agendamento Cancelado

Olá {{nome}},

Seu agendamento do dia ${params.appointmentDate} às ${params.appointmentTime} foi cancelado.

Se precisar remarcar, é só entrar em contato!

Até mais! 🙏`;

  return sendAutomationMessage({
    barbershopId: params.barbershopId,
    recipientPhone: params.clientPhone,
    recipientName: params.clientName,
    messageContent: message,
    messageType: 'notification',
    automationType: 'appointment_cancellation',
  });
}

export async function sendBirthdayMessage(params: {
  barbershopId: string;
  professionalId?: string;
  clientPhone: string;
  clientName: string;
}): Promise<{ success: boolean; error?: string }> {
  const message = `🎉 Parabéns, {{nome}}!!!

Hoje é o seu dia! Que ele seja repleto de muita alegria e conquistas.

Você merece um momento especial no nosso salão. Que tal aproveitar para fazer aquele serviço que você ama com um desconto especial de aniversário?

Venha nos visitar! 🎂✨`;

  return sendAutomationMessage({
    barbershopId: params.barbershopId,
    professionalId: params.professionalId,
    recipientPhone: params.clientPhone,
    recipientName: params.clientName,
    messageContent: message,
    messageType: 'marketing',
    automationType: 'birthday_message',
  });
}

export async function sendPostServiceMessage(params: {
  barbershopId: string;
  professionalId?: string;
  clientPhone: string;
  clientName: string;
  serviceName: string;
  professionalName: string;
}): Promise<{ success: boolean; error?: string }> {
  const message = `Olá {{nome}}! 😊

Obrigado por nos visitar! 💈

Esperamos que você tenha gostado do ${params.serviceName} com ${params.professionalName}.

Sua opinião é muito importante para nós! Se tiver um momento, deixe sua avaliação no nosso Google ou redes sociais.

Até a próxima! 🙏`;

  return sendAutomationMessage({
    barbershopId: params.barbershopId,
    professionalId: params.professionalId,
    recipientPhone: params.clientPhone,
    recipientName: params.clientName,
    messageContent: message,
    messageType: 'marketing',
    automationType: 'post_service_message',
  });
}

export async function sendReactivationMessageWhatsApp(params: {
  barbershopId: string;
  professionalId?: string;
  clientPhone: string;
  clientName: string;
  daysInactive: number;
  favoriteService?: string;
}): Promise<{ success: boolean; error?: string }> {
  const messages = [
    `👋 Olá {{nome}}! Sentimos sua falta!

Há ${params.daysInactive} dias que você não vem nos visitar. Que tal agendar um retorno?

Temos muitos serviços novos para você conhecer! 💈`,
    `😊 {{nome}}, você é especial para nós!

Notamos que faz um tempinho que você não aparece. Que tal aproveitar uma promoçao especial de retorno?

Venha nos visitar! 🎁`,
    `💰 {{nome}}, temos uma surpresa para você!

Clientes que retornam ganham desconto especial essa semana. Quer aproveitar?

É só chamar no WhatsApp! 📱`,
  ];

  const selectedMessage = params.daysInactive > 30 ? messages[1] : messages[Math.floor(Math.random() * messages.length)];

  return sendAutomationMessage({
    barbershopId: params.barbershopId,
    professionalId: params.professionalId,
    recipientPhone: params.clientPhone,
    recipientName: params.clientName,
    messageContent: selectedMessage,
    messageType: 'automation',
    automationType: 'client_reactivation',
  });
}

export async function sendMarketingCampaign(params: {
  barbershopId: string;
  recipients: Array<{
    professionalId?: string;
    phone: string;
    name: string;
  }>;
  campaignName: string;
  messageTemplate: string;
}): Promise<{ sent: number; failed: number }> {
  const messages = params.recipients.map(r => ({
    professionalId: r.professionalId,
    recipientPhone: r.phone,
    recipientName: r.name,
    messageContent: params.messageTemplate,
  }));

  const result = await sendBulkAutomationMessages({
    barbershopId: params.barbershopId,
    messages,
    messageType: 'marketing',
    automationType: 'marketing_campaign',
  });

  return { sent: result.sent, failed: result.failed };
}

export async function getInactiveClientsForCampaign(
  barbershopId: string,
  daysInactive: number = 15,
  limit: number = 100
): Promise<Array<{
  user_id: string;
  name: string;
  whatsapp: string;
  professional_id?: string;
  days_inactive: number;
  total_visits: number;
  favorite_service?: string;
}>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('client_user_id, client_name, client_whatsapp, scheduled_at, professionals(id)')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'completed')
      .lte('scheduled_at', cutoffDate.toISOString())
      .order('scheduled_at', { ascending: false });

    const clientMap = new Map<string, any>();

    appointments?.forEach((apt: any) => {
      if (!apt.client_user_id) return;

      if (!clientMap.has(apt.client_user_id)) {
        clientMap.set(apt.client_user_id, {
          user_id: apt.client_user_id,
          name: apt.client_name,
          whatsapp: apt.client_whatsapp,
          professional_id: apt.professionals?.id,
          visits: [],
        });
      }
      clientMap.get(apt.client_user_id).visits.push(new Date(apt.scheduled_at));
    });

    const result: Array<{
      user_id: string;
      name: string;
      whatsapp: string;
      professional_id?: string;
      days_inactive: number;
      total_visits: number;
      favorite_service?: string;
    }> = [];

    for (const [userId, client] of clientMap.entries()) {
      if (client.whatsapp && client.whatsapp.length > 10) {
        const lastVisit = client.visits[0];
        const daysInactive = Math.floor(
          (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
        );

        result.push({
          user_id: client.user_id,
          name: client.name,
          whatsapp: client.whatsapp,
          professional_id: client.professional_id,
          days_inactive: daysInactive,
          total_visits: client.visits.length,
        });
      }
    }

    return result.slice(0, limit);
  } catch (error) {
    console.error('Erro ao buscar clientes inativos:', error);
    return [];
  }
}
