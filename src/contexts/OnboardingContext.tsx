import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/lib/auth";

interface OnboardingContextType {
  selectedSector: string | null;
  selectedSpecialty: string | null;
  setSelectedSector: (sector: string | null) => void;
  setSelectedSpecialty: (specialty: string | null) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { barbershop } = useAuth();

  // Initialize from barbershop data (already configured) or localStorage (in-progress)
  const [selectedSector, _setSelectedSector] = useState<string | null>(() => {
    return barbershop?.sector || localStorage.getItem("onboarding_sector") || null;
  });
  const [selectedSpecialty, _setSelectedSpecialty] = useState<string | null>(() => {
    return barbershop?.specialty || localStorage.getItem("onboarding_specialty") || null;
  });

  // Sync from barbershop when it loads
  useEffect(() => {
    if (barbershop?.sector && !selectedSector) {
      _setSelectedSector(barbershop.sector);
    }
    if (barbershop?.specialty && !selectedSpecialty) {
      _setSelectedSpecialty(barbershop.specialty);
    }
  }, [barbershop?.sector, barbershop?.specialty]);

  const setSelectedSector = (sector: string | null) => {
    _setSelectedSector(sector);
    if (sector) localStorage.setItem("onboarding_sector", sector);
    else localStorage.removeItem("onboarding_sector");
  };

  const setSelectedSpecialty = (specialty: string | null) => {
    _setSelectedSpecialty(specialty);
    if (specialty) localStorage.setItem("onboarding_specialty", specialty);
    else localStorage.removeItem("onboarding_specialty");
  };

  const resetOnboarding = () => {
    _setSelectedSector(null);
    _setSelectedSpecialty(null);
    localStorage.removeItem("onboarding_sector");
    localStorage.removeItem("onboarding_specialty");
  };

  return (
    <OnboardingContext.Provider value={{
      selectedSector,
      selectedSpecialty,
      setSelectedSector,
      setSelectedSpecialty,
      resetOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
