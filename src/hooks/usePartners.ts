// Hook para parceiros - Integração com React Query
// NÃO duplica funcionalidades existentes

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPartners, 
  getPartnerById, 
  createPartner, 
  updatePartner, 
  updatePartnerStatus,
  getPartnersByType,
  getPartnerHierarchy,
  countDirectReferrals,
  isUserPartner,
  type Partner,
  type PartnerWithUser
} from '@/services/partnersService';

// Chaves de query para cache
export const partnerKeys = {
  all: ['partners'] as const,
  lists: () => [...partnerKeys.all, 'list'] as const,
  list: (filters: any) => [...partnerKeys.lists(), filters] as const,
  details: () => [...partnerKeys.all, 'detail'] as const,
  detail: (id: string) => [...partnerKeys.details(), id] as const,
  byType: (type: string) => [...partnerKeys.all, 'type', type] as const,
  hierarchy: (id: string) => [...partnerKeys.all, 'hierarchy', id] as const,
  referrals: (id: string) => [...partnerKeys.all, 'referrals', id] as const,
  userCheck: (userId: string) => [...partnerKeys.all, 'user', userId] as const,
};

/**
 * Hook para buscar todos os parceiros
 */
export function usePartners() {
  return useQuery({
    queryKey: partnerKeys.lists(),
    queryFn: getPartners,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}

/**
 * Hook para buscar parceiro por ID
 */
export function usePartner(id: string) {
  return useQuery({
    queryKey: partnerKeys.detail(id),
    queryFn: () => getPartnerById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para buscar parceiros por tipo
 */
export function usePartnersByType(type: Partner['type']) {
  return useQuery({
    queryKey: partnerKeys.byType(type),
    queryFn: () => getPartnersByType(type),
    enabled: !!type,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para criar parceiro
 */
export function useCreatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPartner,
    onSuccess: () => {
      // Invalidar queries de lista
      queryClient.invalidateQueries({ queryKey: partnerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
    onError: (error) => {
      console.error('Erro ao criar parceiro:', error);
    },
  });
}

/**
 * Hook para atualizar parceiro
 */
export function useUpdatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Partner> }) =>
      updatePartner(id, updates),
    onSuccess: (data, variables) => {
      // Invalidar queries específicas
      queryClient.invalidateQueries({ queryKey: partnerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: partnerKeys.lists() });
    },
  });
}

/**
 * Hook para atualizar status do parceiro
 */
export function useUpdatePartnerStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ativo' | 'bloqueado' }) =>
      updatePartnerStatus(id, status),
    onSuccess: (data, variables) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: partnerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: partnerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

/**
 * Hook para buscar hierarquia de parceiros
 */
export function usePartnerHierarchy(partnerId: string) {
  return useQuery({
    queryKey: partnerKeys.hierarchy(partnerId),
    queryFn: () => getPartnerHierarchy(partnerId),
    enabled: !!partnerId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para contar indicados diretos
 */
export function useDirectReferralsCount(partnerId: string) {
  return useQuery({
    queryKey: partnerKeys.referrals(partnerId),
    queryFn: () => countDirectReferrals(partnerId),
    enabled: !!partnerId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para verificar se usuário é parceiro
 */
export function useIsUserPartner(userId: string) {
  return useQuery({
    queryKey: partnerKeys.userCheck(userId),
    queryFn: () => isUserPartner(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para estatísticas de parceiros
 */
export function usePartnerStats() {
  const { data: partners, isLoading, error } = usePartners();

  const stats = {
    total: 0,
    active: 0,
    blocked: 0,
    byType: {
      afiliado: 0,
      franqueado: 0,
      diretor: 0,
    },
    totalIndicados: 0,
  };

  if (partners && !isLoading && !error) {
    stats.total = partners.length;
    stats.active = partners.filter(p => p.status === 'ativo').length;
    stats.blocked = partners.filter(p => p.status === 'bloqueado').length;
    
    partners.forEach(partner => {
      stats.byType[partner.type] = (stats.byType[partner.type] || 0) + 1;
      stats.totalIndicados += partner.total_indicados || 0;
    });
  }

  return {
    stats,
    isLoading,
    error,
  };
}