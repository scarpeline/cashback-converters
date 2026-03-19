// @ts-nocheck
/**
 * AnticipationManager - Sistema de Antecipação Automática de Agendamentos
 * 
 * Gerencia automaticamente:
 * - Detecção de horários mais cedo disponíveis
 * - Ofertas de antecipação para clientes
 * - Atualização de agendamentos
 * - Liberação de horários antigos
 */

import { supabase } from "@/integrations/supabase/client";
import { enqueue } from "@/lib/adapters/queue-adapter";
import { waitlistManager } from "@/services/waitlist/WaitlistManager";

export interface AnticipationOpportunity {
  appointmentId: string;
  clientId: string;
  currentScheduledAt: string;
  earlierSlot: {
    date: string;
    time: string;
    professionalId: string;
    serviceId: string;
  };
  timeDifference: number; // minutos de antecipação
}

export interface AnticipationOffer {
  id: string;
  appointment_id: string;
  client_id: string;
  original_scheduled_at: string;
  offered_scheduled_at: string;
  status: "pending" | "accepted" | "declined" | "expired";
  offered_at: string;
  response_deadline: string;
  responded_at: string | null;
  notes: string | null;
}

class AnticipationManager {
  /**
   * Busca oportunidades de antecipação para um cliente
   */
  async findAnticipationOpportunities(
    barbershopId: string,
    clientId: string,
    timeWindowHours: number = 4
  ): Promise<AnticipationOpportunity[]> {
    try {
      // Buscar agendamentos futuros do cliente
      const { data: appointments, error: appointmentsError } = await (supabase as any)
        .from("appointments")
        .select(`
          id,
          scheduled_at,
          service_id,
          professional_id,
          services:services(name, duration_minutes)
        `)
        .eq("barbershop_id", barbershopId)
        .eq("client_user_id", clientId)
        .in("status", ["scheduled", "confirmed"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at");

      if (appointmentsError) {
        console.error("[ANTICIPATION] Error fetching appointments:", appointmentsError);
        return [];
      }

      if (!appointments || appointments.length === 0) {
        return [];
      }

      const opportunities: AnticipationOpportunity[] = [];

      for (const appointment of appointments) {
        const currentDateTime = new Date(appointment.scheduled_at);
        const windowStart = new Date(currentDateTime);
        windowStart.setHours(windowStart.getHours() - timeWindowHours);

        // Buscar horários disponíveis mais cedo
        const availableSlots = await this.findAvailableSlots(
          barbershopId,
          windowStart,
          currentDateTime,
          appointment.professional_id,
          appointment.services?.duration_minutes || 60
        );

        if (availableSlots.length > 0) {
          const bestSlot = availableSlots[0]; // Pegar o slot mais cedo disponível
          const timeDifference = Math.floor(
            (currentDateTime.getTime() - new Date(bestSlot.dateTime).getTime()) / (1000 * 60)
          );

          // Apenas considerar se a antecipação for significativa (pelo menos 30 minutos)
          if (timeDifference >= 30) {
            opportunities.push({
              appointmentId: appointment.id,
              clientId: clientId,
              currentScheduledAt: appointment.scheduled_at,
              earlierSlot: {
                date: bestSlot.date,
                time: bestSlot.time,
                professionalId: appointment.professional_id,
                serviceId: appointment.service_id,
              },
              timeDifference,
            });
          }
        }
      }

      return opportunities;
    } catch (error) {
      console.error("[ANTICIPATION] Error finding opportunities:", error);
      return [];
    }
  }

  /**
   * Busca slots disponíveis em um período
   */
  private async findAvailableSlots(
    barbershopId: string,
    startTime: Date,
    endTime: Date,
    preferredProfessionalId: string | null = null,
    serviceDuration: number = 60
  ): Promise<Array<{ date: string; time: string; dateTime: string }>> {
    try {
      // Buscar todos os agendamentos no período
      const { data: existingAppointments, error: appointmentsError } = await (supabase as any)
        .from("appointments")
        .select("scheduled_at, professional_id")
        .eq("barbershop_id", barbershopId)
        .in("status", ["scheduled", "confirmed"])
        .gte("scheduled_at", startTime.toISOString())
        .lte("scheduled_at", endTime.toISOString());

      if (appointmentsError) {
        console.error("[ANTICIPATION] Error fetching existing appointments:", appointmentsError);
        return [];
      }

      // Gerar slots possíveis (a cada 30 minutos)
      const slots: Array<{ date: string; time: string; dateTime: string }> = [];
      const currentTime = new Date(startTime);

      while (currentTime < endTime) {
        const slotDateTime = new Date(currentTime);
        const slotDate = slotDateTime.toISOString().split('T')[0];
        const slotTime = slotDateTime.toTimeString().slice(0, 5);

        // Verificar se slot está disponível
        const slotEnd = new Date(slotDateTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

        const hasConflict = existingAppointments?.some(appointment => {
          const appointmentStart = new Date(appointment.scheduled_at);
          const appointmentEnd = new Date(appointmentStart);
          appointmentEnd.setMinutes(appointmentEnd.getMinutes() + serviceDuration);

          // Verificar sobreposição
          const hasProfessionalConflict = preferredProfessionalId
            ? appointment.professional_id === preferredProfessionalId
            : true; // Se não tem preferência, qualquer profissional serve

          return hasProfessionalConflict && (
            (appointmentStart < slotEnd && appointmentEnd > slotDateTime)
          );
        });

        if (!hasConflict) {
          slots.push({
            date: slotDate,
            time: slotTime,
            dateTime: slotDateTime.toISOString(),
          });
        }

        // Avançar para o próximo slot (30 minutos)
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }

      return slots;
    } catch (error) {
      console.error("[ANTICIPATION] Error finding available slots:", error);
      return [];
    }
  }

  /**
   * Envia oferta de antecipação para cliente
   */
  async sendAnticipationOffer(
    opportunity: AnticipationOpportunity,
    responseMinutes: number = 10
  ): Promise<{ success: boolean; offerId?: string; error?: string }> {
    try {
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + responseMinutes);

      // Criar registro da oferta
      const { data, error } = await (supabase as any)
        .from("anticipation_offers")
        .insert({
          appointment_id: opportunity.appointmentId,
          client_id: opportunity.clientId,
          original_scheduled_at: opportunity.currentScheduledAt,
          offered_scheduled_at: `${opportunity.earlierSlot.date}T${opportunity.earlierSlot.time}:00`,
          status: "pending",
          response_deadline: deadline.toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("[ANTICIPATION] Error creating offer:", error);
        return { success: false, error: error.message };
      }

      // Enviar notificação ao cliente
      await this.sendAnticipationNotification(opportunity, deadline);

      return { success: true, offerId: data.id };
    } catch (error) {
      console.error("[ANTICIPATION] Error sending offer:", error);
      return { success: false, error: "Erro interno" };
    }
  }

  /**
   * Processa resposta do cliente à oferta de antecipação
   */
  async processAnticipationResponse(
    offerId: string,
    response: "accepted" | "declined"
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar dados da oferta
      const { data: offer, error: offerError } = await (supabase as any)
        .from("anticipation_offers")
        .select("*")
        .eq("id", offerId)
        .single();

      if (offerError || !offer) {
        return { success: false, error: "Oferta não encontrada" };
      }

      // Atualizar status da oferta
      const { error: updateError } = await (supabase as any)
        .from("anticipation_offers")
        .update({
          status: response,
          responded_at: new Date().toISOString(),
        })
        .eq("id", offerId);

      if (updateError) {
        console.error("[ANTICIPATION] Error updating offer:", updateError);
        return { success: false, error: updateError.message };
      }

      // Se aceitou, atualizar o agendamento
      if (response === "accepted") {
        await this.updateAppointmentForAnticipation(offer);
      }

      return { success: true };
    } catch (error) {
      console.error("[ANTICIPATION] Error processing response:", error);
      return { success: false, error: "Erro interno" };
    }
  }

  /**
   * Atualiza agendamento para antecipação
   */
  private async updateAppointmentForAnticipation(offer: AnticipationOffer): Promise<void> {
    try {
      const oldScheduledAt = new Date(offer.original_scheduled_at);
      const newScheduledAt = new Date(offer.offered_scheduled_at);

      // Atualizar agendamento
      const { error: updateError } = await (supabase as any)
        .from("appointments")
        .update({
          scheduled_at: newScheduledAt.toISOString(),
        })
        .eq("id", offer.appointment_id);

      if (updateError) {
        console.error("[ANTICIPATION] Error updating appointment:", updateError);
        throw updateError;
      }

      // Processar fila de espera para o horário antigo que foi liberado
      await waitlistManager.processSlotRelease(
        // Extrair barbershop_id do agendamento
        "", // Isso precisaria ser obtido do agendamento
        oldScheduledAt.toISOString().split('T')[0],
        oldScheduledAt.toTimeString().slice(0, 5),
        null, // Qualquer profissional
        null  // Qualquer serviço
      );

      // Enviar confirmação ao cliente
      await enqueue({
        job_type: "send_whatsapp",
        payload: {
          userId: offer.client_id,
          message: `✅ Seu agendamento foi antecipado com sucesso!\n\n` +
                  `📅 Novo horário: ${newScheduledAt.toLocaleString('pt-BR')}\n` +
                  `📅 Horário antigo: ${oldScheduledAt.toLocaleString('pt-BR')}\n\n` +
                  `Aguardamos você! 🎉`,
          type: "anticipation_confirmed",
          metadata: {
            appointmentId: offer.appointment_id,
            oldScheduledAt: offer.original_scheduled_at,
            newScheduledAt: offer.offered_scheduled_at,
          },
        },
        priority: 2,
      });
    } catch (error) {
      console.error("[ANTICIPATION] Error updating appointment:", error);
      throw error;
    }
  }

  /**
   * Processa ofertas expiradas
   */
  async processExpiredOffers(): Promise<{ processed: number }> {
    try {
      const now = new Date().toISOString();

      // Buscar ofertas expiradas
      const { data: expiredOffers } = await (supabase as any)
        .from("anticipation_offers")
        .select("*")
        .eq("status", "pending")
        .lt("response_deadline", now);

      if (!expiredOffers || expiredOffers.length === 0) {
        return { processed: 0 };
      }

      let processed = 0;

      for (const offer of expiredOffers) {
        // Marcar como expirado
        await (supabase as any)
          .from("anticipation_offers")
          .update({
            status: "expired",
            responded_at: now,
          })
          .eq("id", offer.id);

        processed++;
      }

      return { processed };
    } catch (error) {
      console.error("[ANTICIPATION] Error processing expired offers:", error);
      return { processed: 0 };
    }
  }

  /**
   * Busca histórico de ofertas de antecipação de um cliente
   */
  async getClientAnticipationHistory(clientId: string): Promise<AnticipationOffer[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("anticipation_offers")
        .select(`
          *,
          appointments:appointments(
            services:services(name)
          )
        `)
        .eq("client_id", clientId)
        .order("offered_at", { ascending: false });

      if (error) {
        console.error("[ANTICIPATION] Error getting history:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("[ANTICIPATION] Error getting history:", error);
      return [];
    }
  }

  /**
   * Verifica automaticamente oportunidades de antecipação
   */
  async checkAnticipationOpportunities(barbershopId: string): Promise<{ opportunities: number }> {
    try {
      // Buscar configurações da barbearia
      const settings = await waitlistManager.getAgendaSettings(barbershopId);
      if (!settings?.enable_auto_anticipation) {
        return { opportunities: 0 };
      }

      // Buscar todos os clientes com agendamentos futuros
      const { data: clients, error: clientsError } = await (supabase as any)
        .from("appointments")
        .select("client_user_id")
        .eq("barbershop_id", barbershopId)
        .in("status", ["scheduled", "confirmed"])
        .gte("scheduled_at", new Date().toISOString())
        .distinct();

      if (clientsError || !clients) {
        return { opportunities: 0 };
      }

      let totalOpportunities = 0;

      for (const client of clients) {
        const opportunities = await this.findAnticipationOpportunities(
          barbershopId,
          client.client_user_id,
          settings.anticipation_time_window_hours
        );

        for (const opportunity of opportunities) {
          const result = await this.sendAnticipationOffer(
            opportunity,
            settings.waitlist_response_minutes
          );
          
          if (result.success) {
            totalOpportunities++;
          }
        }
      }

      return { opportunities: totalOpportunities };
    } catch (error) {
      console.error("[ANTICIPATION] Error checking opportunities:", error);
      return { opportunities: 0 };
    }
  }

  /**
   * Envia notificação de oferta de antecipação
   */
  private async sendAnticipationNotification(
    opportunity: AnticipationOpportunity,
    deadline: Date
  ): Promise<void> {
    await enqueue({
      job_type: "send_whatsapp",
      payload: {
        userId: opportunity.clientId,
        message: `⏰ Temos um horário mais cedo disponível!\n\n` +
                `📅 Horário atual: ${new Date(opportunity.currentScheduledAt).toLocaleString('pt-BR')}\n` +
                `📅 Novo horário: ${opportunity.earlierSlot.date} às ${opportunity.earlierSlot.time}\n` +
                `⏱️ Antecipação de ${opportunity.timeDifference} minutos\n\n` +
                `Responda em até ${deadline.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}!\n` +
                `✅ Aceitar antecipação | ❌ Manter horário atual`,
        type: "anticipation_offer",
        metadata: {
          appointmentId: opportunity.appointmentId,
          currentScheduledAt: opportunity.currentScheduledAt,
          offeredScheduledAt: `${opportunity.earlierSlot.date}T${opportunity.earlierSlot.time}`,
          timeDifference: opportunity.timeDifference,
        },
      },
      priority: 2, // Alta prioridade
    });
  }
}

export const anticipationManager = new AnticipationManager();
