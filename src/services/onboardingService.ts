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

export const getSectorPresets = async (): Promise<SectorPreset[]> => {
  const { data, error } = await supabase
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
  barbershopId: string, // Assuming barbershopId is the ID of the business
  sector: string,
  specialty: string,
  preset: SectorPreset,
) => {
  try {
    // 1. Update barbershop with selected sector/specialty and onboarding status
    const { error: updateError } = await supabase
      .from("barbershops")
      .update({
        sector: sector,
        specialty: specialty,
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
      const { error: servicesError } = await supabase
        .from("services")
        .insert(servicesToInsert);
      if (servicesError) throw servicesError;
    }

    // 3. Apply default automations from preset (example, adjust to your schema)
    if (preset.default_automations && preset.default_automations.length > 0) {
      // Assuming an 'automations' table exists with barbershop_id and config JSONB
      const automationsToInsert = preset.default_automations.map((auto: any) => ({
        barbershop_id: barbershopId,
        type: auto.type,
        event: auto.event,
        message_template: auto.message,
        is_active: true,
      }));
      const { error: automationsError } = await supabase
        .from("automations") // Replace with your actual automations table name
        .insert(automationsToInsert);
      if (automationsError) console.warn("Could not insert default automations:", automationsError.message);
    }

    // 4. Apply default policies from preset (example, adjust to your schema)
    if (preset.default_policies) {
      // Assuming 'barbershops' table can store policy JSONB or a 'policies' table exists
      const { error: policiesError } = await supabase
        .from("barbershops") // Or a dedicated 'policies' table
        .update({
          booking_policies: preset.default_policies, // Assuming a JSONB column for policies
        })
        .eq("id", barbershopId);
      if (policiesError) console.warn("Could not update default policies:", policiesError.message);
    }

    // 5. Apply default resources from preset (example, adjust to your schema)
    if (preset.default_resources && preset.default_resources.length > 0) {
        // Assuming a 'resources' table exists
        const resourcesToInsert = preset.default_resources.map((resource: any) => ({
            barbershop_id: barbershopId,
            name: resource.name,
            type: resource.type, // e.g., 'room', 'equipment', 'assistant'
            capacity: resource.capacity || 1,
            is_active: true,
        }));
        const { error: resourcesError } = await supabase
            .from("resources") // Replace with your actual resources table name
            .insert(resourcesToInsert);
        if (resourcesError) console.warn("Could not insert default resources:", resourcesError.message);
    }


    toast.success("Configuração inicial aplicada com sucesso!");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao aplicar preset:", error);
    toast.error("Erro ao aplicar configuração inicial: " + error.message);
    return { success: false, error: error.message };
  }
};