import { useAuth } from "@/lib/auth";
import { resolveDynamicLabel } from "@/lib/dynamicLabels";

export function useNiche() {
  const { barbershop } = useAuth();

  const sector = barbershop?.sector || null;
  const specialty = barbershop?.specialty || null;

  return {
    currentNiche: sector,
    sector,
    specialty,
    nicheLabel: sector || "Negócio",
    nicheLabelPlural: sector || "Negócios",
    resolveLabel: (key: string) => resolveDynamicLabel(key, sector, specialty),
  };
}
