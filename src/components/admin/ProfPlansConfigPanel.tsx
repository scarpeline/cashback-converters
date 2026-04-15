/**
 * Painel de configuração de planos por profissional.
 * Sincroniza com landing page, comissões e gateway.
 */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save, RefreshCw, Plus, Trash2, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  fetchProfPlansConfig, saveProfPlansConfig,
  DEFAULT_PROF_PLANS, ProfPlansConfig, ProfPlanConfig,
} from "@/hooks/useProfessionalPlansConfig";

export function ProfPlansConfigPanel() {
  const [config, setConfig] = useState<ProfPlansConfig>(DEFAULT_PROF_PLANS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfPlansConfig().then(c => { setConfig(c); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    const ok = await saveProfPlansConfig(config);
    setSaving(false);
    if (ok) toast.success("Planos salvos! Landing page e sistema sincronizados.");
    else toast.error("Erro ao salvar. Tente novamente.");
  };

  const updatePlan = (idx: number, field: keyof ProfPlanConfig, val: any) => {
    setConfig(c => ({
      ...c,
      plans: c.plans.map((p, i) => i === idx ? { ...p, [field]: val } : p),
    }));
  };

  const addPlan = () => {
    if (config.plans.length >= 6) { toast.info("Máximo de 6 planos"); return; }
    setConfig(c => ({
      ...c,
      plans: [...c.plans, {
        professionals: 15, label: "15 Profissionais",
        monthly: 99.90, semiannual: 549.90, annual: 999.90,
        popular: false, color: "bg-slate-500", textColor: "text-slate-600",
      }],
    }));
  };

  const removePlan = (idx: number) => {
    if (config.plans.length <= 1) { toast.info("Mínimo de 1 plano"); return; }
    setConfig(c => ({ ...c, plans: c.plans.filter((_, i) => i !== idx) }));
  };

  const updateFeature = (idx: number, val: string) => {
    setConfig(c => ({ ...c, features: c.features.map((f, i) => i === idx ? val : f) }));
  };

  const addFeature = () => {
    setConfig(c => ({ ...c, features: [...c.features, "Nova funcionalidade"] }));
  };

  const removeFeature = (idx: number) => {
    setConfig(c => ({ ...c, features: c.features.filter((_, i) => i !== idx) }));
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Planos por Profissional</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure preços e planos. Sincroniza automaticamente com a landing page, comissões e gateway.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setConfig(DEFAULT_PROF_PLANS); toast.info("Restaurado. Clique em Salvar."); }}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Restaurar padrão
          </Button>
          <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Salvando..." : "Salvar e Sincronizar"}
          </Button>
        </div>
      </div>

      {/* Trial days */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div>
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Dias de Trial Grátis</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number" min="1" max="90"
                value={config.trial_days}
                onChange={e => setConfig(c => ({ ...c, trial_days: parseInt(e.target.value) || 14 }))}
                className="w-24 h-9 font-bold"
              />
              <span className="text-sm text-slate-500">dias grátis para todos os planos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" /> Planos por Quantidade de Profissionais
          </h3>
          <Button variant="outline" size="sm" onClick={addPlan}>
            <Plus className="w-4 h-4 mr-1.5" /> Adicionar plano
          </Button>
        </div>

        {config.plans.map((plan, idx) => (
          <Card key={idx} className={`border-2 ${plan.popular ? "border-green-300" : "border-slate-200"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${plan.color} flex items-center justify-center`}>
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  {plan.label}
                  {plan.popular && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">POPULAR</span>}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Switch checked={plan.popular} onCheckedChange={v => updatePlan(idx, "popular", v)} />
                    <span className="text-xs text-slate-500">Popular</span>
                  </div>
                  {config.plans.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removePlan(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nº Profissionais</Label>
                  <Input type="number" min="1" value={plan.professionals}
                    onChange={e => {
                      const n = parseInt(e.target.value) || 1;
                      updatePlan(idx, "professionals", n);
                      updatePlan(idx, "label", `${n} ${n === 1 ? "Profissional" : "Profissionais"}`);
                    }}
                    className="mt-1 h-9 font-bold" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço Mensal (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={plan.monthly}
                    onChange={e => updatePlan(idx, "monthly", parseFloat(e.target.value) || 0)}
                    className="mt-1 h-9 font-bold text-orange-600" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço Semestral (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={plan.semiannual}
                    onChange={e => updatePlan(idx, "semiannual", parseFloat(e.target.value) || 0)}
                    className="mt-1 h-9 font-bold text-blue-600" />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ≈ R${(plan.semiannual / 6).toFixed(2)}/mês
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço Anual (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={plan.annual}
                    onChange={e => updatePlan(idx, "annual", parseFloat(e.target.value) || 0)}
                    className="mt-1 h-9 font-bold text-green-600" />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ≈ R${(plan.annual / 12).toFixed(2)}/mês
                  </p>
                </div>
              </div>

              {/* IDs do gateway */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID Checkout Mensal (ASAAS)</Label>
                  <Input value={plan.asaas_monthly_id || ""} placeholder="ex: wyg2cu1i6z2e52el"
                    onChange={e => updatePlan(idx, "asaas_monthly_id", e.target.value)}
                    className="mt-1 h-8 text-xs font-mono" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID Checkout Anual (ASAAS)</Label>
                  <Input value={plan.asaas_annual_id || ""} placeholder="ex: 0yhsb6e32ieawwvv"
                    onChange={e => updatePlan(idx, "asaas_annual_id", e.target.value)}
                    className="mt-1 h-8 text-xs font-mono" />
                </div>
              </div>

              {/* Preview de economia */}
              <div className="flex gap-3 text-xs">
                <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-blue-600 font-bold">Semestral</p>
                  <p className="text-slate-500">Economia: R${((plan.monthly * 6) - plan.semiannual).toFixed(2)}</p>
                  <p className="text-slate-400">({Math.round(((plan.monthly * 6 - plan.semiannual) / (plan.monthly * 6)) * 100)}% off)</p>
                </div>
                <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-green-600 font-bold">Anual</p>
                  <p className="text-slate-500">Economia: R${((plan.monthly * 12) - plan.annual).toFixed(2)}</p>
                  <p className="text-slate-400">({Math.round(((plan.monthly * 12 - plan.annual) / (plan.monthly * 12)) * 100)}% off)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funcionalidades */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-500" /> Funcionalidades Incluídas
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Iguais para todos os planos. Só varia a quantidade de profissionais.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={addFeature} className="text-orange-500 hover:text-orange-600">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {config.features.map((feat, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={feat} onChange={e => updateFeature(idx, e.target.value)}
                  className="h-8 text-sm border-slate-200" />
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-500 flex-shrink-0"
                  onClick={() => removeFeature(idx)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-8 font-bold">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar e Sincronizar</>}
        </Button>
      </div>
    </div>
  );
}
