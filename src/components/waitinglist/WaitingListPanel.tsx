import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Bell, Clock, CheckCircle, AlertCircle, Users, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  getWaitingList,
  addToWaitingList,
  removeFromWaitingList,
  notifyNextInQueue,
  confirmFromWaitingList,
  updateWaitingListStatus,
  getWaitingListStats,
  WaitingListEntry,
} from "@/services/waitingListService";

export default function WaitingListPanel() {
  const { barbershop } = useAuth();
  const [loading, setLoading] = useState(true);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, notified: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    client_whatsapp: "",
    service_id: "",
    service_name: "",
    preferred_date: "",
    preferred_time: "",
    alternative_time: "",
  });

  const fetchWaitingList = useCallback(async () => {
    if (!barbershop?.id) return;
    setLoading(true);
    const { data, error } = await getWaitingList(barbershop.id);
    if (data) {
      setWaitingList(data);
    } else if (error) {
      toast.error("Erro ao carregar fila de espera: " + error);
    }
    setLoading(false);
  }, [barbershop?.id]);

  const fetchStats = useCallback(async () => {
    if (!barbershop?.id) return;
    const statsData = await getWaitingListStats(barbershop.id);
    setStats(statsData);
  }, [barbershop?.id]);

  useEffect(() => {
    if (barbershop?.id) {
      fetchWaitingList();
      fetchStats();
    }
  }, [barbershop?.id, fetchWaitingList, fetchStats]);

  const handleSave = async () => {
    if (!barbershop?.id) {
      toast.error("ID da barbearia não encontrado.");
      return;
    }

    if (!formData.client_name || !formData.client_whatsapp) {
      toast.error("Nome e WhatsApp são obrigatórios.");
      return;
    }

    setSaving(true);
    const { success, error } = await addToWaitingList(barbershop.id, {
      client_name: formData.client_name,
      client_whatsapp: formData.client_whatsapp,
      service_id: formData.service_id || undefined,
      service_name: formData.service_name || undefined,
      preferred_date: formData.preferred_date || undefined,
      preferred_time: formData.preferred_time || undefined,
      alternative_time: formData.alternative_time || undefined,
    });

    if (success) {
      setDialogOpen(false);
      setFormData({
        client_name: "",
        client_whatsapp: "",
        service_id: "",
        service_name: "",
        preferred_date: "",
        preferred_time: "",
        alternative_time: "",
      });
      fetchWaitingList();
      fetchStats();
    } else {
      toast.error("Erro ao adicionar: " + error);
    }
    setSaving(false);
  };

  const handleRemove = async (id: string) => {
    if (!barbershop?.id) return;
    if (window.confirm("Tem certeza que deseja remover este cliente da fila?")) {
      const { success, error } = await removeFromWaitingList(barbershop.id, id);
      if (success) {
        fetchWaitingList();
        fetchStats();
      } else {
        toast.error("Erro ao remover: " + error);
      }
    }
  };

  const handleNotify = async (entry: WaitingListEntry) => {
    if (!barbershop?.id) return;

    const availableSlot = {
      date: entry.preferred_date || new Date().toISOString().split("T")[0],
      time: entry.preferred_time || "09:00",
      professional_id: entry.preferred_professional_id || "",
      service_id: entry.service_id || "",
    };

    const { success, error } = await notifyNextInQueue(barbershop.id, availableSlot);
    if (success) {
      toast.success(`Notificação enviada para ${entry.client_name}!`);
      fetchWaitingList();
      fetchStats();
    } else {
      toast.error("Erro ao notificar: " + error);
    }
  };

  const handleConfirm = async (id: string) => {
    const { success, error } = await confirmFromWaitingList(id);
    if (success) {
      toast.success("Cliente confirmou o agendamento!");
      fetchWaitingList();
      fetchStats();
    } else {
      toast.error("Erro ao confirmar: " + error);
    }
  };

  const handleCancel = async (id: string) => {
    const { success, error } = await updateWaitingListStatus(id, "cancelled");
    if (success) {
      toast.success("Entrada cancelada!");
      fetchWaitingList();
      fetchStats();
    } else {
      toast.error("Erro ao cancelar: " + error);
    }
  };

  const getStatusBadge = (status: WaitingListEntry["status"]) => {
    switch (status) {
      case "waiting":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Aguardando</Badge>;
      case "notified":
        return <Badge variant="secondary"><Bell className="w-3 h-3 mr-1" /> Notificado</Badge>;
      case "confirmed":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" /> Confirmado</Badge>;
      case "expired":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Expirado</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><Trash2 className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Fila de Espera</CardTitle>
            <CardDescription>
              Gerencie clientes na fila de espera para preenchimento automático de horários.
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Adicionar à Fila
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar à Fila de Espera</DialogTitle>
                <DialogDescription>
                  Adicione um cliente à fila de espera para ser notificado quando houver horários disponíveis.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Nome do Cliente *</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_whatsapp">WhatsApp *</Label>
                    <Input
                      id="client_whatsapp"
                      value={formData.client_whatsapp}
                      onChange={(e) => setFormData({ ...formData, client_whatsapp: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_name">Serviço Preferido</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    placeholder="Ex: Corte de cabelo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_date">Data Preferida</Label>
                    <Input
                      id="preferred_date"
                      type="date"
                      value={formData.preferred_date}
                      onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferred_time">Horário Preferido</Label>
                    <Input
                      id="preferred_time"
                      type="time"
                      value={formData.preferred_time}
                      onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternative_time">Horário Alternativo</Label>
                  <Input
                    id="alternative_time"
                    type="time"
                    value={formData.alternative_time}
                    onChange={(e) => setFormData({ ...formData, alternative_time: e.target.value })}
                    placeholder="Se o preferido não estiver disponível"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total na Fila</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{stats.waiting}</p>
              <p className="text-sm text-muted-foreground">Aguardando</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Bell className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats.notified}</p>
              <p className="text-sm text-muted-foreground">Notificados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {waitingList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Nenhum cliente na fila de espera</p>
              <p className="text-sm text-muted-foreground mt-2">Adicione clientes para preencher horários vagos automaticamente.</p>
            </CardContent>
          </Card>
        ) : (
          waitingList.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{entry.client_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MessageCircle className="w-3 h-3" />
                      {entry.client_whatsapp}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(entry.status)}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {entry.service_name && (
                    <div>
                      <p className="text-muted-foreground">Serviço</p>
                      <p className="font-medium">{entry.service_name}</p>
                    </div>
                  )}
                  {entry.preferred_date && (
                    <div>
                      <p className="text-muted-foreground">Data Preferida</p>
                      <p className="font-medium">{entry.preferred_date}</p>
                    </div>
                  )}
                  {entry.preferred_time && (
                    <div>
                      <p className="text-muted-foreground">Horário</p>
                      <p className="font-medium">{entry.preferred_time}</p>
                    </div>
                  )}
                  {entry.alternative_time && (
                    <div>
                      <p className="text-muted-foreground">Alternativo</p>
                      <p className="font-medium">{entry.alternative_time}</p>
                    </div>
                  )}
                </div>
                {entry.status === "waiting" && (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleNotify(entry)}>
                      <Bell className="w-4 h-4 mr-2" />
                      Notificar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleRemove(entry.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                )}
                {entry.status === "notified" && (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button size="sm" onClick={() => handleConfirm(entry.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Agendamento
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCancel(entry.id)}>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
