// WhatsApp Worker Service
// Processamento assíncrono da fila de mensagens

import { supabase } from '@/integrations/supabase/client';
import {
  getNextAvailableNumber,
  registerUsage,
  WhatsAppNumber,
} from './messageBalanceService';
import {
  getJob,
  markJobAsProcessing,
  markJobAsComplete,
  markJobAsFailed,
  addReenvioJob,
  Job,
} from './jobQueueService';
import { createAlert } from './blockingAlertService';
import { sendWhatsAppMessage } from './twilioIntegrationService';

interface SendMessagePayload {
  type: string;
  barbershopId: string;
  whatsappNumberId: string;
  recipientPhone: string;
  messageContent: string;
  messageType: string;
  professionalId?: string;
  campaignId?: string;
}

export interface WorkerResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

const PROCESSING_INTERVAL = 5000;

let isRunning = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

export async function processNextJob(): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
}> {
  try {
    const { data: jobs, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pendente')
      .is('scheduled_for', null)
      .lt('attempts', 3)
      .order('job_priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) throw error;

    const job = jobs?.[0];
    if (!job) {
      return { success: true };
    }

    await markJobAsProcessing(job.id);

    if (job.job_type === 'envio_mensagem') {
      return await processSendMessageJob(job);
    } else if (job.job_type === 'reenvio') {
      return await processReenvioJob(job);
    } else if (job.job_type === 'alerta') {
      return await processAlertJob(job);
    } else {
      await markJobAsComplete(job.id);
      return { success: true, jobId: job.id };
    }
  } catch (error: any) {
    console.error('Erro ao processar job:', error);
    return { success: false, error: error.message };
  }
}

async function processSendMessageJob(job: Job): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
}> {
  const payload = job.payload as SendMessagePayload;

  try {
    let numberInfo: WhatsAppNumber | null = null;
    let selectedNumberId: string | null = null;

    if (payload.whatsappNumberId) {
      selectedNumberId = payload.whatsappNumberId;
    } else {
      const numberResult = await getNextAvailableNumber(payload.barbershopId);
      if (!numberResult.success || !numberResult.number) {
        await createAlert({
          barbershopId: payload.barbershopId,
          whatsappNumberId: '',
          alertType: 'no_available_numbers',
          severity: 'high',
          message: 'Nenhum número de WhatsApp disponível para envio',
          suggestedAction: 'Verifique se há números cadastrados e ativos',
        });

        await markJobAsFailed(job.id, 'Nenhum número disponível');
        return { success: false, jobId: job.id, error: 'Nenhum número disponível' };
      }
      numberInfo = numberResult.number as WhatsAppNumber;
      selectedNumberId = numberInfo.id;
    }

    const result = await sendWhatsAppMessage({
      accountId: payload.whatsappNumberId || (numberInfo?.whatsapp_account_id || ''),
      to: payload.recipientPhone,
      body: payload.messageContent,
      professionalId: payload.professionalId,
      messageType: payload.messageType as any,
      campaignId: payload.campaignId,
    });

    if (result.success) {
      if (selectedNumberId) {
        await registerUsage(selectedNumberId, true);
      }

      await logSendAttempt({
        whatsappAccountId: payload.whatsappNumberId || (numberInfo?.whatsapp_account_id || ''),
        phoneNumber: payload.recipientPhone,
        recipientPhone: payload.recipientPhone,
        messageType: payload.messageType,
        status: 'success',
      });

      await markJobAsComplete(job.id);
      return { success: true, jobId: job.id };
    } else {
      if (selectedNumberId) {
        await registerUsage(selectedNumberId, false, result.error);

        if (result.error?.toLowerCase().includes('blocked') ||
            result.error?.toLowerCase().includes('bloqueado')) {
          await createAlert({
            barbershopId: payload.barbershopId,
            whatsappNumberId: selectedNumberId,
            alertType: 'blocked',
            severity: 'critical',
            message: `Número bloqueado: ${result.error}`,
            suggestedAction: 'Substitua o número bloqueado ou aguarde o período de cooldown',
          });
        }
      }

      await logSendAttempt({
        whatsappAccountId: payload.whatsappNumberId || (numberInfo?.whatsapp_account_id || ''),
        phoneNumber: payload.recipientPhone,
        recipientPhone: payload.recipientPhone,
        messageType: payload.messageType,
        status: 'failed',
        errorReason: result.error,
      });

      await addReenvioJob({
        originalJobId: job.id,
        reason: result.error || 'Erro desconhecido',
      });

      await markJobAsFailed(job.id, result.error || 'Erro desconhecido');
      return { success: false, jobId: job.id, error: result.error };
    }
  } catch (error: any) {
    console.error('Erro ao processar job de envio:', error);
    await markJobAsFailed(job.id, error.message);
    return { success: false, jobId: job.id, error: error.message };
  }
}

async function processReenvioJob(job: Job): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
}> {
  try {
    const originalJob = await getJob(job.payload.originalJobId);
    if (!originalJob) {
      await markJobAsFailed(job.id, 'Job original não encontrado');
      return { success: false, jobId: job.id, error: 'Job original não encontrado' };
    }

    if (originalJob.attempts >= originalJob.max_attempts) {
      await markJobAsComplete(job.id);
      return { success: true, jobId: job.id };
    }

    const payload = originalJob.payload as SendMessagePayload;
    const numberResult = await getNextAvailableNumber(payload.barbershopId);

    if (!numberResult.success || !numberResult.number) {
      await markJobAsFailed(job.id, 'Nenhum número disponível para reenvio');
      return { success: false, jobId: job.id, error: 'Nenhum número disponível' };
    }

    const numberInfo = numberResult.number as WhatsAppNumber;

    const result = await sendWhatsAppMessage({
      accountId: numberInfo.whatsapp_account_id,
      to: payload.recipientPhone,
      body: payload.messageContent,
      professionalId: payload.professionalId,
      messageType: payload.messageType as any,
      campaignId: payload.campaignId,
    });

    if (result.success) {
      await registerUsage(numberInfo.id, true);
      await markJobAsComplete(job.id);
      return { success: true, jobId: job.id };
    } else {
      await registerUsage(numberInfo.id, false, result.error);

      if (result.error?.toLowerCase().includes('blocked')) {
        await createAlert({
          barbershopId: payload.barbershopId,
          whatsappNumberId: numberInfo.id,
          alertType: 'blocked',
          severity: 'critical',
          message: `Número bloqueado durante reenvio: ${result.error}`,
          suggestedAction: 'Verifique o número e tente novamente com outro',
        });
      }

      await markJobAsFailed(job.id, result.error);
      return { success: false, jobId: job.id, error: result.error };
    }
  } catch (error: any) {
    console.error('Erro ao processar reenvio:', error);
    await markJobAsFailed(job.id, error.message);
    return { success: false, jobId: job.id, error: error.message };
  }
}

async function processAlertJob(job: Job): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
}> {
  try {
    await markJobAsComplete(job.id);
    return { success: true, jobId: job.id };
  } catch (error: any) {
    console.error('Erro ao processar alerta:', error);
    await markJobAsFailed(job.id, error.message);
    return { success: false, jobId: job.id, error: error.message };
  }
}

async function logSendAttempt(params: {
  whatsappAccountId: string;
  phoneNumber: string;
  recipientPhone: string;
  messageType: string;
  status: 'success' | 'failed' | 'blocked';
  errorReason?: string;
}): Promise<void> {
  try {
    await supabase.from('message_sending_logs').insert({
      whatsapp_account_id: params.whatsappAccountId || null,
      phone_number: params.phoneNumber,
      recipient_phone: params.recipientPhone,
      message_type: params.messageType,
      status: params.status,
      error_reason: params.errorReason,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao registrar log de envio:', error);
  }
}

export async function startWorker(): Promise<void> {
  if (isRunning) {
    console.log('[Worker] Já está em execução');
    return;
  }

  isRunning = true;
  console.log('[Worker] Iniciando processamento de fila...');

  const processJobs = async () => {
    if (!isRunning) return;

    try {
      const result = await processNextJob();
      if (!result.success && result.error) {
        console.error('[Worker] Erro ao processar job:', result.error);
      }
    } catch (error) {
      console.error('[Worker] Erro no loop de processamento:', error);
    }
  };

  await processJobs();
  intervalId = setInterval(processJobs, PROCESSING_INTERVAL);
}

export function stopWorker(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  console.log('[Worker] Parado');
}

export function isWorkerRunning(): boolean {
  return isRunning;
}

export async function processAllPendingJobs(maxJobs: number = 50): Promise<WorkerResult> {
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < maxJobs; i++) {
    const result = await processNextJob();
    if (result.success) {
      if (result.jobId) processed++;
    } else {
      failed++;
      if (result.error) errors.push(result.error);
    }

    if (!result.jobId) break;
  }

  return {
    success: failed === 0,
    processed,
    failed,
    errors,
  };
}
