import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "./useBarbershop";

interface ProfessionalSlots {
  current_count: number;
  max_allowed: number;
  remaining: number;
  is_unlimited: boolean;
}

export function useProfessionalLimits() {
  const { barbershop } = useBarbershop();

  const { data, isLoading, error } = useQuery({
    queryKey: ["professional-limits", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return null;

      const { data, error } = await supabase.rpc("get_professional_slots", {
        p_barbershop_id: barbershop.id,
      });

      if (error) throw error;
      return data?.[0] as ProfessionalSlots | null;
    },
    enabled: !!barbershop?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  const canAddProfessional = data ? data.remaining > 0 || data.is_unlimited : false;
  const isAtLimit = data ? data.remaining === 0 && !data.is_unlimited : false;

  return {
    currentCount: data?.current_count ?? 0,
    maxAllowed: data?.max_allowed ?? 1,
    remaining: data?.remaining ?? 0,
    isUnlimited: data?.is_unlimited ?? false,
    canAddProfessional,
    isAtLimit,
    isLoading,
    error,
  };
}
