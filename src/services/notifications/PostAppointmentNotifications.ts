import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PostAppointmentNotification {
  id: string;
  appointment_id: string;
  professional_id: string;
  notification_type: 'finalization_reminder' | 'cancellation_request';
  sent_at: string | null;
  acknowledged_at: string | null;
  action_taken: string | null;
  created_at: string;
  updated_at: string;
}

export class PostAppointmentNotificationsService {
  // Verificar agendamentos que precisam de notificação
  static async checkAppointmentsNeedingNotification(): Promise<void> {
    try {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      
      // Buscar agendamentos que terminaram há 30 minutos e ainda não foram notificados
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(`
          id,
          professional_id,
          scheduled_at,
          services(duration_minutes),
          professionals!inner(
            id,
            name,
            user_id
          )
        `)
        .eq("status", "scheduled")
        .lt("scheduled_at", thirtyMinutesAgo.toISOString())
        .is("post_appointment_notifications.appointment_id", null);

      if (error) {
        console.error("Erro ao buscar agendamentos para notificação:", error);
        return;
      }

      // Criar notificações para cada agendamento
      for (const appointment of appointments || []) {
        await this.createNotification(appointment.id, appointment.professional_id, "finalization_reminder");
        
        // Enviar notificação push/web se disponível
        await this.sendNotificationToProfessional(
          appointment.professionals.user_id,
          "Lembrete de Finalização",
          "Seu atendimento recentemente terminou. Deseja finalizar ou marcar como cancelado?",
          {
            type: "post_appointment",
            appointment_id: appointment.id,
            actions: ["finalize", "cancel"]
          }
        );
      }
    } catch (error) {
      console.error("Erro ao verificar notificações pós-atendimento:", error);
    }
  }

  // Criar notificação no banco
  static async createNotification(
    appointmentId: string,
    professionalId: string,
    type: 'finalization_reminder' | 'cancellation_request'
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_post_appointment_notification', {
        p_appointment_id: appointmentId,
        p_professional_id: professionalId,
        p_notification_type: type
      });

      if (error) {
        console.error("Erro ao criar notificação:", error);
        return null;
      }

      // Marcar como enviada
      await supabase
        .from("post_appointment_notifications")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", data);

      return data;
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
      return null;
    }
  }

  // Enviar notificação para o profissional (simulado - integrar com serviço real)
  static async sendNotificationToProfessional(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      // Simular envio de notificação
      // Na implementação real, integrar com Firebase Cloud Messaging, OneSignal, etc.
      console.log("Notificação enviada:", {
        userId,
        title,
        body,
        data,
        timestamp: new Date().toISOString()
      });

      // Poderia também enviar por WhatsApp se integrado com Twilio
      // await this.sendWhatsAppNotification(userId, title, body);
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
    }
  }

  // Buscar notificações não lidas do profissional
  static async getUnreadNotifications(professionalId: string): Promise<PostAppointmentNotification[]> {
    try {
      const { data, error } = await supabase
        .from("post_appointment_notifications")
        .select("*")
        .eq("professional_id", professionalId)
        .is("acknowledged_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar notificações:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      return [];
    }
  }

  // Marcar notificação como lida e registrar ação
  static async acknowledgeNotification(
    notificationId: string,
    action: 'finalized' | 'cancelled' | 'dismissed'
  ): Promise<void> {
    try {
      await supabase
        .from("post_appointment_notifications")
        .update({
          acknowledged_at: new Date().toISOString(),
          action_taken: action
        })
        .eq("id", notificationId);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  }

  // Processar ação da notificação (finalizar ou cancelar atendimento)
  static async processNotificationAction(
    appointmentId: string,
    action: 'finalize' | 'cancel',
    professionalId: string
  ): Promise<boolean> {
    try {
      if (action === 'finalize') {
        // Atualizar status para em_andamento
        const { error } = await supabase
          .from("appointments")
          .update({
            status: "in_progress",
            updated_at: new Date().toISOString()
          })
          .eq("id", appointmentId)
          .eq("professional_id", professionalId);

        if (error) throw error;

        toast.success("Atendimento marcado como em andamento");
      } else if (action === 'cancel') {
        // Atualizar status para cancelado
        const { error } = await supabase
          .from("appointments")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString()
          })
          .eq("id", appointmentId)
          .eq("professional_id", professionalId);

        if (error) throw error;

        toast.success("Atendimento cancelado");
      }

      // Marcar notificação correspondente como processada
      const { data: notifications } = await supabase
        .from("post_appointment_notifications")
        .select("id")
        .eq("appointment_id", appointmentId)
        .eq("professional_id", professionalId)
        .is("acknowledged_at", null);

      if (notifications && notifications.length > 0) {
        await this.acknowledgeNotification(
          notifications[0].id,
          action === 'finalize' ? 'finalized' : 'cancelled'
        );
      }

      return true;
    } catch (error: any) {
      console.error("Erro ao processar ação:", error);
      toast.error(error.message || "Erro ao processar ação");
      return false;
    }
  }

  // Iniciar verificação automática de notificações
  static startNotificationChecker(): void {
    // Verificar a cada 5 minutos
    setInterval(() => {
      this.checkAppointmentsNeedingNotification();
    }, 5 * 60 * 1000);

    // Verificar imediatamente ao iniciar
    this.checkAppointmentsNeedingNotification();
  }

  // Enviar notificação por WhatsApp (opcional)
  static async sendWhatsAppNotification(
    userId: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      // Buscar dados do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("whatsapp, name")
        .eq("id", userId)
        .single();

      if (profile?.whatsapp) {
        // Integrar com API do Twilio ou similar
        const { error } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            to: profile.whatsapp,
            message: `Olá ${profile.name}, ${title}: ${message}`
          }
        });

        if (error) {
          console.error("Erro ao enviar WhatsApp:", error);
        }
      }
    } catch (error) {
      console.error("Erro ao enviar notificação WhatsApp:", error);
    }
  }
}
