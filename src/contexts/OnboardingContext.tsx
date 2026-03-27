import React, { createContext, useContext, useState, ReactNode } from "react";

interface Sector {
  key: string;
  label: string;
  icon: string;
  description: string;
}

interface OnboardingContextType {
  selectedSector: string | null;
  selectedSpecialty: string | null;
  setSelectedSector: (sector: string | null) => void;
  setSelectedSpecialty: (specialty: string | null) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const resetOnboarding = () => {
    setSelectedSector(null);
    setSelectedSpecialty(null);
  };

  return (
    <OnboardingContext.Provider
      value={{
        selectedSector,
        selectedSpecialty,
        setSelectedSector,
        setSelectedSpecialty,
        resetOnboarding,
      }}
    >
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
