import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, Trash2, CheckCircle, AlertCircle, Gift, Users } from 'lucide-react';
import { toast } from 'sonner';
import { markNotificationAsRead, deleteNotification, markAllNotificationsAsRead } from '@/services/partnerNotificationService';

interface PartnerNotificationCenterProps {
  partnerId: string;
}

export default function PartnerNotificationCenter({ partnerId }: PartnerNotificationCenterProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['partner-notifications', partnerId, filter],
    queryFn: async () => {
      let query = (supabase as any)
        .from('partner_notifications')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = (query as any).eq('read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-notifications'] });
      toast.success('Notificação marcada como lida');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-notifications'] });
      toast.success('Notificação deletada');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(partnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-notifications'] });
      toast.success('Todas as notificações marcadas como lidas');
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'commission_generated':
      case 'commission_approved':
      case 'commission_paid':
        return <Gift className="w-5 h-5 text-green-500" />;
      case 'new_referral':
      case 'referral_completed':
        return <Users className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'commission_generated': return 'Comissão Gerada';
      case 'commission_approved': return 'Comissão Aprovada';
      case 'commission_paid': return 'Comissão Paga';
      case 'new_referral': return 'Nova Indicação';
      case 'referral_completed': return 'Indicação Completada';
      default: return type;
    }
  };

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notificações</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} notificação{unreadCount !== 1 ? 's' : ''} não lida{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Não lidas ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {!notifications || notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getIcon(notification.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            Novo
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>

                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(notification.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
