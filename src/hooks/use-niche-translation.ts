import { useTranslation } from "react-i18next";
import { useBarbershop } from "./useBarbershop";

export function useNicheTranslation() {
  const { t } = useTranslation();
  const { barbershop } = useBarbershop();

  const sector = (barbershop?.sector || "barbershop").toLowerCase();

  const getNicheLabel = (key: string) => {
    // Try to get niche-specific translation if sector is not barbershop
    if (sector !== "barbershop") {
      const nicheKey = `niche.${sector}.${key}`;
      const translation = t(nicheKey);
      // If translation exists and is not the key itself
      if (translation !== nicheKey) {
        return translation;
      }
    }

    // Default to barbershop labels if niche-specific not found
    return t(`niche.barbershop.${key}`);
  };

  return {
    t: getNicheLabel,
    sector,
    isBarbershop: sector === "barbershop",
    isSalon: sector === "salon",
    isClinic: sector === "clinic"
  };
}
