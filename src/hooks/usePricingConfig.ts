/**
 * Hook que busca a configuração de preços da landing page.
 * Sincroniza com o painel do super admin automaticamente.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchPricingConfig, PRICING_DEFAULTS } from "@/components/admin/PricingConfigPanel";
import type { PricingConfig } from "@/components/admin/PricingConfigPanel";

export type { PricingConfig };

export function usePricingConfig(): PricingConfig {
  const { data } = useQuery({
    queryKey: ["pricing_config"],
    queryFn: fetchPricingConfig,
    staleTime: 2 * 60 * 1000,
  });
  return data ?? PRICING_DEFAULTS;
}
