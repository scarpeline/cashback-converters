// Twilio Integration Service
// Envio de mensagens WhatsApp via Twilio

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

function formatToWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length > 11) {
    return `whatsapp:+${digits}`;
  }
  if (!digits.startsWith('+')) {
    return `whatsapp:+55${digits}`;
  }
  return `whatsapp:+${digits}`;
}

export async function sendWhatsAppMessage(params: SendMessageParams): Promise<SendMessageResult> {
  try {
    const account = await getAccountById(params.accountId);
    if (!account) {
      return { success: false, error: 'Conta WhatsApp não encontrada' };
    }

    if (!account.is_verified) {
      return { success: false, error: 'Conta WhatsApp não verificada' };
    }

    if (!account.twilio_sid || !account.twilio_auth_token) {
      return { success: false, error: 'Conta WhatsApp sem credenciais Twilio configuradas' };
    }

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

    const toFormatted = formatToWhatsApp(params.to);
    const fromFormatted = `whatsapp:${account.phone_number_formatted}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${account.twilio_sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${account.twilio_sid}:${account.twilio_auth_token}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromFormatted,
          To: toFormatted,
          Body: params.body,
        }),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
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
        twilioMessageSid: responseData.sid,
        twilioStatus: 'failed',
        automationType: params.automationType,
        campaignId: params.campaignId,
        errorMessage: responseData.message || 'Erro Twilio',
      });

      return { success: false, error: responseData.message || 'Erro ao enviar mensagem' };
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
      twilioMessageSid: responseData.sid,
      twilioStatus: responseData.status,
      automationType: params.automationType,
      campaignId: params.campaignId,
    });

    return {
      success: true,
      message_sid: responseData.sid,
      status: responseData.status,
    };
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
  let sent = 0;
  let failed = 0;

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

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { sent, failed, results };
}

export async function getTwilioCostPerMessage(): Promise<number> {
  return 0.07;
}

export async function checkTwilioBalance(account: WhatsAppAccount): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    if (!account.twilio_sid || !account.twilio_auth_token) {
      return { success: false, error: 'Credenciais não configuradas' };
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${account.twilio_sid}/Balance.json`,
      {
        headers: {
          'Authorization': 'Basic ' + btoa(`${account.twilio_sid}:${account.twilio_auth_token}`),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Erro ao verificar saldo Twilio' };
    }

    return { success: true, balance: parseFloat(data.balance) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function validateTwilioCredentials(params: {
  accountSid: string;
  authToken: string;
}): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}.json`,
      {
        headers: {
          'Authorization': 'Basic ' + btoa(`${params.accountSid}:${params.authToken}`),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { valid: false, error: data.message || 'Credenciais inválidas' };
    }

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
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Messaging/Services.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${params.accountSid}:${params.authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          FriendlyName: params.friendlyName,
          StatusCallback: 'https://your-domain.com/webhooks/twilio-status',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Erro ao criar serviço de mensagens' };
    }

    return { success: true, messagingServiceSid: data.sid };
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
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Messages/${params.messageSid}.json`,
      {
        headers: {
          'Authorization': 'Basic ' + btoa(`${params.accountSid}:${params.authToken}`),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { status: 'unknown', error: data.message };
    }

    return { status: data.status };
  } catch (error: any) {
    return { status: 'unknown', error: error.message };
  }
}
