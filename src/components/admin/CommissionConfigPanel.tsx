import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CommissionRule {
  tipo_parceria: string;
  tipo_comissao: string;
  percentual_padrao: number;
  regras: { meses?: number; descricao?: string; periodos?: PeriodBlock[] };
}

// Bloco de período configurável
interface PeriodBlock {
  label: string;   // ex: "Básico", "Intermediário", "Premium"
  meses: number;
  pct: number;
}

interface RoleConfig {
  afiliado_adesao_pct: string;
  afiliado_periodos: PeriodBlock[];

  franqueado_adesao_pct: string;
  franqueado_periodos: PeriodBlock[];

  diretor_indicacao_direta_pct: string;
  diretor_indicacao_indireta_pct: string;
  diretor_periodos: PeriodBlock[];
}

const DEFAULT_PERIODOS: PeriodBlock[] = [
  { label: "Curto",  meses: 6,  pct: 20 },
  { label: "Médio",  meses: 12, pct: 25 },
  { label: "Longo",  meses: 24, pct: 30 },
];

const DEFAULT: RoleConfig = {
  afiliado_adesao_pct: "50",
  afiliado_periodos: DEFAULT_PERIODOS.map(p => ({ ...p })),
  franqueado_adesao_pct: "65",
  franqueado_periodos: DEFAULT_PERIODOS.map(p => ({ ...p, pct: p.pct - 10 })),
  diretor_indicacao_direta_pct: "15",
  diretor_indicacao_indireta_pct: "10",
  diretor_periodos: [
    { label: "Curto",  meses: 12, pct: 10 },
    { label: "Médio",  meses: 24, pct: 12 },
    { label: "Longo",  meses: 36, pct: 15 },
  ],
};

// ── Componente de 3 blocos de período ─────────────────────────────────────────
function PeriodBlocks({
  periodos,
  onChange,
  color,
}: {
  periodos: PeriodBlock[];
  onChange: (p: PeriodBlock[]) => void;
  color: "orange" | "blue" | "purple";
}) {
  const colors = {
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-500" },
    blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   badge: "bg-blue-500" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-500" },
  }[color];

  const update = (i: number, field: keyof PeriodBlock, val: string | number) => {
    const next = periodos.map((p, idx) => idx === i ? { ...p, [field]: field === "label" ? val : Number(val) } : p);
    onChange(next);
  };

  const add = () => {
    if (periodos.length >= 5) { toast.info("Máximo de 5 períodos"); return; }
    onChange([...periodos, { label: `Período ${periodos.length + 1}`, meses: 12, pct: 20 }]);
  };

  const remove = (i: number) => {
    if (periodos.length <= 1) { toast.info("Mínimo de 1 período"); return; }
    onChange(periodos.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Períodos de Comissão Recorrente</p>
        <button onClick={add} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Adicionar período
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {periodos.map((p, i) => (
          <div key={i} className={`relative rounded-xl border-2 ${colors.border} ${colors.bg} p-4 space-y-3`}>
            {/* Badge número */}
            <div className={`absolute -top-2.5 left-3 ${colors.badge} text-white text-[10px] font-black px-2 py-0.5 rounded-full`}>
              Opção {i + 1}
            </div>
            {periodos.length > 1 && (
              <button onClick={() => remove(i)} className="absolute -top-2.5 right-2 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="pt-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome</label>
              <Input
                value={p.label}
                onChange={e => update(i, "label", e.target.value)}
                className="h-8 text-sm font-semibold border-slate-200"
                placeholder="Ex: Básico"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Meses</label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number" min="1" max="120"
                    value={p.meses}
                    onChange={e => update(i, "meses", e.target.value)}
                    className="h-8 text-sm font-bold border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">meses</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">%</label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number" min="0" max="100"
                    value={p.pct}
                    onChange={e => update(i, "pct", e.target.value)}
                    className="h-8 text-sm font-bold border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              </div>
            </div>

            <div className={`text-[10px] ${colors.text} font-semibold text-center`}>
              {p.pct}% por {p.meses} meses
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function CommissionConfigPanel() {
  const [config, setConfig] = useState<RoleConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [precoFranqueado, setPrecoFranqueado] = useState("997");
  const [precoDiretor, setPrecoDiretor] = useState("2997");
  const [precoAssinatura, setPrecoAssinatura] = useState("97");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("config_comissoes")
      .select("tipo_parceria, tipo_comissao, percentual_padrao, regras")
      .eq("ativo", true);

    if (data && data.length > 0) {
      const map: Record<string, CommissionRule> = {};
      (data as CommissionRule[]).forEach(r => { map[`${r.tipo_parceria}__${r.tipo_comissao}`] = r; });

      setConfig({
        afiliado_adesao_pct: String(map["afiliado__adesao"]?.percentual_padrao ?? 50),
        afiliado_periodos: map["afiliado__recorrente"]?.regras?.periodos || DEFAULT.afiliado_periodos,
        franqueado_adesao_pct: String(map["franqueado__adesao"]?.percentual_padrao ?? 65),
        franqueado_periodos: map["franqueado__recorrente"]?.regras?.periodos || DEFAULT.franqueado_periodos,
        diretor_indicacao_direta_pct: String(map["diretor_franqueado__indicacao_direta"]?.percentual_padrao ?? 15),
        diretor_indicacao_indireta_pct: String(map["diretor_franqueado__indicacao_indireta"]?.percentual_padrao ?? 10),
        diretor_periodos: map["diretor_franqueado__indicacao_direta"]?.regras?.periodos || DEFAULT.diretor_periodos,
      });
    }

    const { data: settings } = await (supabase as any)
      .from("integration_settings")
      .select("service_name, base_url")
      .in("service_name", ["preco_franqueado", "preco_diretor", "preco_assinatura"]);
    (settings || []).forEach((s: any) => {
      if (s.service_name === "preco_franqueado") setPrecoFranqueado(s.base_url || "997");
      if (s.service_name === "preco_diretor") setPrecoDiretor(s.base_url || "2997");
      if (s.service_name === "preco_assinatura") setPrecoAssinatura(s.base_url || "97");
    });

    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const rows = [
        {
          tipo_parceria: "afiliado", tipo_comissao: "adesao",
          percentual_padrao: Number(config.afiliado_adesao_pct),
          regras: { descricao: "Comissão única na adesão" }, ativo: true,
        },
        {
          tipo_parceria: "afiliado", tipo_comissao: "recorrente",
          percentual_padrao: config.afiliado_periodos[0]?.pct ?? 25,
          regras: { periodos: config.afiliado_periodos, meses: config.afiliado_periodos[0]?.meses ?? 12 }, ativo: true,
        },
        {
          tipo_parceria: "franqueado", tipo_comissao: "adesao",
          percentual_padrao: Number(config.franqueado_adesao_pct),
          regras: { descricao: "Comissão sobre adesão dos afiliados" }, ativo: true,
        },
        {
          tipo_parceria: "franqueado", tipo_comissao: "recorrente",
          percentual_padrao: config.franqueado_periodos[0]?.pct ?? 10,
          regras: { periodos: config.franqueado_periodos, meses: config.franqueado_periodos[0]?.meses ?? 12 }, ativo: true,
        },
        {
          tipo_parceria: "diretor_franqueado", tipo_comissao: "indicacao_direta",
          percentual_padrao: Number(config.diretor_indicacao_direta_pct),
          regras: { periodos: config.diretor_periodos, meses: config.diretor_periodos[0]?.meses ?? 24 }, ativo: true,
        },
        {
          tipo_parceria: "diretor_franqueado", tipo_comissao: "indicacao_indireta",
          percentual_padrao: Number(config.diretor_indicacao_indireta_pct),
          regras: { periodos: config.diretor_periodos, meses: config.diretor_periodos[0]?.meses ?? 24 }, ativo: true,
        },
      ];

      const { error } = await (supabase as any)
        .from("config_comissoes")
        .upsert(rows, { onConflict: "tipo_parceria,tipo_comissao" });
      if (error) throw error;

      await (supabase as any).from("integration_settings").upsert([
        { service_name: "preco_franqueado", environment: "production", is_active: true, base_url: precoFranqueado },
        { service_name: "preco_diretor", environment: "production", is_active: true, base_url: precoDiretor },
        { service_name: "preco_assinatura", environment: "production", is_active: true, base_url: precoAssinatura },
      ], { onConflict: "service_name,environment" });

      toast.success("Configuração salva com sucesso!");
      await load();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-800 mb-1">Hierarquia de comissões:</p>
            <div className="space-y-1 text-xs">
              <p>🟠 <strong>Afiliado</strong> → indica clientes → ganha % na adesão + % recorrente por período escolhido</p>
              <p>🔵 <strong>Franqueado</strong> → tem afiliados → ganha % sobre adesões + % recorrente por período</p>
              <p>🟣 <strong>Diretor</strong> → tem franqueados → ganha % sobre toda a rede por período</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Afiliado ── */}
      <Card className="border-orange-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">🟠</div>
            <div>
              <CardTitle className="text-base">Afiliado</CardTitle>
              <CardDescription className="text-xs">Indica clientes. Ganha comissão na adesão e recorrente conforme o período.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 block">% na Adesão</label>
            <p className="text-xs text-slate-400">Comissão única quando o indicado assina</p>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" max="100" value={config.afiliado_adesao_pct}
                onChange={e => setConfig(c => ({ ...c, afiliado_adesao_pct: e.target.value }))}
                className="h-10 w-28 font-bold" />
              <span className="text-sm font-bold text-slate-500">%</span>
            </div>
          </div>
          <PeriodBlocks
            periodos={config.afiliado_periodos}
            onChange={p => setConfig(c => ({ ...c, afiliado_periodos: p }))}
            color="orange"
          />
          <div className="p-3 bg-orange-50 rounded-lg text-xs text-orange-700">
            <strong>Exemplo (Período 1):</strong> Afiliado indica cliente que paga R$ 100/mês →
            recebe R$ {((Number(config.afiliado_adesao_pct) / 100) * 100).toFixed(0)} na adesão +
            R$ {((config.afiliado_periodos[0]?.pct ?? 0) / 100 * 100).toFixed(0)}/mês por {config.afiliado_periodos[0]?.meses ?? 0} meses
          </div>
        </CardContent>
      </Card>

      {/* ── Franqueado ── */}
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">🔵</div>
            <div>
              <CardTitle className="text-base">Franqueado</CardTitle>
              <CardDescription className="text-xs">Gerencia afiliados. Ganha sobre adesões e assinaturas da rede.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 block">% sobre Adesões dos Afiliados</label>
            <p className="text-xs text-slate-400">% sobre cada adesão gerada pelos afiliados da rede</p>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" max="100" value={config.franqueado_adesao_pct}
                onChange={e => setConfig(c => ({ ...c, franqueado_adesao_pct: e.target.value }))}
                className="h-10 w-28 font-bold" />
              <span className="text-sm font-bold text-slate-500">%</span>
            </div>
          </div>
          <PeriodBlocks
            periodos={config.franqueado_periodos}
            onChange={p => setConfig(c => ({ ...c, franqueado_periodos: p }))}
            color="blue"
          />
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <strong>Exemplo (Período 1):</strong> Franqueado tem 10 afiliados, cada um gera R$ 100/mês →
            recebe R$ {((config.franqueado_periodos[0]?.pct ?? 0) / 100 * 100 * 10).toFixed(0)}/mês por {config.franqueado_periodos[0]?.meses ?? 0} meses
          </div>
        </CardContent>
      </Card>

      {/* ── Diretor ── */}
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">🟣</div>
            <div>
              <CardTitle className="text-base">Diretor Franqueado</CardTitle>
              <CardDescription className="text-xs">Topo da hierarquia. Ganha sobre toda a rede.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 block">% sobre Rede de Afiliados</label>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" max="100" value={config.diretor_indicacao_direta_pct}
                  onChange={e => setConfig(c => ({ ...c, diretor_indicacao_direta_pct: e.target.value }))}
                  className="h-10 w-28 font-bold" />
                <span className="text-sm font-bold text-slate-500">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 block">% sobre Rede de Franqueados</label>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" max="100" value={config.diretor_indicacao_indireta_pct}
                  onChange={e => setConfig(c => ({ ...c, diretor_indicacao_indireta_pct: e.target.value }))}
                  className="h-10 w-28 font-bold" />
                <span className="text-sm font-bold text-slate-500">%</span>
              </div>
            </div>
          </div>
          <PeriodBlocks
            periodos={config.diretor_periodos}
            onChange={p => setConfig(c => ({ ...c, diretor_periodos: p }))}
            color="purple"
          />
          <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-700">
            <strong>Exemplo (Período 1):</strong> Diretor tem 5 franqueados com 10 afiliados cada, gerando R$ 100/mês →
            recebe R$ {((config.diretor_indicacao_indireta_pct ? Number(config.diretor_indicacao_indireta_pct) / 100 * 100 * 50 : 0)).toFixed(0)}/mês por {config.diretor_periodos[0]?.meses ?? 0} meses
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Resumo da Configuração Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <p className="text-orange-400 font-black uppercase tracking-widest mb-2">Afiliado</p>
              <p className="text-white">Adesão: <strong>{config.afiliado_adesao_pct}%</strong></p>
              {config.afiliado_periodos.map((p, i) => (
                <p key={i} className="text-slate-300">{p.label}: <strong>{p.pct}%</strong> × <strong>{p.meses}m</strong></p>
              ))}
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-400 font-black uppercase tracking-widest mb-2">Franqueado</p>
              <p className="text-white">Adesão rede: <strong>{config.franqueado_adesao_pct}%</strong></p>
              {config.franqueado_periodos.map((p, i) => (
                <p key={i} className="text-slate-300">{p.label}: <strong>{p.pct}%</strong> × <strong>{p.meses}m</strong></p>
              ))}
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-purple-400 font-black uppercase tracking-widest mb-2">Diretor</p>
              <p className="text-white">Afiliados: <strong>{config.diretor_indicacao_direta_pct}%</strong></p>
              <p className="text-white">Franqueados: <strong>{config.diretor_indicacao_indireta_pct}%</strong></p>
              {config.diretor_periodos.map((p, i) => (
                <p key={i} className="text-slate-300">{p.label}: <strong>{p.meses}m</strong></p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preços de Upgrade */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">💰 Preços de Upgrade</CardTitle>
          <CardDescription className="text-xs">Sincronizado com a landing page e painéis.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: "Preço Franqueado", hint: "Investimento para se tornar franqueado", val: precoFranqueado, set: setPrecoFranqueado },
              { label: "Preço Diretor", hint: "Investimento para se tornar diretor", val: precoDiretor, set: setPrecoDiretor },
              { label: "Preço da Assinatura", hint: "Mensalidade base do sistema", val: precoAssinatura, set: setPrecoAssinatura, suffix: "R$/mês" },
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block">{item.label}</label>
                <p className="text-xs text-slate-400">{item.hint}</p>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" value={item.val} onChange={e => item.set(e.target.value)}
                    className="h-10 w-32 font-bold" />
                  <span className="text-sm font-bold text-slate-500">{item.suffix || "R$"}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-8 rounded-xl gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar Configuração de Comissões"}
        </Button>
      </div>
    </div>
  );
}
