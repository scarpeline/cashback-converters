// Hook para CRM (Customer Relationship Management)
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getClientProfile,
  getTopClientsByScore,
  addClientTag,
  removeClientTag,
  getClientsByTag,
  createCRMAction,
  getPendingCRMActions,
  processPendingCRMActions,
  getClientsNeedingReactivation,
  getHighPotentialClients,
  getClientsForPartnerConversion,
  getClientsByRecency,
  getClientsByFrequency,
  getClientsBySpending,
  getClientsByScore,
  type ClientProfile,
  type CRMAction 
} from '@/services/crmService';

// Chaves de query para cache
export const crmKeys = {
  all: ['crm'] as const,
  profile: (clientId: string) => [...crmKeys.all, 'profile', clientId] as const,
  top: (barbershopId: string) => [...crmKeys.all, 'top', barbershopId] as const,
  tag: (tag: string) => [...crmKeys.all, 'tag', tag] as const,
  pendingActions: () => [...crmKeys.all, 'pendingActions'] as const,
  reactivation: () => [...crmKeys.all, 'reactivation'] as const,
  highPotential: (barbershopId: string) => [...crmKeys.all, 'highPotential', barbershopId] as const,
  partnerConversion: (barbershopId: string) => [...crmKeys.all, 'partnerConversion', barbershopId] as const,
};

/**
 * Hook para buscar perfil do cliente
 */
export function useClientProfile(clientId: string) {
  return useQuery({
    queryKey: crmKeys.profile(clientId),
    queryFn: () => getClientProfile(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar top clientes por score
 */
export function useTopClients(barbershopId: string) {
  return useQuery({
    queryKey: crmKeys.top(barbershopId),
    queryFn: () => getTopClientsByScore(barbershopId, 10),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para adicionar tag ao cliente
 */
export function useAddClientTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, tag }: { clientId: string; tag: string }) =>
      addClientTag(clientId, tag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: crmKeys.profile(variables.clientId) });
    },
  });
}

/**
 * Hook para remover tag do cliente
 */
export function useRemoveClientTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, tag }: { clientId: string; tag: string }) =>
      removeClientTag(clientId, tag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: crmKeys.profile(variables.clientId) });
    },
  });
}

/**
 * Hook para buscar clientes por tag
 */
export function useClientsByTag(tag: string) {
  return useQuery({
    queryKey: crmKeys.tag(tag),
    queryFn: () => getClientsByTag(tag, 50),
    enabled: !!tag,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar ações pendentes de CRM
 */
export function usePendingCRMActions() {
  return useQuery({
    queryKey: crmKeys.pendingActions(),
    queryFn: getPendingCRMActions,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para processar ações pendentes de CRM
 */
export function useProcessPendingCRMActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processPendingCRMActions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.pendingActions() });
    },
  });
}

/**
 * Hook para buscar clientes que precisam de reativação
 */
export function useClientsNeedingReactivation() {
  return useQuery({
    queryKey: crmKeys.reactivation(),
    queryFn: getClientsNeedingReactivation,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes com alto potencial
 */
export function useHighPotentialClients(barbershopId: string) {
  return useQuery({
    queryKey: crmKeys.highPotential(barbershopId),
    queryFn: () => getHighPotentialClients(barbershopId),
    enabled: !!barbershopId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes para conversão em parceiros
 */
export function useClientsForPartnerConversion(barbershopId: string) {
  return useQuery({
    queryKey: crmKeys.partnerConversion(barbershopId),
    queryFn: () => getClientsForPartnerConversion(barbershopId),
    enabled: !!barbershopId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes por recência
 */
export function useClientsByRecency(
  barbershopId: string,
  recency: 'recent' | 'active' | 'inactive' | 'dormant'
) {
  return useQuery({
    queryKey: crmKeys.all,
    queryFn: () => getClientsByRecency(barbershopId, recency),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes por frequência
 */
export function useClientsByFrequency(
  barbershopId: string,
  frequency: 'high' | 'medium' | 'low'
) {
  return useQuery({
    queryKey: crmKeys.all,
    queryFn: () => getClientsByFrequency(barbershopId, frequency),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes por gasto
 */
export function useClientsBySpending(
  barbershopId: string,
  minSpent: number,
  maxSpent: number = 10000
) {
  return useQuery({
    queryKey: crmKeys.all,
    queryFn: () => getClientsBySpending(barbershopId, minSpent, maxSpent),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes por score
 */
export function useClientsByScore(
  barbershopId: string,
  minScore: number,
  maxScore: number = 100
) {
  return useQuery({
    queryKey: crmKeys.all,
    queryFn: () => getClientsByScore(barbershopId, minScore, maxScore),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para dashboard de CRM
 */
export function useCRMDashboard(barbershopId: string) {
  const { data: top, isLoading: loadingTop } = useTopClients(barbershopId);
  const { data: reactivation, isLoading: loadingReactivation } = useClientsNeedingReactivation();
  const { data: highPotential, isLoading: loadingHighPotential } = useHighPotentialClients(barbershopId);
  const { data: pendingActions, isLoading: loadingPending } = usePendingCRMActions();

  const loading = loadingTop || loadingReactivation || loadingHighPotential || loadingPending;

  return {
    topClients: top || [],
    clientsNeedingReactivation: reactivation || [],
    highPotentialClients: highPotential || [],
    pendingActions: pendingActions || [],
    loading,
  };
}