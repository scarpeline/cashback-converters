import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Automation {
  id: string;
  barbershop_id: string;
  name: string;
  type: string;
  trigger_event: string;
  action_type: string;
  config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Extended fields (mapped from config)
  description?: string | null;
  trigger_type?: string;
  trigger_hours_before?: number | null;
  trigger_days_inactive?: number | null;
  action_config?: any;
  template_message?: string | null;
  priority?: number;
}

export const getAutomations = async (barbershopId: string): Promise<Automation[]> => {
  try {
    const { data, error } = await supabase
      .from("automations")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar automações:", error);
    toast.error("Erro ao carregar automações.");
    return [];
  }
};

export const createAutomation = async (
  barbershopId: string,
  automation: Partial<Automation>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from("automations").insert({
      barbershop_id: barbershopId,
      name: automation.name || 'Nova Automação',
      type: automation.type || 'reminder',
      trigger_event: automation.trigger_event || automation.trigger_type || 'appointment_created',
      action_type: automation.action_type || 'send_whatsapp',
      config: automation.config || automation.action_config || {},
      is_active: automation.is_active ?? true,
    });

    if (error) throw error;
    toast.success("Automação criada com sucesso!");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao criar automação:", error);
    toast.error("Erro ao criar automação: " + error.message);
    return { success: false, error: error.message };
  }
};

export const updateAutomation = async (
  automationId: string,
  updates: Partial<Automation>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.trigger_event !== undefined) dbUpdates.trigger_event = updates.trigger_event;
    if (updates.action_type !== undefined) dbUpdates.action_type = updates.action_type;
    if (updates.config !== undefined) dbUpdates.config = updates.config;
    if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
    const { error } = await supabase
      .from("automations")
      .update(dbUpdates)
      .eq("id", automationId);

    if (error) throw error;
    toast.success("Automação atualizada com sucesso!");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar automação:", error);
    toast.error("Erro ao atualizar automação: " + error.message);
    return { success: false, error: error.message };
  }
};

export const deleteAutomation = async (
  automationId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("automations")
      .delete()
      .eq("id", automationId);

    if (error) throw error;
    toast.success("Automação deletada com sucesso!");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao deletar automação:", error);
    toast.error("Erro ao deletar automação: " + error.message);
    return { success: false, error: error.message };
  }
};

export const toggleAutomation = async (
  automationId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> => {
  return updateAutomation(automationId, { is_active: isActive });
};

export const TRIGGER_TYPES = [
  { value: "booking_created", label: "Agendamento Criado" },
  { value: "booking_confirmed", label: "Agendamento Confirmado" },
  { value: "booking_cancelled", label: "Agendamento Cancelado" },
  { value: "booking_completed", label: "Agendamento Concluído" },
  { value: "reminder_before", label: "Lembrete (X horas antes)" },
  { value: "no_show", label: "Cliente Não Compareceu" },
  { value: "client_inactive", label: "Cliente Inativo (X dias)" },
  { value: "payment_received", label: "Pagamento Recebido" },
  { value: "payment_overdue", label: "Pagamento Atrasado" },
];

export const ACTION_TYPES = [
  { value: "send_whatsapp", label: "Enviar WhatsApp" },
  { value: "send_email", label: "Enviar Email" },
  { value: "send_sms", label: "Enviar SMS" },
  { value: "create_booking", label: "Criar Agendamento" },
  { value: "update_status", label: "Atualizar Status" },
  { value: "add_tag", label: "Adicionar Tag" },
  { value: "send_notification", label: "Enviar Notificação" },
];

export const getTriggerLabel = (triggerType: string): string => {
  return TRIGGER_TYPES.find((t) => t.value === triggerType)?.label || triggerType;
};

export const getActionLabel = (actionType: string): string => {
  return ACTION_TYPES.find((a) => a.value === actionType)?.label || actionType;
};