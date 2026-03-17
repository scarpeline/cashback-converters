// Hook para Agendamento Recorrente
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createRecurringAppointment,
  generateFutureAppointments,
  cancelRecurringSeries,
  pauseRecurringSeries,
  resumeRecurringSeries,
  getRecurringAppointments,
  getClientRecurringAppointments,
  getProfessionalRecurringAppointments,
  getActiveRecurringAppointments,
  getRecurringAppointmentsByFrequency,
  getRecurringAppointmentsByStatus,
  getExpiringRecurringAppointments,
  getRecurringAppointmentsNeedingGeneration,
  generatePendingRecurringAppointments,
  getRecurringAppointmentsToday,
  getRecurringAppointmentsTodayForClient,
  getRecurringAppointmentsTodayForProfessional,
  getRecurringAppointmentsTodayForBarbershop,
  type RecurringAppointment 
} from '@/services/recurringAppointmentService';

// Chaves de query para cache
export const recurringKeys = {
  all: ['recurring'] as const,
  list: (barbershopId: string) => [...recurringKeys.all, 'list', barbershopId] as const,
  client: (clientId: string) => [...recurringKeys.all, 'client', clientId] as const,
  professional: (professionalId: string) => [...recurringKeys.all, 'professional', professionalId] as const,
  active: (barbershopId: string) => [...recurringKeys.all, 'active', barbershopId] as const,
  frequency: (barbershopId: string, frequency: string) => 
    [...recurringKeys.all, 'frequency', barbershopId, frequency] as const,
  status: (barbershopId: string, status: string) => 
    [...recurringKeys.all, 'status', barbershopId, status] as const,
  expiring: () => [...recurringKeys.all, 'expiring'] as const,
  pending: () => [...recurringKeys.all, 'pending'] as const,
  today: () => [...recurringKeys.all, 'today'] as const,
};

/**
 * Hook para buscar agendamentos recorrentes
 */
export function useRecurringAppointments(barbershopId: string) {
  return useQuery({
    queryKey: recurringKeys.list(barbershopId),
    queryFn: () => getRecurringAppointments(barbershopId, 50),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar agendamentos recorrentes de um cliente
 */
export function useClientRecurringAppointments(clientId: string) {
  return useQuery({
    queryKey: recurringKeys.client(clientId),
    queryFn: () => getClientRecurringAppointments(clientId, 50),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos recorrentes de um profissional
 */
export function useProfessionalRecurringAppointments(professionalId: string) {
  return useQuery({
    queryKey: recurringKeys.professional(professionalId),
    queryFn: () => getProfessionalRecurringAppointments(professionalId, 50),
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos recorrentes ativos
 */
export function useActiveRecurringAppointments(barbershopId: string) {
  return useQuery({
    queryKey: recurringKeys.active(barbershopId),
    queryFn: () => getActiveRecurringAppointments(barbershopId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos recorrentes por frequência
 */
export function useRecurringAppointmentsByFrequency(
  barbershopId: string,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
) {
  return useQuery({
    queryKey: recurringKeys.frequency(barbershopId, frequency),
    queryFn: () => getRecurringAppointmentsByFrequency(barbershopId, frequency),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos recorrentes por status
 */
export function useRecurringAppointmentsByStatus(
  barbershopId: string,
  status: 'active' | 'paused' | 'cancelled'
) {
  return useQuery({
    queryKey: recurringKeys.status(barbershopId, status),
    queryFn: () => getRecurringAppointmentsByStatus(barbershopId, status),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar agendamentos recorrentes expirando
 */
export function useExpiringRecurringAppointments() {
  return useQuery({
    queryKey: recurringKeys.expiring(),
    queryFn: getExpiringRecurringAppointments,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para buscar agendamentos recorrentes pendentes
 */
export function usePendingRecurringAppointments() {
  return useQuery({
    queryKey: recurringKeys.pending(),
    queryFn: getRecurringAppointmentsNeedingGeneration,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para gerar agendamentos recorrentes pendentes
 */
export function useGeneratePendingRecurringAppointments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generatePendingRecurringAppointments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.pending() });
      queryClient.invalidateQueries({ queryKey: recurringKeys.today() });
    },
  });
}

/**
 * Hook para criar agendamento recorrente
 */
export function useCreateRecurringAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecurringAppointment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.list(variables.barbershop_id) });
      queryClient.invalidateQueries({ queryKey: recurringKeys.client(variables.client_user_id || '') });
    },
  });
}

/**
 * Hook para gerar agendamentos futuros
 */
export function useGenerateFutureAppointments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recurringId: string) => generateFutureAppointments(recurringId, 3),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.list(variables) });
      queryClient.invalidateQueries({ queryKey: recurringKeys.today() });
    },
  });
}

/**
 * Hook para cancelar série
 */
export function useCancelRecurringSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelRecurringSeries,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.list('') });
      queryClient.invalidateQueries({ queryKey: recurringKeys.active('') });
    },
  });
}

/**
 * Hook para pausar série
 */
export function usePauseRecurringSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseRecurringSeries,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.list('') });
      queryClient.invalidateQueries({ queryKey: recurringKeys.active('') });
    },
  });
}

/**
 * Hook para retomar série
 */
export function useResumeRecurringSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeRecurringSeries,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.list('') });
      queryClient.invalidateQueries({ queryKey: recurringKeys.active('') });
    },
  });
}

/**
 * Hook para agendamentos recorrentes de hoje
 */
export function useRecurringAppointmentsToday() {
  return useQuery({
    queryKey: recurringKeys.today(),
    queryFn: getRecurringAppointmentsToday,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para agendamentos recorrentes de hoje para um cliente
 */
export function useRecurringAppointmentsTodayForClient(clientId: string) {
  return useQuery({
    queryKey: recurringKeys.client(clientId),
    queryFn: () => getRecurringAppointmentsTodayForClient(clientId),
    enabled: !!clientId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para agendamentos recorrentes de hoje para um profissional
 */
export function useRecurringAppointmentsTodayForProfessional(professionalId: string) {
  return useQuery({
    queryKey: recurringKeys.professional(professionalId),
    queryFn: () => getRecurringAppointmentsTodayForProfessional(professionalId),
    enabled: !!professionalId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para agendamentos recorrentes de hoje para uma barbearia
 */
export function useRecurringAppointmentsTodayForBarbershop(barbershopId: string) {
  return useQuery({
    queryKey: recurringKeys.list(barbershopId),
    queryFn: () => getRecurringAppointmentsTodayForBarbershop(barbershopId),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para dashboard de agendamentos recorrentes
 */
export function useRecurringDashboard(barbershopId: string) {
  const { data: active, isLoading: loadingActive } = useActiveRecurringAppointments(barbershopId);
  const { data: expiring, isLoading: loadingExpiring } = useExpiringRecurringAppointments();
  const { data: pending, isLoading: loadingPending } = usePendingRecurringAppointments();

  const loading = loadingActive || loadingExpiring || loadingPending;

  return {
    activeSeries: active || [],
    expiringSeries: expiring || [],
    pendingSeries: pending || [],
    loading,
  };
}