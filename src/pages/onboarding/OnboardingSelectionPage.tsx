```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { LanguageSelector } from "@/components/layout/LanguageSelector";

interface SectorPreset {
  id: string;
  sector: string;
  specialty: string;
  display_name: string;
  description: string;
  icon: string;
  default_services?: any[];
  [key: string]: any;
}

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

const OnboardingSelectionPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [availableSpecialties, setAvailableSpecialties] = useState<
    SectorPreset[]
  >([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchSectorPresets();
  }, [user, navigate]);

  const fetchSectorPresets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sector_presets")
        .select("*")
        .order("sector")
        .order("specialty");

      if (error) {
        toast.error(t("onboarding.error_loading_presets") + ": " + error.message);
        console.error("Erro ao carregar presets:", error);
      } else {
        setAvailableSpecialties(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSector = (sectorKey: string) => {
    setSelectedSector(sectorKey);
    setSelectedSpecialty(null);
  };

  const handleSelectSpecialty = (specialtyKey: string) => {
    setSelectedSpecialty(specialtyKey);
  };

  const applyPreset = async () => {
    if (!user?.id || !selectedSector || !selectedSpecialty) {
      toast.error(t("onboarding.select_sector_specialty"));
      return;
    }

    setApplyingPreset(true);
    try {
      const preset = availableSpecialties.find(
        (p) => p.sector === selectedSector && p.specialty === selectedSpecialty,
      );

      if (!preset) {
        toast.error(t("onboarding.preset_not_found"));
        setApplyingPreset(false);
        return;
      }

      // Update barbershop metadata
      const { error: updateError } = await supabase
        .from("barbershops")
        .update({
          sector: selectedSector,
          specialty: selectedSpecialty,
          onboarding_status: "configured",
        })
        .eq("owner_user_id", user.id);

      if (updateError) throw updateError;

      // Apply default services
      if (preset.default_services && Array.isArray(preset.default_services)) {
        // First get the barbershop id
        const { data: bshop } = await supabase
          .from("barbershops")
          .select("id")
          .eq("owner_user_id", user.id)
          .single();

        if (bshop) {
          const servicesToInsert = preset.default_services.map((service: any) => ({
            barbershop_id: bshop.id,
            name: service.name,
            duration_minutes: service.duration_minutes || service.duration || 30, // Normalize duration
            price: service.price,
            description: service.description,
            is_active: true,
          }));
          
          const { error: servicesError } = await supabase
            .from("services")
            .insert(servicesToInsert);
          if (servicesError) console.error("Error inserting services:", servicesError);
        }
      }

      // TODO: Implement logic to apply default automations, policies, resources
      // This would involve inserting into respective tables based on preset.default_automations, etc.

      toast.success(t("onboarding.setup_success"));
      navigate("/painel-dono"); 
    } catch (error: any) {
      toast.error(t("onboarding.apply_error") + ": " + error.message);
      console.error("Erro ao aplicar preset:", error);
    } finally {
      setApplyingPreset(false);
    }
  };

  const filteredSpecialties = availableSpecialties.filter(
    (preset) => preset.sector === selectedSector,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">A</span>
          </div>
          <h1 className="text-xl font-bold">Agenda App</h1>
        </div>
        <LanguageSelector />
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-3xl border-none shadow-premium bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              {t("onboarding.welcome_title")}
            </CardTitle>
            <CardDescription className="text-lg">
              {t("onboarding.welcome_description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Step 1: Select Sector */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-primary/20 text-primary rounded-full text-sm">1</span>
                {t("onboarding.select_sector")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SECTORS.map((sector) => (
                  <Button
                    key={sector.key}
                    variant={selectedSector === sector.key ? "default" : "outline"}
                    onClick={() => handleSelectSector(sector.key)}
                    className={`flex flex-col h-auto py-6 items-center justify-center text-center transition-all duration-300 ${
                      selectedSector === sector.key 
                      ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-lg" 
                      : "hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <span className="text-4xl mb-3">{sector.icon}</span>
                    <span className="font-bold text-base">{sector.label}</span>
                    <span className="text-xs text-muted-foreground mt-2 px-2 leading-relaxed">
                      {sector.description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Specialty (conditionally rendered) */}
            {selectedSector && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-primary/20 text-primary rounded-full text-sm">2</span>
                  {t("onboarding.select_specialty", {
                    sector: SECTORS.find(s => s.key === selectedSector)?.label
                  })}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSpecialties.length > 0 ? (
                    filteredSpecialties.map((preset) => (
                      <Button
                        key={preset.id}
                        variant={
                          selectedSpecialty === preset.specialty
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleSelectSpecialty(preset.specialty)}
                        className={`flex flex-col h-auto py-6 items-center justify-center text-center transition-all duration-300 ${
                          selectedSpecialty === preset.specialty
                          ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-lg" 
                          : "hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        <span className="text-4xl mb-3">{preset.icon || "✨"}</span>
                        <span className="font-bold text-base">{preset.display_name || preset.specialty}</span>
                        <span className="text-xs text-muted-foreground mt-2 px-2 leading-relaxed">
                          {preset.description}
                        </span>
                      </Button>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-full text-center py-8 border-2 border-dashed rounded-xl">
                      {t("onboarding.no_specialties_available")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Apply Configuration */}
            {selectedSpecialty && (
              <div className="text-center pt-4 animate-in zoom-in duration-300">
                <Button
                  onClick={applyPreset}
                  disabled={applyingPreset}
                  size="lg"
                  className="w-full max-w-sm h-14 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105"
                >
                  {applyingPreset ? (
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5 mr-3" />
                  )}
                  {applyingPreset ? t("common.applying") : t("onboarding.apply_preset_button")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default OnboardingSelectionPage;
```