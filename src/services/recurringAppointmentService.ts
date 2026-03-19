// Serviço de Agendamento Recorrente
// Integração com IA e automação

import { supabase } from "@/integrations/supabase/client";

export interface RecurringAppointment {
  id: string;
  barbershop_id: string;
  professional_id: string;
  service_id: string;
  client_user_id?: string;
  client_name: string;
  client_whatsapp: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  day_of_week?: number; // 0-6 (Sunday-Saturday)
  day_of_month?: number; // 1-31
  start_date: string;
  end_date?: string;
  next_scheduled_at?: string;
  status: 'active' | 'paused' | 'cancelled';
  created_at: string;
}

export interface RecurringAppointmentSeries {
  id: string;
  recurring_id: string;
  original_appointment_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
}

/**
 * Criar agendamento recorrente
 */
export async function createRecurringAppointment(
  data: {
    barbershop_id: string;
    professional_id: string;
    service_id: string;
    client_user_id?: string;
    client_name: string;
    client_whatsapp: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    day_of_week?: number;
    day_of_month?: number;
    start_date: Date;
    end_date?: Date;
  }
): Promise<RecurringAppointment | null> {
  try {
    const { data: recurring, error } = await (supabase as any)
      .from('recurring_appointments')
      .insert({
        barbershop_id: data.barbershop_id,
        professional_id: data.professional_id,
        service_id: data.service_id,
        client_user_id: data.client_user_id,
        client_name: data.client_name,
        client_whatsapp: data.client_whatsapp,
        frequency: data.frequency,
        day_of_week: data.day_of_week,
        day_of_month: data.day_of_month,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date?.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar agendamento recorrente:', error);
      return null;
    }

    // Gerar primeiro agendamento
    await generateFirstAppointment(recurring.id);

    return recurring;
  } catch (error) {
    console.error('Erro ao criar agendamento recorrente:', error);
    return null;
  }
}

/**
 * Gerar primeiro agendamento da série
 */
async function generateFirstAppointment(recurringId: string): Promise<void> {
  try {
    const { data: recurring, error: recurringError } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('id', recurringId)
      .single();

    if (recurringError || !recurring) {
      return;
    }

    const startDate = new Date(recurring.start_date);
    const nextDate = calculateNextDate(startDate, recurring.frequency, recurring.day_of_week, recurring.day_of_month);

    const { error } = await (supabase as any)
      .from('appointments')
      .insert({
        barbershop_id: recurring.barbershop_id,
        professional_id: recurring.professional_id,
        service_id: recurring.service_id,
        client_user_id: recurring.client_user_id,
        client_name: recurring.client_name,
        client_whatsapp: recurring.client_whatsapp,
        scheduled_at: nextDate.toISOString(),
        status: 'scheduled',
        notes: 'Agendamento recorrente',
      });

    if (error) {
      console.error('Erro ao gerar primeiro agendamento:', error);
    }
  } catch (error) {
    console.error('Erro ao gerar primeiro agendamento:', error);
  }
}

/**
 * Calcular próxima data baseada na frequência
 */
function calculateNextDate(
  currentDate: Date,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }

  // Ajustar para o dia da semana especificado
  if (dayOfWeek !== undefined) {
    const dayDiff = dayOfWeek - nextDate.getDay();
    nextDate.setDate(nextDate.getDate() + dayDiff);
  }

  // Ajustar para o dia do mês especificado
  if (dayOfMonth !== undefined) {
    nextDate.setDate(dayOfMonth);
  }

  return nextDate;
}

/**
 * Gerar agendamentos futuros
 */
export async function generateFutureAppointments(
  recurringId: string,
  monthsAhead: number = 3
): Promise<{ success: boolean; count: number }> {
  try {
    const { data: recurring, error: recurringError } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('id', recurringId)
      .single();

    if (recurringError || !recurring) {
      return { success: false, count: 0 };
    }

    if (recurring.status !== 'active') {
      return { success: false, count: 0 };
    }

    let count = 0;
    const startDate = recurring.next_scheduled_at 
      ? new Date(recurring.next_scheduled_at)
      : new Date(recurring.start_date);

    const endDate = recurring.end_date ? new Date(recurring.end_date) : null;
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + monthsAhead);

    let currentDate = startDate;

    while (currentDate <= maxDate && (!endDate || currentDate <= endDate)) {
      // Verificar se já existe agendamento para esta data
      const { data: existing } = await (supabase as any)
        .from('appointments')
        .select('id')
        .eq('barbershop_id', recurring.barbershop_id)
        .eq('professional_id', recurring.professional_id)
        .eq('scheduled_at', currentDate.toISOString())
        .eq('status', 'scheduled')
        .single();

      if (!existing) {
        // Criar agendamento
        const { error } = await (supabase as any)
          .from('appointments')
          .insert({
            barbershop_id: recurring.barbershop_id,
            professional_id: recurring.professional_id,
            service_id: recurring.service_id,
            client_user_id: recurring.client_user_id,
            client_name: recurring.client_name,
            client_whatsapp: recurring.client_whatsapp,
            scheduled_at: currentDate.toISOString(),
            status: 'scheduled',
            notes: 'Agendamento recorrente',
          });

        if (!error) {
          count++;
        }
      }

      // Próxima data
      currentDate = calculateNextDate(
        currentDate,
        recurring.frequency,
        recurring.day_of_week,
        recurring.day_of_month
      );
    }

    // Atualizar próxima data
    if (count > 0) {
      await (supabase as any)
        .from('recurring_appointments')
        .update({ next_scheduled_at: currentDate.toISOString() })
        .eq('id', recurringId);
    }

    return { success: true, count };
  } catch (error) {
    console.error('Erro ao gerar agendamentos futuros:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Cancelar série de agendamentos recorrentes
 */
export async function cancelRecurringSeries(recurringId: string): Promise<boolean> {
  try {
    // Atualizar status da série
    const { error: recurringError } = await (supabase as any)
      .from('recurring_appointments')
      .update({ status: 'cancelled' })
      .eq('id', recurringId);

    if (recurringError) {
      console.error('Erro ao cancelar série:', recurringError);
      return false;
    }

    // Cancelar agendamentos futuros
    const { error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('recurring_id', recurringId)
      .eq('status', 'scheduled');

    if (appointmentsError) {
      console.error('Erro ao cancelar agendamentos:', appointmentsError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao cancelar série:', error);
    return false;
  }
}

/**
 * Pausar série de agendamentos recorrentes
 */
export async function pauseRecurringSeries(recurringId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('recurring_appointments')
      .update({ status: 'paused' })
      .eq('id', recurringId);

    if (error) {
      console.error('Erro ao pausar série:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao pausar série:', error);
    return false;
  }
}

/**
 * Retomar série de agendamentos recorrentes
 */
export async function resumeRecurringSeries(recurringId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('recurring_appointments')
      .update({ status: 'active' })
      .eq('id', recurringId);

    if (error) {
      console.error('Erro ao retomar série:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao retomar série:', error);
    return false;
  }
}

/**
 * Buscar séries de agendamentos recorrentes
 */
export async function getRecurringAppointments(
  barbershopId: string,
  limit: number = 50
): Promise<RecurringAppointment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('start_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes:', error);
    return [];
  }
}

/**
 * Buscar séries de um cliente
 */
export async function getClientRecurringAppointments(
  clientId: string,
  limit: number = 50
): Promise<RecurringAppointment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('client_user_id', clientId)
      .order('start_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes:', error);
    return [];
  }
}

/**
 * Buscar séries de um profissional
 */
export async function getProfessionalRecurringAppointments(
  professionalId: string,
  limit: number = 50
): Promise<RecurringAppointment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('professional_id', professionalId)
      .order('start_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes:', error);
    return [];
  }
}

/**
 * Buscar agendamentos recorrentes ativos
 */
export async function getActiveRecurringAppointments(
  barbershopId: string
): Promise<RecurringAppointment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes ativos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes ativos:', error);
    return [];
  }
}

/**
 * Buscar agendamentos recorrentes por frequência
 */
export async function getRecurringAppointmentsByFrequency(
  barbershopId: string,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
): Promise<RecurringAppointment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('frequency', frequency)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes:', error);
    return [];
  }
}

/**
 * Buscar agendamentos recorrentes por status
 */
export async function getRecurringAppointmentsByStatus(
  barbershopId: string,
  status: 'active' | 'paused' | 'cancelled'
): Promise<RecurringAppointment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('status', status)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes:', error);
    return [];
  }
}

/**
 * Buscar agendamentos recorrentes que terminam hoje ou amanhã
 */
export async function getExpiringRecurringAppointments(): Promise<RecurringAppointment[]> {
  try {
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .gte('end_date', hoje.toISOString())
      .lte('end_date', amanha.toISOString())
      .eq('status', 'active')
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes expirando:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes expirando:', error);
    return [];
  }
}

/**
 * Buscar agendamentos recorrentes que precisam de geração
 */
export async function getRecurringAppointmentsNeedingGeneration(): Promise<RecurringAppointment[]> {
  try {
    const hoje = new Date();

    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('status', 'active')
      .lt('next_scheduled_at', hoje.toISOString())
      .order('next_scheduled_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes:', error);
    return [];
  }
}

/**
 * Gerar agendamentos recorrentes pendentes
 */
export async function generatePendingRecurringAppointments(): Promise<{ success: boolean; count: number }> {
  try {
    const pendentes = await getRecurringAppointmentsNeedingGeneration();
    let count = 0;

    for (const recurring of pendentes) {
      const result = await generateFutureAppointments(recurring.id, 1);
      if (result.success) {
        count += result.count;
      }
    }

    return { success: true, count };
  } catch (error) {
    console.error('Erro ao gerar agendamentos recorrentes pendentes:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Buscar agendamentos recorrentes de hoje
 */
export async function getRecurringAppointmentsToday(): Promise<RecurringAppointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('status', 'active')
      .gte('start_date', startOfDay.toISOString())
      .lte('start_date', endOfDay.toISOString())
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes de hoje:', error);
    return [];
  }
}

/**
 * Buscar agendamentos recorrentes de hoje para um cliente
 */
export async function getRecurringAppointmentsTodayForClient(clientId: string): Promise<RecurringAppointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('client_user_id', clientId)
      .eq('status', 'active')
      .gte('start_date', startOfDay.toISOString())
      .lte('start_date', endOfDay.toISOString())
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes de hoje:', error);
    return [];
  }
}

/**
 * Buscar agendamentos recorrentes de hoje para um profissional
 */
export async function getRecurringAppointmentsTodayForProfessional(professionalId: string): Promise<RecurringAppointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('status', 'active')
      .gte('start_date', startOfDay.toISOString())
      .lte('start_date', endOfDay.toISOString())
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes de hoje:', error);
    return [];
  }
}

/**
 * Buscar agendamentos recorrentes de hoje para uma barbearia
 */
export async function getRecurringAppointmentsTodayForBarbershop(barbershopId: string): Promise<RecurringAppointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('recurring_appointments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'active')
      .gte('start_date', startOfDay.toISOString())
      .lte('start_date', endOfDay.toISOString())
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos recorrentes de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos recorrentes de hoje:', error);
    return [];
  }
}