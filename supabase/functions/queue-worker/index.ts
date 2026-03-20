// Supabase Edge Function: queue-worker
// Processa a fila de mensagens de WhatsApp
// Chamada via cron job ou webhook

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobPayload {
  type: string;
  barbershopId: string;
  whatsappNumberId: string;
  recipientPhone: string;
  messageContent: string;
  messageType: string;
  professionalId?: string;
  campaignId?: string;
}

async function getNextJob(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('job_queue')
    .select('*')
    .eq('status', 'pendente')
    .is('scheduled_for', null)
    .lt('attempts', 3)
    .order('job_priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const job = data[0];

  await supabaseClient
    .from('job_queue')
    .update({
      status: 'processando',
      started_at: new Date().toISOString(),
    })
    .eq('id', job.id);

  return job;
}

async function getNextAvailableNumber(supabaseClient: any, barbershopId: string) {
  const { data, error } = await supabaseClient
    .rpc('get_next_available_whatsapp_number', { p_barbershop_id: barbershopId });

  if (error || !data) {
    return null;
  }

  return data;
}

async function registerNumberUsage(supabaseClient: any, numberId: string, success: boolean, errorReason?: string) {
  await supabaseClient.rpc('register_whatsapp_number_usage', {
    p_whatsapp_number_id: numberId,
    p_success: success,
    p_error_reason: errorReason,
  });
}

async function logSendAttempt(supabaseClient: any, params: {
  whatsappAccountId: string;
  phoneNumber: string;
  recipientPhone: string;
  messageType: string;
  status: string;
  errorReason?: string;
}) {
  await supabaseClient.from('message_sending_logs').insert({
    whatsapp_account_id: params.whatsappAccountId || null,
    phone_number: params.phoneNumber,
    recipient_phone: params.recipientPhone,
    message_type: params.messageType,
    status: params.status,
    error_reason: params.errorReason,
    sent_at: new Date().toISOString(),
  });
}

async function sendViaTwilio(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    const auth = btoa(`${params.accountSid}:${params.authToken}`);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: params.from,
          To: params.to,
          Body: params.body,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Erro Twilio' };
    }

    return { success: true, messageSid: data.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createBlockedAlert(supabaseClient: any, params: {
  whatsappNumberId: string;
  barbershopId: string;
  alertType: string;
  severity: string;
  message: string;
  suggestedAction?: string;
}) {
  await supabaseClient.from('blocked_numbers_alerts').insert({
    whatsapp_number_id: params.whatsappNumberId || '00000000-0000-0000-0000-000000000000',
    alert_type: params.alertType,
    severity: params.severity,
    message: params.message,
    suggested_action: params.suggestedAction,
  });
}

async function completeJob(supabaseClient: any, jobId: string) {
  await supabaseClient
    .from('job_queue')
    .update({
      status: 'completo',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

async function failJob(supabaseClient: any, jobId: string, errorMessage: string, attempts: number, maxAttempts: number) {
  const newStatus = attempts >= maxAttempts ? 'falhou' : 'pendente';

  await supabaseClient
    .from('job_queue')
    .update({
      status: newStatus,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

async function scheduleReenvio(supabaseClient: any, originalJobId: string, reason: string) {
  await supabaseClient.from('job_queue').insert({
    job_type: 'reenvio',
    payload: { originalJobId, reason },
    job_priority: 5,
    status: 'pendente',
    attempts: 0,
    max_attempts: 3,
  });
}

async function processSendMessageJob(supabaseClient: any, job: any): Promise<boolean> {
  const payload = job.payload as JobPayload;

  try {
    let selectedNumber: any = null;

    if (payload.whatsappNumberId) {
      const { data } = await supabaseClient
        .from('whatsapp_numbers')
        .select('*, whatsapp_accounts(*)')
        .eq('id', payload.whatsappNumberId)
        .single();

      if (data && !data.is_blocked) {
        selectedNumber = data;
      }
    }

    if (!selectedNumber) {
      const numberResult = await getNextAvailableNumber(supabaseClient, payload.barbershopId);
      if (!numberResult) {
        await createBlockedAlert(supabaseClient, {
          whatsappNumberId: '',
          barbershopId: payload.barbershopId,
          alertType: 'no_available_numbers',
          severity: 'high',
          message: 'Nenhum número de WhatsApp disponível para envio',
          suggestedAction: 'Verifique se há números cadastrados e ativos',
        });
        await failJob(supabaseClient, job.id, 'Nenhum número disponível', job.attempts, job.max_attempts);
        return false;
      }
      selectedNumber = numberResult;
    }

    const account = selectedNumber.whatsapp_accounts;

    if (!account || !account.twilio_sid || !account.twilio_auth_token) {
      await failJob(supabaseClient, job.id, 'Conta WhatsApp sem credenciais', job.attempts, job.max_attempts);
      return false;
    }

    const fromNumber = `whatsapp:${account.phone_number_formatted}`;
    const toNumber = `whatsapp:+${payload.recipientPhone.replace(/\D/g, '')}`;

    const result = await sendViaTwilio({
      accountSid: account.twilio_sid,
      authToken: account.twilio_auth_token,
      from: fromNumber,
      to: toNumber,
      body: payload.messageContent,
    });

    if (result.success) {
      await registerNumberUsage(supabaseClient, selectedNumber.id, true);
      await logSendAttempt(supabaseClient, {
        whatsappAccountId: account.id,
        phoneNumber: payload.recipientPhone,
        recipientPhone: payload.recipientPhone,
        messageType: payload.messageType,
        status: 'success',
      });
      await completeJob(supabaseClient, job.id);
      return true;
    } else {
      await registerNumberUsage(supabaseClient, selectedNumber.id, false, result.error);

      const isBlocked = result.error?.toLowerCase().includes('blocked') ||
                        result.error?.toLowerCase().includes('bloqueado');

      if (isBlocked) {
        await createBlockedAlert(supabaseClient, {
          whatsappNumberId: selectedNumber.id,
          barbershopId: payload.barbershopId,
          alertType: 'blocked',
          severity: 'critical',
          message: `Número bloqueado: ${result.error}`,
          suggestedAction: 'Substitua o número bloqueado ou aguarde o período de cooldown',
        });
      }

      await logSendAttempt(supabaseClient, {
        whatsappAccountId: account.id,
        phoneNumber: payload.recipientPhone,
        recipientPhone: payload.recipientPhone,
        messageType: payload.messageType,
        status: isBlocked ? 'blocked' : 'failed',
        errorReason: result.error,
      });

      await scheduleReenvio(supabaseClient, job.id, result.error || 'Erro desconhecido');
      await failJob(supabaseClient, job.id, result.error || 'Erro desconhecido', job.attempts, job.max_attempts);
      return false;
    }
  } catch (error: any) {
    console.error('Erro ao processar job:', error);
    await failJob(supabaseClient, job.id, error.message, job.attempts, job.max_attempts);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const maxJobs = parseInt(url.searchParams.get('max') || '10');

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < maxJobs; i++) {
      const job = await getNextJob(supabaseClient);

      if (!job) {
        break;
      }

      if (job.job_type === 'envio_mensagem') {
        const success = await processSendMessageJob(supabaseClient, job);
        if (success) {
          processed++;
        } else {
          failed++;
        }
      } else if (job.job_type === 'reenvio' || job.job_type === 'alerta') {
        await completeJob(supabaseClient, job.id);
        processed++;
      } else {
        await completeJob(supabaseClient, job.id);
        processed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro no worker:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
