import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/pages/dashboards/owner/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Smartphone, Wifi, WifiOff, Plus, QrCode, Key, RefreshCw,
  AlertTriangle, CheckCircle, Info, Trash2, Crown, Shuffle,
  Pin, Bell, BellOff, Zap, Shield, Clock, ChevronDown, ChevronUp,
} from "lucide-react";

type ConnectionType = "web" | "api";
type SendMode = "fixed" | "alternate";
type AccountStatus = "connected" | "disconnected" | "connecting" | "error";

interface WaAccount {
  id: string;
  nickname: string;
  phone_number: string;
  connection_type: ConnectionType;
  status: AccountStatus;
  is_primary: boolean;
  send_mode?: SendMode;
  qr_code?: string;
  twilio_sid?: string;
  twilio_auth_token?: string;
  twilio_phone?: string;
  last_seen?: string;
  notify_disconnect: boolean;
}

const STATUS_CONFIG: Record<AccountStatus, { label: string; color: string; icon: React.ReactNode }> = {
  connected:    { label: "Conectado",    color: "bg-green-100 text-green-700 border-green-200",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  disconnected: { label: "Desconectado", color: "bg-red-100 text-red-700 border-red-200",        icon: <WifiOff className="w-3.5 h-3.5" /> },
  connecting:   { label: "Conectando...", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" /> },
  error:        { label: "Erro",         color: "bg-orange-100 text-orange-700 border-orange-200", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

// ── Componente de card de conta ───────────────────────────────────────────────
function AccountCard({
  account, onDelete, onSetPrimary, onToggleNotify, onRefreshQr, index,
}: {
  account: WaAccount;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onToggleNotify: (id: string, val: boolean) => void;
  onRefreshQr: (id: string) => void;
  index: number;
}) {
  const [showQr, setShowQr] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const st = STATUS_CONFIG[account.status];

  return (
    <Card className={`border-2 transition-all ${account.is_primary ? "border-orange-400 shadow-md shadow-orange-500/10" : "border-slate-200"}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Ícone tipo */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              account.connection_type === "api" ? "bg-blue-100" : "bg-green-100"
            }`}>
              {account.connection_type === "api"
                ? <Key className="w-5 h-5 text-blue-600" />
                : <QrCode className="w-5 h-5 text-green-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">{account.nickname || `WhatsApp ${index + 1}`}</p>
                {account.is_primary && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> Principal
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500">{account.phone_number}</p>
              <Badge className={`text-[10px] border mt-1 flex items-center gap-1 w-fit ${st.color}`}>
                {st.icon} {st.label}
              </Badge>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onToggleNotify(account.id, !account.notify_disconnect)}
                    className={`p-2 rounded-lg transition-colors ${account.notify_disconnect ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400 hover:text-slate-600"}`}
                  >
                    {account.notify_disconnect ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{account.notify_disconnect ? "Notificação ativa" : "Ativar notificação de desconexão"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {!account.is_primary && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => onSetPrimary(account.id)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                      <Pin className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Definir como principal</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {account.connection_type === "web" && (
              <button onClick={() => setShowQr(!showQr)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                <QrCode className="w-4 h-4" />
              </button>
            )}

            <button onClick={() => onDelete(account.id)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR Code (WhatsApp Web) */}
        {showQr && account.connection_type === "web" && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Escanear QR Code</p>
              <button onClick={() => onRefreshQr(account.id)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                <RefreshCw className="w-3 h-3" /> Atualizar
              </button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-48 h-48 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                {account.qr_code ? (
                  <img src={account.qr_code} alt="QR Code" className="w-full h-full rounded-xl object-contain" />
                ) : (
                  <div className="text-center">
                    <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Gerando QR Code...</p>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500 text-center max-w-xs">
                Abra o WhatsApp no celular → Menu → Aparelhos conectados → Conectar aparelho
              </div>
            </div>
          </div>
        )}

        {/* Credenciais API */}
        {account.connection_type === "api" && (
          <div className="mt-3">
            <button onClick={() => setShowCreds(!showCreds)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              {showCreds ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showCreds ? "Ocultar credenciais" : "Ver credenciais Twilio"}
            </button>
            {showCreds && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <p><span className="font-semibold text-slate-600">SID:</span> <span className="text-slate-500 font-mono">{account.twilio_sid ? `${account.twilio_sid.slice(0, 8)}...` : "—"}</span></p>
                <p><span className="font-semibold text-slate-600">Número:</span> <span className="text-slate-500">{account.twilio_phone || "—"}</span></p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Formulário adicionar conta ────────────────────────────────────────────────
function AddAccountForm({ barbershopId, onSuccess, accountCount }: { barbershopId: string; onSuccess: () => void; accountCount: number }) {
  const [type, setType] = useState<ConnectionType>("web");
  const [form, setForm] = useState({ nickname: "", phone: "", sid: "", token: "", twilioPhone: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.phone) { toast.error("Informe o número de WhatsApp"); return; }
    if (type === "api" && (!form.sid || !form.token)) { toast.error("Informe as credenciais Twilio"); return; }
    setSaving(true);
    const { error } = await (supabase as any).from("whatsapp_connections").insert({
      barbershop_id: barbershopId,
      nickname: form.nickname || `WhatsApp ${accountCount + 1}`,
      phone_number: form.phone,
      connection_type: type,
      status: type === "web" ? "connecting" : "connected",
      is_primary: accountCount === 0,
      notify_disconnect: true,
      twilio_sid: type === "api" ? form.sid : null,
      twilio_auth_token: type === "api" ? form.token : null,
      twilio_phone: type === "api" ? form.twilioPhone : null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta adicionada!");
    onSuccess();
  };

  return (
    <div className="space-y-5">
      {/* Tipo de conexão */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Tipo de Conexão</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setType("web")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${type === "web" ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300"}`}
          >
            <QrCode className={`w-6 h-6 mb-2 ${type === "web" ? "text-green-600" : "text-slate-400"}`} />
            <p className={`font-bold text-sm ${type === "web" ? "text-green-700" : "text-slate-700"}`}>WhatsApp Web</p>
            <p className="text-xs text-slate-500 mt-0.5">Conectar via QR Code</p>
          </button>
          <button
            onClick={() => setType("api")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${type === "api" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
          >
            <Key className={`w-6 h-6 mb-2 ${type === "api" ? "text-blue-600" : "text-slate-400"}`} />
            <p className={`font-bold text-sm ${type === "api" ? "text-blue-700" : "text-slate-700"}`}>API Twilio</p>
            <p className="text-xs text-slate-500 mt-0.5">Mais estável e confiável</p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Apelido</Label>
          <Input placeholder="Ex: WhatsApp Principal" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} />
        </div>
        <div>
          <Label>Número WhatsApp</Label>
          <Input placeholder="+55 11 99999-9999" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
      </div>

      {type === "api" && (
        <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5"><Key className="w-3.5 h-3.5" /> Credenciais Twilio</p>
          <div>
            <Label className="text-xs">Account SID</Label>
            <Input className="text-xs font-mono" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={form.sid} onChange={e => setForm(f => ({ ...f, sid: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Auth Token</Label>
            <Input className="text-xs font-mono" type="password" placeholder="••••••••••••••••••••••••••••••••" value={form.token} onChange={e => setForm(f => ({ ...f, token: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Número Twilio (com +)</Label>
            <Input className="text-xs" placeholder="+14155238886" value={form.twilioPhone} onChange={e => setForm(f => ({ ...f, twilioPhone: e.target.value }))} />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={save} disabled={saving}>
          {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Plus className="w-4 h-4 mr-2" /> Adicionar</>}
        </Button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function WhatsAppConectarPanel() {
  const { barbershop } = useBarbershop();
  const [accounts, setAccounts] = useState<WaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendMode, setSendMode] = useState<SendMode>("fixed");
  const [openAdd, setOpenAdd] = useState(false);
  const [showApiInfo, setShowApiInfo] = useState(false);

  const load = useCallback(async () => {
    if (!barbershop?.id) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("whatsapp_connections")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    setAccounts(data || []);
    setLoading(false);
  }, [barbershop?.id]);

  useEffect(() => { load(); }, [load]);

  // Polling para detectar desconexão
  useEffect(() => {
    if (!barbershop?.id) return;
    const interval = setInterval(async () => {
      const { data } = await (supabase as any)
        .from("whatsapp_connections")
        .select("id, status, nickname, notify_disconnect")
        .eq("barbershop_id", barbershop.id);

      (data || []).forEach((acc: any) => {
        if (acc.status === "disconnected" && acc.notify_disconnect) {
          toast.warning(`⚠️ WhatsApp desconectado: ${acc.nickname}`, {
            description: "Reconecte para continuar enviando mensagens automáticas.",
            duration: 8000,
            action: { label: "Reconectar", onClick: () => {} },
          });
        }
      });
    }, 60000); // verifica a cada 1 min
    return () => clearInterval(interval);
  }, [barbershop?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta conta?")) return;
    await (supabase as any).from("whatsapp_connections").delete().eq("id", id);
    toast.success("Conta removida");
    load();
  };

  const handleSetPrimary = async (id: string) => {
    if (!barbershop?.id) return;
    await (supabase as any).from("whatsapp_connections").update({ is_primary: false }).eq("barbershop_id", barbershop.id);
    await (supabase as any).from("whatsapp_connections").update({ is_primary: true }).eq("id", id);
    toast.success("Conta principal atualizada");
    load();
  };

  const handleToggleNotify = async (id: string, val: boolean) => {
    await (supabase as any).from("whatsapp_connections").update({ notify_disconnect: val }).eq("id", id);
    load();
  };

  const handleRefreshQr = async (id: string) => {
    toast.info("Gerando novo QR Code...");
    // Simula geração — em produção chamaria edge function
    await (supabase as any).from("whatsapp_connections").update({ status: "connecting" }).eq("id", id);
    load();
  };

  const connectedCount = accounts.filter(a => a.status === "connected").length;
  const canAdd = accounts.length < 3;

  return (
    <div className="space-y-6">

      {/* ── Banner API no topo ── */}
      <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-blue-900 text-base">Conectar via API Twilio — Recomendado</p>
              <p className="text-sm text-blue-700 mt-0.5">
                Mais estável, sem risco de banimento e funciona 24/7 sem precisar manter o celular conectado.
              </p>
            </div>
          </div>
          <button onClick={() => setShowApiInfo(!showApiInfo)} className="text-blue-500 hover:text-blue-700 flex-shrink-0">
            {showApiInfo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showApiInfo && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: <Shield className="w-4 h-4 text-blue-600" />, title: "Sem risco de banimento", desc: "Número oficial Meta/Twilio, não viola termos de uso" },
              { icon: <Clock className="w-4 h-4 text-green-600" />, title: "Funciona 24/7", desc: "Não depende do celular estar ligado ou com internet" },
              { icon: <Zap className="w-4 h-4 text-orange-500" />, title: "Entrega garantida", desc: "Relatório de entrega, reenvio automático em falha" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/70 rounded-xl p-3">
                <div className="mt-0.5">{item.icon}</div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Status geral + modo de envio ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${
            connectedCount > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {connectedCount > 0 ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {connectedCount} de {accounts.length} conectado{connectedCount !== 1 ? "s" : ""}
          </div>
          <span className="text-xs text-slate-400">(máx. 3 números)</span>
        </div>

        {accounts.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSendMode("fixed")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sendMode === "fixed" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              <Pin className="w-3.5 h-3.5" /> Fixo (principal)
            </button>
            <button
              onClick={() => setSendMode("alternate")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sendMode === "alternate" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              <Shuffle className="w-3.5 h-3.5" /> Alternar envios
            </button>
          </div>
        )}
      </div>

      {sendMode === "alternate" && accounts.length > 1 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Shuffle className="w-4 h-4 text-orange-500" />
          <AlertDescription className="text-orange-700 text-sm">
            <strong>Modo alternado ativo:</strong> as mensagens serão distribuídas entre os {accounts.length} números conectados para reduzir o risco de bloqueio.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Lista de contas ── */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Carregando...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Nenhum WhatsApp conectado</p>
          <p className="text-sm text-slate-400 mt-1">Adicione até 3 números para envio automático</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc, i) => (
            <AccountCard
              key={acc.id}
              account={acc}
              index={i}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
              onToggleNotify={handleToggleNotify}
              onRefreshQr={handleRefreshQr}
            />
          ))}
        </div>
      )}

      {/* ── Botão adicionar ── */}
      {canAdd ? (
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-xl">
              <Plus className="w-5 h-5 mr-2" /> Adicionar WhatsApp ({accounts.length}/3)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Conectar WhatsApp</DialogTitle>
            </DialogHeader>
            <AddAccountForm
              barbershopId={barbershop?.id || ""}
              accountCount={accounts.length}
              onSuccess={() => { setOpenAdd(false); load(); }}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Limite de 3 números atingido</p>
        </div>
      )}

      {/* ── Avisos importantes ── */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-2">
        <p className="font-bold text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Avisos Importantes — WhatsApp Web
        </p>
        <ul className="space-y-1.5 text-xs text-red-600">
          <li>• O WhatsApp pode <strong>banir</strong> seu número se as mensagens forem consideradas SPAM.</li>
          <li>• Não nos responsabilizamos caso seu número seja banido.</li>
          <li>• Cadastre o cliente em sua lista de contatos antes de fazer disparos.</li>
          <li>• Evite enviar mensagens para clientes que você nunca conversou antes.</li>
          <li>• <strong>Recomendamos</strong> o uso de outro número (não o principal da empresa).</li>
          <li>• O envio automático pode parar sem aviso quando o WhatsApp atualiza suas bibliotecas.</li>
          <li>• Ao ativar o envio automático, você concorda com os <strong>termos de uso do WhatsApp</strong>.</li>
        </ul>
      </div>
    </div>
  );
}
