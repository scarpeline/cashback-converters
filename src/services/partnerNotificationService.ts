/**
 * Serviço de notificações para parceiros
 * Notifica parceiros sobre eventos importantes (comissões, indicações, etc)
 */

import { supabase } from '@/integrations/supabase/client';

export interface PartnerNotification {
  id: string;
  partner_id: string;
  type: 'commission_generated' | 'commission_approved' | 'commission_paid' | 'referral_completed' | 'new_referral';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

/**
 * Criar notificação para parceiro
 */
export async function createPartnerNotification(
  partnerId: string,
  type: PartnerNotification['type'],
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('partner_notifications')
      .insert([{
        partner_id: partnerId,
        type,
        title,
        message,
        data,
        read: false,
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return false;
  }
}

/**
 * Buscar notificações não lidas de um parceiro
 */
export async function getUnreadNotifications(partnerId: string): Promise<PartnerNotification[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('partner_notifications')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
}

/**
 * Buscar todas as notificações de um parceiro
 */
export async function getAllNotifications(partnerId: string, limit = 50): Promise<PartnerNotification[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('partner_notifications')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
}

/**
 * Marcar notificação como lida
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('partner_notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return false;
  }
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllNotificationsAsRead(partnerId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('partner_notifications')
      .update({ read: true })
      .eq('partner_id', partnerId)
      .eq('read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return false;
  }
}

/**
 * Deletar notificação
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('partner_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    return false;
  }
}

/**
 * Notificar parceiro sobre comissão gerada
 */
export async function notifyCommissionGenerated(
  partnerId: string,
  amount: number,
  type: 'referral' | 'franchise_revenue' | 'network_revenue'
): Promise<boolean> {
  const typeLabel = {
    referral: 'indicação',
    franchise_revenue: 'franquia',
    network_revenue: 'rede'
  }[type];

  return createPartnerNotification(
    partnerId,
    'commission_generated',
    'Nova comissão gerada',
    `Você ganhou R$ ${amount.toFixed(2)} de comissão por ${typeLabel}`,
    { amount, type }
  );
}

/**
 * Notificar parceiro sobre comissão aprovada
 */
export async function notifyCommissionApproved(
  partnerId: string,
  amount: number
): Promise<boolean> {
  return createPartnerNotification(
    partnerId,
    'commission_approved',
    'Comissão aprovada',
    `Sua comissão de R$ ${amount.toFixed(2)} foi aprovada e está pronta para pagamento`,
    { amount }
  );
}

/**
 * Notificar parceiro sobre comissão paga
 */
export async function notifyCommissionPaid(
  partnerId: string,
  amount: number
): Promise<boolean> {
  return createPartnerNotification(
    partnerId,
    'commission_paid',
    'Comissão paga',
    `Você recebeu R$ ${amount.toFixed(2)} de comissão`,
    { amount }
  );
}

/**
 * Notificar parceiro sobre nova indicação
 */
export async function notifyNewReferral(
  partnerId: string,
  referredName: string
): Promise<boolean> {
  return createPartnerNotification(
    partnerId,
    'new_referral',
    'Nova indicação',
    `${referredName} se cadastrou com seu código de referência`,
    { referredName }
  );
}

/**
 * Notificar parceiro sobre indicação completada
 */
export async function notifyReferralCompleted(
  partnerId: string,
  referredName: string,
  amount: number
): Promise<boolean> {
  return createPartnerNotification(
    partnerId,
    'referral_completed',
    'Indicação completada',
    `${referredName} fez seu primeiro pagamento. Você ganhou R$ ${amount.toFixed(2)}`,
    { referredName, amount }
  );
}
