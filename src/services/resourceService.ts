import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Resource {
  id: string;
  barbershop_id: string;
  name: string;
  type: string;
  description: string | null;
  is_available: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
  // Extended aliases
  resource_type?: string;
  capacity?: number;
  is_active?: boolean;
  color?: string;
}

export const getResources = async (barbershopId: string): Promise<Resource[]> => {
  try {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar recursos:", error);
    toast.error("Erro ao carregar recursos.");
    return [];
  }
};

export const createResource = async (
  barbershopId: string,
  resource: Partial<Resource>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from("resources").insert({
      barbershop_id: barbershopId,
      name: resource.name || 'Novo Recurso',
      type: resource.resource_type || resource.type || 'room',
      description: resource.description || null,
      is_available: resource.is_active ?? resource.is_available ?? true,
      metadata: resource.metadata || {},
    });

    if (error) throw error;
    toast.success("Recurso criado com sucesso!");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao criar recurso:", error);
    toast.error("Erro ao criar recurso: " + error.message);
    return { success: false, error: error.message };
  }
};

export const updateResource = async (
  resourceId: string,
  updates: Partial<Resource>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("resources")
      .update(updates)
      .eq("id", resourceId);

    if (error) throw error;
    toast.success("Recurso atualizado com sucesso!");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar recurso:", error);
    toast.error("Erro ao atualizar recurso: " + error.message);
    return { success: false, error: error.message };
  }
};

export const deleteResource = async (
  resourceId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId);

    if (error) throw error;
    toast.success("Recurso deletado com sucesso!");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao deletar recurso:", error);
    toast.error("Erro ao deletar recurso: " + error.message);
    return { success: false, error: error.message };
  }
};

export const toggleResource = async (
  resourceId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> => {
  return updateResource(resourceId, { is_active: isActive });
};

export const RESOURCE_TYPES = [
  { value: "room", label: "Sala" },
  { value: "equipment", label: "Equipamento" },
  { value: "assistant", label: "Assistente" },
  { value: "vehicle", label: "Veículo" },
  { value: "other", label: "Outro" },
];

export const getResourceTypeLabel = (resourceType: string): string => {
  return RESOURCE_TYPES.find((t) => t.value === resourceType)?.label || resourceType;
};