// Serviço de Agendamento Inteligente
// Integração com IA e automação

import { supabase } from "@/integrations/supabase/client";

export interface Appointment {
  id: string;
  barbershop_id: string;
  professional_id: string;
  service_id: string;
  client_user_id?: string;
  client_name: string;
  client_whatsapp: string;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at: string;
}

export interface SchedulingSuggestion {
  time: string;
  reason: string;
  confidence: number;
}

/**
 * Buscar horários disponíveis
 */
export async function getAvailableSlots(
  barbershopId: string,
  professionalId: string,
  date: Date
): Promise<string[]> {
  try {
    // Buscar agendamentos do dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: appointments, error } = await (supabase as any)
      .from('appointments')
      .select('scheduled_at, status')
      .eq('barbershop_id', barbershopId)
      .eq('professional_id', professionalId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString());

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return [];
    }

    // Gerar slots de 30 em 30 minutos (8h às 20h)
    const slots: string[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }

    // Remover slots ocupados
    const occupiedSlots = (appointments || []).map((a: any) => {
      const date = new Date(a.scheduled_at);
      return `${date.getHours()}:${date.getMinutes()}`;
    });

    return slots.filter(slot => !occupiedSlots.includes(slot));
  } catch (error) {
    console.error('Erro ao buscar horários disponíveis:', error);
    return [];
  }
}

/**
 * Buscar horários disponíveis para um dia específico
 */
export async function getAvailableSlotsForDate(
  barbershopId: string,
  professionalId: string,
  date: Date
): Promise<string[]> {
  return getAvailableSlots(barbershopId, professionalId, date);
}

/**
 * Buscar horários disponíveis para uma semana
 */
export async function getAvailableSlotsForWeek(
  barbershopId: string,
  professionalId: string,
  startDate: Date
): Promise<Record<string, string[]>> {
  const slotsByDay: Record<string, string[]> = {};

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayKey = date.toISOString().split('T')[0];
    slotsByDay[dayKey] = await getAvailableSlots(barbershopId, professionalId, date);
  }

  return slotsByDay;
}

/**
 * Criar agendamento
 */
export async function createAppointment(
  barbershopId: string,
  professionalId: string,
  serviceId: string,
  clientId: string,
  clientName: string,
  clientWhatsApp: string,
  scheduledAt: Date,
  notes?: string
): Promise<Appointment | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('appointments')
      .insert({
        barbershop_id: barbershopId,
        professional_id: professionalId,
        service_id: serviceId,
        client_user_id: clientId,
        client_name: clientName,
        client_whatsapp: clientWhatsApp,
        scheduled_at: scheduledAt.toISOString(),
        status: 'scheduled',
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar agendamento:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return null;
  }
}

/**
 * Atualizar status do agendamento
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: Appointment['status']
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return false;
  }
}

/**
 * Cancelar agendamento
 */
export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<boolean> {
  return updateAppointmentStatus(appointmentId, 'cancelled');
}

/**
 * Buscar agendamentos de um cliente
 */
export async function getClientAppointments(clientId: string, limit: number = 50): Promise<Appointment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('client_user_id', clientId)
      .order('scheduled_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }
}

/**
 * Buscar agendamentos de uma barbearia
 */
export async function getBarbershopAppointments(
  barbershopId: string,
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }
}

/**
 * Buscar agendamentos de um profissional
 */
export async function getProfessionalAppointments(
  professionalId: string,
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('professional_id', professionalId)
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }
}

/**
 * Buscar agendamentos pendentes de hoje
 */
export async function getPendingAppointmentsToday(): Promise<Appointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos pendentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos pendentes:', error);
    return [];
  }
}

/**
 * Buscar agendamentos de hoje
 */
export async function getAppointmentsToday(): Promise<Appointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    return [];
  }
}

/**
 * Buscar agendamentos de hoje para um cliente
 */
export async function getTodayAppointmentsForClient(clientId: string): Promise<Appointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('client_user_id', clientId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    return [];
  }
}

/**
 * Buscar agendamentos de hoje para um profissional
 */
export async function getTodayAppointmentsForProfessional(professionalId: string): Promise<Appointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('professional_id', professionalId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    return [];
  }
}

/**
 * Buscar agendamentos de hoje para uma barbearia
 */
export async function getTodayAppointmentsForBarbershop(barbershopId: string): Promise<Appointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    return [];
  }
}

/**
 * Buscar agendamentos de hoje para um cliente e profissional
 */
export async function getTodayAppointmentsForClientAndProfessional(
  clientId: string,
  professionalId: string
): Promise<Appointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('client_user_id', clientId)
      .eq('professional_id', professionalId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    return [];
  }
}

/**
 * Buscar agendamentos de hoje para um cliente e barbearia
 */
export async function getTodayAppointmentsForClientAndBarbershop(
  clientId: string,
  barbershopId: string
): Promise<Appointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('client_user_id', clientId)
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    return [];
  }
}

/**
 * Buscar agendamentos de hoje para um profissional e barbearia
 */
export async function getTodayAppointmentsForProfessionalAndBarbershop(
  professionalId: string,
  barbershopId: string
): Promise<Appointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    return [];
  }
}

/**
 * Buscar agendamentos de hoje para um cliente, profissional e barbearia
 */
export async function getTodayAppointmentsForAll(
  clientId: string,
  professionalId: string,
  barbershopId: string
): Promise<Appointment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('client_user_id', clientId)
      .eq('professional_id', professionalId)
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    return [];
  }
}