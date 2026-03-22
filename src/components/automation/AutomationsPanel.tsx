import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Zap, ZapOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  getAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  toggleAutomation,
  TRIGGER_TYPES,
  ACTION_TYPES,
  getTriggerLabel,
  getActionLabel,
  Automation,
} from "@/services/automationService";

export default function AutomationsPanel() {
  const { barbershop } = useAuth();
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "booking_created",
    trigger_hours_before: 24,
    action_type: "send_whatsapp",
    template_message: "",
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    if (barbershop?.id) {
      fetchAutomations();
    }
  }, [barbershop?.id]);

  const fetchAutomations = async () => {
    if (!barbershop?.id) return;
    setLoading(true);
    try {
      const data = await getAutomations(barbershop.id);
      setAutomations(data);
    } catch (error) {
      console.error("Erro ao buscar automações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (automation?: Automation) => {
    if (automation) {
      setEditingAutomation(automation);
      setFormData({
        name: automation.name,
        description: (automation as any).description || "",
        trigger_type: automation.trigger_event,
        trigger_hours_before: (automation.config as any)?.trigger_hours_before || 24,
        action_type: automation.action_type,
        template_message: (automation.config as any)?.template_message || "",
        is_active: automation.is_active,
        priority: (automation.config as any)?.priority || 0,
      });
    } else {
      setEditingAutomation(null);
      setFormData({
        name: "",
        description: "",
        trigger_type: "booking_created",
        trigger_hours_before: 24,
        action_type: "send_whatsapp",
        template_message: "",
        is_active: true,
        priority: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!barbershop?.id) return;

    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const automationData = {
        name: formData.name,
        description: formData.description || null,
        trigger_type: formData.trigger_type,
        trigger_hours_before: formData.trigger_type === "reminder_before" ? formData.trigger_hours_before : null,
        trigger_days_inactive: formData.trigger_type === "client_inactive" ? formData.trigger_hours_before : null,
        action_type: formData.action_type,
        action_config: {},
        template_message: formData.template_message || null,
        is_active: formData.is_active,
        priority: formData.priority,
      };

      let result;
      if (editingAutomation) {
        result = await updateAutomation(editingAutomation.id, automationData);
      } else {
        result = await createAutomation(barbershop.id, automationData);
      }

      if (result.success) {
        setDialogOpen(false);
        fetchAutomations();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (automationId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta automação?")) return;
    await deleteAutomation(automationId);
    fetchAutomations();
  };

  const handleToggle = async (automation: Automation) => {
    await toggleAutomation(automation.id, !automation.is_active);
    fetchAutomations();
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {automations.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground">Nenhuma automação configurada ainda.</p>
                ) : (
                  automations.map((automation) => (
                    <Card key={automation.id} className="relative">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">{automation.name}</CardTitle>
                        <Badge variant={automation.is_active ? "default" : "secondary"}>
                          {automation.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">{automation.description}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Zap className="mr-1 h-4 w-4" />
                          <span>Gatilho: {getTriggerLabel(automation.trigger_type)}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <ZapOff className="mr-1 h-4 w-4" />
                          <span>Ação: {getActionLabel(automation.action_type)}</span>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" size="sm" onClick={() => handleOpenDialog(automation)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(automation.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={automation.is_active}
                            onCheckedChange={(checked) => handleToggle(automation)}
                            aria-label={`Toggle automation ${automation.name}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-2xl font-bold">Automações</CardTitle>
                  <Button onClick={() => handleOpenDialog()} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Nova Automação
                  </Button>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Gerencie suas automações de mensagens e ações para otimizar o fluxo do seu negócio.
                  </CardDescription>
                </CardContent>
              </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAutomation ? "Editar Automação" : "Nova Automação"}
            </DialogTitle>
            <DialogDescription>
              Configure quando e o que esta automação deve fazer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Lembrete 24h antes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger_type">Gatilho</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.trigger_type === "reminder_before" && (
              <div className="space-y-2">
                <Label htmlFor="trigger_hours_before">Enviar lembrete X horas antes</Label>
                <Input
                  id="trigger_hours_before"
                  type="number"
                  min={1}
                  value={formData.trigger_hours_before}
                  onChange={(e) =>
                    setFormData({ ...formData, trigger_hours_before: parseInt(e.target.value) || 24 })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="action_type">Ação</Label>
              <Select
                value={formData.action_type}
                onValueChange={(value) => setFormData({ ...formData, action_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_message">Mensagem (template)</Label>
              <Textarea
                id="template_message"
                value={formData.template_message}
                onChange={(e) => setFormData({ ...formData, template_message: e.target.value })}
                placeholder="Ex: Olá {client_name}, lembrete do seu agendamento de {service_name} amanhã às {time}."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use variáveis como: {"{client_name}"}, {"{service_name}"}, {"{date}"}, {"{time}"}, {"{professional_name}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Automações com maior prioridade são executadas primeiro.</p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Ativa</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingAutomation ? "Salvar Alterações" : "Criar Automação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}