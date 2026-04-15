/**
 * Twilio Integration Service — SEGURO
 * Todas as chamadas à API Twilio são feitas via Edge Function no servidor.
 * Nenhuma credencial é exposta no browser.
 */
import { supabase } from '@/integrations/supabase/client';
import { getAccountById, WhatsAppAccount } from './whatsappAccountService';
import { useMessages as consumeMessages, getBalance } from './messagePackageService';
import { calculateCostSplit } from './costSplitService';
import { logMessageUsage } from './messageReportService';

export interface SendMessageResult {
  success: boolean;
  message_sid?: string;
  status?: string;
  error?: string;
}

export interface SendMessageParams {
  accountId: string;
  to: string;
  body: string;
  professionalId?: string;
  messageType: 'notification' | 'marketing' | 'automation' | 'reminder' | 'confirmation';
  templateId?: string;
  campaignId?: string;
  automationType?: string;
}

export async function sendWhatsAppMessage(params: SendMessageParams): Promise<SendMessageResult> {
  try {
    const account = await getAccountById(params.accountId);
    if (!account) return { success: false, error: 'Conta WhatsApp não encontrada' };
    if (!account.is_verified) return { success: false, error: 'Conta WhatsApp não verificada' };

    const balance = await getBalance(account.barbershop_id);
    if (!balance || balance.available_messages < 1) {
      return { success: false, error: 'Saldo de mensagens insuficiente' };
    }

    const costPerMessage = await getTwilioCostPerMessage();
    const costSplit = await calculateCostSplit({
      barbershopId: account.barbershop_id,
      professionalId: params.professionalId,
      totalCost: costPerMessage,
    });

    // ✅ Chamada via Edge Function — credenciais ficam no servidor
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        action: 'whatsapp',
        to: params.to,
        body: params.body,
        accountId: params.accountId,
        messageType: params.messageType,
      },
    });

    if (error || !data?.success) {
      await logMessageUsage({
        barbershopId: account.barbershop_id,
        whatsappAccountId: params.accountId,
        professionalId: params.professionalId,
        recipientPhone: params.to,
        messageType: params.messageType,
        messageContent: params.body,
        templateId: params.templateId,
        costPerMessage,
        totalCost: costPerMessage,
        ownerCostShare: costSplit.ownerShare,
        professionalCostShare: costSplit.professionalShare,
        twilioStatus: 'failed',
        automationType: params.automationType,
        campaignId: params.campaignId,
        errorMessage: error?.message || data?.error || 'Erro ao enviar',
      });
      return { success: false, error: error?.message || data?.error || 'Erro ao enviar mensagem' };
    }

    await consumeMessages(account.barbershop_id, 1);
    await logMessageUsage({
      barbershopId: account.barbershop_id,
      whatsappAccountId: params.accountId,
      professionalId: params.professionalId,
      recipientPhone: params.to,
      messageType: params.messageType,
      messageContent: params.body,
      templateId: params.templateId,
      costPerMessage,
      totalCost: costPerMessage,
      ownerCostShare: costSplit.ownerShare,
      professionalCostShare: costSplit.professionalShare,
      twilioMessageSid: data.sid,
      twilioStatus: data.status || 'sent',
      automationType: params.automationType,
      campaignId: params.campaignId,
    });

    return { success: true, message_sid: data.sid, status: data.status };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

export async function sendBulkMessages(params: {
  accountId: string;
  recipients: { phone: string; name?: string; professionalId?: string }[];
  messageTemplate: string;
  messageType: SendMessageParams['messageType'];
  campaignId?: string;
  automationType?: string;
}): Promise<{ sent: number; failed: number; results: SendMessageResult[] }> {
  const results: SendMessageResult[] = [];
  let sent = 0, failed = 0;

  for (const recipient of params.recipients) {
    const personalizedMessage = params.messageTemplate
      .replace('{{nome}}', recipient.name || 'Cliente')
      .replace('{{phone}}', recipient.phone);

    const result = await sendWhatsAppMessage({
      accountId: params.accountId,
      to: recipient.phone,
      body: personalizedMessage,
      professionalId: recipient.professionalId,
      messageType: params.messageType,
      campaignId: params.campaignId,
      automationType: params.automationType,
    });

    results.push(result);
    if (result.success) sent++; else failed++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { sent, failed, results };
}

export async function getTwilioCostPerMessage(): Promise<number> {
  return 0.07;
}

// ✅ Verificar saldo via Edge Function — sem expor credenciais
export async function checkTwilioBalance(account: WhatsAppAccount): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { action: 'check_balance', accountId: account.id },
    });
    if (error || !data?.success) return { success: false, error: error?.message || 'Erro ao verificar saldo' };
    return { success: true, balance: data.balance };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ✅ Validar credenciais via Edge Function
export async function validateTwilioCredentials(params: {
  accountSid: string;
  authToken: string;
}): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { action: 'validate_credentials', sid: params.accountSid, token: params.authToken },
    });
    if (error || !data?.valid) return { valid: false, error: error?.message || 'Credenciais inválidas' };
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

export async function createMessagingService(params: {
  accountSid: string;
  authToken: string;
  friendlyName: string;
}): Promise<{ success: boolean; messagingServiceSid?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { action: 'create_messaging_service', sid: params.accountSid, token: params.authToken, name: params.friendlyName },
    });
    if (error || !data?.success) return { success: false, error: error?.message || 'Erro ao criar serviço' };
    return { success: true, messagingServiceSid: data.messagingServiceSid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMessageStatus(params: {
  accountSid: string;
  authToken: string;
  messageSid: string;
}): Promise<{ status: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { action: 'get_status', sid: params.accountSid, token: params.authToken, messageSid: params.messageSid },
    });
    if (error) return { status: 'unknown', error: error.message };
    return { status: data?.status || 'unknown' };
  } catch (error: any) {
    return { status: 'unknown', error: error.message };
  }
}
