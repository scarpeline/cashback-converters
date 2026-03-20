// Job Queue Service
// Gerenciamento de fila de processamento de mensagens

import { supabase } from '@/integrations/supabase/client';

export type JobType = 'envio_mensagem' | 'reenvio' | 'alerta' | 'verificacao' | 'backup';
export type JobStatus = 'pendente' | 'processando' | 'completo' | 'falhou' | 'cancelado';

export interface Job {
  id: string;
  job_type: JobType;
  job_priority: number;
  payload: Record<string, any>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface JobResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

export async function addJob(
  jobType: JobType,
  payload: Record<string, any>,
  priority: number = 0,
  scheduledFor?: Date
): Promise<JobResult> {
  try {
    const { data, error } = await supabase
      .rpc('add_job_to_queue', {
        p_job_type: jobType,
        p_payload: payload,
        p_priority: priority,
        p_scheduled_for: scheduledFor?.toISOString(),
      })
      .single();

    if (error) throw error;
    return { success: true, jobId: data };
  } catch (error: any) {
    console.error('Erro ao adicionar job:', error);
    return { success: false, error: error.message };
  }
}

export async function addMessageJob(params: {
  barbershopId: string;
  whatsappNumberId: string;
  recipientPhone: string;
  messageContent: string;
  messageType: string;
  professionalId?: string;
  campaignId?: string;
  priority?: number;
}): Promise<JobResult> {
  return addJob(
    'envio_mensagem',
    {
      type: 'send_message',
      ...params,
    },
    params.priority || 0
  );
}

export async function addReenvioJob(params: {
  originalJobId: string;
  reason: string;
  priority?: number;
}): Promise<JobResult> {
  return addJob(
    'reenvio',
    {
      type: 'reenvio',
      ...params,
    },
    params.priority || 5
  );
}

export async function addAlertJob(params: {
  alertType: string;
  barbershopId: string;
  whatsappNumberId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedAction?: string;
}): Promise<JobResult> {
  return addJob(
    'alerta',
    {
      type: 'alert',
      ...params,
    },
    10
  );
}

export async function getJob(jobId: string): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getJobsByStatus(
  status: JobStatus,
  limit: number = 50
): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', status)
      .order('job_priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar jobs:', error);
    return [];
  }
}

export async function getPendingJobs(limit: number = 10): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pendente')
      .is('scheduled_for', null)
      .lt('attempts', 3)
      .order('job_priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar jobs pendentes:', error);
    return [];
  }
}

export async function getScheduledJobs(limit: number = 50): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pendente')
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar jobs agendados:', error);
    return [];
  }
}

export async function getJobsByType(
  jobType: JobType,
  limit: number = 50
): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('job_type', jobType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar jobs por tipo:', error);
    return [];
  }
}

export async function getJobStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}> {
  try {
    const { data, error } = await supabase
      .from('job_queue')
      .select('status');

    if (error) throw error;

    const jobs = data || [];
    return {
      pending: jobs.filter((j: any) => j.status === 'pendente').length,
      processing: jobs.filter((j: any) => j.status === 'processando').length,
      completed: jobs.filter((j: any) => j.status === 'completo').length,
      failed: jobs.filter((j: any) => j.status === 'falhou').length,
      total: jobs.length,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
  }
}

export async function markJobAsProcessing(jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('job_queue')
      .update({
        status: 'processando',
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao marcar job como processando:', error);
    return false;
  }
}

export async function markJobAsComplete(jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('job_queue')
      .update({
        status: 'completo',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao marcar job como completo:', error);
    return false;
  }
}

export async function markJobAsFailed(
  jobId: string,
  errorMessage: string,
  maxAttempts: number = 3
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('job_queue')
      .select('attempts')
      .eq('id', jobId)
      .single();

    const newStatus = (data?.attempts || 0) >= maxAttempts - 1 ? 'falhou' : 'pendente';

    const { error } = await supabase
      .from('job_queue')
      .update({
        status: newStatus,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao marcar job como falhou:', error);
    return false;
  }
}

export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('job_queue')
      .update({
        status: 'cancelado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao cancelar job:', error);
    return false;
  }
}

export async function retryJob(jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('job_queue')
      .update({
        status: 'pendente',
        attempts: 0,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao re tentar job:', error);
    return false;
  }
}

export async function clearCompletedJobs(olderThanDays: number = 7): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { error, count } = await supabase
      .from('job_queue')
      .delete()
      .eq('status', 'completo')
      .lt('completed_at', cutoffDate.toISOString());

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Erro ao limpar jobs antigos:', error);
    return 0;
  }
}

export async function clearFailedJobs(olderThanDays: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { error, count } = await supabase
      .from('job_queue')
      .delete()
      .eq('status', 'falhou')
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Erro ao limpar jobs falhados:', error);
    return 0;
  }
}

export async function getRecentJobs(limit: number = 20): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('job_queue')
      .select('*')
      .in('status', ['pendente', 'processando', 'completo', 'falhou'])
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar jobs recentes:', error);
    return [];
  }
}
