// Hook para Gestão de Clientes
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getClients,
  getClientById,
  getClientByWhatsApp,
  createClient,
  updateClient,
  searchClientsByName,
  searchClientsByWhatsApp,
  getActiveClients,
  getInactiveClients,
  calculateClientScore,
  getTopClients,
  getClientsByScore,
  getClientsByRecency,
  getClientsBySpending,
  getClientsByFrequency,
  type Client,
  type ClientScore 
} from '@/services/clientService';

// Chaves de query para cache
export const clientKeys = {
  all: ['clients'] as const,
  list: (barbershopId: string) => [...clientKeys.all, 'list', barbershopId] as const,
  detail: (clientId: string) => [...clientKeys.all, 'detail', clientId] as const,
  search: (barbershopId: string, query: string) => [...clientKeys.all, 'search', barbershopId, query] as const,
  active: (barbershopId: string, days: number) => [...clientKeys.all, 'active', barbershopId, days] as const,
  inactive: (barbershopId: string, days: number) => [...clientKeys.all, 'inactive', barbershopId, days] as const,
  top: (barbershopId: string) => [...clientKeys.all, 'top', barbershopId] as const,
  score: (clientId: string) => [...clientKeys.all, 'score', clientId] as const,
};

/**
 * Hook para buscar clientes
 */
export function useClients(barbershopId: string) {
  return useQuery({
    queryKey: clientKeys.list(barbershopId),
    queryFn: () => getClients(barbershopId, 50),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar cliente por ID
 */
export function useClient(clientId: string) {
  return useQuery({
    queryKey: clientKeys.detail(clientId),
    queryFn: () => getClientById(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar cliente por WhatsApp
 */
export function useClientByWhatsApp(whatsapp: string) {
  return useQuery({
    queryKey: clientKeys.detail(whatsapp),
    queryFn: () => getClientByWhatsApp(whatsapp),
    enabled: !!whatsapp,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para criar cliente
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list(variables.barbershop_id || '') });
    },
  });
}

/**
 * Hook para atualizar cliente
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, updates }: { clientId: string; updates: Partial<Client> }) =>
      updateClient(clientId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: clientKeys.list('') });
    },
  });
}

/**
 * Hook para buscar clientes ativos
 */
export function useActiveClients(barbershopId: string, days: number = 30) {
  return useQuery({
    queryKey: clientKeys.active(barbershopId, days),
    queryFn: () => getActiveClients(barbershopId, days),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar clientes inativos
 */
export function useInactiveClients(barbershopId: string, days: number = 30) {
  return useQuery({
    queryKey: clientKeys.inactive(barbershopId, days),
    queryFn: () => getInactiveClients(barbershopId, days),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes por nome
 */
export function useSearchClientsByName(barbershopId: string, name: string) {
  return useQuery({
    queryKey: clientKeys.search(barbershopId, name),
    queryFn: () => searchClientsByName(barbershopId, name, 20),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes por WhatsApp
 */
export function useSearchClientsByWhatsApp(barbershopId: string, whatsapp: string) {
  return useQuery({
    queryKey: clientKeys.search(barbershopId, whatsapp),
    queryFn: () => searchClientsByWhatsApp(barbershopId, whatsapp, 20),
    enabled: !!whatsapp,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para calcular score do cliente
 */
export function useClientScore(clientId: string) {
  return useQuery({
    queryKey: clientKeys.score(clientId),
    queryFn: () => calculateClientScore(clientId),
    enabled: !!clientId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para buscar top clientes
 */
export function useTopClients(barbershopId: string) {
  return useQuery({
    queryKey: clientKeys.top(barbershopId),
    queryFn: () => getTopClients(barbershopId, 10),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes por score
 */
export function useClientsByScore(barbershopId: string, minScore: number, maxScore: number = 100) {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: () => getClientsByScore(barbershopId, minScore, maxScore),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes por recência
 */
export function useClientsByRecency(barbershopId: string, recency: 'recent' | 'active' | 'inactive' | 'dormant') {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: () => getClientsByRecency(barbershopId, recency),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes por gasto
 */
export function useClientsBySpending(barbershopId: string, minSpent: number, maxSpent: number = 10000) {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: () => getClientsBySpending(barbershopId, minSpent, maxSpent),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar clientes por frequência
 */
export function useClientsByFrequency(barbershopId: string, minVisits: number, maxVisits: number = 100) {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: () => getClientsByFrequency(barbershopId, minVisits, maxVisits),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para dashboard de clientes
 */
export function useClientDashboard(barbershopId: string) {
  const { data: clients, isLoading: loadingClients } = useClients(barbershopId);
  const { data: active, isLoading: loadingActive } = useActiveClients(barbershopId, 30);
  const { data: inactive, isLoading: loadingInactive } = useInactiveClients(barbershopId, 30);
  const { data: top, isLoading: loadingTop } = useTopClients(barbershopId);

  const loading = loadingClients || loadingActive || loadingInactive || loadingTop;

  return {
    clients: clients || [],
    activeClients: active || [],
    inactiveClients: inactive || [],
    topClients: top || [],
    loading,
  };
}