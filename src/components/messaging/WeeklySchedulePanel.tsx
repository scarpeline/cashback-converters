import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

interface WeeklySchedulePanelProps {
  barbershopId: string;
}

interface Schedule {
  id: string;
  name: string;
  is_active: boolean;
  days_of_week: number[];
  send_time: string;
  channel: string;
  target_audience: string;
  message_template: string;
  use_ai: boolean;
}

const DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export function WeeklySchedulePanel({ barbershopId }: WeeklySchedulePanelProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Schedule, "id">>({
    name: "",
    is_active: true,
    days_of_week: [1, 2, 3, 4, 5],
    send_time: "09:00",
    channel: "whatsapp",
    target_audience: "all",
    message_template: "",
    use_ai: false,
  });

  useEffect(() => {
    loadSchedules();
  }, [barbershopId, loadSchedules]);

  const loadSchedules = useCallback(async () => {
    try {
      const { data } = await (supabase as any)
        .from("message_schedules")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("created_at", { ascending: false });
      setSchedules(data || []);
    } catch (err) {
      console.error("Error loading schedules:", err);
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  const saveSchedule = async () => {
    if (!form.name || !form.message_template) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    try {
      const { error } = await (supabase as any)
        .from("message_schedules")
        .insert({ barbershop_id: barbershopId, ...form });

      if (error) throw error;
      toast({ title: "Agendamento criado!" });
      setShowForm(false);
      setForm({ name: "", is_active: true, days_of_week: [1, 2, 3, 4, 5], send_time: "09:00", channel: "whatsapp", target_audience: "all", message_template: "", use_ai: false });
      loadSchedules();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const toggleSchedule = async (id: string, active: boolean) => {
    await (supabase as any).from("message_schedules").update({ is_active: active }).eq("id", id);
    loadSchedules();
  };

  const deleteSchedule = async (id: string) => {
    await (supabase as any).from("message_schedules").delete().eq("id", id);
    loadSchedules();
    toast({ title: "Agendamento removido" });
  };

  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Ciclo Semanal de Mensagens
          </h3>
          <p className="text-sm text-muted-foreground">Automações que se repetem infinitamente toda semana</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-1" />Novo Ciclo
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Lembrete semanal" />
              </div>
              <div className="space-y-1">
                <Label>Horário de envio</Label>
                <Input type="time" value={form.send_time} onChange={(e) => setForm(p => ({ ...p, send_time: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Dias da semana</Label>
              <div className="flex gap-1">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      form.days_of_week.includes(day.value) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={(v) => setForm(p => ({ ...p, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="notification">Notificação Interna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Público-alvo</Label>
                <Select value={form.target_audience} onValueChange={(v) => setForm(p => ({ ...p, target_audience: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    <SelectItem value="active">Clientes ativos</SelectItem>
                    <SelectItem value="inactive">Clientes inativos</SelectItem>
                    <SelectItem value="vip">Clientes VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Mensagem</Label>
              <Textarea
                value={form.message_template}
                onChange={(e) => setForm(p => ({ ...p, message_template: e.target.value }))}
                placeholder="Use {nome} para personalizar. Ex: Olá {nome}, temos novidades!"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.use_ai} onCheckedChange={(v) => setForm(p => ({ ...p, use_ai: v }))} />
                <Label>Personalizar com IA</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={saveSchedule}>Salvar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-center text-muted-foreground py-4">Carregando...</p>
      ) : schedules.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhum ciclo configurado</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {schedules.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Ativo" : "Pausado"}</Badge>
                    <Badge variant="outline">{s.channel}</Badge>
                    {s.use_ai && <Badge variant="outline">🤖 IA</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {s.days_of_week.map(d => DAYS.find(dd => dd.value === d)?.label).join(", ")} às {s.send_time} • {s.target_audience}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={s.is_active} onCheckedChange={(v) => toggleSchedule(s.id, v)} />
                  <Button variant="ghost" size="icon" onClick={() => deleteSchedule(s.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
