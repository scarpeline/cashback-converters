import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PostAppointmentNotificationsService } from "@/services/notifications/PostAppointmentNotifications";

interface Notification {
  id: string;
  appointment_id: string;
  notification_type: 'finalization_reminder' | 'cancellation_request';
  created_at: string;
  appointment?: {
    client_name: string;
    services?: {
      name: string;
    };
    scheduled_at: string;
  };
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const notificationsData = await PostAppointmentNotificationsService.getUnreadNotifications(user.id);
      
      // Buscar detalhes dos agendamentos
      const notificationsWithDetails = await Promise.all(
        notificationsData.map(async (notification) => {
          const { data: appointment } = await (supabase as any)
            .from("appointments")
            .select(`
              client_name,
              services(name),
              scheduled_at
            `)
            .eq("id", notification.appointment_id)
            .single();

          return {
            ...notification,
            appointment: appointment || undefined
          };
        })
      );

      setNotifications(notificationsWithDetails);
      setUnreadCount(notificationsWithDetails.length);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const loadNotifications = async () => {
        if (!user) return;

        setLoading(true);
        try {
          const notificationsData = await PostAppointmentNotificationsService.getUnreadNotifications(user.id);
          
          // Buscar detalhes dos agendamentos
          const notificationsWithDetails = await Promise.all(
            notificationsData.map(async (notification) => {
              const { data: appointment } = await (supabase as any)
                .from("appointments")
                .select(`
                  client_name,
                  services(name),
                  scheduled_at
                `)
                .eq("id", notification.appointment_id)
                .single();

              return {
                ...notification,
                appointment: appointment || undefined
              };
            })
          );

          setNotifications(notificationsWithDetails);
          setUnreadCount(notificationsWithDetails.length);
        } catch (error) {
          console.error("Erro ao carregar notificações:", error);
        } finally {
          setLoading(false);
        }
      };
      loadNotifications();
      
      // Recarregar notificações a cada 30 segundos
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNotificationAction = async (
    notification: Notification,
    action: 'finalize' | 'cancel'
  ) => {
    const success = await PostAppointmentNotificationsService.processNotificationAction(
      notification.appointment_id,
      action,
      user?.id || ''
    );

    if (success) {
      // Remover notificação da lista
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const dismissNotification = async (notification: Notification) => {
    await PostAppointmentNotificationsService.acknowledgeNotification(
      notification.id,
      'dismissed'
    );
    
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "agora";
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} d atrás`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">
                          {notification.notification_type === 'finalization_reminder' 
                            ? 'Finalizar Atendimento' 
                            : 'Confirmação Necessária'
                          }
                        </span>
                      </div>
                      
                      {notification.appointment && (
                        <div className="text-sm text-muted-foreground">
                          <p><strong>Cliente:</strong> {notification.appointment.client_name}</p>
                          {notification.appointment.services && (
                            <p><strong>Serviço:</strong> {notification.appointment.services.name}</p>
                          )}
                          <p className="text-xs">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => dismissNotification(notification)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {notification.notification_type === 'finalization_reminder' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleNotificationAction(notification, 'finalize')}
                        className="flex-1"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Finalizar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNotificationAction(notification, 'cancel')}
                        className="flex-1"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                // Marcar todas como lidas
                notifications.forEach(notification => {
                  PostAppointmentNotificationsService.acknowledgeNotification(
                    notification.id,
                    'dismissed'
                  );
                });
                setNotifications([]);
                setUnreadCount(0);
              }}
            >
              Marcar todas como lidas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
