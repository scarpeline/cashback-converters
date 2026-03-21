// Blocking Alert Service
// Alertas de bloqueios e problemas para super admin

import { supabase } from '@/integrations/supabase/client';

export type AlertType = 'blocked' | 'rate_limit' | 'cooldown' | 'high_failure_rate' | 'no_available_numbers';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BlockedAlert {
  id: string;
  whatsapp_number_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  suggested_action?: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface CreateAlertParams {
  barbershopId: string;
  whatsappNumberId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  suggestedAction?: string;
}

export async function createAlert(params: CreateAlertParams): Promise<{
  success: boolean;
  alertId?: string;
  error?: string;
}> {
  try {
    const { data, error } = await (supabase as any)
      .from('blocked_numbers_alerts')
      .insert({
        whatsapp_number_id: params.whatsappNumberId || '00000000-0000-0000-0000-000000000000',
        alert_type: params.alertType,
        severity: params.severity,
        message: params.message,
        suggested_action: params.suggestedAction,
      })
      .select('id')
      .single();

    if (error) throw error;

    await notifySuperAdmins(data.id);

    return { success: true, alertId: data.id };
  } catch (error: any) {
    console.error('Erro ao criar alerta:', error);
    return { success: false, error: error.message };
  }
}

async function notifySuperAdmins(alertId: string): Promise<void> {
  try {
    const { data: alert } = await (supabase as any)
      .from('blocked_numbers_alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (!alert) return;

    const { data: superAdmins } = await (supabase as any)
      .from('authorized_super_admins')
      .select('email')
      .eq('is_active', true);

    const { data: numberInfo } = await (supabase as any)
      .from('whatsapp_numbers')
      .select('phone_number, whatsapp_accounts(barbershop_id, barbershops(name))')
      .eq('id', alert.whatsapp_number_id)
      .single();

    const barbershopName = numberInfo?.whatsapp_accounts?.barbershops?.name || 'Desconhecido';
    const phoneNumber = numberInfo?.phone_number || 'N/A';

    for (const admin of superAdmins || []) {
      await (supabase as any).from('notifications').insert({
        user_id: admin.email,
        title: `⚠️ Alerta de Bloqueio WhatsApp`,
        message: `Barbearia: ${barbershopName}\nNúmero: ${phoneNumber}\nTipo: ${alert.alert_type}\nMensagem: ${alert.message}\nSugestão: ${alert.suggested_action || 'N/A'}`,
        type: 'warning',
        priority: alert.severity === 'critical' ? 'high' : 'normal',
        data: { alert_id: alertId, severity: alert.severity },
      });
    }
  } catch (error) {
    console.error('Erro ao notificar super admins:', error);
  }
}

export async function getAlerts(params: {
  barbershopId?: string;
  isResolved?: boolean;
  severity?: AlertSeverity;
  limit?: number;
}): Promise<BlockedAlert[]> {
  try {
    let query = (supabase as any)
      .from('blocked_numbers_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.isResolved !== undefined) {
      query = query.eq('is_resolved', params.isResolved);
    }

    if (params.severity) {
      query = query.eq('severity', params.severity);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    let alerts = data || [];

    if (params.barbershopId) {
      const { data: numberIds } = await (supabase as any)
        .from('whatsapp_numbers')
        .select('id')
        .eq('whatsapp_accounts.barbershop_id', params.barbershopId);

      const validIds = numberIds?.map(n => n.id) || [];
      validIds.push('00000000-0000-0000-0000-000000000000');
      alerts = alerts.filter(a => validIds.includes(a.whatsapp_number_id));
    }

    return alerts;
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return [];
  }
}

export async function getUnresolvedAlerts(barbershopId?: string): Promise<BlockedAlert[]> {
  return getAlerts({ barbershopId, isResolved: false });
}

export async function getCriticalAlerts(): Promise<BlockedAlert[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('blocked_numbers_alerts')
      .select('*')
      .eq('is_resolved', false)
      .in('severity', ['high', 'critical'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar alertas críticos:', error);
    return [];
  }
}

export async function resolveAlert(
  alertId: string,
  resolvedByUserId: string
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('blocked_numbers_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedByUserId,
      })
      .eq('id', alertId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    return false;
  }
}

export async function resolveAllAlerts(
  barbershopId: string,
  resolvedByUserId: string
): Promise<number> {
  try {
    const { data: numberIds } = await (supabase as any)
      .from('whatsapp_numbers')
      .select('id')
      .eq('whatsapp_accounts.barbershop_id', barbershopId);

    const validIds = numberIds?.map(n => n.id) || [];

    const { error, count } = await (supabase as any)
      .from('blocked_numbers_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedByUserId,
      })
      .eq('is_resolved', false)
      .in('whatsapp_number_id', validIds);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Erro ao resolver todos os alertas:', error);
    return 0;
  }
}

export async function deleteAlert(alertId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('blocked_numbers_alerts')
      .delete()
      .eq('id', alertId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao deletar alerta:', error);
    return false;
  }
}

export async function getAlertStats(barbershopId?: string): Promise<{
  total: number;
  unresolved: number;
  critical: number;
  high: number;
  byType: Record<string, number>;
}> {
  try {
    const alerts = await getAlerts({ barbershopId });

    const stats = {
      total: alerts.length,
      unresolved: alerts.filter(a => !a.is_resolved).length,
      critical: alerts.filter(a => !a.is_resolved && a.severity === 'critical').length,
      high: alerts.filter(a => !a.is_resolved && a.severity === 'high').length,
      byType: {} as Record<string, number>,
    };

    for (const alert of alerts) {
      stats.byType[alert.alert_type] = (stats.byType[alert.alert_type] || 0) + 1;
    }

    return stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      total: 0,
      unresolved: 0,
      critical: 0,
      high: 0,
      byType: {},
    };
  }
}

export async function autoResolveOldAlerts(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error, count } = await (supabase as any)
      .from('blocked_numbers_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: 'system',
      })
      .eq('is_resolved', false)
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Erro ao resolver alertas antigos:', error);
    return 0;
  }
}
