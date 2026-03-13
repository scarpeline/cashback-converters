/**
 * WaitlistNotifications - Sistema de Notificações Automáticas para Fila de Espera
 * 
 * Gerencia automaticamente:
 * - Notificações de ofertas de horário
 * - Confirmações de aceite/recusa
 * - Alertas de expiração
 * - Lembretes para clientes
 */

import { supabase } from "@/integrations/supabase/client";
import { enqueue } from "@/lib/adapters/queue-adapter";

export interface NotificationTemplate {
  type: string;
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    action: string;
    style?: "primary" | "secondary" | "danger";
  }>;
  metadata?: Record<string, any>;
}

export interface NotificationConfig {
  channels: ("whatsapp" | "sms" | "email")[];
  priority: "low" | "medium" | "high" | "urgent";
  retryAttempts?: number;
  delayMinutes?: number;
}

class WaitlistNotifications {
  /**
   * Envia notificação de oferta de horário para cliente
   */
  async sendSlotOfferNotification(
    waitlistId: string,
    clientId: string,
    offeredDate: string,
    offeredTime: string,
    professionalName: string,
    serviceName: string,
    deadlineMinutes: number = 10
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const template: NotificationTemplate = {
        type: "slot_offer",
        title: "🎉 Horário Disponível!",
        message: `Uma vaga abriu na nossa agenda!\n\n` +
                `📅 Data: ${new Date(offeredDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}\n` +
                `⏰ Horário: ${offeredTime}\n` +
                `💈 Serviço: ${serviceName}\n` +
                `💇‍♂️ Profissional: ${professionalName}\n\n` +
                `⚠️ Você tem ${deadlineMinutes} minutos para responder!\n\n` +
                `Deseja aceitar este horário?`,
        buttons: [
          {
            text: "✅ Aceitar",
            action: "accept_offer",
            style: "primary"
          },
          {
            text: "❌ Recusar", 
            action: "decline_offer",
            style: "secondary"
          }
        ],
        metadata: {
          waitlistId,
          offeredDate,
          offeredTime,
          deadlineMinutes
        }
      };

      const config: NotificationConfig = {
        channels: ["whatsapp"],
        priority: "high",
        retryAttempts: 3,
        delayMinutes: 1
      };

      return await this.sendNotification(clientId, template, config);
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error sending slot offer:", error);
      return { success: false, error: "Erro ao enviar notificação" };
    }
  }

  /**
   * Envia notificação de antecipação de horário
   */
  async sendAnticipationNotification(
    appointmentId: string,
    clientId: string,
    currentDateTime: string,
    offeredDateTime: string,
    timeDifferenceMinutes: number,
    serviceName: string,
    deadlineMinutes: number = 10
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const template: NotificationTemplate = {
        type: "anticipation_offer",
        title: "⏰ Horário Mais Cedo Disponível!",
        message: `Temos um horário mais cedo disponível para você!\n\n` +
                `📅 Horário atual: ${new Date(currentDateTime).toLocaleString('pt-BR')}\n` +
                `📅 Novo horário: ${new Date(offeredDateTime).toLocaleString('pt-BR')}\n` +
                `⏱️ Antecipação de ${timeDifferenceMinutes} minutos\n` +
                `💈 Serviço: ${serviceName}\n\n` +
                `⚠️ Você tem ${deadlineMinutes} minutos para responder!\n\n` +
                `Deseja antecipar seu atendimento?`,
        buttons: [
          {
            text: "✅ Aceitar Antecipação",
            action: "accept_anticipation",
            style: "primary"
          },
          {
            text: "❌ Manter Horário",
            action: "decline_anticipation", 
            style: "secondary"
          }
        ],
        metadata: {
          appointmentId,
          currentDateTime,
          offeredDateTime,
          timeDifferenceMinutes
        }
      };

      const config: NotificationConfig = {
        channels: ["whatsapp"],
        priority: "high",
        retryAttempts: 3,
        delayMinutes: 1
      };

      return await this.sendNotification(clientId, template, config);
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error sending anticipation notification:", error);
      return { success: false, error: "Erro ao enviar notificação" };
    }
  }

  /**
   * Envia confirmação de aceite de oferta
   */
  async sendOfferAcceptedNotification(
    clientId: string,
    appointmentDate: string,
    appointmentTime: string,
    serviceName: string,
    professionalName: string
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const template: NotificationTemplate = {
        type: "offer_accepted",
        title: "✅ Agendamento Confirmado!",
        message: `Ótima notícia! Seu agendamento foi confirmado com sucesso.\n\n` +
                `📅 Data: ${new Date(appointmentDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}\n` +
                `⏰ Horário: ${appointmentTime}\n` +
                `💈 Serviço: ${serviceName}\n` +
                `💇‍♂️ Profissional: ${professionalName}\n\n` +
                `📍 Compareça 10 minutos antes do horário.\n` +
                `📱 Leve seu documento de identificação.\n\n` +
                `Aguardamos você! 🎉`,
        metadata: {
          appointmentDate,
          appointmentTime,
          serviceName,
          professionalName
        }
      };

      const config: NotificationConfig = {
        channels: ["whatsapp", "email"],
        priority: "medium",
        retryAttempts: 2
      };

      return await this.sendNotification(clientId, template, config);
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error sending accepted notification:", error);
      return { success: false, error: "Erro ao enviar notificação" };
    }
  }

  /**
   * Envia notificação de oferta expirada
   */
  async sendOfferExpiredNotification(
    clientId: string,
    offeredDate: string,
    offeredTime: string,
    serviceName: string
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const template: NotificationTemplate = {
        type: "offer_expired",
        title: "⏰ Oferta Expirada",
        message: `Infelizmente, a oferta de horário expirou.\n\n` +
                `📅 Horário oferecido: ${new Date(offeredDate).toLocaleDateString('pt-BR')} às ${offeredTime}\n` +
                `💈 Serviço: ${serviceName}\n\n` +
                `Não se preocupe! Você continua na nossa fila de espera.\n` +
                `Entraremos em contato assim que surgir uma nova oportunidade.\n\n` +
                `📱 Fique atento às notificações!`,
        metadata: {
          offeredDate,
          offeredTime,
          serviceName
        }
      };

      const config: NotificationConfig = {
        channels: ["whatsapp"],
        priority: "low",
        retryAttempts: 1
      };

      return await this.sendNotification(clientId, template, config);
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error sending expired notification:", error);
      return { success: false, error: "Erro ao enviar notificação" };
    }
  }

  /**
   * Envia lembrete de posição na fila
   */
  async sendWaitlistPositionReminder(
    waitlistId: string,
    clientId: string,
    currentPosition: number,
    totalInQueue: number,
    serviceName: string
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const template: NotificationTemplate = {
        type: "position_reminder",
        title: "📋 Atualização da Fila de Espera",
        message: `Atualização sobre sua posição na fila de espera!\n\n` +
                `📍 Sua posição: #${currentPosition} de ${totalInQueue}\n` +
                `💈 Serviço: ${serviceName}\n\n` +
                `📈 Estamos trabalhando para encontrar um horário para você.\n` +
                `📱 Fique atento às notificações de ofertas.\n\n` +
                `Tempo médio de espera: aproximadamente ${currentPosition * 15} minutos.`,
        metadata: {
          currentPosition,
          totalInQueue,
          serviceName
        }
      };

      const config: NotificationConfig = {
        channels: ["whatsapp"],
        priority: "low",
        retryAttempts: 1
      };

      return await this.sendNotification(clientId, template, config);
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error sending position reminder:", error);
      return { success: false, error: "Erro ao enviar notificação" };
    }
  }

  /**
   * Envia notificação de boas-vindas à fila
   */
  async sendWaitlistWelcomeNotification(
    waitlistId: string,
    clientId: string,
    serviceName: string,
    estimatedWaitTime?: string
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const template: NotificationTemplate = {
        type: "waitlist_welcome",
        title: "📋 Bem-vindo à Fila de Espera!",
        message: `Você foi adicionado à nossa fila de espera com sucesso!\n\n` +
                `💈 Serviço: ${serviceName}\n` +
                (estimatedWaitTime ? `⏱️ Tempo estimado: ${estimatedWaitTime}\n\n` : '') +
                `🔄 Como funciona:\n` +
                `• Receberemos notificações quando um horário disponível surgir\n` +
                `• Você terá 10 minutos para aceitar ou recusar cada oferta\n` +
                `• Se não responder, passaremos para o próximo da fila\n\n` +
                `📱 Fique atento às notificações!`,
        metadata: {
          waitlistId,
          serviceName,
          estimatedWaitTime
        }
      };

      const config: NotificationConfig = {
        channels: ["whatsapp", "email"],
        priority: "medium",
        retryAttempts: 2
      };

      return await this.sendNotification(clientId, template, config);
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error sending welcome notification:", error);
      return { success: false, error: "Erro ao enviar notificação" };
    }
  }

  /**
   * Processa resposta do cliente via notificação
   */
  async processNotificationResponse(
    notificationId: string,
    action: string,
    metadata: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Registrar a resposta no banco
      const { error: responseError } = await supabase
        .from("notification_responses")
        .insert({
          notification_id: notificationId,
          action: action,
          metadata: metadata,
          responded_at: new Date().toISOString()
        });

      if (responseError) {
        console.error("[WAITLIST_NOTIFICATIONS] Error recording response:", responseError);
      }

      // Processar ações específicas
      switch (action) {
        case "accept_offer":
          return await this.handleAcceptOffer(metadata);
        case "decline_offer":
          return await this.handleDeclineOffer(metadata);
        case "accept_anticipation":
          return await this.handleAcceptAnticipation(metadata);
        case "decline_anticipation":
          return await this.handleDeclineAnticipation(metadata);
        default:
          return { success: true };
      }
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error processing response:", error);
      return { success: false, error: "Erro ao processar resposta" };
    }
  }

  /**
   * Envia notificação genérica
   */
  private async sendNotification(
    clientId: string,
    template: NotificationTemplate,
    config: NotificationConfig
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // Registrar notificação no banco
      const { data: notification, error: insertError } = await supabase
        .from("notifications")
        .insert({
          user_id: clientId,
          title: template.title,
          message: template.message,
          type: template.type,
          priority: config.priority,
          metadata: {
            ...template.metadata,
            buttons: template.buttons,
            channels: config.channels
          }
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[WAITLIST_NOTIFICATIONS] Error inserting notification:", insertError);
        return { success: false, error: insertError.message };
      }

      // Enviar para cada canal configurado
      for (const channel of config.channels) {
        await this.sendToChannel(channel, clientId, template, notification.id, config);
      }

      return { success: true, notificationId: notification.id };
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error sending notification:", error);
      return { success: false, error: "Erro ao enviar notificação" };
    }
  }

  /**
   * Envia notificação para canal específico
   */
  private async sendToChannel(
    channel: string,
    clientId: string,
    template: NotificationTemplate,
    notificationId: string,
    config: NotificationConfig
  ): Promise<void> {
    try {
      let jobType = "send_whatsapp";
      
      switch (channel) {
        case "whatsapp":
          jobType = "send_whatsapp";
          break;
        case "sms":
          jobType = "send_sms";
          break;
        case "email":
          jobType = "send_email";
          break;
        default:
          return;
      }

      await enqueue({
        job_type: jobType,
        payload: {
          userId: clientId,
          title: template.title,
          message: template.message,
          type: template.type,
          notificationId: notificationId,
          buttons: template.buttons,
          metadata: template.metadata,
        },
        priority: config.priority === "urgent" ? 3 : config.priority === "high" ? 2 : 1,
        scheduled_at: config.delayMinutes 
          ? new Date(Date.now() + config.delayMinutes * 60000).toISOString()
          : undefined,
      });
    } catch (error) {
      console.error(`[WAITLIST_NOTIFICATIONS] Error sending to ${channel}:`, error);
    }
  }

  /**
   * Manipula aceite de oferta
   */
  private async handleAcceptOffer(metadata: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      const { waitlistId, offeredDate, offeredTime } = metadata;
      
      // Atualizar status na fila
      const { error: updateError } = await supabase
        .from("waitlist_queue")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString()
        })
        .eq("id", waitlistId);

      if (updateError) {
        throw updateError;
      }

      // Enviar confirmação
      // (Isso seria implementado com base nos dados do agendamento criado)
      
      return { success: true };
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error handling accept offer:", error);
      return { success: false, error: "Erro ao processar aceite" };
    }
  }

  /**
   * Manipula recusa de oferta
   */
  private async handleDeclineOffer(metadata: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      const { waitlistId } = metadata;
      
      // Atualizar status na fila
      const { error: updateError } = await supabase
        .from("waitlist_queue")
        .update({
          status: "declined",
          responded_at: new Date().toISOString()
        })
        .eq("id", waitlistId);

      if (updateError) {
        throw updateError;
      }

      // Processar próximo da fila
      // (Isso chamaria o WaitlistManager para processar próximo cliente)
      
      return { success: true };
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error handling decline offer:", error);
      return { success: false, error: "Erro ao processar recusa" };
    }
  }

  /**
   * Manipula aceite de antecipação
   */
  private async handleAcceptAnticipation(metadata: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      const { appointmentId, currentDateTime, offeredDateTime } = metadata;
      
      // Atualizar agendamento
      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          scheduled_at: offeredDateTime
        })
        .eq("id", appointmentId);

      if (updateError) {
        throw updateError;
      }

      // Enviar confirmação
      // (Isso enviaria uma notificação de confirmação)
      
      return { success: true };
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error handling accept anticipation:", error);
      return { success: false, error: "Erro ao processar antecipação" };
    }
  }

  /**
   * Manipula recusa de antecipação
   */
  private async handleDeclineAnticipation(metadata: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      const { appointmentId } = metadata;
      
      // Manter agendamento original (não precisa fazer nada)
      
      return { success: true };
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error handling decline anticipation:", error);
      return { success: false, error: "Erro ao processar recusa" };
    }
  }

  /**
   * Envia notificações em lote
   */
  async sendBatchNotifications(
    notifications: Array<{
      clientId: string;
      template: NotificationTemplate;
      config: NotificationConfig;
    }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(
          notification.clientId,
          notification.template,
          notification.config
        );
        
        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(`Cliente ${notification.clientId}: ${result.error}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Cliente ${notification.clientId}: Erro inesperado`);
      }
    }

    return { success, failed, errors };
  }

  /**
   * Verifica notificações pendentes de resposta
   */
  async checkPendingNotifications(): Promise<{ pending: number }> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id")
        .eq("type", "slot_offer")
        .is("response", null)
        .lt("created_at", new Date(Date.now() - 15 * 60000).toISOString()); // Mais de 15 minutos

      if (error) {
        console.error("[WAITLIST_NOTIFICATIONS] Error checking pending notifications:", error);
        return { pending: 0 };
      }

      return { pending: data?.length || 0 };
    } catch (error) {
      console.error("[WAITLIST_NOTIFICATIONS] Error checking pending notifications:", error);
      return { pending: 0 };
    }
  }
}

export const waitlistNotifications = new WaitlistNotifications();
