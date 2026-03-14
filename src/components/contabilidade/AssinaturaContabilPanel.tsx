// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  RefreshCw, CreditCard, Copy, Loader2, QrCode,
  CheckCircle, XCircle, AlertCircle, Plus, Calendar
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ContadorBuscaPanel } from "./ContadorBuscaPanel";

interface Assinatura {
  id: string;
  contador_id: string;
  valor_mensal: number;
  status: string;
  data_inicio: string;
  data_proxima_cobranca: string;
  data_cancelamento: string | null;
}

interface Historico {
  id: string;
  valor: number;
  status: string;
  pix_copy_paste: string | null;
  data_vencimento: string;
  data_pagamento: string | null;
}

const STATUS_BADGE: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
  active:    { label: "Ativa", variant: "success", icon: <CheckCircle className="w-3 h-3" /> },
  paused:    { label: "Pausada", variant: "secondary", icon: <AlertCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelada", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
  past_due:  { label: "Em Atraso", variant: "warning", icon: <AlertCircle className="w-3 h-3" /> },
};

interface Props {
  barbershopId?: string;
}

export function AssinaturaContabilPanel({ barbershopId }: Props) {
  const { user } = useAuth();
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [contadoresMapa, setContadoresMapa] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"lista" | "busca_contador" | "confirmar">("lista");
  const [contadorSel, setContadorSel] = useState<{ id: string; name: string; valor_mensalidade: number | null } | null>(null);
  const [valorMensal, setValorMensal] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [split, setSplit] = useState<{ pct_app: number; pct_contador: number; valor_app: number; valor_contador: number } | null>(null);

  useEffect(() => { if (user) { fetchAssinaturas(); } }, [user]);

  const fetchAssinaturas = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("assinaturas_contabeis")
      .select("id, contador_id, valor_mensal, status, data_inicio, data_proxima_cobranca, data_cancelamento")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false });
    setAssinaturas((data as Assinatura[]) || []);

    const ids = [...new Set((data || []).map((a) => a.contador_id))];
    if (ids.length > 0) {
      const { data: conts } = await supabase
        .from("accountants")
        .select("id, name")
        .in("id", ids);
      const mapa: Record<string, string> = {};
      (conts || []).forEach((c) => { mapa[c.id] = c.name; });
      setContadoresMapa(mapa);
    }

    if (data && data.length > 0) {
      const { data: hist } = await supabase
        .from("historico_assinaturas")
        .select("id, valor, status, pix_copy_paste, data_vencimento, data_pagamento")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setHistorico((hist as Historico[]) || []);
    }
  };

  const handleSelecionarContador = async (c: { id: string; name: string; valor_mensalidade: number | null }) => {
    setContadorSel(c);
    const v = c.valor_mensalidade ?? 0;
    setValorMensal(v > 0 ? String(v) : "");
    const { data } = await supabase.rpc("calcular_split_comissao", { _valor: v > 0 ? v : 100 });
    if (data && data[0]) setSplit(data[0] as any);
    setStep("confirmar");
  };

  const handleCriarAssinatura = async () => {
    if (!user || !contadorSel) return;
    const valor = Number(valorMensal);
    if (!valor || valor <= 0) { toast.error("Informe um valor válido."); return; }
    setLoading(true);

    const splitData = await supabase.rpc("calcular_split_comissao", { _valor: valor });
    const sp = splitData.data?.[0] as any;

    const proxCobranca = new Date();
    proxCobranca.setMonth(proxCobranca.getMonth() + 1);

    const { data: assin, error } = await supabase
      .from("assinaturas_contabeis")
      .insert({
        usuario_id: user.id,
        contador_id: contadorSel.id,
        valor_mensal: valor,
        data_proxima_cobranca: proxCobranca.toISOString(),
        porcentagem_app: sp?.pct_app ?? 20,
        porcentagem_contador: sp?.pct_contador ?? 80,
        valor_app: sp?.valor_app ?? valor * 0.2,
        valor_contador: sp?.valor_contador ?? valor * 0.8,
      })
      .select()
      .single();

    if (error) { toast.error("Erro: " + error.message); setLoading(false); return; }

    const { data: charge, error: chargeErr } = await supabase.functions.invoke("process-payment", {
      body: {
        action: "charge",
        amount: valor,
        description: `Assinatura Contábil - ${contadorSel.name}`,
        billing_type: "PIX",
        external_reference: (assin as any).id,
      },
    });

    if (!chargeErr && charge) {
      await supabase.from("historico_assinaturas").insert({
        assinatura_id: (assin as any).id,
        usuario_id: user.id,
        valor,
        status: "pending",
        asaas_payment_id: charge.payment_id,
        pix_copy_paste: charge.pix_copy_paste,
        data_vencimento: new Date().toISOString(),
      });
      toast.success("Assinatura criada! Efetue o pagamento via PIX.");
    } else {
      toast.success("Assinatura criada! Aguardando cobrança.");
    }

    setLoading(false);
    await fetchAssinaturas();
    setStep("lista");
  };

  const handleCancelar = async (id: string) => {
    setCancelando(id);
    const { error } = await supabase
      .from("assinaturas_contabeis")
      .update({ status: "cancelled", data_cancelamento: new Date().toISOString() })
      .eq("id", id);
    setCancelando(null);
    if (error) { toast.error("Erro ao cancelar: " + error.message); return; }
    toast.success("Assinatura cancelada.");
    await fetchAssinaturas();
  };

  const copiarPix = (codigo: string) => {
    navigator.clipboard?.writeText(codigo);
    toast.success("Código PIX copiado!");
  };

  if (step === "busca_contador") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setStep("lista")}>← Voltar</Button>
          <h2 className="font-semibold">Selecionar Contador para Assinatura</h2>
        </div>
        <ContadorBuscaPanel
          barbershopId={barbershopId}
          onContadorSelecionado={(c) => handleSelecionarContador({
            id: c.id, name: c.name, valor_mensalidade: c.valor_mensalidade ?? null
          })}
        />
      </div>
    );
  }

  if (step === "confirmar" && contadorSel) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setStep("busca_contador")}>← Voltar</Button>
          <h2 className="font-semibold">Confirmar Assinatura</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Assinatura com {contadorSel.name}</CardTitle>
            <CardDescription>Contabilidade mensal recorrente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Valor Mensal (R$) *</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="Ex: 299.00"
                value={valorMensal}
                onChange={(e) => setValorMensal(e.target.value)}
                className="mt-1"
              />
              {split && Number(valorMensal) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Contador recebe: R$ {(Number(valorMensal) * split.pct_contador / 100).toFixed(2)} ·
                  App: R$ {(Number(valorMensal) * split.pct_app / 100).toFixed(2)}
                </p>
              )}
            </div>
            <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
              <p className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Primeiro pagamento gerado hoje via PIX
              </p>
              <p className="flex items-center gap-1 text-muted-foreground">
                <RefreshCw className="w-4 h-4" />
                Renovação automática mensal
              </p>
            </div>
            <Button variant="gold" className="w-full" onClick={handleCriarAssinatura} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Assinar e Gerar PIX
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Assinatura Contábil</h2>
          <p className="text-sm text-muted-foreground">Contabilidade recorrente mensal</p>
        </div>
        <Button variant="gold" onClick={() => setStep("busca_contador")}>
          <Plus className="w-4 h-4 mr-2" />Nova Assinatura
        </Button>
      </div>

      {assinaturas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma assinatura ativa.</p>
            <p className="text-sm text-muted-foreground mt-1">Contrate contabilidade recorrente com um contador verificado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assinaturas.map((a) => {
            const sb = STATUS_BADGE[a.status] || STATUS_BADGE.active;
            return (
              <Card key={a.id} className="border-primary/10">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{contadoresMapa[a.contador_id] || "Contador"}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {sb.icon}
                      <span className={a.status === "active" ? "text-green-600" : "text-muted-foreground"}>
                        {sb.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Próx. cobrança: {new Date(a.data_proxima_cobranca).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right space-y-2 shrink-0">
                    <p className="font-bold text-primary">R$ {a.valor_mensal.toFixed(2)}/mês</p>
                    {a.status === "active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={cancelando === a.id}
                        onClick={() => handleCancelar(a.id)}
                      >
                        {cancelando === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancelar"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {historico.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Histórico de Cobranças</h3>
          {historico.map((h) => (
            <Card key={h.id} className="border-muted">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">R$ {h.valor.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Venc: {new Date(h.data_vencimento).toLocaleDateString("pt-BR")}
                    {h.data_pagamento && ` · Pago: ${new Date(h.data_pagamento).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={h.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                    {h.status === "confirmed" ? "Pago" : h.status === "failed" ? "Falhou" : "Pendente"}
                  </Badge>
                  {h.status !== "confirmed" && h.pix_copy_paste && (
                    <Button size="sm" variant="outline" className="h-7 px-2"
                      onClick={() => copiarPix(h.pix_copy_paste!)}>
                      <Copy className="w-3 h-3 mr-1" />PIX
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AssinaturaContabilPanel;
