/**
 * WaitlistEntryModal - Modal para clientes entrarem na fila de espera
 * 
 * Interface para configurar preferências de atendimento na fila:
 * - Profissional preferido
 * - Aceitar outros profissionais
 * - Aceitar horários próximos
 * - Aceitar qualquer horário
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { waitlistManager, type WaitlistPreferences } from "@/services/waitlist/WaitlistManager";
import { Calendar, Clock, Users, AlertCircle, CheckCircle } from "lucide-react";

interface WaitlistEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbershopId: string;
  clientId: string;
  serviceId: string;
  serviceName: string;
  desiredDate: string;
  desiredTime: string;
  professionals?: Array<{
    id: string;
    name: string;
    commission_percentage?: number;
  }>;
  onSuccess?: (waitlistId: string) => void;
}

export const WaitlistEntryModal = ({
  open,
  onOpenChange,
  barbershopId,
  clientId,
  serviceId,
  serviceName,
  desiredDate,
  desiredTime,
  professionals = [],
  onSuccess,
}: WaitlistEntryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Preferências do cliente
  const [preferences, setPreferences] = useState<WaitlistPreferences>({
    professional_preferred_id: null,
    accepts_other_professional: false,
    accepts_nearby_time: false,
    accepts_any_time: false,
    notes: "",
  });

  // Opções de preferência
  const preferenceOptions = [
    {
      id: "only_professional",
      title: "Apenas com este profissional",
      description: "Serei atendido apenas pelo profissional escolhido",
      icon: Users,
      config: {
        accepts_other_professional: false,
        accepts_nearby_time: false,
        accepts_any_time: false,
      },
    },
    {
      id: "other_professional",
      title: "Aceito outros profissionais",
      description: "Posso ser atendido por outros profissionais",
      icon: Users,
      config: {
        accepts_other_professional: true,
        accepts_nearby_time: false,
        accepts_any_time: false,
      },
    },
    {
      id: "nearby_time",
      title: "Aceito horário próximo",
      description: "Aceito horários próximos ao desejado",
      icon: Clock,
      config: {
        accepts_other_professional: true,
        accepts_nearby_time: true,
        accepts_any_time: false,
      },
    },
    {
      id: "any_time",
      title: "Qualquer horário no dia",
      description: "Aceito qualquer horário disponível no dia",
      icon: Calendar,
      config: {
        accepts_other_professional: true,
        accepts_nearby_time: true,
        accepts_any_time: true,
      },
    },
  ];

  const handleSubmit = async () => {
    if (!preferences.professional_preferred_id && !preferences.accepts_other_professional) {
      toast.error("Selecione um profissional ou aceite ser atendido por outros profissionais");
      return;
    }

    setLoading(true);
    
    try {
      const result = await waitlistManager.addToWaitlist(
        barbershopId,
        clientId,
        serviceId,
        desiredDate,
        desiredTime,
        preferences
      );

      if (result.success) {
        toast.success("Você foi adicionado à fila de espera com sucesso!");
        onSuccess?.(result.waitlistId!);
        onOpenChange(false);
        resetForm();
      } else {
        toast.error(result.error || "Erro ao entrar na fila de espera");
      }
    } catch (error) {
      console.error("[WAITLIST_ENTRY] Error:", error);
      toast.error("Erro ao entrar na fila de espera");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPreferences({
      professional_preferred_id: null,
      accepts_other_professional: false,
      accepts_nearby_time: false,
      accepts_any_time: false,
      notes: "",
    });
    setStep(1);
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      resetForm();
    }
  };

  const selectedPreference = preferenceOptions.find(
    (option) => option.id === getSelectedPreferenceId()
  );

  function getSelectedPreferenceId(): string {
    if (!preferences.accepts_other_professional) return "only_professional";
    if (preferences.accepts_any_time) return "any_time";
    if (preferences.accepts_nearby_time) return "other_professional";
    return "other_professional";
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Entrar na Fila de Espera
          </DialogTitle>
          <DialogDescription>
            Configure suas preferências de atendimento e entraremos em contato assim que um horário disponível surgir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do agendamento desejado */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium">Resumo do agendamento:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Data:</span>
                <p className="font-medium">
                  {new Date(desiredDate).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Horário:</span>
                <p className="font-medium">{desiredTime}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Serviço:</span>
                <p className="font-medium">{serviceName}</p>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Escolha o profissional:</Label>
                <RadioGroup
                  value={preferences.professional_preferred_id || "no-preference"}
                  onValueChange={(value) => {
                    if (value === "no-preference") {
                      setPreferences({
                        ...preferences,
                        professional_preferred_id: null,
                        accepts_other_professional: true,
                      });
                    } else {
                      setPreferences({
                        ...preferences,
                        professional_preferred_id: value,
                        accepts_other_professional: false,
                      });
                    }
                  }}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="no-preference" id="no-preference" />
                    <Label htmlFor="no-preference" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Sem preferência</span>
                        <Badge variant="outline">Qualquer profissional</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Serei atendido pelo primeiro profissional disponível
                      </p>
                    </Label>
                  </div>

                  {professionals.map((professional) => (
                    <div
                      key={professional.id}
                      className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    >
                      <RadioGroupItem value={professional.id} id={`prof-${professional.id}`} />
                      <Label htmlFor={`prof-${professional.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{professional.name}</span>
                          {professional.commission_percentage && (
                            <Badge variant="outline">
                              {professional.commission_percentage}% comissão
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Quero ser atendido especificamente por este profissional
                        </p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Continuar
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Preferência de atendimento:</Label>
                <RadioGroup
                  value={getSelectedPreferenceId()}
                  onValueChange={(value) => {
                    const option = preferenceOptions.find((opt) => opt.id === value);
                    if (option) {
                      setPreferences({
                        ...preferences,
                        ...option.config,
                      });
                    }
                  }}
                  className="mt-2"
                >
                  {preferenceOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Icon className="w-5 h-5 text-primary" />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          <div className="font-medium">{option.title}</div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Alguma informação adicional que possa nos ajudar a encontrar o horário perfeito para você?"
                  value={preferences.notes}
                  onChange={(e) => setPreferences({ ...preferences, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Entrar na Fila
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Informações importantes */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">Como funciona:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Você receberá uma notificação quando um horário disponível surgir</li>
                  <li>• Terá 10 minutos para aceitar ou recusar a oferta</li>
                  <li>• Se não responder, passaremos para o próximo da fila</li>
                  <li>• Podemos oferecer horários diferentes conforme suas preferências</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
