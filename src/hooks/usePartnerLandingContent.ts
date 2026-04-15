/**
 * Hook que busca os textos editáveis da landing page de parceiros.
 * Sincroniza com o painel do super admin automaticamente.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchPartnerLandingContent, PARTNER_LANDING_DEFAULTS } from "@/components/admin/PartnerLandingContentPanel";
import type { LandingContent } from "@/components/admin/PartnerLandingContentPanel";

export type { LandingContent };

export function usePartnerLandingContent(): LandingContent {
  const { data } = useQuery({
    queryKey: ["partner_landing_content"],
    queryFn: fetchPartnerLandingContent,
    staleTime: 2 * 60 * 1000, // 2 min cache
  });
  return data ?? PARTNER_LANDING_DEFAULTS;
}
