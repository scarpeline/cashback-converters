import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, HardHat, Car, Home, Users, Box, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  toggleResource,
  RESOURCE_TYPES,
  getResourceTypeLabel,
  Resource,
} from "@/services/resourceService";

export default function ResourcesPanel() {
  const { barbershop } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    resource_type: "room",
    description: "",
    capacity: 1,
    is_active: true,
    color: "#6366f1",
  });

  useEffect(() => {
    if (barbershop?.id) {
      fetchResources();
    }
  }, [barbershop?.id]);

  const fetchResources = async () => {
    if (!barbershop?.id) return;
    setLoading(true);
    try {
      const data = await getResources(barbershop.id);
      setResources(data);
    } catch (error) {
      console.error("Erro ao buscar recursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (resource?: Resource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        name: resource.name,
        resource_type: resource.type,
        description: resource.description || "",
        capacity: 1,
        is_active: resource.is_available,
        color: "#000000",
      });
    } else {
      setEditingResource(null);
      setFormData({
        name: "",
        resource_type: "room",
        description: "",
        capacity: 1,
        is_active: true,
        color: "#6366f1",
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
    if (formData.capacity < 1) {
      toast.error("Capacidade deve ser no mínimo 1.");
      return;
    }

    setSaving(true);
    try {
      const resourceData = {
        name: formData.name,
        resource_type: formData.resource_type,
        description: formData.description || null,
        capacity: formData.capacity,
        is_active: formData.is_active,
        color: formData.color,
        metadata: {}, // Future use for more complex resource properties
      };

      let result;
      if (editingResource) {
        result = await updateResource(editingResource.id, resourceData);
      } else {
        result = await createResource(barbershop.id, resourceData);
      }

      if (result.success) {
        setDialogOpen(false);
        fetchResources();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Tem certeza que deseja deletar este recurso?")) return;
    await deleteResource(resourceId);
    fetchResources();
  };

  const handleToggle = async (resource: Resource) => {
    await toggleResource(resource.id, !resource.is_active);
    fetchResources();
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "room":
        return <Home className="w-5 h-5" />;
      case "equipment":
        return <HardHat className="w-5 h-5" />;
      case "assistant":
        return <Users className="w-5 h-5" />;
      case "vehicle":
        return <Car className="w-5 h-5" />;
      default:
        return <Box className="w-5 h-5" />;
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-primary" />
                Recursos
              </CardTitle>
              <CardDescription>
                Gerencie salas, equipamentos, assistentes e outros recursos da sua empresa.
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Recurso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum recurso encontrado</p>
              <p className="text-sm mb-4">Crie seu primeiro recurso para começar.</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Recurso
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    resource.is_active ? "bg-card" : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${resource.is_active ? "bg-primary/10" : "bg-muted"}`}>
                      {getResourceIcon(resource.resource_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${!resource.is_active ? "text-muted-foreground" : ""}`}>
                          {resource.name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getResourceTypeLabel(resource.resource_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Capacidade: {resource.capacity} | {resource.description || "Sem descrição"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={resource.is_active}
                      onCheckedChange={() => handleToggle(resource)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(resource)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? "Editar Recurso" : "Novo Recurso"}
            </DialogTitle>
            <DialogDescription>
              Adicione ou edite um recurso que pode ser agendado ou utilizado em serviços.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Sala de Reunião A, Máquina de Laser"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource_type">Tipo de Recurso</Label>
              <Select
                value={formData.resource_type}
                onValueChange={(value) => setFormData({ ...formData, resource_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes sobre o recurso, capacidade, etc."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                Número de pessoas ou usos simultâneos que este recurso suporta.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Ativo</Label>
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
              {editingResource ? "Salvar Alterações" : "Criar Recurso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}