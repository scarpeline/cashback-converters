import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Key, Plus, Copy, Trash2, ExternalLink, Code2, RefreshCw,
  CheckCircle, AlertTriangle, Link2, Zap, Eye, EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Token {
  id: string;
  name: string;
  token: string;
  permissions: string[];
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

function maskToken(token: string) {
  return `${token.slice(0, 8)}${"•".repeat(24)}${token.slice(-8)}`;
}

export function IntegrationAPIPanel() {
  const { barbershop } = useBarbershop();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", expires_days: "" });
  const [creating, setCreating] = useState(false);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Serviços para montar link de exemplo
  const { data: services = [] } = useQuery({
    queryKey: ["services-for-link", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data } = await (supabase as any).from("services").select("id, name").eq("barbershop_id", barbershop.id).eq("is_active", true).limit(5);
      return data || [];
    },
    enabled: !!barbershop?.id,
  });

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ["integration-tokens", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data } = await (supabase as any)
        .from("integration_tokens")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("created_at", { ascending: false });
      return (data || []) as Token[];
    },
    enabled: !!barbershop?.id,
  });

  const createToken = async () => {
    if (!form.name) { toast.error("Informe um nome para o token"); return; }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${window.location.origin}/functions/v1/integration-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: "generate",
          name: form.name,
          expires_days: form.expires_days ? parseInt(form.expires_days) : null,
        }),
      });
      const result = await res.json();
      if (result.error) { toast.error(result.error); return; }
      toast.success("Token criado com sucesso!");
      setForm({ name: "", expires_days: "" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["integration-tokens"] });
    } catch (e) {
      toast.error("Erro ao criar token");
    } finally {
      setCreating(false);
    }
  };

  const revokeToken = async (id: string) => {
    if (!confirm("Revogar este token? Apps que o usam deixarão de funcionar.")) return;
    await (supabase as any).from("integration_tokens").update({ is_active: false }).eq("id", id);
    toast.success("Token revogado");
    qc.invalidateQueries({ queryKey: ["integration-tokens"] });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const buildBookingLink = (token: string, serviceId?: string) => {
    const base = `${window.location.origin}/agendar/${barbershop?.slug}`;
    const params = new URLSearchParams({ token, source: "meu-app" });
    if (serviceId) params.set("service", serviceId);
    params.set("return_url", "https://meu-app.com/confirmacao");
    return `${base}?${params.toString()}`;
  };

  const exampleService = services[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-400" /> API de Integração
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Conecte apps externos ao seu sistema de agendamento</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Novo Token
        </Button>
      </div>

      {/* Como funciona */}
      <Alert className="border-blue-500/30 bg-blue-500/10">
        <Zap className="w-4 h-4 text-blue-400" />
        <AlertDescription className="text-blue-300 text-sm">
          <strong>Como funciona:</strong> Gere um token, use-o no seu app externo para montar um link dinâmico de agendamento.
          O usuário clica no link, já chega com empresa/serviço pré-selecionado, agenda e volta ao seu app com os dados confirmados.
        </AlertDescription>
      </Alert>

      {/* Formulário novo token */}
      {showForm && (
        <Card className="glass-card border-orange-500/20 rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-white">Criar novo token</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400">Nome do token *</Label>
                <Input placeholder="Ex: App Empresas" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 bg-slate-800 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Expirar em (dias, opcional)</Label>
                <Input type="number" placeholder="Ex: 365" value={form.expires_days} onChange={e => setForm(f => ({ ...f, expires_days: e.target.value }))}
                  className="mt-1 bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600 text-slate-300">Cancelar</Button>
              <Button onClick={createToken} disabled={creating} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
                {creating ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Criando...</> : "Criar Token"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de tokens */}
      {isLoading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-slate-500">
          <Key className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>Nenhum token criado ainda</p>
          <p className="text-sm mt-1">Crie um token para integrar seu app externo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map(tk => (
            <Card key={tk.id} className={`glass-card rounded-2xl border ${tk.is_active ? "border-white/10" : "border-red-500/20 opacity-60"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white">{tk.name}</p>
                      <Badge className={tk.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                        {tk.is_active ? "Ativo" : "Revogado"}
                      </Badge>
                    </div>
                    {/* Token mascarado */}
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                        {revealedId === tk.id ? tk.token : maskToken(tk.token)}
                      </code>
                      <button onClick={() => setRevealedId(revealedId === tk.id ? null : tk.id)}
                        className="text-slate-500 hover:text-white transition-colors">
                        {revealedId === tk.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => copyToClipboard(tk.token, tk.id)}
                        className="text-slate-500 hover:text-orange-400 transition-colors">
                        {copiedId === tk.id ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Criado {format(new Date(tk.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      {tk.expires_at && ` · Expira ${format(new Date(tk.expires_at), "dd/MM/yyyy", { locale: ptBR })}`}
                    </p>
                  </div>
                  {tk.is_active && (
                    <button onClick={() => revokeToken(tk.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Link de exemplo */}
                {tk.is_active && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Exemplo de link dinâmico:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-blue-400 bg-slate-800 px-2 py-1.5 rounded-lg flex-1 truncate">
                        {buildBookingLink(tk.token, exampleService?.id)}
                      </code>
                      <button onClick={() => copyToClipboard(buildBookingLink(tk.token, exampleService?.id), `link-${tk.id}`)}
                        className="text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0">
                        {copiedId === `link-${tk.id}` ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documentação */}
      <Card className="glass-card border-white/5 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-orange-400" /> Documentação da API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div>
            <p className="text-slate-400 font-semibold mb-1">1. Montar link de agendamento no seu app:</p>
            <pre className="bg-slate-900 text-green-400 p-3 rounded-xl overflow-x-auto text-[11px]">{`const link = \`https://seudominio.com/agendar/${barbershop?.slug || "seu-negocio"}
  ?token=SEU_TOKEN
  &service=ID_DO_SERVICO
  &prof=ID_DO_PROFISSIONAL
  &ref=ID_EXTERNO_DO_SEU_APP
  &source=nome-do-seu-app
  &return_url=https://seu-app.com/confirmacao\``}</pre>
          </div>
          <div>
            <p className="text-slate-400 font-semibold mb-1">2. Validar token via API (opcional):</p>
            <pre className="bg-slate-900 text-green-400 p-3 rounded-xl overflow-x-auto text-[11px]">{`POST /functions/v1/integration-token
{
  "action": "validate",
  "token": "SEU_TOKEN"
}
// Retorna: { valid: true, barbershop_id, permissions }`}</pre>
          </div>
          <div>
            <p className="text-slate-400 font-semibold mb-1">3. Parâmetros de retorno (return_url):</p>
            <pre className="bg-slate-900 text-green-400 p-3 rounded-xl overflow-x-auto text-[11px]">{`?appointment_id=UUID
&status=confirmed
&ref=ID_EXTERNO_DO_SEU_APP
&service=Nome+do+Servico`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
