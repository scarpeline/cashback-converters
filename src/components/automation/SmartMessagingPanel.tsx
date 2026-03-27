// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle, Smartphone, Mail, Users, Clock, Play, Pause,
  Edit2, Save, X, Bell, Calendar, UserPlus, UserX, Star, Gift
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBarbershop } from "@/hooks/useBarbershop";

type Channel = "app" | "sms" | "whatsapp";
type SegmentType = "new_no_appointment" | "inactive_30" | "inactive_60" | "inactive_90" | "frequent" | "birthday" | "post_service";

interface MessageRule {
  id: SegmentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  active: boolean;
  channel: Channel;
  message: string;
  delay_days?: number;
}

const DEFAULT_RULES: MessageRule[] = [
  {
    id: "new_no_appointment",
    label: "Cadastrou mas não agendou",
    description: "Clientes que se cadastraram há mais de 2 dias e nunca agendaram",
    icon: <UserPlus className="w-4 h-4" />,
    color: "text-blue-600",
    active: true,
    channel: "whatsapp",
    message: "Olá {nome}! Você se cadastrou mas ainda não fez seu primeiro agendamento. Que tal marcar agora? Temos horários disponíveis para você! 💈",
    delay_days: 2,
  },
  {
    id: "inactive_30",
    label: "Inativo há 30 dias",
    description: "Clientes que não agendaram nos últimos 30 dias",
    icon: <Clock className="w-4 h-4" />,
    color: "text-yellow-600",
    active: true,
    channel: "whatsapp",
    message: "Olá {nome}! Faz um tempinho que não te vemos por aqui. Que tal agendar um horário? Estamos com novidades esperando por você! ✂️",
    delay_days: 30,
  },
  {
    id: "inactive_60",
    label: "Inativo há 60 dias",
    description: "Clientes que não agendaram nos últimos 60 dias",
    icon: <UserX className="w-4 h-4" />,
    color: "text-orange-600",
    active: true,
    channel: "whatsapp",
    message: "Olá {nome}! Sentimos sua falta! Faz 2 meses que não te vemos. Temos uma oferta especial para você voltar. Agende agora! 🎁",
    delay_days: 60,
  },
  {
    id: "inactive_90",
    label: "Inativo há 90 dias",
    description: "Clientes que não agendaram nos últimos 90 dias — risco de perda",
    icon: <UserX className="w-4 h-4" />,
    color: "text-red-600",
    active: false,
    channel: "whatsapp",
    message: "Olá {nome}! Faz 3 meses que não te vemos. Queremos muito te ter de volta! Que tal um desconto especial no próximo serviço? 💪",
    delay_days: 90,
  },
  {
    id: "frequent",
    label: "Cliente frequente",
    description: "Clientes com 5+ agendamentos — fidelização",
    icon: <Star className="w-4 h-4" />,
    color: "text-yellow-500",
    active: false,
    channel: "app",
    message: "Olá {nome}! Você é um dos nossos clientes mais fiéis! Obrigado pela confiança. Você tem um benefício especial esperando por você! ⭐",
  },
  {
    id: "birthday",
    label: "Aniversariante do mês",
    description: "Clientes que fazem aniversário no mês atual",
    icon: <Gift className="w-4 h-4" />,
    color: "text-pink-600",
    active: true,
    channel: "whatsapp",
    message: "Feliz aniversário, {nome}! 🎂 A equipe deseja um dia incrível! Temos um presente especial para você neste mês. Venha nos visitar!",
  },
  {
    id: "post_service",
    label: "Pós-atendimento",
    description: "Mensagem enviada 24h após o serviço concluído",
    icon: <Calendar className="w-4 h-4" />,
    color: "text-green-600",
    active: true,
    channel: "app",
    message: "Olá {nome}! Esperamos que tenha gostado do atendimento de ontem! Avalie sua experiência e agende o próximo horário. 😊",
    delay_days: 1,
  },
];

const CHANNEL_ICONS: Record<Channel, React.ReactNode> = {
  app: <Bell className="w-4 h-4" />,
  sms: <Smartphone className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
};

const CHANNEL_LABELS: Record<Channel, string> = {
  app: "📱 App",
  sms: "💬 SMS",
  whatsapp: "📲 WhatsApp",
};

export const SmartMessagingPanel = () => {
  const { barbershop } = useBarbershop();
  const [rules, setRules] = useState<MessageRule[]>(DEFAULT_RULES);
  const [editing, setEditing] = useState<SegmentType | null>(null);
  const [editMsg, setEditMsg] = useState("");
  const [sending, setSending] = useState<SegmentType | null>(null);
  const [clientCounts, setClientCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!barbershop?.id) return;
    loadClientCounts();
    loadSavedRules();
  }, [barbershop?.id]);

  const loadSavedRules = async () => {
    if (!barbershop?.id) return;
    const { data } = await (supabase as any)
      .from("barbershops")
      .select("automation_schedule")
      .eq("id", barbershop.id)
      .single();
    if (data?.automation_schedule) {
      const saved = (data.automation_schedule as any)?.smart_messages;
      if (saved) {
        setRules(prev => prev.map(r => ({ ...r, ...(saved[r.id] || {}) })));
      }
    }
  };

  const loadClientCounts = async () => {
    if (!barbershop?.id) return;
    const now = new Date();
    const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
    const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
    const d90 = new Date(now); d90.setDate(d90.getDate() - 90);
    const d2 = new Date(now); d2.setDate(d2.getDate() - 2);

    const [newNoApt, i30, i60, i90] = await Promise.all([
      (supabase as any).from("profiles").select("user_id", { count: "exact", head: true })
        .eq("role", "cliente")
        .lt("created_at", d2.toISOString())
        .not("user_id", "in",
          `(SELECT DISTINCT client_user_id FROM appointments WHERE barbershop_id='${barbershop.id}' AND client_user_id IS NOT NULL)`
        ),
      (supabase as any).from("appointments").select("client_user_id", { count: "exact", head: true })
        .eq("barbershop_id", barbershop.id)
        .lt("scheduled_at", d30.toISOString())
        .gte("scheduled_at", d60.toISOString()),
      (supabase as any).from("appointments").select("client_user_id", { count: "exact", head: true })
        .eq("barbershop_id", barbershop.id)
        .lt("scheduled_at", d60.toISOString())
        .gte("scheduled_at", d90.toISOString()),
      (supabase as any).from("appointments").select("client_user_id", { count: "exact", head: true })
        .eq("barbershop_id", barbershop.id)
        .lt("scheduled_at", d90.toISOString()),
    ]);

    setClientCounts({
      new_no_appointment: newNoApt.count || 0,
      inactive_30: i30.count || 0,
      inactive_60: i60.count || 0,
      inactive_90: i90.count || 0,
    });
  };

  const toggleRule = (id: SegmentType) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    toast.success("Regra atualizada");
  };

  const startEdit = (rule: MessageRule) => {
    setEditing(rule.id);
    setEditMsg(rule.message);
  };

  const saveEdit = (id: SegmentType) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, message: editMsg } : r));
    setEditing(null);
    toast.success("Mensagem salva");
  };

  const changeChannel = (id: SegmentType, channel: Channel) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, channel } : r));
  };

  const saveAllRules = async () => {
    if (!barbershop?.id) return;
    const saved = rules.reduce((acc, r) => {
      acc[r.id] = { active: r.active, channel: r.channel, message: r.message };
      return acc;
    }, {} as Record<string, any>);

    const current = (barbershop as any).automation_schedule || {};
    const { error } = await (supabase as any)
      .from("barbershops")
      .update({ automation_schedule: { ...current, smart_messages: saved } })
      .eq("id", barbershop.id);

    if (error) toast.error("Erro ao salvar");
    else toast.success("Configurações salvas!");
  };

  const dispatchManual = async (rule: MessageRule) => {
    if (!barbershop?.id) return;
    setSending(rule.id);
    try {
      const { data: clients } = await (supabase as any)
        .from("profiles")
        .select("user_id, name")
        .eq("role", "cliente")
        .limit(100);

      let sent = 0;
      for (const c of clients || []) {
        const msg = rule.message.replace("{nome}", c.name || "Cliente");
        await (supabase as any).from("notifications").insert({
          user_id: c.user_id,
          title: rule.label,
          message: msg,
          type: "info",
          priority: "normal",
        });
        sent++;
      }
      toast.success(`Enviado para ${sent} clientes via ${CHANNEL_LABELS[rule.channel]}`);
    } catch {
      toast.error("Erro ao disparar mensagem");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Mensagens Inteligentes por Segmento
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure mensagens automáticas por perfil de cliente
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Users className="w-3 h-3" />
            {rules.filter(r => r.active).length} ativas
          </Badge>
          <Button size="sm" variant="gold" onClick={saveAllRules}>
            <Save className="w-4 h-4 mr-1" /> Salvar Tudo
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {rules.map(rule => (
          <Card key={rule.id} className={rule.active ? "border-primary/30" : "opacity-60"}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className={rule.color}>{rule.icon}</span>
                  <div>
                    <CardTitle className="text-sm font-semibold">{rule.label}</CardTitle>
                    <CardDescription className="text-xs">{rule.description}</CardDescription>
                  </div>
                  {clientCounts[rule.id] !== undefined && (
                    <Badge variant="secondary" className="text-xs ml-2">
                      {clientCounts[rule.id]} clientes
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={rule.active} onCheckedChange={() => toggleRule(rule.id)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Canal:</Label>
                <div className="flex gap-1">
                  {(["app", "sms", "whatsapp"] as Channel[]).map(ch => (
                    <Button
                      key={ch}
                      size="sm"
                      variant={rule.channel === ch ? "gold" : "outline"}
                      className="h-7 text-xs px-2"
                      onClick={() => changeChannel(rule.id, ch)}
                    >
                      {CHANNEL_ICONS[ch]} <span className="ml-1">{CHANNEL_LABELS[ch]}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {editing === rule.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editMsg}
                    onChange={e => setEditMsg(e.target.value)}
                    rows={3}
                    className="text-sm"
                    placeholder="Use {nome} para personalizar com o nome do cliente"
                  />
                  <p className="text-xs text-muted-foreground">Use {"{nome}"} para inserir o nome do cliente</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="gold" onClick={() => saveEdit(rule.id)}>
                      <Save className="w-3 h-3 mr-1" /> Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      <X className="w-3 h-3 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-muted-foreground flex-1 italic">"{rule.message}"</p>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => startEdit(rule)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={!rule.active || sending === rule.id}
                      onClick={() => dispatchManual(rule)}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {sending === rule.id ? "Enviando..." : "Disparar"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
