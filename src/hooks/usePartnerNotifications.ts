import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUnreadNotifications,
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createPartnerNotification,
  type PartnerNotification,
} from '@/services/partnerNotificationService';

// Chaves de query
export const notificationKeys = {
  all: ['partner-notifications'] as const,
  unread: (partnerId: string) => [...notificationKeys.all, 'unread', partnerId] as const,
  all: (partnerId: string) => [...notificationKeys.all, 'all', partnerId] as const,
};

/**
 * Hook para buscar notificações não lidas
 */
export function useUnreadNotifications(partnerId: string) {
  return useQuery({
    queryKey: notificationKeys.unread(partnerId),
    queryFn: () => getUnreadNotifications(partnerId),
    enabled: !!partnerId,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refetch a cada 1 minuto
  });
}

/**
 * Hook para buscar todas as notificações
 */
export function useAllNotifications(partnerId: string, limit = 50) {
  return useQuery({
    queryKey: notificationKeys.all(partnerId),
    queryFn: () => getAllNotifications(partnerId, limit),
    enabled: !!partnerId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para marcar notificação como lida
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook para marcar todas as notificações como lidas
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook para deletar notificação
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook para criar notificação
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      partnerId: string;
      type: PartnerNotification['type'];
      title: string;
      message: string;
      data?: Record<string, any>;
    }) =>
      createPartnerNotification(
        params.partnerId,
        params.type,
        params.title,
        params.message,
        params.data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
