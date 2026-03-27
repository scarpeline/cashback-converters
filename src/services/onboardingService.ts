import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SectorPreset {
  id: string;
  sector: string;
  specialty: string;
  default_services: any[];
  default_automations: any[];
  default_policies: any;
  default_resources: any[];
  description: string;
  icon: string;
}

const AUTOMATION_TYPE_MAP: Record<string, { trigger_type: string; action_type: string }> = {
  reminder: { trigger_type: "reminder_before", action_type: "send_whatsapp" },
  confirmation: { trigger_type: "booking_created", action_type: "send_whatsapp" },
  cancellation: { trigger_type: "booking_cancelled", action_type: "send_whatsapp" },
  rebook: { trigger_type: "client_inactive", action_type: "send_whatsapp" },
  feedback: { trigger_type: "booking_completed", action_type: "send_whatsapp" },
};

export const getSectorPresets = async (): Promise<SectorPreset[]> => {
  const { data, error } = await (supabase as any)
    .from("sector_presets")
    .select("*")
    .order("sector")
    .order("specialty");

  if (error) {
    console.error("Erro ao buscar presets de setor:", error);
    toast.error("Erro ao carregar opções de setor.");
    return [];
  }
  return data || [];
};

export const applyInitialPreset = async (
  userId: string,
  barbershopId: string,
  sector: string,
  specialty: string,
  preset: SectorPreset,
) => {
  try {
    // 1. Update barbershop with selected sector/specialty, policies and onboarding status
    const { error: updateError } = await (supabase as any)
      .from("barbershops")
      .update({
        sector: sector,
        specialty: specialty,
        booking_policies: preset.default_policies || {},
        onboarding_status: "configured",
      })
      .eq("id", barbershopId);

    if (updateError) throw updateError;

    // 2. Apply default services from preset
    if (preset.default_services && preset.default_services.length > 0) {
      const servicesToInsert = preset.default_services.map((service: any) => ({
        barbershop_id: barbershopId,
        name: service.name,
        duration: service.duration,
        price: service.price,
        description: service.description,
        is_active: true,
      }));
      const { error: servicesError } = await (supabase as any)
        .from("services")
        .insert(servicesToInsert);
      if (servicesError) throw servicesError;
    }

    // 3. Apply default automations from preset
    if (preset.default_automations && preset.default_automations.length > 0) {
      const automationsToInsert = preset.default_automations.map((auto: any) => {
        const typeMapping = AUTOMATION_TYPE_MAP[auto.type] || {
          trigger_type: auto.event || "booking_created",
          action_type: "send_whatsapp",
        };
        return {
          barbershop_id: barbershopId,
          name: `${auto.type.charAt(0).toUpperCase() + auto.type.slice(1)} - ${auto.event}`,
          description: `Automação de ${auto.type} para evento ${auto.event}`,
          trigger_type: typeMapping.trigger_type,
          trigger_hours_before: auto.type === "reminder" ? 24 : null,
          action_type: typeMapping.action_type,
          action_config: {},
          template_message: auto.message,
          is_active: true,
          priority: 0,
        };
      });
      const { error: automationsError } = await (supabase as any)
        .from("automations")
        .insert(automationsToInsert);
      if (automationsError) throw automationsError;
    }

    // 4. Apply default resources from preset
    if (preset.default_resources && preset.default_resources.length > 0) {
      const resourcesToInsert = preset.default_resources.map((resource: any) => ({
        barbershop_id: barbershopId,
        name: resource.name,
        resource_type: resource.type || "other",
        description: resource.description || null,
        capacity: resource.capacity || 1,
        is_active: true,
        color: resource.color || "#6366f1",
        metadata: resource.metadata || {},
      }));
      const { error: resourcesError } = await (supabase as any)
        .from("resources")
        .insert(resourcesToInsert);
      if (resourcesError) throw resourcesError;
    }

    toast.success("Configuração inicial aplicada com sucesso!");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao aplicar preset:", error);
    toast.error("Erro ao aplicar configuração inicial: " + error.message);
    return { success: false, error: error.message };
  }
};

export const updateBookingPolicies = async (
  barbershopId: string,
  policies: any,
) => {
  try {
    const { error } = await (supabase as any)
      .from("barbershops")
      .update({ booking_policies: policies })
      .eq("id", barbershopId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar políticas:", error);
    return { success: false, error: error.message };
  }
};

export const getBookingPolicies = async (barbershopId: string) => {
  try {
    const { data, error } = await (supabase as any)
      .from("barbershops")
      .select("booking_policies")
      .eq("id", barbershopId)
      .single();

    if (error) throw error;
    return { success: true, policies: data?.booking_policies };
  } catch (error: any) {
    console.error("Erro ao buscar políticas:", error);
    return { success: false, error: error.message };
  }
};