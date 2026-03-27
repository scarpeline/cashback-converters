import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";

const SECTORS = [
  {
    key: "beleza_estetica",
    label: "Beleza & Estética",
    icon: "✂️",
    description: "Salões, barbearias, nail designers, maquiadoras, esteticistas.",
  },
  {
    key: "saude_bem_estar",
    label: "Saúde & Bem-Estar",
    icon: "❤️",
    description: "Clínicas, fisioterapeutas, psicólogos, massagistas, nutricionistas.",
  },
  {
    key: "educacao_mentorias",
    label: "Educação & Mentorias",
    icon: "📚",
    description: "Professores particulares, consultores, coaches, escolas de idiomas.",
  },
  {
    key: "automotivo",
    label: "Automotivo",
    icon: "🚗",
    description: "Oficinas mecânicas, lava-rápidos, centros de estética automotiva.",
  },
  {
    key: "pets",
    label: "Pets",
    icon: "🐾",
    description: "Pet shops, veterinários, adestradores, cuidadores de animais.",
  },
  {
    key: "servicos_domiciliares",
    label: "Serviços Domiciliares",
    icon: "🏠",
    description: "Eletricistas, encanadores, diaristas, montadores de móveis.",
  },
  {
    key: "juridico_financeiro",
    label: "Jurídico & Financeiro",
    icon: "💼",
    description: "Advogados, contadores, consultores financeiros.",
  },
  {
    key: "espacos_locacao",
    label: "Espaços & Locação",
    icon: "🔑",
    description: "Salas de reunião, estúdios, quadras esportivas, coworking.",
  },
];

export const SectorSelector = () => {
  const { t } = useTranslation();
  const { selectedSector, setSelectedSector, setSelectedSpecialty } = useOnboarding();

  const handleSelect = (key: string) => {
    setSelectedSector(key);
    setSelectedSpecialty(null); // Reset specialty when sector changes
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {SECTORS.map((sector) => (
        <Button
          key={sector.key}
          variant={selectedSector === sector.key ? "default" : "outline"}
          onClick={() => handleSelect(sector.key)}
          className={`group relative flex flex-col h-auto py-8 items-center justify-center text-center transition-all duration-500 overflow-hidden ${
            selectedSector === sector.key
              ? "ring-2 ring-primary ring-offset-4 scale-105 shadow-2xl bg-primary text-white"
              : "hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02]"
          }`}
        >
          {selectedSector === sector.key && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 animate-pulse" />
          )}
          
          <span className={`text-5xl mb-4 transition-transform duration-500 group-hover:scale-110 ${
            selectedSector === sector.key ? "drop-shadow-lg" : ""
          }`}>
            {sector.icon}
          </span>
          
          <span className="font-bold text-xl mb-2 z-10">{sector.label}</span>
          
          <p className={`text-sm max-w-[200px] leading-relaxed z-10 ${
            selectedSector === sector.key ? "text-primary-foreground/90" : "text-muted-foreground"
          }`}>
            {sector.description}
          </p>

          {selectedSector === sector.key && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
              <span className="text-primary text-xs font-bold font-mono">✓</span>
            </div>
          )}
        </Button>
      ))}
    </div>
  );
};
