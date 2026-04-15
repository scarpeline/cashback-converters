import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WaitingListEntry {
  id: string;
  barbershop_id: string;
  client_id?: string;
  client_name: string;
  client_whatsapp: string;
  service_id?: string;
  service_name?: string;
  preferred_professional_id?: string;
  preferred_date?: string;
  preferred_time?: string;
  alternative_time?: string;
  status: "waiting" | "notified" | "confirmed" | "expired" | "cancelled";
  priority: number;
  notified_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WaitingListNotification {
  id: string;
  waiting_list_id: string;
  message_sent: string;
  sent_at: string;
  expires_at: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  created_at: string;
}

const NOTIFICATION_TIMEOUT_MINUTES = 15;
const db = supabase as any;

export const getWaitingList = async (barbershopId: string): Promise<{ data: WaitingListEntry[] | null; error: string | null }> => {
  try {
    const { data, error } = await db
      .from("waiting_list")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .in("status", ["waiting", "notified"])
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { data: data as WaitingListEntry[], error: null };
  } catch (error: any) {
    console.error("Erro ao buscar fila de espera:", error);
    return { data: null, error: error.message };
  }
};

export const addToWaitingList = async (
  barbershopId: string,
  entry: Omit<WaitingListEntry, "id" | "barbershop_id" | "status" | "priority" | "created_at" | "updated_at">
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await db
      .from("waiting_list")
      .insert({
        barbershop_id: barbershopId,
        client_id: entry.client_id,
        client_name: entry.client_name,
        client_whatsapp: entry.client_whatsapp,
        service_id: entry.service_id,
        service_name: entry.service_name,
        preferred_professional_id: entry.preferred_professional_id,
        preferred_date: entry.preferred_date,
        preferred_time: entry.preferred_time,
        alternative_time: entry.alternative_time,
        status: "waiting",
        priority: 0,
      });

    if (error) throw error;
    toast.success("Adicionado à fila de espera!");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Erro ao adicionar à fila de espera:", error);
    toast.error("Erro ao adicionar à fila de espera");
    return { success: false, error: error.message };
  }
};

export const removeFromWaitingList = async (
  barbershopId: string,
  entryId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await db
      .from("waiting_list")
      .delete()
      .eq("id", entryId)
      .eq("barbershop_id", barbershopId);

    if (error) throw error;
    toast.success("Removido da fila de espera!");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Erro ao remover da fila de espera:", error);
    return { success: false, error: error.message };
  }
};

export const updateWaitingListStatus = async (
  entryId: string,
  status: WaitingListEntry["status"]
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await db
      .from("waiting_list")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", entryId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Erro ao atualizar status:", error);
    return { success: false, error: error.message };
  }
};

export const notifyNextInQueue = async (
  barbershopId: string,
  availableSlot: { date: string; time: string; professional_id: string; service_id: string }
): Promise<{ success: boolean; error: string | null; notifiedEntry?: WaitingListEntry }> => {
  try {
    const { data: nextInLine, error: fetchError } = await db
      .from("waiting_list")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("status", "waiting")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !nextInLine) {
      return { success: false, error: "Nenhum cliente na fila de espera" };
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + NOTIFICATION_TIMEOUT_MINUTES);

    const clientName = nextInLine.client_name || 'Cliente';
    const message = `Olá ${clientName}! Temos um horário disponível para você!\n\n📅 Data: ${availableSlot.date}\n🕐 Horário: ${availableSlot.time}\n\nPara confirmar seu agendamento, responda *CONFIRMAR* a esta mensagem.\n\nOu responda *MAIS TARDE* para indicar que prefere um horário posterior.\n\n⏰ Esta oferta expira em ${NOTIFICATION_TIMEOUT_MINUTES} minutos.`;

    const { error: updateError } = await db
      .from("waiting_list")
      .update({
        status: "notified",
        notified_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", nextInLine.id);

    if (updateError) throw updateError;

    // Try to send whatsapp notification (table may not exist yet)
    try {
      await db
        .from("whatsapp_outbound_messages")
        .insert({
          barbershop_id: barbershopId,
          to_number: nextInLine.client_whatsapp,
          message_body: message,
          status: "queued",
        });
    } catch (notifyError: any) {
      console.warn("Erro ao inserir mensagem na fila:", notifyError?.message);
    }

    toast.success(`Notificação enviada para ${clientName}!`);

    return { success: true, error: null, notifiedEntry: nextInLine as WaitingListEntry };
  } catch (error: any) {
    console.error("Erro ao notificar próximo da fila:", error);
    return { success: false, error: error.message };
  }
};

export const confirmFromWaitingList = async (entryId: string): Promise<{ success: boolean; error: string | null }> => {
  return updateWaitingListStatus(entryId, "confirmed");
};

export const expireWaitingListNotification = async (entryId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await db
      .from("waiting_list")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", entryId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Erro ao expirar notificação:", error);
    return { success: false, error: error.message };
  }
};

export const checkExpiredNotifications = async (barbershopId: string): Promise<{ expiredEntries: WaitingListEntry[] }> => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await db
      .from("waiting_list")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("status", "notified")
      .lt("expires_at", now);

    if (error) throw error;

    const expiredEntries = data || [];

    for (const entry of expiredEntries) {
      await expireWaitingListNotification(entry.id);
    }

    return { expiredEntries: expiredEntries as WaitingListEntry[] };
  } catch (error: any) {
    console.error("Erro ao verificar notificações expiradas:", error);
    return { expiredEntries: [] };
  }
};

export const getWaitingListStats = async (barbershopId: string): Promise<{ total: number; waiting: number; notified: number }> => {
  try {
    const { count: total, error: totalError } = await db
      .from("waiting_list")
      .select("*", { count: "exact", head: true })
      .eq("barbershop_id", barbershopId);

    const { count: waiting, error: waitingError } = await db
      .from("waiting_list")
      .select("*", { count: "exact", head: true })
      .eq("barbershop_id", barbershopId)
      .eq("status", "waiting");

    const { count: notified, error: notifiedError } = await db
      .from("waiting_list")
      .select("*", { count: "exact", head: true })
      .eq("barbershop_id", barbershopId)
      .eq("status", "notified");

    if (totalError || waitingError || notifiedError) {
      throw new Error("Erro ao buscar estatísticas");
    }

    return {
      total: total || 0,
      waiting: waiting || 0,
      notified: notified || 0,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return { total: 0, waiting: 0, notified: 0 };
  }
};
