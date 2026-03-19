// Hook para Agendamento Inteligente
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAvailableSlots,
  getAvailableSlotsForDate,
  getAvailableSlotsForWeek,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  getClientAppointments,
  getBarbershopAppointments,
  getProfessionalAppointments,
  getPendingAppointmentsToday,
  getAppointmentsToday,
  getTodayAppointmentsForClient,
  getTodayAppointmentsForProfessional,
  getTodayAppointmentsForBarbershop,
  getTodayAppointmentsForClientAndProfessional,
  getTodayAppointmentsForClientAndBarbershop,
  getTodayAppointmentsForProfessionalAndBarbershop,
  getTodayAppointmentsForAll,
  type Appointment 
} from '@/services/schedulingService';

// Chaves de query para cache
export const schedulingKeys = {
  all: ['scheduling'] as const,
  slots: (barbershopId: string, professionalId: string, date: string) => 
    [...schedulingKeys.all, 'slots', barbershopId, professionalId, date] as const,
  weekSlots: (barbershopId: string, professionalId: string, startDate: string) => 
    [...schedulingKeys.all, 'weekSlots', barbershopId, professionalId, startDate] as const,
  client: (clientId: string) => [...schedulingKeys.all, 'client', clientId] as const,
  barbershop: (barbershopId: string, start: string, end: string) => 
    [...schedulingKeys.all, 'barbershop', barbershopId, start, end] as const,
  professional: (professionalId: string, start: string, end: string) => 
    [...schedulingKeys.all, 'professional', professionalId, start, end] as const,
  today: () => [...schedulingKeys.all, 'today'] as const,
};

/**
 * Hook para buscar horários disponíveis
 */
export function useAvailableSlots(
  barbershopId: string,
  professionalId: string,
  date: Date
) {
  return useQuery({
    queryKey: schedulingKeys.slots(barbershopId, professionalId, date.toISOString()),
    queryFn: () => getAvailableSlots(barbershopId, professionalId, date),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar horários disponíveis para uma semana
 */
export function useAvailableSlotsForWeek(
  barbershopId: string,
  professionalId: string,
  startDate: Date
) {
  return useQuery({
    queryKey: schedulingKeys.weekSlots(barbershopId, professionalId, startDate.toISOString()),
    queryFn: () => getAvailableSlotsForWeek(barbershopId, professionalId, startDate),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para criar agendamento
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { barbershopId: string; professionalId: string; serviceId: string; clientId: string; clientName: string; clientWhatsApp: string; scheduledAt: Date; notes?: string }) =>
      createAppointment(params.barbershopId, params.professionalId, params.serviceId, params.clientId, params.clientName, params.clientWhatsApp, params.scheduledAt, params.notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.today() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.barbershop(variables.barbershopId, '', '') });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.professional(variables.professionalId, '', '') });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.client(variables.clientId) });
    },
  });
}

/**
 * Hook para atualizar status do agendamento
 */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppointmentStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.today() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.all });
    },
  });
}

/**
 * Hook para cancelar agendamento
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.today() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.all });
    },
  });
}

/**
 * Hook para buscar agendamentos de um cliente
 */
export function useClientAppointments(clientId: string) {
  return useQuery({
    queryKey: schedulingKeys.client(clientId),
    queryFn: () => getClientAppointments(clientId, 50),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos de uma barbearia
 */
export function useBarbershopAppointments(
  barbershopId: string,
  startDate: Date,
  endDate: Date
) {
  return useQuery({
    queryKey: schedulingKeys.barbershop(barbershopId, startDate.toISOString(), endDate.toISOString()),
    queryFn: () => getBarbershopAppointments(barbershopId, startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos de um profissional
 */
export function useProfessionalAppointments(
  professionalId: string,
  startDate: Date,
  endDate: Date
) {
  return useQuery({
    queryKey: schedulingKeys.professional(professionalId, startDate.toISOString(), endDate.toISOString()),
    queryFn: () => getProfessionalAppointments(professionalId, startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos pendentes de hoje
 */
export function usePendingAppointmentsToday() {
  return useQuery({
    queryKey: schedulingKeys.today(),
    queryFn: getPendingAppointmentsToday,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para buscar agendamentos de hoje
 */
export function useAppointmentsToday() {
  return useQuery({
    queryKey: schedulingKeys.today(),
    queryFn: getAppointmentsToday,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos de hoje para um cliente
 */
export function useTodayAppointmentsForClient(clientId: string) {
  return useQuery({
    queryKey: schedulingKeys.client(clientId),
    queryFn: () => getTodayAppointmentsForClient(clientId),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos de hoje para um profissional
 */
export function useTodayAppointmentsForProfessional(professionalId: string) {
  return useQuery({
    queryKey: schedulingKeys.professional(professionalId, '', ''),
    queryFn: () => getTodayAppointmentsForProfessional(professionalId),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos de hoje para uma barbearia
 */
export function useTodayAppointmentsForBarbershop(barbershopId: string) {
  return useQuery({
    queryKey: schedulingKeys.barbershop(barbershopId, '', ''),
    queryFn: () => getTodayAppointmentsForBarbershop(barbershopId),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para agendamento inteligente
 */
export function useSmartScheduling() {
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);

  const generateSuggestions = useCallback(async (
    barbershopId: string,
    professionalId: string,
    date: Date
  ) => {
    try {
      // Buscar horários disponíveis
      const slots = await getAvailableSlots(barbershopId, professionalId, date);

      // Gerar sugestões baseadas em padrões
      const sugestoes: SchedulingSuggestion[] = [];

      // Sugerir horários de maior demanda
      if (slots.length > 0) {
        sugestoes.push({
          time: slots[0],
          reason: 'Primeiro horário disponível',
          confidence: 0.8,
        });
      }

      // Sugerir horários intermediários
      if (slots.length > 3) {
        sugestoes.push({
          time: slots[Math.floor(slots.length / 2)],
          reason: 'Horário intermediário',
          confidence: 0.7,
        });
      }

      // Sugerir horários finais
      if (slots.length > 5) {
        sugestoes.push({
          time: slots[slots.length - 1],
          reason: 'Último horário do dia',
          confidence: 0.6,
        });
      }

      setSuggestions(sugestoes);
      return sugestoes;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return [];
    }
  }, []);

  return {
    suggestions,
    generateSuggestions,
  };
}

/**
 * Hook para dashboard de agendamento
 */
export function useSchedulingDashboard() {
  const { data: pending, isLoading: loadingPending } = usePendingAppointmentsToday();
  const { data: today, isLoading: loadingToday } = useAppointmentsToday();

  const loading = loadingPending || loadingToday;

  return {
    pendingAppointments: pending || [],
    todayAppointments: today || [],
    loading,
  };
}