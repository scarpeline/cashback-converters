import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WaitingListEntry {
  id: string;
  barbershop_id: string;
  client_id?: string;
  client_user_id?: string;
  service_id?: string;
  service_name?: string;
  preferred_professional_id?: string;
  preferred_date?: string;
  preferred_time?: string;
  status: string;
  priority: number;
  notes?: string;
  notified_at?: string;
  confirmed_at?: string;
  expired_at?: string;
  created_at: string;
  updated_at: string;
}

const NOTIFICATION_TIMEOUT_MINUTES = 15;

export const getWaitingList = async (barbershopId: string): Promise<{ data: WaitingListEntry[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from("waiting_list")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .in("status", ["waiting", "notified"])
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { data: (data || []) as unknown as WaitingListEntry[], error: null };
  } catch (error: any) {
    console.error("Erro ao buscar fila de espera:", error);
    return { data: null, error: error.message };
  }
};

export const addToWaitingList = async (
  barbershopId: string,
  entry: Partial<WaitingListEntry>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await (supabase
      .from("waiting_list") as any)
      .insert({
        barbershop_id: barbershopId,
        client_id: entry.client_id,
        service_id: entry.service_id,
        service_name: entry.service_name,
        preferred_professional_id: entry.preferred_professional_id,
        preferred_date: entry.preferred_date,
        preferred_time: entry.preferred_time,
        status: "waiting",
        priority: entry.priority || 0,
        notes: entry.notes,
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
    const { error } = await supabase
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
  status: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await (supabase
      .from("waiting_list") as any)
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
    const { data: nextInLine, error: fetchError } = await supabase
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

    const entry = nextInLine as any;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + NOTIFICATION_TIMEOUT_MINUTES);

    const { error: updateError } = await (supabase
      .from("waiting_list") as any)
      .update({
        status: "notified",
        notified_at: new Date().toISOString(),
      })
      .eq("id", entry.id);

    if (updateError) throw updateError;

    toast.success(`Notificação enviada para o próximo da fila!`);

    return { success: true, error: null, notifiedEntry: entry as unknown as WaitingListEntry };
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
    const { error } = await (supabase
      .from("waiting_list") as any)
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
    const { data, error } = await (supabase
      .from("waiting_list") as any)
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("status", "notified")
      .lt("expired_at", now);

    if (error) throw error;

    const expiredEntries = (data || []) as unknown as WaitingListEntry[];

    for (const entry of expiredEntries) {
      await expireWaitingListNotification(entry.id);
    }

    return { expiredEntries };
  } catch (error: any) {
    console.error("Erro ao verificar notificações expiradas:", error);
    return { expiredEntries: [] };
  }
};

export const getWaitingListStats = async (barbershopId: string): Promise<{ total: number; waiting: number; notified: number }> => {
  try {
    const { count: total } = await supabase
      .from("waiting_list")
      .select("*", { count: "exact", head: true })
      .eq("barbershop_id", barbershopId);

    const { count: waiting } = await supabase
      .from("waiting_list")
      .select("*", { count: "exact", head: true })
      .eq("barbershop_id", barbershopId)
      .eq("status", "waiting");

    const { count: notified } = await supabase
      .from("waiting_list")
      .select("*", { count: "exact", head: true })
      .eq("barbershop_id", barbershopId)
      .eq("status", "notified");

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
