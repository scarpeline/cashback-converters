import { supabase } from "@/integrations/supabase/client";

export interface Professional {
  id: string;
  barbershop_id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getProfessionals(barbershopId: string): Promise<Professional[]> {
  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Erro ao buscar profissionais:", error);
    return [];
  }
  return data || [];
}

export async function getProfessionalById(barbershopId: string, professionalId: string): Promise<Professional | null> {
  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .eq("id", professionalId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Erro ao buscar profissional por ID:", error);
  }
  return data || null;
}
