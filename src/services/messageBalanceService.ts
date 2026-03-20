// Message Balance Service
// Balanceamento de envio entre múltiplos números de WhatsApp

import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppNumber {
  id: string;
  whatsapp_account_id: string;
  phone_number: string;
  usage_count: number;
  successful_count: number;
  failed_count: number;
  blocked_count: number;
  last_used_at?: string;
  last_success_at?: string;
  last_failed_at?: string;
  is_blocked: boolean;
  blocked_until?: string;
  cooldown_minutes: number;
  priority: number;
  is_active: boolean;
}

export interface SendingPolicy {
  barbershop_id: string;
  max_messages_per_minute: number;
  max_messages_per_hour: number;
  max_messages_per_day: number;
  cooldown_between_messages: number;
  enable_auto_rotation: boolean;
  block_on_failure_count: number;
  auto_unblock_after_hours: number;
}

export async function getNextAvailableNumber(barbershopId: string): Promise<{
  success: boolean;
  number?: WhatsAppNumber & { account_nickname?: string };
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .rpc('get_next_available_whatsapp_number', { p_barbershop_id: barbershopId })
      .single();

    if (error || !data) {
      return { success: false, error: 'Nenhum número disponível encontrado' };
    }

    return {
      success: true,
      number: {
        id: data.whatsapp_number_id,
        whatsapp_account_id: data.whatsapp_account_id,
        phone_number: data.phone_number,
        account_nickname: data.account_nickname,
        usage_count: 0,
        successful_count: 0,
        failed_count: 0,
        blocked_count: 0,
        is_blocked: false,
        cooldown_minutes: 30,
        priority: 1,
        is_active: true,
      },
    };
  } catch (error: any) {
    console.error('Erro ao buscar próximo número:', error);
    return { success: false, error: error.message };
  }
}

export async function registerUsage(
  whatsappNumberId: string,
  success: boolean,
  errorReason?: string
): Promise<void> {
  try {
    await supabase.rpc('register_whatsapp_number_usage', {
      p_whatsapp_number_id: whatsappNumberId,
      p_success: success,
      p_error_reason: errorReason,
    });
  } catch (error) {
    console.error('Erro ao registrar uso:', error);
  }
}

export async function getNumbersByBarbershop(barbershopId: string): Promise<WhatsAppNumber[]> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .select('*')
      .eq('whatsapp_accounts.barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .order('usage_count', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar números:', error);
    return [];
  }
}

export async function getNumberById(numberId: string): Promise<WhatsAppNumber | null> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .select('*')
      .eq('id', numberId)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function blockNumber(
  numberId: string,
  until: Date,
  reason: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('whatsapp_numbers')
      .update({
        is_blocked: true,
        blocked_until: until.toISOString(),
        blocked_count: 1,
      })
      .eq('id', numberId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao bloquear número:', error);
    return false;
  }
}

export async function unblockNumber(numberId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('whatsapp_numbers')
      .update({
        is_blocked: false,
        blocked_until: null,
      })
      .eq('id', numberId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao desbloquear número:', error);
    return false;
  }
}

export async function updateNumberPriority(
  numberId: string,
  priority: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('whatsapp_numbers')
      .update({ priority })
      .eq('id', numberId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar prioridade:', error);
    return false;
  }
}

export async function resetNumberStats(numberId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('whatsapp_numbers')
      .update({
        usage_count: 0,
        successful_count: 0,
        failed_count: 0,
        blocked_count: 0,
      })
      .eq('id', numberId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao resetar estatísticas:', error);
    return false;
  }
}

export async function getSendingPolicy(barbershopId: string): Promise<SendingPolicy | null> {
  try {
    const { data, error } = await supabase
      .from('sending_policies')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single();

    if (error || !data) {
      return {
        barbershop_id: barbershopId,
        max_messages_per_minute: 10,
        max_messages_per_hour: 200,
        max_messages_per_day: 1000,
        cooldown_between_messages: 3,
        enable_auto_rotation: true,
        block_on_failure_count: 5,
        auto_unblock_after_hours: 24,
      };
    }

    return data;
  } catch {
    return null;
  }
}

export async function updateSendingPolicy(
  barbershopId: string,
  policy: Partial<SendingPolicy>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sending_policies')
      .update({ ...policy, updated_at: new Date().toISOString() })
      .eq('barbershop_id', barbershopId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar política:', error);
    return false;
  }
}

export async function checkRateLimit(barbershopId: string): Promise<{
  allowed: boolean;
  reason?: string;
  wait_seconds?: number;
}> {
  try {
    const policy = await getSendingPolicy(barbershopId);
    if (!policy) return { allowed: true };

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    const { data: recentMessages } = await supabase
      .from('message_sending_logs')
      .select('created_at')
      .eq('whatsapp_accounts.barbershop_id', barbershopId)
      .gte('created_at', oneMinuteAgo.toISOString());

    const minuteCount = recentMessages?.length || 0;
    if (minuteCount >= policy.max_messages_per_minute) {
      return {
        allowed: false,
        reason: 'Limite de mensagens por minuto atingido',
        wait_seconds: 60 - Math.floor((now.getTime() - new Date(recentMessages[0].created_at).getTime()) / 1000),
      };
    }

    const { data: hourMessages } = await supabase
      .from('message_sending_logs')
      .select('created_at')
      .eq('whatsapp_accounts.barbershop_id', barbershopId)
      .gte('created_at', oneHourAgo.toISOString());

    const hourCount = hourMessages?.length || 0;
    if (hourCount >= policy.max_messages_per_hour) {
      return {
        allowed: false,
        reason: 'Limite de mensagens por hora atingido',
        wait_seconds: 3600 - Math.floor((now.getTime() - oneHourAgo.getTime()) / 1000),
      };
    }

    const { data: dayMessages } = await supabase
      .from('message_sending_logs')
      .select('created_at')
      .eq('whatsapp_accounts.barbershop_id', barbershopId)
      .gte('created_at', oneDayAgo.toISOString());

    const dayCount = dayMessages?.length || 0;
    if (dayCount >= policy.max_messages_per_day) {
      return {
        allowed: false,
        reason: 'Limite de mensagens por dia atingido',
        wait_seconds: 86400 - Math.floor((now.getTime() - oneDayAgo.getTime()) / 1000),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Erro ao verificar rate limit:', error);
    return { allowed: true };
  }
}

export async function getSendingStats(barbershopId: string): Promise<{
  today: number;
  thisHour: number;
  thisMinute: number;
  blockedNumbers: number;
  activeNumbers: number;
}> {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    const [
      { count: todayCount },
      { count: hourCount },
      { count: minuteCount },
      { data: blockedNumbers },
      { data: activeNumbers },
    ] = await Promise.all([
      supabase
        .from('message_sending_logs')
        .select('*', { count: 'exact', head: true })
        .eq('whatsapp_accounts.barbershop_id', barbershopId)
        .gte('created_at', oneDayAgo.toISOString()),
      supabase
        .from('message_sending_logs')
        .select('*', { count: 'exact', head: true })
        .eq('whatsapp_accounts.barbershop_id', barbershopId)
        .gte('created_at', oneHourAgo.toISOString()),
      supabase
        .from('message_sending_logs')
        .select('*', { count: 'exact', head: true })
        .eq('whatsapp_accounts.barbershop_id', barbershopId)
        .gte('created_at', oneMinuteAgo.toISOString()),
      supabase
        .from('whatsapp_numbers')
        .select('id', { count: 'exact', head: true })
        .eq('whatsapp_accounts.barbershop_id', barbershopId)
        .eq('is_blocked', true),
      supabase
        .from('whatsapp_numbers')
        .select('id', { count: 'exact', head: true })
        .eq('whatsapp_accounts.barbershop_id', barbershopId)
        .eq('is_active', true)
        .eq('is_blocked', false),
    ]);

    return {
      today: todayCount || 0,
      thisHour: hourCount || 0,
      thisMinute: minuteCount || 0,
      blockedNumbers: blockedNumbers?.length || 0,
      activeNumbers: activeNumbers?.length || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      today: 0,
      thisHour: 0,
      thisMinute: 0,
      blockedNumbers: 0,
      activeNumbers: 0,
    };
  }
}
