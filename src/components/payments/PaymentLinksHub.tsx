import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Copy, Check, Link2, Loader2, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface PaymentLink {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  billing_type: string;
  url: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
}

interface Props {
  barbershopId: string;
}

const BILLING_TYPES = [
  { value: "PIX", label: "PIX" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "UNDEFINED", label: "Qualquer forma" },
];

export function PaymentLinksHub({ barbershopId }: Props) {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [billingType, setBillingType] = useState("PIX");
  const [expiresAt, setExpiresAt] = useState("");

  const loadLinks = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("payment_links")
      .select("id,title,description,amount,billing_type,url,status,expires_at,created_at")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: false });
    setLinks(data || []);
    setLoading(false);
  };

  useEffect(() => { loadLinks(); }, [barbershopId]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setAmount(""); setBillingType("PIX"); setExpiresAt(""); setShowForm(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !amount) { toast.error("Título e valor são obrigatórios"); return; }
    const amountNum = Number(amount);
    if (amountNum <= 0) { toast.error("Valor deve ser maior que zero"); return; }
    setSaving(true);

    try {
      // Get barbershop wallet id
      const { data: shop } = await (supabase as any)
        .from("barbershops")
        .select("asaas_wallet_id, asaas_customer_id")
        .eq("id", barbershopId)
        .single();

      // Call process-payment to create the charge link
      const { data: paymentResult, error: fnError } = await supabase.functions.invoke("process-payment", {
        body: {
          action: "charge",
          amount: amountNum,
          billing_type: billingType,
          description: description || title,
          external_reference: `paylink:${barbershopId}`,
          ...(shop?.asaas_wallet_id ? {
            split: [{
              wallet_id: shop.asaas_wallet_id,
              percentage_value: 100,
            }]
          } : {}),
        },
      });

      if (fnError) throw new Error(fnError.message);

      const invoiceUrl = paymentResult?.invoice_url || paymentResult?.payment_link || null;

      // Save to payment_links table
      const { error: dbError } = await (supabase as any).from("payment_links").insert({
        barbershop_id: barbershopId,
        title,
        description: description || null,
        amount: amountNum,
        billing_type: billingType,
        asaas_link_id: paymentResult?.payment_id || null,
        url: invoiceUrl,
        status: "active",
        expires_at: expiresAt || null,
        notify_customer: true,
      });

      if (dbError) throw new Error(dbError.message);

      toast.success("Link de cobrança criado!");
      resetForm();
      await loadLinks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar link";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (link: PaymentLink) => {
    const urlToCopy = link.url || `https://app.asaas.com/i/${link.id}`;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedId(link.id);
      toast.success("Link copiado!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este link?")) return;
    await (supabase as any).from("payment_links").update({ status: "inactive" }).eq("id", id);
    toast.success("Link desativado");
    loadLinks();
  };

  const statusColor = (status: string) => {
    if (status === "active") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "expired") return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const statusLabel = (status: string) => {
    if (status === "active") return "Ativo";
    if (status === "expired") return "Expirado";
    return "Inativo";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">
            Links de <span className="text-gradient-gold">Cobrança</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Gere links de pagamento via Asaas</p>
        </div>
        <Button variant="gold" className="rounded-2xl font-black shadow-gold h-11 px-6 diamond-glow"
          onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus className="w-4 h-4 mr-2" /> {showForm ? "Fechar" : "Novo Link"}
        </Button>
      </div>

      {/* Creation form */}
      {showForm && (
        <div className="glass-card rounded-[2.5rem] p-8 border border-orange-500/20 animate-in slide-in-from-top-4 duration-400">
          <h3 className="text-lg font-black text-white mb-6">Criar Link de Cobrança</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-slate-400 font-bold">Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Consultoria de 1h"
                className="bg-white/5 border-white/10 rounded-2xl h-12 text-white" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-slate-400 font-bold">Descrição (opcional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Detalhes do serviço ou produto"
                className="bg-white/5 border-white/10 rounded-2xl h-12 text-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 font-bold">Valor (R$)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00"
                  className="bg-white/5 border-white/10 rounded-2xl h-12 pl-10 text-white font-black" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 font-bold">Forma de Pagamento</Label>
              <select value={billingType} onChange={e => setBillingType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-orange-500/50">
                {BILLING_TYPES.map(t => <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 font-bold">Validade (opcional)</Label>
              <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="bg-white/5 border-white/10 rounded-2xl h-12 text-white" />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <Button variant="ghost" className="rounded-2xl h-11 font-bold" onClick={resetForm}>Cancelar</Button>
              <Button variant="gold" className="rounded-2xl h-11 px-8 font-black shadow-gold"
                onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar Link"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Links list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-[2rem] animate-pulse" />)}
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-[2.5rem]">
          <Link2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">Nenhum link criado ainda</p>
          <p className="text-slate-600 text-sm mt-1">Crie links de cobrança para compartilhar com clientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map(link => (
            <div key={link.id} className="glass-card rounded-[2rem] p-5 border border-white/5 flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Link2 className="w-5 h-5 text-orange-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-black text-white truncate">{link.title}</p>
                  <Badge variant="outline" className={`rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${statusColor(link.status)}`}>
                    {statusLabel(link.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-black text-gradient-gold text-sm">R$ {Number(link.amount).toFixed(2)}</span>
                  <span>{BILLING_TYPES.find(t => t.value === link.billing_type)?.label || link.billing_type}</span>
                  {link.expires_at && (
                    <span>Expira: {new Date(link.expires_at).toLocaleDateString("pt-BR")}</span>
                  )}
                </div>
                {link.url && (
                  <p className="text-[10px] text-slate-600 truncate mt-1 font-mono">{link.url}</p>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {link.url && (
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-white/5">
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </Button>
                  </a>
                )}
                <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-orange-500/10"
                  onClick={() => handleCopy(link)}>
                  {copiedId === link.id
                    ? <Check className="w-4 h-4 text-emerald-400" />
                    : <Copy className="w-4 h-4 text-orange-400" />}
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(link.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
