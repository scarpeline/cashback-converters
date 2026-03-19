// Hook para Notificações
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getNotifications, 
  getUnreadNotifications, 
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendBulkNotification,
  getNotificationStats,
  sendCommissionNotification,
  sendAppointmentNotification,
  sendPaymentNotification,
  type Notification 
} from '@/services/notificationService';

// Chaves de query para cache
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => [...notificationKeys.all, 'list', userId] as const,
  unread: (userId: string) => [...notificationKeys.all, 'unread', userId] as const,
  stats: (userId: string) => [...notificationKeys.all, 'stats', userId] as const,
};

/**
 * Hook para buscar notificações
 */
export function useNotifications(userId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: notificationKeys.list(userId || ''),
    queryFn: () => getNotifications(userId || '', 50),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    notifications: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para buscar notificações não lidas
 */
export function useUnreadNotifications(userId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: notificationKeys.unread(userId || ''),
    queryFn: () => getUnreadNotifications(userId || ''),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  return {
    unreadCount: data?.length || 0,
    unreadNotifications: data || [],
    isLoading,
    error,
  };
}

/**
 * Hook para criar notificação
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { userId: string; title: string; message: string; type?: string; priority?: string; data?: any }) => 
      createNotification(params.userId, params.title, params.message, params.type as any, params.priority as any, params.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(variables.userId) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread(variables.userId) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats(variables.userId) });
    },
  });
}

/**
 * Hook para marcar como lida
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread(variables) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats(variables) });
    },
  });
}

/**
 * Hook para marcar todas como lidas
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(variables) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread(variables) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats(variables) });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook para enviar notificação de comissão
 */
export function useCommissionNotification() {
  return useMutation({
    mutationFn: (params: { userId: string; amount: number; type: 'adesao' | 'recorrente' }) =>
      sendCommissionNotification(params.userId, params.amount, params.type),
  });
}

/**
 * Hook para enviar notificação de agendamento
 */
export function useAppointmentNotification() {
  return useMutation({
    mutationFn: (params: { userId: string; barbershopName: string; service: string; date: Date; time: string; type?: string }) =>
      sendAppointmentNotification(params.userId, params.barbershopName, params.service, params.date, params.time, params.type as any),
  });
}

/**
 * Hook para enviar notificação de pagamento
 */
export function usePaymentNotification() {
  return useMutation({
    mutationFn: (params: { userId: string; amount: number; status: 'pending' | 'success' | 'failed'; barbershopName: string }) =>
      sendPaymentNotification(params.userId, params.amount, params.status, params.barbershopName),
  });
}

/**
 * Hook para estatísticas de notificações
 */
export function useNotificationStats(userId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: notificationKeys.stats(userId || ''),
    queryFn: () => getNotificationStats(userId || ''),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  return {
    stats: data,
    isLoading,
    error,
  };
}

/**
 * Hook para dashboard de notificações
 */
export function useNotificationDashboard(userId?: string) {
  const { notifications, isLoading: loadingList } = useNotifications(userId);
  const { unreadCount, isLoading: loadingUnread } = useUnreadNotifications(userId);
  const { stats, isLoading: loadingStats } = useNotificationStats(userId);
  const markAllAsReadMutation = useMarkAllAsRead();

  const loading = loadingList || loadingUnread || loadingStats;

  const markAllAsRead = useCallback(async () => {
    if (userId) {
      await markAllAsReadMutation.mutateAsync(userId);
    }
  }, [userId, markAllAsReadMutation]);

  return {
    notifications,
    unreadCount,
    stats,
    loading,
    markAllAsRead,
    refresh: () => {
      // Refetch all queries
    },
  };
}