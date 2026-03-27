import { useTranslation } from "react-i18next";
import { useOnboarding } from "@/contexts/OnboardingContext";

export function useNiche() {
  const { t } = useTranslation();
  const { selectedSector, selectedSpecialty } = useOnboarding();

  // Determina o setor atual baseado no onboarding ou no padrão
  const currentSector = selectedSector || 'barbershop';

  // Labels dinâmicas
  const nicheLabel = t(`niche.${currentSector}.label`, { defaultValue: t('niche.barbershop.label') });
  const nicheLabelPlural = t(`niche.${currentSector}.plural`, { defaultValue: t('niche.barbershop.plural') });

  return {
    currentNiche: currentSector,
    nicheLabel,
    nicheLabelPlural,
    sector: currentSector,
    specialty: selectedSpecialty,
  };
}
