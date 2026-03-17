// Serviço de Notificações
// Integração com IA e automação

import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'comissao' | 'agendamento' | 'pagamento';
  priority: 'low' | 'normal' | 'high';
  is_read: boolean;
  data?: any;
  created_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

/**
 * Buscar notificações do usuário
 */
export async function getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
}

/**
 * Buscar notificações não lidas
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar notificações não lidas:', error);
    return [];
  }
}

/**
 * Criar nova notificação
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  priority: Notification['priority'] = 'normal',
  data?: any
): Promise<Notification | null> {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        priority,
        is_read: false,
        data,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }

    return notification;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
}

/**
 * Marcar notificação como lida
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Erro ao marcar como lida:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    return false;
  }
}

/**
 * Marcar todas como lidas
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    return false;
  }
}

/**
 * Deletar notificação
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Erro ao deletar notificação:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    return false;
  }
}

/**
 * Enviar notificação para múltiplos usuários
 */
export async function sendBulkNotification(
  userIds: string[],
  title: string,
  message: string,
  type: Notification['type'] = 'info'
): Promise<number> {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      priority: 'normal',
      is_read: false,
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Erro ao enviar notificações em massa:', error);
      return 0;
    }

    return userIds.length;
  } catch (error) {
    console.error('Erro ao enviar notificações em massa:', error);
    return 0;
  }
}

/**
 * Buscar notificações por tipo
 */
export async function getNotificationsByType(
  userId: string,
  type: Notification['type']
): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar notificações por tipo:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar notificações por tipo:', error);
    return [];
  }
}

/**
 * Buscar notificações por prioridade
 */
export async function getNotificationsByPriority(
  userId: string,
  priority: Notification['priority']
): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('priority', priority)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar notificações por prioridade:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar notificações por prioridade:', error);
    return [];
  }
}

/**
 * Obter estatísticas de notificações
 */
export async function getNotificationStats(userId: string): Promise<NotificationStats> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('type, is_read')
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { total: 0, unread: 0, byType: {} };
    }

    const notifications = data || [];
    
    const unread = notifications.filter((n: any) => !n.is_read).length;
    
    const byType: Record<string, number> = {};
    notifications.forEach((n: any) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread,
      byType,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return { total: 0, unread: 0, byType: {} };
  }
}

/**
 * Limpar notificações antigas (manutenção)
 */
export async function cleanupOldNotifications(daysToKeep: number = 90): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
  } catch (error) {
    console.error('Erro ao limpar notificações antigas:', error);
  }
}

/**
 * Enviar notificação de comissão
 */
export async function sendCommissionNotification(
  userId: string,
  amount: number,
  type: 'adesao' | 'recorrente'
): Promise<boolean> {
  try {
    const title = type === 'adesao' ? 'Nova Comissão de Adesão' : 'Comissão Recorrente';
    const message = `Você recebeu uma comissão de R$ ${amount.toFixed(2)}!`;

    await createNotification(
      userId,
      title,
      message,
      'comissao',
      'high',
      { amount, type }
    );

    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação de comissão:', error);
    return false;
  }
}

/**
 * Enviar notificação de agendamento
 */
export async function sendAppointmentNotification(
  userId: string,
  barbershopName: string,
  service: string,
  date: Date,
  time: string,
  type: 'confirmacao' | 'lembrete' | 'cancelamento' = 'confirmacao'
): Promise<boolean> {
  try {
    const dataFormatada = date.toLocaleDateString('pt-BR');
    
    let title = '';
    let message = '';
    
    if (type === 'confirmacao') {
      title = 'Agendamento Confirmado';
      message = `Seu agendamento em ${barbershopName} foi confirmado!`;
    } else if (type === 'lembrete') {
      title = 'Lembrete de Agendamento';
      message = `Seu agendamento em ${barbershopName} é amanhã às ${time}.`;
    } else {
      title = 'Agendamento Cancelado';
      message = `Seu agendamento em ${barbershopName} foi cancelado.`;
    }

    await createNotification(
      userId,
      title,
      message,
      'agendamento',
      type === 'lembrete' ? 'normal' : 'high',
      { barbershopName, service, date: dataFormatada, time }
    );

    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação de agendamento:', error);
    return false;
  }
}

/**
 * Enviar notificação de pagamento
 */
export async function sendPaymentNotification(
  userId: string,
  amount: number,
  status: 'success' | 'pending' | 'failed',
  barbershopName: string
): Promise<boolean> {
  try {
    let title = '';
    let message = '';
    let type: Notification['type'] = 'pagamento';

    if (status === 'success') {
      title = 'Pagamento Confirmado';
      message = `Pagamento de R$ ${amount.toFixed(2)} confirmado na ${barbershopName}!`;
      type = 'success';
    } else if (status === 'pending') {
      title = 'Pagamento Pendente';
      message = `Seu pagamento de R$ ${amount.toFixed(2)} está pendente na ${barbershopName}.`;
      type = 'info';
    } else {
      title = 'Pagamento Falhou';
      message = `O pagamento de R$ ${amount.toFixed(2)} na ${barbershopName} falhou.`;
      type = 'error';
    }

    await createNotification(
      userId,
      title,
      message,
      type,
      status === 'failed' ? 'high' : 'normal',
      { amount, status, barbershopName }
    );

    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação de pagamento:', error);
    return false;
  }
}