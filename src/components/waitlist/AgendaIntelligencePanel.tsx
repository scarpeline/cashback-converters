/**
 * AgendaIntelligencePanel - Painel de Configurações de Inteligência de Agenda
 * 
 * Interface para o Dono configurar:
 * - Fila de espera inteligente
 * - Antecipação automática
 * - Preço dinâmico
 * - Realocação de clientes
 * - Permissões para profissionais
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { waitlistManager, type AgendaIntelligenceSettings, type DynamicPricingRule } from "@/services/waitlist/WaitlistManager";
import {
  Settings,
  Users,
  Clock,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  Save,
  Loader2
} from "lucide-react";

interface AgendaIntelligencePanelProps {
  barbershopId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

export const AgendaIntelligencePanel = ({ barbershopId }: AgendaIntelligencePanelProps) => {
  const [settings, setSettings] = useState<AgendaIntelligenceSettings | null>(null);
  const [pricingRules, setPricingRules] = useState<DynamicPricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<DynamicPricingRule | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);

  // Estado do formulário de regra de preço
  const [ruleForm, setRuleForm] = useState({
    service_id: "",
    day_of_week: 5, // Sexta-feira padrão
    start_time: "18:00",
    end_time: "22:00",
    price_type: "percentage" as "percentage" | "fixed",
    price_adjustment: 20,
    min_capacity_threshold: 80,
    description: "",
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, [barbershopId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [settingsData, rulesData] = await Promise.all([
        waitlistManager.getAgendaSettings(barbershopId),
        waitlistManager.getDynamicPricingRules(barbershopId),
      ]);

      setSettings(settingsData);
      setPricingRules(rulesData);
    } catch (error) {
      console.error("[AGENDA_INTELLIGENCE] Error loading data:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      
      const result = await waitlistManager.updateAgendaSettings(barbershopId, settings);
      
      if (result.success) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        toast.error(result.error || "Erro ao salvar configurações");
      }
    } catch (error) {
      console.error("[AGENDA_INTELLIGENCE] Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePricingRule = async () => {
    try {
      setSaving(true);
      
      const ruleData = {
        ...ruleForm,
        barbershop_id: barbershopId,
        service_id: ruleForm.service_id || null,
      };

      const result = await waitlistManager.saveDynamicPricingRule(ruleData);
      
      if (result.success) {
        toast.success("Regra de preço salva com sucesso!");
        setShowRuleForm(false);
        setRuleForm({
          service_id: "",
          day_of_week: 5,
          start_time: "18:00",
          end_time: "22:00",
          price_type: "percentage",
          price_adjustment: 20,
          min_capacity_threshold: 80,
          description: "",
          is_active: true,
        });
        setEditingRule(null);
        await loadData(); // Recarregar regras
      } else {
        toast.error(result.error || "Erro ao salvar regra de preço");
      }
    } catch (error) {
      console.error("[AGENDA_INTELLIGENCE] Error saving pricing rule:", error);
      toast.error("Erro ao salvar regra de preço");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePricingRule = async (ruleId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra de preço?")) {
      return;
    }

    try {
      const result = await waitlistManager.deleteDynamicPricingRule(ruleId, barbershopId);
      
      if (result.success) {
        toast.success("Regra de preço excluída com sucesso!");
        await loadData();
      } else {
        toast.error(result.error || "Erro ao excluir regra de preço");
      }
    } catch (error) {
      console.error("[AGENDA_INTELLIGENCE] Error deleting pricing rule:", error);
      toast.error("Erro ao excluir regra de preço");
    }
  };

  const handleEditPricingRule = (rule: DynamicPricingRule) => {
    setEditingRule(rule);
    setRuleForm({
      service_id: rule.service_id || "",
      day_of_week: rule.day_of_week,
      start_time: rule.start_time,
      end_time: rule.end_time,
      price_type: rule.price_type,
      price_adjustment: rule.price_adjustment,
      min_capacity_threshold: rule.min_capacity_threshold,
      description: rule.description || "",
      is_active: rule.is_active,
    });
    setShowRuleForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Configurações não encontradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Inteligência de Agenda
          </h2>
          <p className="text-muted-foreground">
            Configure automações inteligentes para otimizar sua agenda
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Configurações
        </Button>
      </div>

      <Tabs defaultValue="waitlist" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="waitlist" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Fila de Espera
          </TabsTrigger>
          <TabsTrigger value="anticipation" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Antecipação
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Preço Dinâmico
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        {/* Aba: Fila de Espera */}
        <TabsContent value="waitlist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Configurações da Fila de Espera
              </CardTitle>
              <CardDescription>
                Gerencie como clientes entram na fila quando não há horários disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Ativar fila de espera</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que clientes entrem em fila quando todos os horários estiverem ocupados
                  </p>
                </div>
                <Switch
                  checked={settings.enable_waitlist}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enable_waitlist: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Tempo de resposta</Label>
                  <p className="text-sm text-muted-foreground">
                    Minutos que o cliente tem para responder a uma oferta de horário
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    value={settings.waitlist_response_minutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        waitlist_response_minutes: Number(e.target.value),
                      })
                    }
                    className="w-20"
                    disabled={!settings.enable_waitlist}
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Profissionais veem fila</Label>
                    <p className="text-xs text-muted-foreground">
                      Permitir que profissionais visualizem a fila de espera
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_professionals_view_queue}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, allow_professionals_view_queue: checked })
                    }
                    disabled={!settings.enable_waitlist}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Profissionais oferecem vagas</Label>
                    <p className="text-xs text-muted-foreground">
                      Permitir que profissionais ofereçam vagas manualmente
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_professionals_offer_slots}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, allow_professionals_offer_slots: checked })
                    }
                    disabled={!settings.enable_waitlist}
                  />
                </div>
              </div>

              {settings.enable_waitlist && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Estatísticas da Fila</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">Aguardando</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-green-600">0</p>
                      <p className="text-xs text-muted-foreground">Ofertas enviadas hoje</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">0</p>
                      <p className="text-xs text-muted-foreground">Aceitas esta semana</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">0</p>
                      <p className="text-xs text-muted-foreground">Taxa de aceitação</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Antecipação */}
        <TabsContent value="anticipation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Antecipação Automática
              </CardTitle>
              <CardDescription>
                Ofereça horários mais cedo quando surgirem vagas disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Ativar antecipação automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Oferece automaticamente horários mais cedo quando disponíveis
                  </p>
                </div>
                <Switch
                  checked={settings.enable_auto_anticipation}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enable_auto_anticipation: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Janela de antecipação</Label>
                  <p className="text-sm text-muted-foreground">
                    Horas antes do horário original para considerar antecipação
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={settings.anticipation_time_window_hours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        anticipation_time_window_hours: Number(e.target.value),
                      })
                    }
                    className="w-20"
                    disabled={!settings.enable_auto_anticipation}
                  />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Profissionais veem antecipações</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que profissionais visualizem ofertas de antecipação
                  </p>
                </div>
                <Switch
                  checked={settings.allow_professionals_view_anticipations}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allow_professionals_view_anticipations: checked })
                  }
                  disabled={!settings.enable_auto_anticipation}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Preço Dinâmico */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Preço Dinâmico
                  </CardTitle>
                  <CardDescription>
                    Ajuste preços automaticamente baseado na demanda por horário
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.enable_dynamic_pricing}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, enable_dynamic_pricing: checked })
                    }
                  />
                  <Label>Ativar</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Profissionais veem preços dinâmicos</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que profissionais visualizem preços ajustados
                  </p>
                </div>
                <Switch
                  checked={settings.allow_professionals_view_dynamic_pricing}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allow_professionals_view_dynamic_pricing: checked })
                  }
                  disabled={!settings.enable_dynamic_pricing}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Regras de Preço Dinâmico</Label>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingRule(null);
                      setRuleForm({
                        service_id: "",
                        day_of_week: 5,
                        start_time: "18:00",
                        end_time: "22:00",
                        price_type: "percentage",
                        price_adjustment: 20,
                        min_capacity_threshold: 80,
                        description: "",
                        is_active: true,
                      });
                      setShowRuleForm(true);
                    }}
                    disabled={!settings.enable_dynamic_pricing}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Regra
                  </Button>
                </div>

                {showRuleForm && (
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {editingRule ? "Editar Regra" : "Nova Regra de Preço"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dia da Semana</Label>
                          <select
                            value={ruleForm.day_of_week}
                            onChange={(e) =>
                              setRuleForm({ ...ruleForm, day_of_week: Number(e.target.value) })
                            }
                            className="w-full p-2 border rounded-md"
                          >
                            {DAYS_OF_WEEK.map((day) => (
                              <option key={day.value} value={day.value}>
                                {day.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tipo de Ajuste</Label>
                          <select
                            value={ruleForm.price_type}
                            onChange={(e) =>
                              setRuleForm({ ...ruleForm, price_type: e.target.value as "percentage" | "fixed" })
                            }
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="percentage">Porcentagem (%)</option>
                            <option value="fixed">Valor Fixo (R$)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Horário Inicial</Label>
                          <Input
                            type="time"
                            value={ruleForm.start_time}
                            onChange={(e) => setRuleForm({ ...ruleForm, start_time: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Horário Final</Label>
                          <Input
                            type="time"
                            value={ruleForm.end_time}
                            onChange={(e) => setRuleForm({ ...ruleForm, end_time: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Ajuste ({ruleForm.price_type === "percentage" ? "%" : "R$"})
                          </Label>
                          <Input
                            type="number"
                            step={ruleForm.price_type === "percentage" ? "1" : "0.01"}
                            min={0}
                            value={ruleForm.price_adjustment}
                            onChange={(e) =>
                              setRuleForm({ ...ruleForm, price_adjustment: Number(e.target.value) })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Ocupação Mínima (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={ruleForm.min_capacity_threshold}
                            onChange={(e) =>
                              setRuleForm({ ...ruleForm, min_capacity_threshold: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição (opcional)</Label>
                        <Input
                          value={ruleForm.description}
                          onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                          placeholder="Ex: Horário de pico de sexta-feira"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={ruleForm.is_active}
                            onCheckedChange={(checked) => setRuleForm({ ...ruleForm, is_active: checked })}
                          />
                          <Label>Regra Ativa</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowRuleForm(false);
                              setEditingRule(null);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={handleSavePricingRule} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  {pricingRules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma regra de preço dinâmico configurada</p>
                    </div>
                  ) : (
                    pricingRules.map((rule) => (
                      <Card key={rule.id} className={!rule.is_active ? "opacity-50" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {DAYS_OF_WEEK.find((d) => d.value === rule.day_of_week)?.label}
                                </span>
                                <Badge variant={rule.is_active ? "default" : "secondary"}>
                                  {rule.is_active ? "Ativa" : "Inativa"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {rule.start_time} - {rule.end_time}
                              </p>
                              <p className="text-sm">
                                Ajuste: {rule.price_type === "percentage" ? "+" : "R$ "}
                                {rule.price_adjustment}
                                {rule.price_type === "percentage" ? "%" : ""}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Ocupação mínima: {rule.min_capacity_threshold}%
                              </p>
                              {rule.description && (
                                <p className="text-xs text-muted-foreground">{rule.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPricingRule(rule)}
                                disabled={!settings.enable_dynamic_pricing}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePricingRule(rule.id)}
                                disabled={!settings.enable_dynamic_pricing}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Permissões */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Permissões dos Profissionais
              </CardTitle>
              <CardDescription>
                Controle o que os profissionais podem visualizar e fazer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Fila de Espera</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm">Visualizar fila</Label>
                        <p className="text-xs text-muted-foreground">
                          Ver clientes aguardando na fila
                        </p>
                      </div>
                      <Switch
                        checked={settings.allow_professionals_view_queue}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, allow_professionals_view_queue: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm">Oferecer vagas</Label>
                        <p className="text-xs text-muted-foreground">
                          Oferecer horários manualmente
                        </p>
                      </div>
                      <Switch
                        checked={settings.allow_professionals_offer_slots}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, allow_professionals_offer_slots: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Antecipação</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm">Visualizar antecipações</Label>
                        <p className="text-xs text-muted-foreground">
                          Ver ofertas de antecipação
                        </p>
                      </div>
                      <Switch
                        checked={settings.allow_professionals_view_anticipations}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, allow_professionals_view_anticipations: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Preços</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm">Visualizar preços dinâmicos</Label>
                        <p className="text-xs text-muted-foreground">
                          Ver preços ajustados automaticamente
                        </p>
                      </div>
                      <Switch
                        checked={settings.allow_professionals_view_dynamic_pricing}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, allow_professionals_view_dynamic_pricing: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Realocação</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm">Permitir realocação</Label>
                        <p className="text-xs text-muted-foreground">
                          Realocar clientes para outros profissionais
                        </p>
                      </div>
                      <Switch
                        checked={settings.allow_professionals_reallocation}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, allow_professionals_reallocation: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-sm">Importante</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  As permissões afetam o que os profissionais podem ver e fazer no painel deles.
                  Desative funções que não deseja que os profissionais utilizem.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
