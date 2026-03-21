import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  barbershop_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getServices(barbershopId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Erro ao buscar serviços:", error);
    return [];
  }
  return data || [];
}

export async function getServiceById(barbershopId: string, serviceId: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .eq("id", serviceId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Erro ao buscar serviço por ID:", error);
  }
  return data || null;
}
