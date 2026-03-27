/**
 * Queue Adapter - Enfileira jobs para processamento assíncrono
 * 
 * Fluxo: APP → Queue (job_queue table) → Worker (edge function) → External API
 */

import { supabase } from "@/integrations/supabase/client";

export type JobType = 
  | "send_email"
  | "send_sms"
  | "send_whatsapp"
  | "dispatch_webhook"
  | "process_notification";

export interface EnqueueOptions {
  job_type: JobType;
  payload: Record<string, unknown>;
  priority?: number;        // Higher = processed first (default 0)
  max_attempts?: number;    // Default 3
  scheduled_at?: string;    // ISO date, for delayed jobs
}

export interface QueueAdapter {
  enqueue(options: EnqueueOptions): Promise<string | null>;
  enqueueBatch(jobs: EnqueueOptions[]): Promise<number>;
  triggerWorker(batchSize?: number): Promise<void>;
}

class PostgresQueueAdapter implements QueueAdapter {
  /**
   * Enfileira um job para processamento assíncrono
   * Retorna o ID do job criado ou null em caso de erro
   */
  async enqueue(options: EnqueueOptions): Promise<string | null> {
    const { data, error } = await (supabase as any)
      .from("job_queue" as any)
      .insert({
        job_type: options.job_type,
        payload: options.payload,
        priority: options.priority ?? 0,
        max_attempts: options.max_attempts ?? 3,
        scheduled_at: options.scheduled_at ?? new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[QUEUE] Failed to enqueue:", error.message);
      return null;
    }
    return (data as any)?.id ?? null;
  }

  /**
   * Enfileira múltiplos jobs de uma vez
   * Retorna quantidade de jobs criados com sucesso
   */
  async enqueueBatch(jobs: EnqueueOptions[]): Promise<number> {
    const rows = jobs.map((j) => ({
      job_type: j.job_type,
      payload: j.payload,
      priority: j.priority ?? 0,
      max_attempts: j.max_attempts ?? 3,
      scheduled_at: j.scheduled_at ?? new Date().toISOString(),
    }));

    const { data, error } = await (supabase as any)
      .from("job_queue" as any)
      .insert(rows)
      .select("id");

    if (error) {
      console.error("[QUEUE] Batch enqueue failed:", error.message);
      return 0;
    }
    return (data as any[])?.length ?? 0;
  }

  /**
   * Dispara o worker para processar jobs pendentes
   */
  async triggerWorker(batchSize = 10): Promise<void> {
    const { error } = await supabase.functions.invoke("queue-worker", {
      body: { batch_size: batchSize },
    });
    if (error) {
      console.error("[QUEUE] Failed to trigger worker:", error.message);
    }
  }
}

export const queueAdapter: QueueAdapter = new PostgresQueueAdapter();

// Exportar função enqueue para facilitar uso
export const enqueue = queueAdapter.enqueue.bind(queueAdapter);
