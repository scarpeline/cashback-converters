// @ts-nocheck
/**
 * Módulo Queue — Service
 * Enfileirar jobs para processamento assíncrono via Supabase Edge Functions
 */

import { supabase } from '@/integrations/supabase/client';
import type { QueueJob, QueueJobType, QueueJobPriority, QueueStats } from '../types';

// ==================== ENFILEIRAR JOB ====================

export async function enqueueJob(params: {
  type: QueueJobType;
  payload: Record<string, unknown>;
  priority?: QueueJobPriority;
  max_retries?: number;
  scheduled_for?: string;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.from('queue_jobs' as any).insert({
      type: params.type,
      payload: params.payload,
      priority: params.priority || 'normal',
      status: 'pending',
      retry_count: 0,
      max_retries: params.max_retries ?? 3,
      scheduled_for: params.scheduled_for || null,
    }).select('id').single();

    if (error) return { success: false, error: error.message };
    return { success: true, jobId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==================== HELPERS PARA JOBS COMUNS ====================

export async function enqueueNotification(params: {
  user_id: string;
  title: string;
  message: string;
  type?: string;
  channel?: 'push' | 'email' | 'whatsapp' | 'sms';
}): Promise<{ success: boolean }> {
  return enqueueJob({
    type: 'send_notification',
    payload: params,
    priority: 'high',
  });
}

export async function enqueueWhatsApp(params: {
  phone: string;
  message: string;
  template_id?: string;
}): Promise<{ success: boolean }> {
  return enqueueJob({
    type: 'send_whatsapp',
    payload: params,
    priority: 'high',
  });
}

export async function enqueueEmail(params: {
  to: string;
  subject: string;
  body: string;
  template_id?: string;
}): Promise<{ success: boolean }> {
  return enqueueJob({
    type: 'send_email',
    payload: params,
    priority: 'normal',
  });
}

export async function enqueueMarketingCampaign(params: {
  campaign_id: string;
  target_audience: string[];
  channel: 'whatsapp' | 'email' | 'sms';
}): Promise<{ success: boolean }> {
  return enqueueJob({
    type: 'marketing_campaign',
    payload: params,
    priority: 'low',
  });
}

export async function enqueueCommissionProcessing(params: {
  appointment_id: string;
  payment_id: string;
  barbershop_id: string;
}): Promise<{ success: boolean }> {
  return enqueueJob({
    type: 'process_commission',
    payload: params,
    priority: 'high',
  });
}

// ==================== ESTATÍSTICAS ====================

export async function getQueueStats(): Promise<QueueStats> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('queue_jobs' as any)
      .select('status')
      .gte('created_at', `${today}T00:00:00`);

    const jobs = data || [];

    return {
      pending: jobs.filter((j: any) => j.status === 'pending').length,
      processing: jobs.filter((j: any) => j.status === 'processing').length,
      completed: jobs.filter((j: any) => j.status === 'completed').length,
      failed: jobs.filter((j: any) => j.status === 'failed').length,
      total_today: jobs.length,
    };
  } catch {
    return { pending: 0, processing: 0, completed: 0, failed: 0, total_today: 0 };
  }
}
