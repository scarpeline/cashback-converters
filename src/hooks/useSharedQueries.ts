import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook compartilhado para perfil do usuário
export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook compartilhado para barbearia
export function useBarbershop(barbershopId?: string) {
  return useQuery({
    queryKey: ['barbershop', barbershopId],
    queryFn: async () => {
      if (!barbershopId) return null;
      const { data, error } = await supabase
        .from('barbershops')
        .select('*')
        .eq('id', barbershopId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!barbershopId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook compartilhado para agendamentos
export function useAppointments(filters?: {
  barbershopId?: string;
  professionalId?: string;
  clientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const queryKey = useMemo(() => [
    'appointments',
    filters?.barbershopId,
    filters?.professionalId,
    filters?.clientId,
    filters?.status,
    filters?.dateFrom,
    filters?.dateTo
  ], [filters]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          services (
            id,
            name,
            price,
            duration
          ),
          professionals (
            id,
            name
          ),
          clients:profiles!appointments_client_id_fkey (
            id,
            name,
            whatsapp
          )
        `);

      if (filters?.barbershopId) {
        query = query.eq('barbershop_id', filters.barbershopId);
      }
      if (filters?.professionalId) {
        query = query.eq('professional_id', filters.professionalId);
      }
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('scheduled_time', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('scheduled_time', filters.dateTo);
      }

      const { data, error } = await query.order('scheduled_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
  });
}

// Hook para invalidar cache de forma otimizada
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateProfile = useCallback((userId?: string) => {
    return queryClient.invalidateQueries({
      queryKey: ['profile', userId],
    });
  }, [queryClient]);

  const invalidateBarbershop = useCallback((barbershopId?: string) => {
    return queryClient.invalidateQueries({
      queryKey: ['barbershop', barbershopId],
    });
  }, [queryClient]);

  const invalidateAppointments = useCallback((filters?: any) => {
    return queryClient.invalidateQueries({
      queryKey: ['appointments'],
    });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    return queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    invalidateProfile,
    invalidateBarbershop,
    invalidateAppointments,
    invalidateAll,
  };
}

// Hook para dados financeiros compartilhados
export function useFinancialData(barbershopId?: string, period?: {
  from: string;
  to: string;
}) {
  return useQuery({
    queryKey: ['financial-data', barbershopId, period],
    queryFn: async () => {
      if (!barbershopId) return null;

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          appointments (
            id,
            services (
              price
            )
          )
        `)
        .eq('barbershop_id', barbershopId)
        .gte('created_at', period?.from)
        .lte('created_at', period?.to)
        .eq('status', 'confirmed');

      if (error) throw error;

      // Calcular totais
      const totalRevenue = data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const totalTransactions = data?.length || 0;
      const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      return {
        totalRevenue,
        totalTransactions,
        averageTicket,
        transactions: data || [],
      };
    },
    enabled: !!barbershopId && !!period,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
