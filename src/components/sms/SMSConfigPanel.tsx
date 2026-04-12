import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/pages/dashboards/owner/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageSquare, Save, RotateCcw, Info, Wallet,
  Bell, Calendar, Cake, RefreshCw, AlertTriangle,
  CheckCircle, Clock, ChevronDown, ChevronUp, Zap,
} from "lucide-react";

// ── Variáveis disponíveis ─────────────────────────────────────────────────────
const VARS = [
  { tag: "@CLIENTE",          label: "@CLIENTE" },
  { tag: "@NOMEEMPRESA",      label: "@NOMEEMPRESA" },
  { tag: "@NOMESERVICO",      label: "@NOMESERVICO" },
  { tag: "@NOMEPROFISSIONAL", label: "@NOMEPROFISSIONAL" },
  { tag: "@DIA",              label: "@DIA" },
  { tag: "@HORA",             label: "@HORA" },
];

const VARS_BIRTHDAY = [
  { tag: "@CLIENTE",          label: "@CLIENTE" },
  { tag: "@NOMEEMPRESA",      label: "@NOMEEMPRESA" },
  { tag: "@NOMESERVICO",      label: "@NOMESERVICO" },
  { tag: "@NOMEPROFISSIONAL", label: "@NOMEPROFISSIONAL" },
  { tag: "@DIA",              label: "@DIA" },
  { tag: "@HORA",             label: "@HORA" },
];

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_AGENDAMENTO = "Ola @CLIENTE, voce tem @NOMESERVICO com @NOMEEMPRESA, dia @DIA as @HORA com @NOMEPROFISSIONAL.";
const DEFAULT_RETORNO     = "Ola @CLIENTE, seu retorno de @NOMESERVICO se aproxima. Garanta ja seu horario acessando nossa Agenda Online.";
const DEFAULT_ANIVERSARIO = "Ola @CLIENTE, hoje eh o seu dia, feliz aniversario! Desejamos muita saude, paz e sabedoria. Equipe @NOMEEMPRESA.";

// ── Pacotes de SMS ────────────────────────────────────────────────────────────
const SMS_PACKAGES = [
  { label: "R$ 30,00 | 250/SMS",  qty: 250,  price: 30 },
  { label: "R$ 60,00 | 500/SMS",  qty: 500,  price: 60 },
  { label: "R$ 90,00 | 750/SMS",  qty: 750,  price: 90 },
  { label: "R$ 150,00 | 1500/SMS",qty: 1500, price: 150 },
];

// ── Componente de seção de SMS ────────────────────────────────────────────────
function SMSSection({
  title, icon, enabled, onToggle, antecedencia, onAntecedencia, showAntecedencia,
  message, onMessage, defaultMsg, vars, preview, onSave, saving,
}: {
  title: string; icon: React.ReactNode; enabled: boolean; onToggle: () => void;
  antecedencia?: string; onAntecedencia?: (v: string) => void; showAntecedencia?: boolean;
  message: string; onMessage: (v: string) => void; defaultMsg: string;
  vars: typeof VARS; preview: string; onSave: () => void; saving: boolean;
}) {
  const insertVar = (tag: string) => {
    onMessage(message + tag);
  };

  const charCount = message.replace(/<[^>]+>/g, "").length;
  const isOver = charCount > 150;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {/* Toggle SIM/NÃO */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => !enabled && onToggle()}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${enabled ? "bg-green-500 text-white shadow" : "text-slate-500"}`}
            >
              SIM
            </button>
            <button
              onClick={() => enabled && onToggle()}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${!enabled ? "bg-red-500 text-white shadow" : "text-slate-500"}`}
            >
              NÃO
            </button>
          </div>
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          {/* Antecedência */}
          {showAntecedencia && onAntecedencia && (
            <div className="flex items-center gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Tempo SMS (horas antes)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number" min="1" max="72"
                    value={antecedencia} onChange={e => onAntecedencia(e.target.value)}
                    className="w-24 h-9 text-sm"
                  />
                  <span className="text-xs text-slate-500">horas antes do agendamento</span>
                </div>
              </div>
              <Alert className="flex-1 border-yellow-200 bg-yellow-50 py-2">
                <Info className="w-3.5 h-3.5 text-yellow-600" />
                <AlertDescription className="text-xs text-yellow-700">
                  Ex: Informando 04:00, agendamento para 18h00, cliente recebe às 14h00.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Mensagem + Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Mensagem</Label>
              <Textarea
                value={message}
                onChange={e => onMessage(e.target.value)}
                rows={4}
                className="text-sm resize-none"
                placeholder="Digite a mensagem..."
              />
              {/* Variáveis */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {vars.map(v => (
                  <button
                    key={v.tag}
                    onClick={() => insertVar(v.tag)}
                    className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-md hover:bg-blue-200 transition-colors"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              {/* Contador */}
              <div className={`flex items-center gap-1.5 mt-2 text-xs ${isOver ? "text-red-600" : "text-slate-400"}`}>
                <AlertTriangle className={`w-3 h-3 ${isOver ? "text-red-500" : "text-slate-300"}`} />
                {isOver
                  ? `Limite de 150 caracteres excedido (${charCount}). O sistema removerá acentuação automaticamente.`
                  : `Não é permitido acentuação. Sistema irá retirar automaticamente. Permitido somente 150 caracteres (${charCount}/150).`}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Exemplo Pré-Visualização</Label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[100px] text-sm text-slate-700 leading-relaxed">
                {preview || <span className="text-slate-400 italic">Pré-visualização aparecerá aqui...</span>}
              </div>
              <button
                onClick={() => onMessage(defaultMsg)}
                className="flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                <RotateCcw className="w-3 h-3" /> Restaurar Padrão
              </button>
            </div>
          </div>

          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-6"
          >
            {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function SMSConfigPanel() {
  const { barbershop } = useBarbershop();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saldoSMS, setSaldoSMS] = useState(0);
  const [showPackages, setShowPackages] = useState(false);

  // Agendamento
  const [agendEnabled, setAgendEnabled] = useState(false);
  const [agendHoras, setAgendHoras] = useState("4");
  const [agendMsg, setAgendMsg] = useState(DEFAULT_AGENDAMENTO);

  // Retorno / Previsão
  const [retornoEnabled, setRetornoEnabled] = useState(false);
  const [retornoDias, setRetornoDias] = useState("7");
  const [retornoMsg, setRetornoMsg] = useState(DEFAULT_RETORNO);

  // Aniversário
  const [anivEnabled, setAnivEnabled] = useState(false);
  const [anivMsg, setAnivMsg] = useState(DEFAULT_ANIVERSARIO);

  // Gera preview substituindo variáveis por exemplos
  const makePreview = (msg: string) =>
    msg
      .replace(/@CLIENTE/g, "Maria")
      .replace(/@NOMEEMPRESA/g, barbershop?.name || "teste")
      .replace(/@NOMESERVICO/g, "Consulta")
      .replace(/@NOMEPROFISSIONAL/g, "Dr. João")
      .replace(/@DIA/g, "11/04")
      .replace(/@HORA/g, "18:00");

  const load = useCallback(async () => {
    if (!barbershop?.id) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("sms_config")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .maybeSingle();

    if (data) {
      setAgendEnabled(data.agendamento_enabled ?? false);
      setAgendHoras(String(data.agendamento_horas ?? 4));
      setAgendMsg(data.agendamento_msg || DEFAULT_AGENDAMENTO);
      setRetornoEnabled(data.retorno_enabled ?? false);
      setRetornoDias(String(data.retorno_dias ?? 7));
      setRetornoMsg(data.retorno_msg || DEFAULT_RETORNO);
      setAnivEnabled(data.aniversario_enabled ?? false);
      setAnivMsg(data.aniversario_msg || DEFAULT_ANIVERSARIO);
      setSaldoSMS(data.saldo_sms ?? 0);
    }
    setLoading(false);
  }, [barbershop?.id]);

  useEffect(() => { load(); }, [load]);

  const saveSection = async (section: "agendamento" | "retorno" | "aniversario") => {
    if (!barbershop?.id) return;
    setSaving(section);

    const payload: Record<string, any> = { barbershop_id: barbershop.id };
    if (section === "agendamento") {
      payload.agendamento_enabled = agendEnabled;
      payload.agendamento_horas = parseInt(agendHoras);
      payload.agendamento_msg = agendMsg;
    } else if (section === "retorno") {
      payload.retorno_enabled = retornoEnabled;
      payload.retorno_dias = parseInt(retornoDias);
      payload.retorno_msg = retornoMsg;
    } else {
      payload.aniversario_enabled = anivEnabled;
      payload.aniversario_msg = anivMsg;
    }

    const { error } = await (supabase as any)
      .from("sms_config")
      .upsert(payload, { onConflict: "barbershop_id" });

    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Configuração salva!");
  };

  if (loading) return <div className="text-center py-8 text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-6">

      {/* ── Saldo SMS ── */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-500 flex flex-col items-center justify-center text-white shadow-lg">
                <span className="text-2xl font-black leading-none">{saldoSMS}</span>
                <span className="text-[10px] font-bold uppercase leading-none mt-0.5">SMS</span>
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg">Saldo de SMS</p>
                <p className="text-sm text-slate-500">Clique no pacote para recarregar</p>
                <p className="text-xs text-orange-600 font-semibold mt-0.5">R$ 0,12/SMS</p>
              </div>
            </div>
            <button
              onClick={() => setShowPackages(!showPackages)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Wallet className="w-4 h-4" />
              Recarregar
              {showPackages ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showPackages && (
            <div className="mt-4 pt-4 border-t border-orange-200">
              <p className="text-sm font-bold text-slate-700 mb-3">Escolha o pacote:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SMS_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.qty}
                    onClick={() => {
                      window.location.href = `/painel-dono/financeiro?tab=subscription`;
                    }}
                    className="p-3 bg-white border-2 border-orange-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-center group"
                  >
                    <p className="font-black text-orange-600 text-sm group-hover:text-orange-700">{pkg.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {(pkg.price / pkg.qty).toFixed(2)}/SMS</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Seção 1: SMS dos Agendamentos ── */}
      <SMSSection
        title="SMS dos Agendamentos"
        icon={<Calendar className="w-4 h-4 text-blue-500" />}
        enabled={agendEnabled}
        onToggle={() => setAgendEnabled(!agendEnabled)}
        showAntecedencia
        antecedencia={agendHoras}
        onAntecedencia={setAgendHoras}
        message={agendMsg}
        onMessage={setAgendMsg}
        defaultMsg={DEFAULT_AGENDAMENTO}
        vars={VARS}
        preview={makePreview(agendMsg)}
        onSave={() => saveSection("agendamento")}
        saving={saving === "agendamento"}
      />

      {/* ── Seção 2: SMS de Previsão de Retorno ── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-500" />
              SMS das Previsões de Retorno
            </CardTitle>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => !retornoEnabled && setRetornoEnabled(true)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${retornoEnabled ? "bg-green-500 text-white shadow" : "text-slate-500"}`}>SIM</button>
              <button onClick={() => retornoEnabled && setRetornoEnabled(false)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${!retornoEnabled ? "bg-red-500 text-white shadow" : "text-slate-500"}`}>NÃO</button>
            </div>
          </div>
        </CardHeader>
        {retornoEnabled && (
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Avisar quantos dias antes?</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="number" min="1" max="30" value={retornoDias}
                    onChange={e => setRetornoDias(e.target.value)} className="w-20 h-9 text-sm" />
                  <span className="text-xs text-slate-500">dias</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1 block">Mensagem</Label>
                <Textarea value={retornoMsg} onChange={e => setRetornoMsg(e.target.value)} rows={4} className="text-sm resize-none" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {VARS.slice(0, 4).map(v => (
                    <button key={v.tag} onClick={() => setRetornoMsg(retornoMsg + v.tag)}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-md hover:bg-blue-200 transition-colors">{v.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1 block">Exemplo Pré-Visualização</Label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[100px] text-sm text-slate-700 leading-relaxed">
                  {makePreview(retornoMsg)}
                </div>
                <button onClick={() => setRetornoMsg(DEFAULT_RETORNO)}
                  className="flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  <RotateCcw className="w-3 h-3" /> Restaurar Padrão
                </button>
              </div>
            </div>
            <Button onClick={() => saveSection("retorno")} disabled={saving === "retorno"}
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-6">
              {saving === "retorno" ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* ── Seção 3: SMS para Aniversariantes ── */}
      <SMSSection
        title="SMS para Aniversariantes"
        icon={<Cake className="w-4 h-4 text-pink-500" />}
        enabled={anivEnabled}
        onToggle={() => setAnivEnabled(!anivEnabled)}
        message={anivMsg}
        onMessage={setAnivMsg}
        defaultMsg={DEFAULT_ANIVERSARIO}
        vars={VARS_BIRTHDAY}
        preview={makePreview(anivMsg)}
        onSave={() => saveSection("aniversario")}
        saving={saving === "aniversario"}
      />

      {/* ── Avisos ── */}
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 text-xs space-y-1">
          <p className="font-bold">Importante sobre o SMS:</p>
          <p>• O cliente receberá a mensagem automaticamente via SMS no número cadastrado.</p>
          <p>• O intervalo entre o envio de uma mensagem e outra é de <strong>5 minutos</strong>.</p>
          <p>• Não é permitido acentuação — o sistema removerá automaticamente.</p>
          <p>• Permitido somente <strong>150 caracteres</strong> por mensagem.</p>
          <p>• Cada SMS consome 1 crédito do seu saldo.</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
