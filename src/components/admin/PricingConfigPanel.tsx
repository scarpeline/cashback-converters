/**
 * Painel para editar preços e textos da seção de preços da landing page principal.
 * Salva em integration_settings e é consumido pelo Pricing.tsx via hook.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, RefreshCw, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── Estrutura de um plano ────────────────────────────────────────────────────
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;           // ex: "29,90"
  price_label: string;     // ex: "por mês"
  trial_note: string;      // ex: "7 dias grátis"
  popular: boolean;
  best_value: boolean;
  cta_label: string;
  features: string[];
}

// ─── Estrutura das taxas de pagamento ────────────────────────────────────────
export interface PaymentFees {
  pix_rate: string;        // ex: "1,49%"
  credit_rate: string;     // ex: "3,49% + R$0,49"
  debit_rate: string;      // ex: "2,49%"
}

// ─── Estrutura completa ───────────────────────────────────────────────────────
export interface PricingConfig {
  section_title: string;
  section_subtitle: string;
  section_badge: string;
  plans: PricingPlan[];
  fees: PaymentFees;
  fees_title: string;
  fees_subtitle: string;
}

const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: "monthly",
    name: "Mensal",
    description: "Perfeito para começar",
    price: "29,90",
    price_label: "por mês",
    trial_note: "14 dias grátis para testar",
    popular: false,
    best_value: false,
    cta_label: "Começar Grátis",
    features: [
      "14 dias grátis para testar",
      "Agendamentos ilimitados",
      "Pagamentos PIX, Crédito e Débito",
      "Split automático de comissões",
      "Cashback configurável",
      "WhatsApp automático",
      "Dashboard financeiro completo",
      "Relatórios e métricas",
      "Múltiplos profissionais",
      "Sistema de afiliados",
      "Gestão de estoque e produtos",
      "Exportação de dados",
      "Suporte via chat",
    ],
  },
  {
    id: "semiannual",
    name: "Semestral",
    description: "Economia inteligente",
    price: "169,90",
    price_label: "por 6 meses",
    trial_note: "Equivale a R$28,32/mês",
    popular: true,
    best_value: false,
    cta_label: "Assinar Agora",
    features: [
      "14 dias grátis para testar",
      "Agendamentos ilimitados",
      "Pagamentos PIX, Crédito e Débito",
      "Split automático de comissões",
      "Cashback configurável",
      "WhatsApp automático",
      "Dashboard financeiro completo",
      "Relatórios e métricas",
      "Múltiplos profissionais",
      "Sistema de afiliados",
      "Gestão de estoque e produtos",
      "Exportação de dados",
      "Suporte via chat",
    ],
  },
  {
    id: "annual",
    name: "Anual",
    description: "Máxima economia",
    price: "299,90",
    price_label: "por ano",
    trial_note: "Equivale a R$24,99/mês",
    popular: false,
    best_value: true,
    cta_label: "Assinar Anual",
    features: [
      "14 dias grátis para testar",
      "Agendamentos ilimitados",
      "Pagamentos PIX, Crédito e Débito",
      "Split automático de comissões",
      "Cashback configurável",
      "WhatsApp automático",
      "Dashboard financeiro completo",
      "Relatórios e métricas",
      "Múltiplos profissionais",
      "Sistema de afiliados",
      "Gestão de estoque e produtos",
      "Exportação de dados",
      "Suporte via chat",
    ],
  },
];

export const PRICING_DEFAULTS: PricingConfig = {
  section_title: "Escolha o plano ideal para seu negócio",
  section_subtitle: "14 dias grátis em todos os planos. Sem cartão de crédito. Cancele quando quiser.",
  section_badge: "Preços Transparentes",
  plans: DEFAULT_PLANS,
  fees: { pix_rate: "1,49%", credit_rate: "3,49% + R$0,49", debit_rate: "2,49%" },
  fees_title: "Taxas por transação",
  fees_subtitle: "Sem mensalidade extra. Só paga quando recebe.",
};

const SERVICE_NAME = "pricing_config";

// ─── Fetch para uso externo ───────────────────────────────────────────────────
export async function fetchPricingConfig(): Promise<PricingConfig> {
  const { data } = await (supabase as any)
    .from("integration_settings")
    .select("base_url")
    .eq("service_name", SERVICE_NAME)
    .maybeSingle();
  if (data?.base_url) {
    try { return { ...PRICING_DEFAULTS, ...JSON.parse(data.base_url) }; } catch { /* fallback */ }
  }
  return PRICING_DEFAULTS;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function PricingConfigPanel() {
  const [config, setConfig] = useState<PricingConfig>(PRICING_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>("monthly");

  useEffect(() => {
    fetchPricingConfig().then(c => { setConfig(c); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any).from("integration_settings").upsert(
      { service_name: SERVICE_NAME, environment: "production", is_active: true, base_url: JSON.stringify(config) },
      { onConflict: "service_name,environment" }
    );
    setSaving(false);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Configuração de preços salva!");
  };

  const reset = () => { setConfig(PRICING_DEFAULTS); toast.info("Restaurado para o padrão. Clique em Salvar para confirmar."); };

  const updatePlan = (id: string, field: keyof PricingPlan, value: any) => {
    setConfig(c => ({
      ...c,
      plans: c.plans.map(p => p.id === id ? { ...p, [field]: value } : p),
    }));
  };

  const updateFeature = (planId: string, idx: number, value: string) => {
    setConfig(c => ({
      ...c,
      plans: c.plans.map(p => p.id === planId
        ? { ...p, features: p.features.map((f, i) => i === idx ? value : f) }
        : p
      ),
    }));
  };

  const addFeature = (planId: string) => {
    setConfig(c => ({
      ...c,
      plans: c.plans.map(p => p.id === planId
        ? { ...p, features: [...p.features, "Nova funcionalidade"] }
        : p
      ),
    }));
  };

  const removeFeature = (planId: string, idx: number) => {
    setConfig(c => ({
      ...c,
      plans: c.plans.map(p => p.id === planId
        ? { ...p, features: p.features.filter((_, i) => i !== idx) }
        : p
      ),
    }));
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Edite os preços e textos da seção de planos da landing page principal.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Restaurar padrão
          </Button>
          <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar Preços"}
          </Button>
        </div>
      </div>

      {/* Cabeçalho da seção */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📋 Cabeçalho da Seção</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Badge</label>
            <Input value={config.section_badge} onChange={e => setConfig(c => ({ ...c, section_badge: e.target.value }))} className="h-10 text-slate-900 border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Título</label>
            <Input value={config.section_title} onChange={e => setConfig(c => ({ ...c, section_title: e.target.value }))} className="h-10 text-slate-900 border-slate-200" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Subtítulo</label>
            <Input value={config.section_subtitle} onChange={e => setConfig(c => ({ ...c, section_subtitle: e.target.value }))} className="h-10 text-slate-900 border-slate-200" />
          </div>
        </CardContent>
      </Card>

      {/* Planos */}
      {config.plans.map((plan, planIdx) => (
        <Card key={plan.id} className={plan.popular ? "border-orange-300" : plan.best_value ? "border-green-300" : ""}>
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {plan.popular && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">Mais Popular</span>}
                {plan.best_value && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Melhor Valor</span>}
                Plano {planIdx + 1}: {plan.name}
              </CardTitle>
              <span className="text-2xl font-black text-orange-500">R$ {plan.price}</span>
            </div>
          </CardHeader>

          {expandedPlan === plan.id && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Nome do Plano</label>
                  <Input value={plan.name} onChange={e => updatePlan(plan.id, "name", e.target.value)} className="h-10 text-slate-900 border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Descrição</label>
                  <Input value={plan.description} onChange={e => updatePlan(plan.id, "description", e.target.value)} className="h-10 text-slate-900 border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Preço (ex: 29,90)</label>
                  <Input value={plan.price} onChange={e => updatePlan(plan.id, "price", e.target.value)} className="h-10 text-slate-900 border-slate-200 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Label do preço (ex: por mês)</label>
                  <Input value={plan.price_label} onChange={e => updatePlan(plan.id, "price_label", e.target.value)} className="h-10 text-slate-900 border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Nota de trial/equivalência</label>
                  <Input value={plan.trial_note} onChange={e => updatePlan(plan.id, "trial_note", e.target.value)} className="h-10 text-slate-900 border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Texto do botão CTA</label>
                  <Input value={plan.cta_label} onChange={e => updatePlan(plan.id, "cta_label", e.target.value)} className="h-10 text-slate-900 border-slate-200" />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={plan.popular} onChange={e => updatePlan(plan.id, "popular", e.target.checked)} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm font-medium text-slate-700">Mais Popular (destaque laranja)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={plan.best_value} onChange={e => updatePlan(plan.id, "best_value", e.target.checked)} className="w-4 h-4 accent-green-500" />
                  <span className="text-sm font-medium text-slate-700">Melhor Valor (destaque verde)</span>
                </label>
              </div>

              {/* Funcionalidades */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Funcionalidades incluídas</label>
                  <Button variant="ghost" size="sm" onClick={() => addFeature(plan.id)} className="gap-1 text-orange-500 hover:text-orange-600 h-7">
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={feat}
                        onChange={e => updateFeature(plan.id, idx, e.target.value)}
                        className="h-9 text-slate-900 border-slate-200 text-sm"
                      />
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-50 hover:text-red-500 flex-shrink-0" onClick={() => removeFeature(plan.id, idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Taxas de pagamento */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">💳 Taxas de Pagamento</CardTitle>
          <CardDescription className="text-xs">Exibidas no bloco escuro abaixo dos planos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Título do bloco</label>
              <Input value={config.fees_title} onChange={e => setConfig(c => ({ ...c, fees_title: e.target.value }))} className="h-10 text-slate-900 border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Subtítulo</label>
              <Input value={config.fees_subtitle} onChange={e => setConfig(c => ({ ...c, fees_subtitle: e.target.value }))} className="h-10 text-slate-900 border-slate-200" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-green-600 uppercase tracking-wider block">Taxa PIX</label>
              <Input value={config.fees.pix_rate} onChange={e => setConfig(c => ({ ...c, fees: { ...c.fees, pix_rate: e.target.value } }))} className="h-10 text-slate-900 border-green-200 font-bold" placeholder="ex: 1,49%" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-purple-600 uppercase tracking-wider block">Taxa Cartão de Crédito</label>
              <Input value={config.fees.credit_rate} onChange={e => setConfig(c => ({ ...c, fees: { ...c.fees, credit_rate: e.target.value } }))} className="h-10 text-slate-900 border-purple-200 font-bold" placeholder="ex: 3,49% + R$0,49" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-cyan-600 uppercase tracking-wider block">Taxa Débito/NFC</label>
              <Input value={config.fees.debit_rate} onChange={e => setConfig(c => ({ ...c, fees: { ...c.fees, debit_rate: e.target.value } }))} className="h-10 text-slate-900 border-cyan-200 font-bold" placeholder="ex: 2,49%" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-8 gap-2 font-bold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar Configuração de Preços"}
        </Button>
      </div>
    </div>
  );
}

export { SERVICE_NAME as PRICING_SERVICE_NAME };
