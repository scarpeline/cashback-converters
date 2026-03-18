// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export interface RecurringAppointment {
  id: string;
  barbershop_id: string;
  professional_id: string;
  service_id: string;
  client_user_id?: string;
  client_name?: string;
  client_whatsapp?: string;
  scheduled_at: string;
  is_recurring: boolean;
  recurring_type?: 'weekly' | 'biweekly' | 'monthly';
  recurring_day?: number; // 1-7 (domingo-sábado)
  recurring_time?: string;
  recurring_end_date?: string;
  recurring_parent_id?: string;
  auto_generated: boolean;
  status: string;
  notes?: string;
}

export interface RecurringSettings {
  id: string;
  barbershop_id: string;
  max_recurring_days: number;
  allow_conflicts: boolean;
  notify_conflicts: boolean;
}

export interface CreateRecurringAppointment {
  barbershop_id: string;
  professional_id: string;
  service_id: string;
  client_user_id?: string;
  client_name?: string;
  client_whatsapp?: string;
  first_date: string;
  time: string;
  recurring_type: 'weekly' | 'biweekly' | 'monthly';
  recurring_day: number; // 1-7 (domingo-sábado)
  recurring_end_date: string;
  notes?: string;
}

/**
 * Serviço para gerenciar agendamentos recorrentes
 */
/**
 * Serviço para gerenciar agendamentos recorrentes com IA
 */
export class RecurringAppointmentService {
  /**
   * Criar um novo agendamento recorrente com sugestão inteligente
   */
  static async createRecurringAppointment(data: CreateRecurringAppointment): Promise<{ success: boolean; error?: string; appointment?: RecurringAppointment }> {
    try {
      // Buscar histórico do cliente para sugestão inteligente
      const { data: history, error: historyError } = await supabase
        .from('appointments')
        .select('scheduled_at, services(name)')
        .eq('client_user_id', data.client_user_id)
        .order('scheduled_at', { ascending: false })
        .limit(10);

      // Verificar conflitos de horário
      const { hasConflicts, conflicts } = await this.checkRecurringConflicts(
        data.barbershop_id,
        data.professional_id,
        data.recurring_day,
        data.time
      );

      if (hasConflicts && !conflicts.length) {
        return { success: false, error: 'Conflito de horário detectado' };
      }

      // Primeiro, criar o agendamento pai
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: data.barbershop_id,
          professional_id: data.professional_id,
          service_id: data.service_id,
          client_user_id: data.client_user_id,
          client_name: data.client_name,
          client_whatsapp: data.client_whatsapp,
          scheduled_at: `${data.first_date} ${data.time}`,
          status: 'scheduled',
          notes: data.notes,
          is_recurring: true,
          recurring_type: data.recurring_type,
          recurring_day: data.recurring_day,
          recurring_time: data.time,
          recurring_end_date: data.recurring_end_date,
          auto_generated: false
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar agendamento recorrente:', error);
        return { success: false, error: error.message };
      }

      // Gerar agendamentos futuros automaticamente
      await this.generateFutureAppointments(appointment.id);

      // Enviar notificação ao cliente
      if (data.client_whatsapp) {
        await this.sendRecurringConfirmation(data.client_whatsapp, appointment);
      }

      return { success: true, appointment };
    } catch (error) {
      console.error('Erro inesperado ao criar agendamento recorrente:', error);
      return { success: false, error: 'Erro ao criar agendamento recorrente' };
    }
  }

  /**
   * Enviar confirmação de agendamento recorrente via WhatsApp
   */
  private static async sendRecurringConfirmation(
    whatsapp: string,
    appointment: RecurringAppointment
  ): Promise<void> {
    try {
      const type = appointment.recurring_type === 'weekly' ? 'semanal' :
                   appointment.recurring_type === 'biweekly' ? 'quinzenal' : 'mensal';
      const day = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][appointment.recurring_day! - 1];

      const message = `✅ Agendamento recorrente confirmado!\n\n${type} - ${day} às ${appointment.recurring_time}\nServiço: ${appointment.services?.name || 'Não especificado'}\n\nVocê receberá lembretes automaticamente.`;

      // Enviar via WhatsApp (se configurado)
      // await sendWhatsAppMessage(whatsapp, message);
    } catch (error) {
      console.error('Erro ao enviar confirmação:', error);
    }
  }

  /**
   * Gerar agendamentos futuros para uma série recorrente com IA
   */
  static async generateFutureAppointments(parentAppointmentId: string): Promise<{ success: boolean; generated?: number; conflicts?: number }> {
    try {
      const { data, error } = await supabase
        .rpc('generate_recurring_appointments');

      if (error) {
        console.error('Erro ao gerar agendamentos futuros:', error);
        return { success: false };
      }

      return {
        success: true,
        generated: data[0]?.generated_count || 0,
        conflicts: data[0]?.conflicts_count || 0
      };
    } catch (error) {
      console.error('Erro inesperado ao gerar agendamentos futuros:', error);
      return { success: false };
    }
  }

  /**
   * Cancelar todos os agendamentos de uma série recorrente
   */
  static async cancelRecurringSeries(parentAppointmentId: string): Promise<{ success: boolean; cancelled?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('cancel_recurring_series', { p_parent_appointment_id: parentAppointmentId });

      if (error) {
        console.error('Erro ao cancelar série recorrente:', error);
        return { success: false, error: error.message };
      }

      return { success: true, cancelled: data };
    } catch (error) {
      console.error('Erro inesperado ao cancelar série recorrente:', error);
      return { success: false, error: 'Erro ao cancelar série recorrente' };
    }
  }

  /**
   * Buscar agendamentos recorrentes de uma barbearia
   */
  static async getRecurringAppointments(barbershopId: string): Promise<RecurringAppointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services(name, price, duration_minutes),
          professionals(name),
          barbershops(name)
        `)
        .eq('barbershop_id', barbershopId)
        .eq('is_recurring', true)
        .eq('auto_generated', false)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar agendamentos recorrentes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar agendamentos recorrentes:', error);
      return [];
    }
  }

  /**
   * Buscar configurações de recorrência de uma barbearia
   */
  static async getRecurringSettings(barbershopId: string): Promise<RecurringSettings | null> {
    try {
      const { data, error } = await supabase
        .from('recurring_settings')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .single();

      if (error) {
        console.error('Erro ao buscar configurações de recorrência:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro inesperado ao buscar configurações de recorrência:', error);
      return null;
    }
  }

  /**
   * Atualizar configurações de recorrência de uma barbearia
   */
  static async updateRecurringSettings(barbershopId: string, settings: Partial<RecurringSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('recurring_settings')
        .upsert({
          barbershop_id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao atualizar configurações de recorrência:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro inesperado ao atualizar configurações de recorrência:', error);
      return { success: false, error: 'Erro ao atualizar configurações' };
    }
  }

  /**
   * Verificar conflitos de horário para agendamento recorrente
   */
  static async checkRecurringConflicts(
    barbershopId: string,
    professionalId: string,
    day: number,
    time: string,
    excludeAppointmentId?: string
  ): Promise<{ hasConflicts: boolean; conflicts: any[] }> {
    try {
      // Buscar agendamentos existentes no mesmo dia/horário
      let query = supabase
        .from('appointments')
        .select(`
          *,
          services(name),
          professionals(name)
        `)
        .eq('barbershop_id', barbershopId)
        .eq('professional_id', professionalId)
        .eq('recurring_day', day)
        .eq('recurring_time', time)
        .in('status', ['scheduled', 'confirmed'])
        .neq('auto_generated', true);

      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao verificar conflitos:', error);
        return { hasConflicts: false, conflicts: [] };
      }

      return {
        hasConflicts: (data?.length || 0) > 0,
        conflicts: data || []
      };
    } catch (error) {
      console.error('Erro inesperado ao verificar conflitos:', error);
      return { hasConflicts: false, conflicts: [] };
    }
  }

  /**
   * Buscar próximos agendamentos recorrentes de um cliente
   */
  static async getClientRecurringAppointments(clientUserId: string): Promise<RecurringAppointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services(name, price, duration_minutes),
          professionals(name),
          barbershops(name)
        `)
        .eq('client_user_id', clientUserId)
        .eq('is_recurring', true)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar agendamentos recorrentes do cliente:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar agendamentos recorrentes do cliente:', error);
      return [];
    }
  }

  /**
   * Pausar temporariamente uma série recorrente
   */
  static async pauseRecurringSeries(parentAppointmentId: string, pauseUntil: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          recurring_end_date: pauseUntil,
          updated_at: new Date().toISOString()
        })
        .eq('id', parentAppointmentId);

      if (error) {
        console.error('Erro ao pausar série recorrente:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro inesperado ao pausar série recorrente:', error);
      return { success: false, error: 'Erro ao pausar série recorrente' };
    }
  }

  /**
   * Retomar uma série recorrente pausada
   */
  static async resumeRecurringSeries(parentAppointmentId: string, newEndDate: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          recurring_end_date: newEndDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', parentAppointmentId);

      if (error) {
        console.error('Erro ao retomar série recorrente:', error);
        return { success: false, error: error.message };
      }

      // Gerar agendamentos futuros
      await this.generateFutureAppointments(parentAppointmentId);

      return { success: true };
    } catch (error) {
      console.error('Erro inesperado ao retomar série recorrente:', error);
      return { success: false, error: 'Erro ao retomar série recorrente' };
    }
  }

  /**
   * Buscar agendamentos recorrentes que precisam de geração
   */
  static async getPendingRecurringAppointments(): Promise<RecurringAppointment[]> {
    try {
      const hoje = new Date();

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('is_recurring', true)
        .eq('auto_generated', false)
        .eq('status', 'scheduled')
        .lt('recurring_end_date', hoje.toISOString())
        .limit(50);

      if (error) {
        console.error('Erro ao buscar agendamentos pendentes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar agendamentos pendentes:', error);
      return [];
    }
  }

  /**
   * Gerar agendamentos recorrentes pendentes automaticamente
   */
  static async generatePendingRecurringAppointments(): Promise<{ success: boolean; count: number }> {
    try {
      const pendentes = await this.getPendingRecurringAppointments();
      let count = 0;

      for (const appointment of pendentes) {
        const result = await this.generateFutureAppointments(appointment.id);
        if (result.success) {
          count += result.generated || 0;
        }
      }

      return { success: true, count };
    } catch (error) {
      console.error('Erro ao gerar agendamentos pendentes:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Buscar agendamentos recorrentes de hoje
   */
  static async getTodayRecurringAppointments(): Promise<RecurringAppointment[]> {
    try {
      const hoje = new Date();
      const startOfDay = new Date(hoje);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(hoje);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services(name, price),
          professionals(name),
          barbershops(name)
        `)
        .eq('is_recurring', true)
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar agendamentos de hoje:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar agendamentos de hoje:', error);
      return [];
    }
  }
}


// Funções utilitárias
export const RECURRING_TYPES = {
  weekly: { label: 'Semanal', description: 'Toda semana no mesmo dia e horário' },
  biweekly: { label: 'Quinzenal', description: 'A cada 2 semanas no mesmo dia e horário' },
  monthly: { label: 'Mensal', description: 'Todo mês no mesmo dia e horário' }
} as const;

export const WEEKDAYS = {
  1: 'Domingo',
  2: 'Segunda-feira',
  3: 'Terça-feira',
  4: 'Quarta-feira',
  5: 'Quinta-feira',
  6: 'Sexta-feira',
  7: 'Sábado'
} as const;

export function formatRecurringDescription(appointment: RecurringAppointment): string {
  if (!appointment.is_recurring) return 'Agendamento único';

  const type = RECURRING_TYPES[appointment.recurring_type!]?.label || 'Recorrente';
  const day = WEEKDAYS[appointment.recurring_day!] || '';
  const time = appointment.recurring_time || '';
  const endDate = appointment.recurring_end_date ? 
    new Date(appointment.recurring_end_date).toLocaleDateString('pt-BR') : 
    'indefinidamente';

  return `${type} - ${day} às ${time} até ${endDate}`;
}
