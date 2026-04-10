/**
 * Hook para buscar o período de trial configurado pelo super admin.
 * Fallback: 14 dias se não configurado.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTrialDays(): number {
  const { data } = useQuery({
    queryKey: ["trial_days_config"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("integration_settings")
        .select("base_url")
        .eq("service_name", "trial_days")
        .maybeSingle();
      return data?.base_url ? parseInt(data.base_url) : 14;
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });
  return data ?? 14;
}
