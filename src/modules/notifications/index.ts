/**
 * Módulo Notificações Multicanal — Tipos + Service
 * WhatsApp, Push, Email, SMS
 */

import { supabase } from '@/integrations/supabase/client';
import { enqueueJob } from '@/modules/queue';

// ==================== TIPOS ====================

export type NotificationChannel = 'whatsapp' | 'push' | 'email' | 'sms';
export type NotificationTrigger = 
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'payment_received'
  | 'cashback_earned'
  | 'birthday'
  | 'reactivation'
  | 'promotion'
  | 'waitlist_available'
  | 'custom';

export interface NotificationTemplate {
  id: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  title_template: string;
  body_template: string;
  variables: string[];
  enabled: boolean;
  barbershop_id?: string;
}

export interface NotificationPayload {
  user_id?: string;
  phone?: string;
  email?: string;
  channel: NotificationChannel;
  trigger: NotificationTrigger;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  scheduled_for?: string;
}

// ==================== TEMPLATE ENGINE ====================

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template
  );
}

// ==================== ENVIO ====================

export async function sendNotification(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // Enfileira na queue para processamento assíncrono
    const result = await enqueueJob({
      type: payload.channel === 'whatsapp' ? 'send_whatsapp' 
            : payload.channel === 'email' ? 'send_email' 
            : payload.channel === 'sms' ? 'send_sms' 
            : 'send_notification',
      payload: {
        ...payload,
        sent_via: 'notification_service',
      },
      priority: payload.trigger === 'appointment_reminder' ? 'high' : 'normal',
      scheduled_for: payload.scheduled_for,
    });

    // Registrar na tabela de notificações
    if (payload.user_id) {
      await (supabase as any).from('notifications').insert({
        user_id: payload.user_id,
        title: payload.title,
        message: payload.body,
        type: payload.trigger,
        read: false,
      });
    }

    return { success: result.success, error: result.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==================== ENVIO EM MASSA ====================

export async function sendBulkNotification(params: {
  barbershop_id: string;
  channel: NotificationChannel;
  trigger: NotificationTrigger;
  title: string;
  body: string;
  target: 'all_clients' | 'vip' | 'inactive' | 'birthday_today' | string[];
}): Promise<{ sent: number; failed: number }> {
  let userIds: string[] = [];

  if (Array.isArray(params.target)) {
    userIds = params.target;
  } else {
    // Buscar clientes pelo filtro
    let query = (supabase as any)
      .from('appointments')
      .select('client_user_id')
      .eq('barbershop_id', params.barbershop_id)
      .not('client_user_id', 'is', null);

    if (params.target === 'inactive') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.lt('scheduled_at', thirtyDaysAgo);
    }

    const { data } = await query;
    userIds = [...new Set((data || []).map((d: any) => d.client_user_id).filter(Boolean))] as string[];
  }

  let sent = 0, failed = 0;

  for (const userId of userIds) {
    const result = await sendNotification({
      user_id: userId,
      channel: params.channel,
      trigger: params.trigger,
      title: params.title,
      body: params.body,
    });
    if (result.success) sent++; else failed++;
  }

  return { sent, failed };
}

// ==================== LEMBRETES AUTOMÁTICOS ====================

export async function scheduleAppointmentReminders(barbershopId: string): Promise<number> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('id, client_user_id, client_name, scheduled_at, service_id')
    .eq('barbershop_id', barbershopId)
    .gte('scheduled_at', `${tomorrowStr}T00:00:00`)
    .lte('scheduled_at', `${tomorrowStr}T23:59:59`)
    .in('status', ['scheduled', 'confirmed']);

  if (!appointments?.length) return 0;

  let count = 0;
  for (const appt of appointments) {
    const time = new Date(appt.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    await sendNotification({
      user_id: appt.client_user_id,
      channel: 'push',
      trigger: 'appointment_reminder',
      title: '📅 Lembrete de Agendamento',
      body: `Olá ${appt.client_name || ''}! Lembrete: seu agendamento é amanhã às ${time}.`,
    });
    count++;
  }

  return count;
}
