import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";

export const SpecialtySelector = () => {
  const { selectedSector, selectedSpecialty, setSelectedSpecialty } = useOnboarding();

  const { data: specialties, isLoading } = useQuery({
    queryKey: ["sector_specialties", selectedSector],
    queryFn: async () => {
      if (!selectedSector) return [];
      const { data, error } = await supabase
        .from("sector_presets")
        .select("*")
        .eq("sector", selectedSector)
        .order("label");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedSector,
  });

  if (!selectedSector) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Carregando sugestões para você...</p>
      </div>
    );
  }

  // Se não houver especialidades no banco, podemos mostrar algo padrão ou permitir escrita livre
  if (!specialties || specialties.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 rounded-xl border-2 border-dashed">
        <p className="text-muted-foreground">Não encontramos especialidades pré-definidas para este setor.</p>
        <p className="text-sm text-muted-foreground mt-2">Você poderá definir seus serviços manualmente no próximo passo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold">Qual é sua especialidade principal?</h3>
        <p className="text-muted-foreground">Isso nos ajudará a configurar seus serviços iniciais.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {specialties.map((spec) => (
          <Button
            key={spec.id || spec.value}
            variant={selectedSpecialty === spec.value ? "default" : "outline"}
            onClick={() => setSelectedSpecialty(spec.value)}
            className={`h-auto py-4 px-6 relative transition-all duration-300 ${
              selectedSpecialty === spec.value
                ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-md"
                : "hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <span className="font-medium">{spec.label}</span>
            {selectedSpecialty === spec.value && (
              <div className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full shadow-lg">
                <Check className="w-3 h-3" />
              </div>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};
