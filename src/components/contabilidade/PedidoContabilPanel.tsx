// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShoppingCart, CreditCard, Copy, CheckCircle, Clock,
  Loader2, QrCode, ChevronDown, ChevronUp, FileText, AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ContadorBuscaPanel } from "./ContadorBuscaPanel";

interface ServiceType {
  id: string;
  service_type: string;
  label: string;
  price: number;
  required_fields: { key: string; label: string; required: boolean }[];
}

interface Pedido {
  id: string;
  nome_servico: string;
  valor: number;
  status: string;
  pagamento_status: string;
  pix_copy_paste: string | null;
  payment_link: string | null;
  data_pedido: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  aguardando_pagamento: { label: "Aguardando Pagamento", color: "bg-yellow-500/10 text-yellow-600" },
  pagamento_confirmado:  { label: "Pagamento Confirmado", color: "bg-blue-500/10 text-blue-600" },
  em_andamento:         { label: "Em Andamento", color: "bg-indigo-500/10 text-indigo-600" },
  concluido:            { label: "Concluído", color: "bg-green-500/10 text-green-600" },
  cancelado:            { label: "Cancelado", color: "bg-red-500/10 text-red-600" },
};

const PAG_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendente", color: "bg-yellow-500/10 text-yellow-600" },
  confirmed: { label: "Confirmado", color: "bg-green-500/10 text-green-600" },
  failed:    { label: "Falhou", color: "bg-red-500/10 text-red-600" },
};

interface Props {
  barbershopId?: string;
}

export function PedidoContabilPanel({ barbershopId }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<"lista" | "busca_contador" | "escolher_servico" | "preencher" | "pagar">("lista");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [servicos, setServicos] = useState<ServiceType[]>([]);
  const [contadorSel, setContadorSel] = useState<{ id: string; name: string } | null>(null);
  const [servicoSel, setServicoSel] = useState<ServiceType | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [split, setSplit] = useState<{ pct_app: number; pct_contador: number; valor_app: number; valor_contador: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchPedidos();
    fetchServicos();
  }, [user]);

  const fetchPedidos = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("pedidos_contabeis")
      .select("id, nome_servico, valor, status, pagamento_status, pix_copy_paste, payment_link, data_pedido")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false });
    setPedidos((data as Pedido[]) || []);
  };

  const fetchServicos = async () => {
    const { data } = await (supabase as any)
      .from("fiscal_service_types")
      .select("id, service_type, label, price, required_fields")
      .eq("status", "approved")
      .eq("is_active", true)
      .order("label");
    setServicos((data || []).map((s) => ({
      ...s,
      required_fields: Array.isArray(s.required_fields) ? s.required_fields as any : [],
    })));
  };

  const handleSelecionarContador = (c: { id: string; name: string }) => {
    setContadorSel(c);
    setStep("escolher_servico");
  };

  const handleSelecionarServico = async (s: ServiceType) => {
    setServicoSel(s);
    const camposInit: Record<string, string> = {};
    s.required_fields.forEach((f) => { camposInit[f.key] = ""; });
    setCampos(camposInit);
    const { data } = await (supabase as any).rpc("calcular_split_comissao", { _valor: s.price });
    if (data && data[0]) setSplit(data[0] as any);
    setStep("preencher");
  };

  const handleCriarPedido = async () => {
    if (!user || !contadorSel || !servicoSel) return;
    const faltando = servicoSel.required_fields
      .filter((f) => f.required && !campos[f.key]?.trim())
      .map((f) => f.label);
    if (faltando.length > 0) {
      toast.error(`Preencha: ${faltando.join(", ")}`);
      return;
    }
    setLoading(true);
    const { data: pedido, error: pedErr } = await (supabase as any)
      .from("pedidos_contabeis")
      .insert({
        usuario_id: user.id,
        contador_id: contadorSel.id,
        servico_id: servicoSel.id,
        nome_servico: servicoSel.label,
        dados_formulario: campos,
        valor: servicoSel.price,
        porcentagem_app: split?.pct_app ?? 20,
        porcentagem_contador: split?.pct_contador ?? 80,
        valor_app: split?.valor_app ?? servicoSel.price * 0.2,
        valor_contador: split?.valor_contador ?? servicoSel.price * 0.8,
      })
      .select()
      .single();

    if (pedErr) { toast.error("Erro ao criar pedido: " + pedErr.message); setLoading(false); return; }

    const { data: charge, error: chargeErr } = await supabase.functions.invoke("process-payment", {
      body: {
        action: "charge",
        amount: servicoSel.price,
        description: `Serviço Contábil: ${servicoSel.label}`,
        billing_type: "PIX",
        external_reference: (pedido as any).id,
      },
    });

    if (chargeErr) {
      toast.error("Pedido criado, mas houve erro ao gerar cobrança. Tente novamente.");
    } else if (charge) {
      await (supabase as any).from("pedidos_contabeis").update({
        asaas_payment_id: charge.payment_id,
        pix_qr_code: charge.pix_qr_code,
        pix_copy_paste: charge.pix_copy_paste,
        payment_link: charge.payment_link,
      }).eq("id", (pedido as any).id);
      toast.success("Pedido criado! Efetue o pagamento via PIX.");
    }

    setLoading(false);
    await fetchPedidos();
    setStep("lista");
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
          <h2 className="font-semibold">Selecionar Contador</h2>
        </div>
        <ContadorBuscaPanel
          barbershopId={barbershopId}
          onContadorSelecionado={(c) => handleSelecionarContador({ id: c.id, name: c.name })}
        />
      </div>
    );
  }

  if (step === "escolher_servico") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setStep("busca_contador")}>← Voltar</Button>
          <h2 className="font-semibold">Escolher Serviço — {contadorSel?.name}</h2>
        </div>
        {servicos.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum serviço disponível.</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {servicos.map((s) => (
              <Card key={s.id} className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleSelecionarServico(s)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.required_fields.length} informação(ões) necessária(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">R$ {s.price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">pagamento único</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === "preencher" && servicoSel) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setStep("escolher_servico")}>← Voltar</Button>
          <h2 className="font-semibold">{servicoSel.label}</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Preencha os Dados</CardTitle>
            <CardDescription>
              Valor: <strong>R$ {servicoSel.price.toFixed(2)}</strong>
              {split && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Contador recebe R$ {split.valor_contador.toFixed(2)} · App R$ {split.valor_app.toFixed(2)})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {servicoSel.required_fields.map((f) => (
              <div key={f.key}>
                <Label>{f.label}{f.required && " *"}</Label>
                <Input
                  className="mt-1"
                  value={campos[f.key] || ""}
                  onChange={(e) => setCampos({ ...campos, [f.key]: e.target.value })}
                  placeholder={f.label}
                />
              </div>
            ))}
            <Button variant="gold" className="w-full" onClick={handleCriarPedido} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Criar Pedido e Gerar PIX
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
          <h2 className="font-display text-xl font-bold">Pedidos Contábeis</h2>
          <p className="text-sm text-muted-foreground">Pagamento antecipado de serviços contábeis</p>
        </div>
        <Button variant="gold" onClick={() => setStep("busca_contador")}>
          <ShoppingCart className="w-4 h-4 mr-2" />Novo Pedido
        </Button>
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum pedido contábil ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">Solicite um serviço contábil e pague antecipado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => {
            const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.aguardando_pagamento;
            const pc = PAG_STATUS[p.pagamento_status] || PAG_STATUS.pending;
            const expanded = expandedId === p.id;
            return (
              <Card key={p.id} className="border-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{p.nome_servico}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${pc.color}`}>
                          PIX: {pc.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.data_pedido).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary">R$ {p.valor.toFixed(2)}</p>
                      {(p.pix_copy_paste || p.payment_link) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs mt-1 h-7"
                          onClick={() => setExpandedId(expanded ? null : p.id)}
                        >
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          PIX
                        </Button>
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
                      {p.pix_copy_paste && (
                        <div>
                          <p className="text-xs font-medium mb-1 flex items-center gap-1">
                            <QrCode className="w-3 h-3" />Código PIX Copia e Cola:
                          </p>
                          <div className="flex gap-2">
                            <Input
                              value={p.pix_copy_paste}
                              readOnly
                              className="text-xs h-8 font-mono"
                            />
                            <Button size="sm" variant="outline" className="shrink-0 h-8"
                              onClick={() => copiarPix(p.pix_copy_paste!)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {p.payment_link && (
                        <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                          <a href={p.payment_link} target="_blank" rel="noopener noreferrer">
                            Abrir Link de Pagamento
                          </a>
                        </Button>
                      )}
                      {p.pagamento_status === "pending" && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Pague o PIX para enviar o pedido ao contador.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PedidoContabilPanel;
