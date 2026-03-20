import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, ArrowRight } from "lucide-react";

interface SectorPreset {
  id: string;
  sector: string;
  specialty: string;
  description: string;
  icon: string;
  default_services?: any[];
  [key: string]: any;
}

const SECTORS = [
  {
    key: "beleza_estetica",
    label: "Beleza & Estética",
    icon: "scissors",
    description: "Salões, barbearias, nail designers, maquiadoras, esteticistas.",
  },
  {
    key: "saude_bem_estar",
    label: "Saúde & Bem-Estar",
    icon: "heart",
    description: "Clínicas, fisioterapeutas, psicólogos, massagistas, nutricionistas.",
  },
  {
    key: "educacao_mentorias",
    label: "Educação & Mentorias",
    icon: "book",
    description: "Professores particulares, consultores, coaches, escolas de idiomas.",
  },
  {
    key: "automotivo",
    label: "Automotivo",
    icon: "car",
    description: "Oficinas mecânicas, lava-rápidos, centros de estética automotiva.",
  },
  {
    key: "pets",
    label: "Pets",
    icon: "paw_print",
    description: "Pet shops, veterinários, adestradores, cuidadores de animais.",
  },
  {
    key: "servicos_domiciliares",
    label: "Serviços Domiciliares",
    icon: "home",
    description: "Eletricistas, encanadores, diaristas, montadores de móveis.",
  },
  {
    key: "juridico_financeiro",
    label: "Jurídico & Financeiro",
    icon: "briefcase",
    description: "Advogados, contadores, consultores financeiros.",
  },
  {
    key: "espacos_locacao",
    label: "Espaços & Locação",
    icon: "key",
    description: "Salas de reunião, estúdios, quadras esportivas, coworking.",
  },
];

const OnboardingSelectionPage = () => {
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
    const { data, error } = await (supabase as any)
      .from("sector_presets")
      .select("*")
      .order("sector")
      .order("specialty");

    if (error) {
      toast.error("Erro ao carregar presets: " + error.message);
      console.error("Erro ao carregar presets:", error);
    } else {
      setAvailableSpecialties(data || []);
    }
    setLoading(false);
  };

  const handleSelectSector = (sectorKey: string) => {
    setSelectedSector(sectorKey);
    setSelectedSpecialty(null); // Reset specialty when sector changes
  };

  const handleSelectSpecialty = (specialtyKey: string) => {
    setSelectedSpecialty(specialtyKey);
  };

  const applyPreset = async () => {
    if (!user?.id || !selectedSector || !selectedSpecialty) {
      toast.error("Selecione um setor e especialidade para continuar.");
      return;
    }

    setApplyingPreset(true);
    try {
      const preset = availableSpecialties.find(
        (p) => p.sector === selectedSector && p.specialty === selectedSpecialty,
      );

      if (!preset) {
        toast.error("Preset não encontrado para o setor/especialidade selecionado.");
        setApplyingPreset(false);
        return;
      }

      // Update barbershop with selected sector/specialty and onboarding status
      const { error: updateError } = await (supabase as any)
        .from("barbershops")
        .update({
          sector: selectedSector,
          specialty: selectedSpecialty,
          onboarding_status: "configured", // Mark as configured after applying preset
        })
        .eq("owner_id", user.id); // Assuming owner_id links to auth.users.id

      if (updateError) throw updateError;

      // Apply default services from preset
      if (preset.default_services && preset.default_services.length > 0) {
        const servicesToInsert = preset.default_services.map((service: any) => ({
          barbershop_id: user.id, // Assuming barbershop_id is user.id for now
          name: service.name,
          duration: service.duration,
          price: service.price,
          description: service.description,
          is_active: true,
        }));
        const { error: servicesError } = await (supabase as any)
          .from("services")
          .insert(servicesToInsert);
        if (servicesError) throw servicesError;
      }

      // TODO: Implement logic to apply default automations, policies, resources
      // This would involve inserting into respective tables based on preset.default_automations, etc.

      toast.success("Configuração inicial aplicada com sucesso!");
      navigate("/painel-dono"); // Redirect to dashboard after onboarding
    } catch (error: any) {
      toast.error("Erro ao aplicar configuração: " + error.message);
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
        <p className="ml-2 text-muted-foreground">Carregando opções...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo(a)!</CardTitle>
          <CardDescription>
            Para começar, selecione o setor e a especialidade da sua empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Sector */}
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Selecione seu Setor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SECTORS.map((sector) => (
                <Button
                  key={sector.key}
                  variant={selectedSector === sector.key ? "default" : "outline"}
                  onClick={() => handleSelectSector(sector.key)}
                  className="flex flex-col h-auto py-4 items-center justify-center text-center"
                >
                  <span className="text-3xl mb-2">{sector.icon === "scissors" ? "✂️" : sector.icon === "heart" ? "❤️" : sector.icon === "book" ? "📚" : sector.icon === "car" ? "🚗" : sector.icon === "paw_print" ? "🐾" : sector.icon === "home" ? "🏠" : sector.icon === "briefcase" ? "💼" : sector.icon === "key" ? "🔑" : "✨"}</span>
                  <span className="font-medium">{sector.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {sector.description}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Specialty (conditionally rendered) */}
          {selectedSector && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                2. Selecione sua Especialidade em {SECTORS.find(s => s.key === selectedSector)?.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="flex flex-col h-auto py-4 items-center justify-center text-center"
                    >
                      <span className="text-3xl mb-2">{preset.icon === "scissors" ? "✂️" : preset.icon === "nail_polish" ? "💅" : preset.icon === "palette" ? "🎨" : "✨"}</span>
                      <span className="font-medium">{preset.specialty}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {preset.description}
                      </span>
                    </Button>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-full text-center">
                    Nenhuma especialidade disponível para este setor ainda.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Apply Configuration */}
          {selectedSpecialty && (
            <div className="text-center">
              <Button
                onClick={applyPreset}
                disabled={applyingPreset}
                className="w-full max-w-xs"
              >
                {applyingPreset ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {applyingPreset ? "Aplicando..." : "Aplicar Configuração Inicial"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingSelectionPage;