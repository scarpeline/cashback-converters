/**
 * Módulo Queue — Tipos
 * Sistema de filas assíncronas para processamento em background
 */

export type QueueJobType =
  | 'send_notification'
  | 'send_whatsapp'
  | 'send_email'
  | 'send_sms'
  | 'process_commission'
  | 'ai_process_message'
  | 'marketing_campaign'
  | 'payment_check'
  | 'generate_report'
  | 'sync_data';

export type QueueJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

export type QueueJobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface QueueJob {
  id: string;
  type: QueueJobType;
  priority: QueueJobPriority;
  status: QueueJobStatus;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total_today: number;
}
