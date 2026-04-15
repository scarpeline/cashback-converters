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

      const { count, error } = await supabase
        .from("professionals")
        .select("*", { count: "exact", head: true })
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true);

      if (error) throw error;
      const current = count ?? 0;
      return {
        current_count: current,
        max_allowed: 50,
        remaining: 50 - current,
        is_unlimited: false,
      } as ProfessionalSlots;
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
