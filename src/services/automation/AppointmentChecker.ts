import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço para verificar agendamentos do cliente na semana atual
 * Objetivo: Evitar envio de automações para clientes já agendados
 */

export interface AppointmentCheckResult {
  hasAppointment: boolean;
  appointments: any[];
  weekStart: Date;
  weekEnd: Date;
}

/**
 * Verifica se o cliente possui agendamento confirmado na semana atual
 * @param clientId ID do cliente (user_id na tabela profiles)
 * @param barbershopId ID da barbearia (opcional, para filtrar por barbearia específica)
 * @returns Promise<AppointmentCheckResult>
 */
export async function verificarAgendamentoSemanaAtual(
  clientId: string,
  barbershopId?: string
): Promise<AppointmentCheckResult> {
  try {
    // Calcular início e fim da semana atual (domingo a sábado)
    const today = new Date();
    const currentDay = today.getDay(); // 0 = domingo, 6 = sábado
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Buscar agendamentos do cliente na semana atual
    let query = (supabase as any)
      .from('appointments')
      .select('*')
      .eq('client_user_id', clientId)
      .gte('scheduled_at', weekStart.toISOString())
      .lte('scheduled_at', weekEnd.toISOString())
      .in('status', ['confirmed', 'pending', 'scheduled']);

    // Se barbershopId for fornecido, filtrar por barbearia específica
    if (barbershopId) {
      query = query.eq('barbershop_id', barbershopId);
    }

    const { data: appointments, error } = await query.order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao verificar agendamentos:', error);
      return {
        hasAppointment: false,
        appointments: [],
        weekStart,
        weekEnd
      };
    }

    return {
      hasAppointment: appointments && appointments.length > 0,
      appointments: appointments || [],
      weekStart,
      weekEnd
    };
  } catch (error) {
    console.error('Erro ao verificar agendamento na semana atual:', error);
    return {
      hasAppointment: false,
      appointments: [],
      weekStart: new Date(),
      weekEnd: new Date()
    };
  }
}

/**
 * Verifica se deve bloquear automação para o cliente
 * @param clientId ID do cliente
 * @param barbershopId ID da barbearia (opcional)
 * @param settings Configurações de automação (opcional)
 * @returns Promise<boolean> true se deve bloquear, false se pode enviar
 */
export async function deveBloquearAutomacao(
  clientId: string,
  barbershopId?: string,
  settings?: {
    blockIfHasAppointment: boolean;
    blockOnlyConfirmed: boolean;
  }
): Promise<boolean> {
  // Se a configuração estiver desativada, não bloquear
  if (settings?.blockIfHasAppointment === false) {
    return false;
  }

  const check = await verificarAgendamentoSemanaAtual(clientId, barbershopId);
  
  if (!check.hasAppointment) {
    return false; // Não tem agendamento, pode enviar
  }

  // Se só deve bloquear agendamentos confirmados
  if (settings?.blockOnlyConfirmed) {
    const confirmedAppointments = check.appointments.filter(
      apt => apt.status === 'confirmed'
    );
    return confirmedAppointments.length > 0;
  }

  // Bloquear qualquer tipo de agendamento (confirmado, pending, scheduled)
  return true;
}

/**
 * Registra log de bloqueio de automação
 * @param clientId ID do cliente
 * @param automationType Tipo da automação bloqueada
 * @param reason Motivo do bloqueio
 * @param barbershopId ID da barbearia
 */
export async function registrarBloqueioAutomacao(
  clientId: string,
  automationType: string,
  reason: string,
  barbershopId?: string
): Promise<void> {
  try {
    await (supabase as any).from('automation_blocked_logs').insert({
      client_id: clientId,
      automation_type: automationType,
      block_reason: reason,
      barbershop_id: barbershopId,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao registrar bloqueio de automação:', error);
  }
}

/**
 * Tipos de automação que devem ser verificadas
 */
export const AUTOMATION_TYPES_TO_CHECK = [
  'no_visit_7d',
  'no_visit_15d', 
  'no_visit_30d',
  'post_service',
  'marketing_campaign',
  'reactivation',
  'promotion',
  'bulk_message',
  'return_automation'
] as const;

/**
 * Tipos de automação que NÃO devem ser bloqueadas (exceções)
 */
export const AUTOMATION_EXCEPTIONS = [
  'reminder_24h',
  'reminder_12h',
  'reminder_7h',
  'reminder_5h',
  'reminder_2h',
  'reminder_1h',
  'reminder_push_24h',
  'reminder_push_7h',
  'reminder_push_2h',
  'appointment_confirmation',
  'schedule_change',
  'cancellation',
  'reschedule'
] as const;

/**
 * Verifica se o tipo de automação deve ser checado
 * @param automationType Tipo da automação
 * @returns boolean
 */
export function deveVerificarAgendamento(automationType: string): boolean {
  return AUTOMATION_TYPES_TO_CHECK.includes(automationType as any) &&
         !AUTOMATION_EXCEPTIONS.includes(automationType as any);
}
