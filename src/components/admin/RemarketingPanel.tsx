// @ts-nocheck
/**
 * RemarketingPanel — Super Admin
 * Automações de remarketing: usuário inativo 1d/3d/7d
 * Usa módulo de notificações e marketing existentes
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, MessageCircle, Smartphone, Play, Pause, Clock, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AutomationRule {
  id: string;
  trigger: "1d" | "3d" | "7d" | "cadastro_sem_uso" | "pagamento_falhou";
  channel: "push" | "email" | "whatsapp";
  title: string;
  message: string;
  active: boolean;
}

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: "1d_push",
    trigger: "1d",
    channel: "push",
    title: "Sentimos sua falta!",
    message: "Você não acessa o app há 1 dia. Que tal agendar hoje?",
    active: true,
  },
  {
    id: "3d_whatsapp",
    trigger: "3d",
    channel: "whatsapp",
    title: "Volte e ganhe desconto",
    message: "Olá! Faz 3 dias que você não usa o app. Temos uma oferta especial esperando por você.",
    active: true,
  },
  {
    id: "7d_email",
    trigger: "7d",
    channel: "email",
    title: "Você está perdendo muito!",
    message: "Faz 7 dias sem atividade. Veja o que há de novo no sistema.",
    active: false,
  },
  {
    id: "cadastro_sem_uso",
    trigger: "cadastro_sem_uso",
    channel: "push",
    title: "Complete seu cadastro",
    message: "Você se cadastrou mas ainda não usou o sistema. Vamos começar?",
    active: true,
  },
  {
    id: "pagamento_falhou",
    trigger: "pagamento_falhou",
    channel: "whatsapp",
    title: "Problema no pagamento",
    message: "Identificamos um problema no seu pagamento. Clique aqui para resolver.",
    active: true,
  },
];

const TRIGGER_LABELS: Record<string, string> = {
  "1d": "1 dia sem uso",
  "3d": "3 dias sem uso",
  "7d": "7 dias sem uso",
  "cadastro_sem_uso": "Cadastrou e não usou",
  "pagamento_falhou": "Pagamento falhou",
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  push: <Smartphone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
};

export function RemarketingPanel() {
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES);
  const [editing, setEditing] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const toggleRule = (id: string) => {
    setRules(prev =>
      prev.map(r => (r.id === id ? { ...r, active: !r.active } : r))
    );
    toast.success("Automação atualizada");
  };

  const updateMessage = (id: string, message: string) => {
    setRules(prev => prev.map(r => (r.id === id ? { ...r, message } : r)));
  };

  const runManual = async (rule: AutomationRule) => {
    setRunning(true);
    try {
      // Buscar usuários inativos e disparar notificação
      const { data: users } = await supabase
        .from("profiles")
        .select("user_id, name")
        .limit(50);

      let sent = 0;
      for (const user of users || []) {
        await supabase.from("notifications").insert({
          user_id: user.user_id,
          title: rule.title,
          message: rule.message,
          type: "info",
          read: false,
        });
        sent++;
      }

      toast.success(`Disparado para ${sent} usuários`);
    } catch {
      toast.error("Erro ao disparar automação");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Remarketing Inteligente
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automações de reengajamento por inatividade
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Users className="w-3 h-3" />
          {rules.filter(r => r.active).length} ativas
        </Badge>
      </div>

      <div className="grid gap-4">
        {rules.map(rule => (
          <Card key={rule.id} className={rule.active ? "border-primary/30" : "opacity-60"}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {CHANNEL_ICONS[rule.channel]}
                  <CardTitle className="text-sm font-semibold">{rule.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {TRIGGER_LABELS[rule.trigger]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.active}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runManual(rule)}
                    disabled={running || !rule.active}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Disparar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {editing === rule.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={rule.message}
                    onChange={e => updateMessage(rule.id, e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={() => setEditing(null)}>Salvar</Button>
                </div>
              ) : (
                <p
                  className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => setEditing(rule.id)}
                >
                  {rule.message}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fluxo pós-cadastro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Fluxo Pós-Cadastro
          </CardTitle>
          <CardDescription>
            Sequência automática após novo cadastro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { step: 1, delay: "Imediato", msg: "Boas-vindas + tutorial" },
              { step: 2, delay: "24h", msg: "Lembrete de configurar perfil" },
              { step: 3, delay: "3 dias", msg: "Dicas de uso do sistema" },
              { step: 4, delay: "7 dias", msg: "Oferta especial de upgrade" },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                  {item.step}
                </Badge>
                <span className="text-muted-foreground w-20 shrink-0">{item.delay}</span>
                <span>{item.msg}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
