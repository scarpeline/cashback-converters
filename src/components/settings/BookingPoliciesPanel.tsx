import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Save, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getBookingPolicies, updateBookingPolicies } from "@/services/onboardingService";

interface BookingPolicies {
  deposit_required: boolean;
  deposit_percentage: number;
  cancellation_window_hours: number;
  no_show_fee_percentage: number;
  advance_booking_hours_min: number;
  advance_booking_hours_max: number;
  buffer_minutes_before: number;
  buffer_minutes_after: number;
  allow_recurring: boolean;
  max_instances_per_recurring: number;
  require_confirmation: boolean;
  auto_confirm_after_hours: number;
}

const DEFAULT_POLICIES: BookingPolicies = {
  deposit_required: false,
  deposit_percentage: 0,
  cancellation_window_hours: 24,
  no_show_fee_percentage: 0,
  advance_booking_hours_min: 1,
  advance_booking_hours_max: 720,
  buffer_minutes_before: 0,
  buffer_minutes_after: 0,
  allow_recurring: true,
  max_instances_per_recurring: 12,
  require_confirmation: true,
  auto_confirm_after_hours: 24,
};

export default function BookingPoliciesPanel() {
  const { barbershop } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policies, setPolicies] = useState<BookingPolicies>(DEFAULT_POLICIES);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (barbershop?.id) {
      fetchPolicies();
    }
  }, [barbershop?.id]);

  const fetchPolicies = async () => {
    if (!barbershop?.id) return;
    setLoading(true);
    try {
      const result = await getBookingPolicies(barbershop.id);
      if (result.success && result.policies) {
        setPolicies({ ...DEFAULT_POLICIES, ...result.policies });
      }
    } catch (error) {
      console.error("Erro ao buscar políticas:", error);
      toast.error("Erro ao carregar políticas de agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof BookingPolicies, value: any) => {
    setPolicies((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!barbershop?.id) return;
    setSaving(true);
    try {
      const result = await updateBookingPolicies(barbershop.id, policies);
      if (result.success) {
        toast.success("Políticas salvas com sucesso!");
        setHasChanges(false);
      } else {
        toast.error("Erro ao salvar: " + result.error);
      }
    } catch (error) {
      console.error("Erro ao salvar políticas:", error);
      toast.error("Erro ao salvar políticas.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Políticas de Agendamento</CardTitle>
          <CardDescription>
            Configure regras gerais para agendamentos da sua empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="require_confirmation" className="flex flex-col">
                  <span>Exigir Confirmação</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Agendamentos precisam de confirmação manual
                  </span>
                </Label>
                <Switch
                  id="require_confirmation"
                  checked={policies.require_confirmation}
                  onCheckedChange={(checked) => handleChange("require_confirmation", checked)}
                />
              </div>
              {policies.require_confirmation && (
                <div className="flex items-center gap-2 pl-4">
                  <Label htmlFor="auto_confirm_after_hours" className="text-sm whitespace-nowrap">
                    Auto-confirmar após
                  </Label>
                  <Input
                    id="auto_confirm_after_hours"
                    type="number"
                    min={1}
                    max={168}
                    value={policies.auto_confirm_after_hours}
                    onChange={(e) => handleChange("auto_confirm_after_hours", parseInt(e.target.value) || 0)}
                    className="w-20 h-8"
                  />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="deposit_required" className="flex flex-col">
                  <span>Exigir Depósito Antecipado</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Cliente paga parte do valor antecipadamente
                  </span>
                </Label>
                <Switch
                  id="deposit_required"
                  checked={policies.deposit_required}
                  onCheckedChange={(checked) => handleChange("deposit_required", checked)}
                />
              </div>
              {policies.deposit_required && (
                <div className="flex items-center gap-2 pl-4">
                  <Label htmlFor="deposit_percentage" className="text-sm whitespace-nowrap">
                    Valor do depósito
                  </Label>
                  <Input
                    id="deposit_percentage"
                    type="number"
                    min={1}
                    max={100}
                    value={policies.deposit_percentage}
                    onChange={(e) => handleChange("deposit_percentage", parseInt(e.target.value) || 0)}
                    className="w-20 h-8"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Cancelamento e No-Show</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="cancellation_window_hours" className="text-sm whitespace-nowrap">
                  Janela de cancelamento
                </Label>
                <Input
                  id="cancellation_window_hours"
                  type="number"
                  min={0}
                  max={168}
                  value={policies.cancellation_window_hours}
                  onChange={(e) => handleChange("cancellation_window_hours", parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="no_show_fee_percentage" className="text-sm whitespace-nowrap">
                  Taxa de no-show
                </Label>
                <Input
                  id="no_show_fee_percentage"
                  type="number"
                  min={0}
                  max={100}
                  value={policies.no_show_fee_percentage}
                  onChange={(e) => handleChange("no_show_fee_percentage", parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Antecipação de Agendamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="advance_booking_hours_min" className="text-sm whitespace-nowrap">
                  Mínimo de antecedência
                </Label>
                <Input
                  id="advance_booking_hours_min"
                  type="number"
                  min={0}
                  max={168}
                  value={policies.advance_booking_hours_min}
                  onChange={(e) => handleChange("advance_booking_hours_min", parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="advance_booking_hours_max" className="text-sm whitespace-nowrap">
                  Máximo de antecedência
                </Label>
                <Input
                  id="advance_booking_hours_max"
                  type="number"
                  min={1}
                  max={8760}
                  value={policies.advance_booking_hours_max}
                  onChange={(e) => handleChange("advance_booking_hours_max", parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Intervalos (Buffers)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="buffer_minutes_before" className="text-sm whitespace-nowrap">
                  Intervalo antes
                </Label>
                <Input
                  id="buffer_minutes_before"
                  type="number"
                  min={0}
                  max={60}
                  value={policies.buffer_minutes_before}
                  onChange={(e) => handleChange("buffer_minutes_before", parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="buffer_minutes_after" className="text-sm whitespace-nowrap">
                  Intervalo depois
                </Label>
                <Input
                  id="buffer_minutes_after"
                  type="number"
                  min={0}
                  max={60}
                  value={policies.buffer_minutes_after}
                  onChange={(e) => handleChange("buffer_minutes_after", parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">minutos</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Agendamentos Recorrentes</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="allow_recurring" className="flex flex-col">
                <span>Permitir Recorrentes</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Clientes podem agendar serviços repetidamente
                </span>
              </Label>
              <Switch
                id="allow_recurring"
                checked={policies.allow_recurring}
                onCheckedChange={(checked) => handleChange("allow_recurring", checked)}
              />
            </div>
            {policies.allow_recurring && (
              <div className="flex items-center gap-2 pl-4">
                <Label htmlFor="max_instances_per_recurring" className="text-sm whitespace-nowrap">
                  Máximo de recorrências
                </Label>
                <Input
                  id="max_instances_per_recurring"
                  type="number"
                  min={1}
                  max={52}
                  value={policies.max_instances_per_recurring}
                  onChange={(e) => handleChange("max_instances_per_recurring", parseInt(e.target.value) || 1)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">vezes</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {hasChanges ? (
                <><AlertCircle className="w-4 h-4 text-yellow-500" /><span>Você tem alterações não salvas</span></>
              ) : (
                <><CheckCircle className="w-4 h-4 text-green-500" /><span>Todas as alterações estão salvas</span></>
              )}
            </div>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}