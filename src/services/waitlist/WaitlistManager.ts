// @ts-nocheck
/**
 * WaitlistManager - Sistema de Fila de Espera Inteligente
 * 
 * Gerencia automaticamente:
 * - Entrada de clientes na fila
 * - Liberação de vagas
 * - Antecipação de horários
 * - Preços dinâmicos
 * - Realocação entre profissionais
 */

import { supabase } from "@/integrations/supabase/client";
import { enqueue } from "@/lib/adapters/queue-adapter";

export interface WaitlistEntry {
  id: string;
  barbershop_id: string;
  client_id: string;
  professional_preferred_id: string | null;
  service_id: string;
  desired_date: string;
  desired_time: string;
  accepts_other_professional: boolean;
  accepts_nearby_time: boolean;
  accepts_any_time: boolean;
  position_in_queue: number;
  status: "waiting" | "offered" | "accepted" | "declined" | "expired" | "cancelled";
  offered_at: string | null;
  offered_appointment_id: string | null;
  response_deadline: string | null;
  responded_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgendaIntelligenceSettings {
  id: string;
  barbershop_id: string;
  enable_waitlist: boolean;
  allow_professionals_view_queue: boolean;
  allow_professionals_offer_slots: boolean;
  waitlist_response_minutes: number;
  enable_auto_anticipation: boolean;
  anticipation_time_window_hours: number;
  allow_professionals_view_anticipations: boolean;
  enable_dynamic_pricing: boolean;
  allow_professionals_view_dynamic_pricing: boolean;
  enable_reallocation: boolean;
  allow_professionals_reallocation: boolean;
}

export interface DynamicPricingRule {
  id: string;
  barbershop_id: string;
  service_id: string | null;
  day_of_week: number; // 0=Dom, 1=Seg, ..., 6=Sáb
  start_time: string;
  end_time: string;
  price_type: "percentage" | "fixed";
  price_adjustment: number;
  is_active: boolean;
  min_capacity_threshold: number;
  description: string | null;
}

export interface WaitlistOffer {
  waitlist_id: string;
  appointment_id: string | null;
  offer_type: "slot_available" | "anticipation" | "reallocation";
  offered_at: string;
  response_deadline: string;
  response: "accepted" | "declined" | "expired" | null;
  responded_at: string | null;
  notes: string | null;
}

export interface WaitlistPreferences {
  professional_preferred_id: string | null;
  accepts_other_professional: boolean;
  accepts_nearby_time: boolean;
  accepts_any_time: boolean;
  notes?: string;
}

class WaitlistManager {
  /**
   * Adiciona cliente à fila de espera
   */
  async addToWaitlist(
    barbershopId: string,
    clientId: string,
    serviceId: string,
    desiredDate: string,
    desiredTime: string,
    preferences: WaitlistPreferences
  ): Promise<{ success: boolean; waitlistId?: string; error?: string }> {
    try {
      // Verificar se fila está ativa para esta barbearia
      const settings = await this.getAgendaSettings(barbershopId);
      if (!settings?.enable_waitlist) {
        return { success: false, error: "Fila de espera desativada" };
      }

      // Verificar se cliente já está na fila para este dia
      const existingEntry = await (supabase as any)
        .from("waitlist_queue")
        .select("id")
        .eq("barbershop_id", barbershopId)
        .eq("client_id", clientId)
        .eq("desired_date", desiredDate)
        .eq("status", "waiting")
        .single();

      if (existingEntry.data) {
        return { success: false, error: "Cliente já está na fila para esta data" };
      }

      // Inserir na fila
      const { data, error } = await (supabase as any)
        .from("waitlist_queue")
        .insert({
          barbershop_id: barbershopId,
          client_id: clientId,
          professional_preferred_id: preferences.professional_preferred_id,
          service_id: serviceId,
          desired_date: desiredDate,
          desired_time: desiredTime,
          accepts_other_professional: preferences.accepts_other_professional,
          accepts_nearby_time: preferences.accepts_nearby_time,
          accepts_any_time: preferences.accepts_any_time,
          notes: preferences.notes,
        })
        .select("id")
        .single();

      if (error) {
        console.error("[WAITLIST] Error adding to waitlist:", error);
        return { success: false, error: error.message };
      }

      // Enviar notificação de confirmação
      await this.sendWaitlistConfirmation(data.id, clientId);

      return { success: true, waitlistId: data.id };
    } catch (error) {
      console.error("[WAITLIST] Unexpected error:", error);
      return { success: false, error: "Erro interno" };
    }
  }

  /**
   * Remove cliente da fila
   */
  async removeFromWaitlist(waitlistId: string, clientId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from("waitlist_queue")
        .update({ status: "cancelled" })
        .eq("id", waitlistId)
        .eq("client_id", clientId);

      if (error) {
        console.error("[WAITLIST] Error removing from waitlist:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("[WAITLIST] Unexpected error:", error);
      return { success: false, error: "Erro interno" };
    }
  }

  /**
   * Processa liberação de vaga automaticamente
   */
  async processSlotRelease(
    barbershopId: string,
    availableDate: string,
    availableTime: string,
    professionalId: string | null = null,
    serviceId: string | null = null
  ): Promise<{ processed: boolean; nextClientId?: string }> {
    try {
      const settings = await this.getAgendaSettings(barbershopId);
      if (!settings?.enable_waitlist) {
        return { processed: false };
      }

      // Buscar próximo cliente elegível
      const { data: clients } = await (supabase as any).rpc("find_next_waitlist_client", {
        p_barbershop_id: barbershopId,
        p_available_date: availableDate,
        p_available_time: availableTime,
        p_professional_id: professionalId,
        p_service_id: serviceId,
      });

      if (!clients || clients.length === 0) {
        return { processed: false };
      }

      const nextClient = clients[0];
      
      // Criar oferta para o cliente
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + settings.waitlist_response_minutes);

      const { error: offerError } = await (supabase as any)
        .from("waitlist_queue")
        .update({
          status: "offered",
          offered_at: new Date().toISOString(),
          response_deadline: deadline.toISOString(),
        })
        .eq("id", nextClient.waitlist_id);

      if (offerError) {
        console.error("[WAITLIST] Error creating offer:", offerError);
        return { processed: false };
      }

      // Registrar histórico da oferta
      await (supabase as any)
        .from("waitlist_offer_history")
        .insert({
          waitlist_id: nextClient.waitlist_id,
          offer_type: "slot_available",
          response_deadline: deadline.toISOString(),
        });

      // Enviar notificação ao cliente
      await this.sendSlotOffer(nextClient.waitlist_id, availableDate, availableTime, professionalId);

      return { processed: true, nextClientId: nextClient.client_id };
    } catch (error) {
      console.error("[WAITLIST] Error processing slot release:", error);
      return { processed: false };
    }
  }

  /**
   * Processa resposta do cliente à oferta
   */
  async processOfferResponse(
    waitlistId: string,
    response: "accepted" | "declined",
    appointmentId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Atualizar status na fila
      const { error: updateError } = await (supabase as any)
        .from("waitlist_queue")
        .update({
          status: response,
          responded_at: new Date().toISOString(),
          offered_appointment_id: appointmentId || null,
        })
        .eq("id", waitlistId);

      if (updateError) {
        console.error("[WAITLIST] Error updating response:", updateError);
        return { success: false, error: updateError.message };
      }

      // Atualizar histórico
      await (supabase as any)
        .from("waitlist_offer_history")
        .update({
          response,
          responded_at: new Date().toISOString(),
          appointment_id: appointmentId || null,
        })
        .eq("waitlist_id", waitlistId)
        .eq("response", "expired") // Apenas o mais recente sem resposta
        .is("response", null);

      // Se aceitou, criar agendamento
      if (response === "accepted" && appointmentId) {
        await this.createAppointmentFromOffer(waitlistId, appointmentId);
      }

      // Se recusou, processar próximo cliente
      if (response === "declined") {
        await this.processNextInLine(waitlistId);
      }

      return { success: true };
    } catch (error) {
      console.error("[WAITLIST] Error processing response:", error);
      return { success: false, error: "Erro interno" };
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
        .from("waitlist_queue")
        .select("id, barbershop_id")
        .eq("status", "offered")
        .lt("response_deadline", now);

      if (!expiredOffers || expiredOffers.length === 0) {
        return { processed: 0 };
      }

      let processed = 0;

      for (const offer of expiredOffers) {
        // Marcar como expirado
        await (supabase as any)
          .from("waitlist_queue")
          .update({
            status: "expired",
            responded_at: now,
          })
          .eq("id", offer.id);

        // Atualizar histórico
        await (supabase as any)
          .from("waitlist_offer_history")
          .update({
            response: "expired",
            responded_at: now,
          })
          .eq("waitlist_id", offer.id)
          .is("response", null);

        // Processar próximo da fila
        await this.processNextInLine(offer.id);

        processed++;
      }

      return { processed };
    } catch (error) {
      console.error("[WAITLIST] Error processing expired offers:", error);
      return { processed: 0 };
    }
  }

  /**
   * Calcula preço dinâmico para um serviço
   */
  async calculateDynamicPrice(
    barbershopId: string,
    serviceId: string,
    date: string,
    time: string,
    basePrice: number
  ): Promise<{ finalPrice: number; adjustment?: number; rule?: DynamicPricingRule }> {
    try {
      const settings = await this.getAgendaSettings(barbershopId);
      if (!settings?.enable_dynamic_pricing) {
        return { finalPrice: basePrice };
      }

      // Usar função do banco para calcular preço
      const { data, error } = await (supabase as any).rpc("calculate_dynamic_price", {
        p_barbershop_id: barbershopId,
        p_service_id: serviceId,
        p_date: date,
        p_time: time,
        p_base_price: basePrice,
      });

      if (error) {
        console.error("[WAITLIST] Error calculating dynamic price:", error);
        return { finalPrice: basePrice };
      }

      const finalPrice = Number(data);
      const adjustment = finalPrice - basePrice;

      return { finalPrice, adjustment: adjustment !== 0 ? adjustment : undefined };
    } catch (error) {
      console.error("[WAITLIST] Error calculating dynamic price:", error);
      return { finalPrice: basePrice };
    }
  }

  /**
   * Busca configurações de inteligência de agenda
   */
  async getAgendaSettings(barbershopId: string): Promise<AgendaIntelligenceSettings | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("agenda_intelligence_settings")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .single();

      if (error) {
        console.error("[WAITLIST] Error getting settings:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("[WAITLIST] Error getting settings:", error);
      return null;
    }
  }

  /**
   * Atualiza configurações de inteligência de agenda
   */
  async updateAgendaSettings(
    barbershopId: string,
    settings: Partial<AgendaIntelligenceSettings>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from("agenda_intelligence_settings")
        .update(settings)
        .eq("barbershop_id", barbershopId);

      if (error) {
        console.error("[WAITLIST] Error updating settings:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("[WAITLIST] Error updating settings:", error);
      return { success: false, error: "Erro interno" };
    }
  }

  /**
   * Lista regras de preço dinâmico
   */
  async getDynamicPricingRules(barbershopId: string): Promise<DynamicPricingRule[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("dynamic_pricing")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("day_of_week, start_time");

      if (error) {
        console.error("[WAITLIST] Error getting pricing rules:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("[WAITLIST] Error getting pricing rules:", error);
      return [];
    }
  }

  /**
   * Cria ou atualiza regra de preço dinâmico
   */
  async saveDynamicPricingRule(
    rule: Partial<DynamicPricingRule> & { barbershop_id: string }
  ): Promise<{ success: boolean; ruleId?: string; error?: string }> {
    try {
      const { data, error } = await (supabase as any)
        .from("dynamic_pricing")
        .upsert(rule)
        .select("id")
        .single();

      if (error) {
        console.error("[WAITLIST] Error saving pricing rule:", error);
        return { success: false, error: error.message };
      }

      return { success: true, ruleId: data.id };
    } catch (error) {
      console.error("[WAITLIST] Error saving pricing rule:", error);
      return { success: false, error: "Erro interno" };
    }
  }

  /**
   * Remove regra de preço dinâmico
   */
  async deleteDynamicPricingRule(ruleId: string, barbershopId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from("dynamic_pricing")
        .delete()
        .eq("id", ruleId)
        .eq("barbershop_id", barbershopId);

      if (error) {
        console.error("[WAITLIST] Error deleting pricing rule:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("[WAITLIST] Error deleting pricing rule:", error);
      return { success: false, error: "Erro interno" };
    }
  }

  /**
   * Lista fila de espera
   */
  async getWaitlist(
    barbershopId: string,
    filters?: {
      date?: string;
      professionalId?: string;
      status?: string;
    }
  ): Promise<WaitlistEntry[]> {
    try {
      let query = supabase
        .from("waitlist_queue")
        .select(`
          *,
          clients:profiles(name, whatsapp),
          professionals:professionals(name),
          services:services(name, price)
        `)
        .eq("barbershop_id", barbershopId);

      if (filters?.date) {
        query = query.eq("desired_date", filters.date);
      }
      if (filters?.professionalId) {
        query = query.eq("professional_preferred_id", filters.professionalId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      query = query.order("desired_date, position_in_queue");

      const { data, error } = await query;

      if (error) {
        console.error("[WAITLIST] Error getting waitlist:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("[WAITLIST] Error getting waitlist:", error);
      return [];
    }
  }

  /**
   * Busca histórico de ofertas de um cliente
   */
  async getClientOfferHistory(clientId: string): Promise<WaitlistOffer[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("waitlist_offer_history")
        .select(`
          *,
          waitlist_queue!inner(
            desired_date,
            desired_time,
            services:services(name)
          )
        `)
        .eq("waitlist_queue.client_id", clientId)
        .order("offered_at", { ascending: false });

      if (error) {
        console.error("[WAITLIST] Error getting offer history:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("[WAITLIST] Error getting offer history:", error);
      return [];
    }
  }

  // Métodos privados

  private async sendWaitlistConfirmation(waitlistId: string, clientId: string): Promise<void> {
    await enqueue({
      job_type: "send_whatsapp",
      payload: {
        userId: clientId,
        message: "Você foi adicionado à nossa fila de espera! 📋\n\n" +
                "Entraremos em contato assim que um horário disponível surgir.\n" +
                "Fique atento às notificações! 📱",
        type: "waitlist_confirmation",
        metadata: { waitlistId },
      },
      priority: 1,
    });
  }

  private async sendSlotOffer(
    waitlistId: string,
    date: string,
    time: string,
    professionalId: string | null
  ): Promise<void> {
    // Buscar dados do cliente
    const { data: waitlist } = await (supabase as any)
      .from("waitlist_queue")
      .select("client_id, services:services(name)")
      .eq("id", waitlistId)
      .single();

    if (!waitlist) return;

    await enqueue({
      job_type: "send_whatsapp",
      payload: {
        userId: waitlist.client_id,
        message: `🎉 Uma vaga abriu!\n\n` +
                `📅 Data: ${new Date(date).toLocaleDateString('pt-BR')}\n` +
                `⏰ Horário: ${time}\n` +
                `💈 Serviço: ${waitlist.services.name}\n\n` +
                `Responda em até 10 minutos!\n` +
                `✅ Aceitar | ❌ Recusar`,
        type: "slot_offer",
        metadata: { waitlistId, date, time, professionalId },
      },
      priority: 2, // Alta prioridade
    });
  }

  private async createAppointmentFromOffer(waitlistId: string, appointmentId: string): Promise<void> {
    // Lógica para criar agendamento baseado na oferta
    // Isso seria implementado conforme a lógica de negócio existente
    console.log("[WAITLIST] Creating appointment from offer:", { waitlistId, appointmentId });
  }

  private async processNextInLine(waitlistId: string): Promise<void> {
    // Buscar dados da oferta atual
    const { data: currentOffer } = await (supabase as any)
      .from("waitlist_queue")
      .select("barbershop_id, desired_date, desired_time, professional_preferred_id, service_id")
      .eq("id", waitlistId)
      .single();

    if (!currentOffer) return;

    // Processar próximo cliente na fila
    await this.processSlotRelease(
      currentOffer.barbershop_id,
      currentOffer.desired_date,
      currentOffer.desired_time,
      currentOffer.professional_preferred_id,
      currentOffer.service_id
    );
  }
}

export const waitlistManager = new WaitlistManager();
