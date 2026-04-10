import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface CommissionRule {
  tipo_parceria: string;
  tipo_comissao: string;
  percentual_padrao: number;
  regras: { meses?: number; descricao?: string };
}

// Estrutura de configuração por papel
interface RoleConfig {
  // Afiliado
  afiliado_adesao_pct: string;          // % na adesão do indicado
  afiliado_recorrente_pct: string;      // % recorrente sobre assinatura do indicado
  afiliado_recorrente_meses: string;    // por quantos meses recebe recorrente

  // Franqueado
  franqueado_adesao_pct: string;        // % na adesão dos afiliados da sua rede
  franqueado_recorrente_pct: string;    // % recorrente sobre assinaturas dos afiliados
  franqueado_recorrente_meses: string;  // por quantos meses

  // Diretor
  diretor_indicacao_direta_pct: string;   // % sobre rede de afiliados diretos
  diretor_indicacao_indireta_pct: string; // % sobre rede de franqueados
  diretor_recorrente_meses: string;       // por quantos meses
}

const DEFAULT: RoleConfig = {
  afiliado_adesao_pct: "50",
  afiliado_recorrente_pct: "25",
  afiliado_recorrente_meses: "12",
  franqueado_adesao_pct: "65",
  franqueado_recorrente_pct: "10",
  franqueado_recorrente_meses: "12",
  diretor_indicacao_direta_pct: "15",
  diretor_indicacao_indireta_pct: "10",
  diretor_recorrente_meses: "24",
};

// ─── Componente ───────────────────────────────────────────────────────────────
export function CommissionConfigPanel() {
  const [config, setConfig] = useState<RoleConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("config_comissoes")
      .select("tipo_parceria, tipo_comissao, percentual_padrao, regras")
      .eq("ativo", true);

    if (data && data.length > 0) {
      const map: Record<string, CommissionRule> = {};
      (data as CommissionRule[]).forEach(r => {
        map[`${r.tipo_parceria}__${r.tipo_comissao}`] = r;
      });

      setConfig({
        afiliado_adesao_pct:           String(map["afiliado__adesao"]?.percentual_padrao ?? 50),
        afiliado_recorrente_pct:       String(map["afiliado__recorrente"]?.percentual_padrao ?? 25),
        afiliado_recorrente_meses:     String(map["afiliado__recorrente"]?.regras?.meses ?? 12),
        franqueado_adesao_pct:         String(map["franqueado__adesao"]?.percentual_padrao ?? 65),
        franqueado_recorrente_pct:     String(map["franqueado__recorrente"]?.percentual_padrao ?? 10),
        franqueado_recorrente_meses:   String(map["franqueado__recorrente"]?.regras?.meses ?? 12),
        diretor_indicacao_direta_pct:  String(map["diretor_franqueado__indicacao_direta"]?.percentual_padrao ?? 15),
        diretor_indicacao_indireta_pct:String(map["diretor_franqueado__indicacao_indireta"]?.percentual_padrao ?? 10),
        diretor_recorrente_meses:      String(map["diretor_franqueado__indicacao_direta"]?.regras?.meses ?? 24),
      });
    }
    setLoading(false);
  };

  const save = async () => {
    // Validações básicas
    const nums = Object.entries(config).map(([k, v]) => ({ k, v: Number(v) }));
    for (const { k, v } of nums) {
      if (isNaN(v) || v < 0) {
        toast.error(`Valor inválido em "${k}". Use números positivos.`);
        return;
      }
    }

    setSaving(true);
    try {
      const rows = [
        {
          tipo_parceria: "afiliado",
          tipo_comissao: "adesao",
          percentual_padrao: Number(config.afiliado_adesao_pct),
          regras: { descricao: "Comissão única na adesão do indicado" },
          ativo: true,
        },
        {
          tipo_parceria: "afiliado",
          tipo_comissao: "recorrente",
          percentual_padrao: Number(config.afiliado_recorrente_pct),
          regras: {
            meses: Number(config.afiliado_recorrente_meses),
            descricao: `${config.afiliado_recorrente_pct}% por ${config.afiliado_recorrente_meses} meses sobre assinatura do indicado`,
          },
          ativo: true,
        },
        {
          tipo_parceria: "franqueado",
          tipo_comissao: "adesao",
          percentual_padrao: Number(config.franqueado_adesao_pct),
          regras: { descricao: "Comissão sobre adesão dos afiliados da rede" },
          ativo: true,
        },
        {
          tipo_parceria: "franqueado",
          tipo_comissao: "recorrente",
          percentual_padrao: Number(config.franqueado_recorrente_pct),
          regras: {
            meses: Number(config.franqueado_recorrente_meses),
            descricao: `${config.franqueado_recorrente_pct}% por ${config.franqueado_recorrente_meses} meses sobre assinaturas dos afiliados`,
          },
          ativo: true,
        },
        {
          tipo_parceria: "diretor_franqueado",
          tipo_comissao: "indicacao_direta",
          percentual_padrao: Number(config.diretor_indicacao_direta_pct),
          regras: {
            meses: Number(config.diretor_recorrente_meses),
            descricao: `${config.diretor_indicacao_direta_pct}% sobre rede de afiliados por ${config.diretor_recorrente_meses} meses`,
          },
          ativo: true,
        },
        {
          tipo_parceria: "diretor_franqueado",
          tipo_comissao: "indicacao_indireta",
          percentual_padrao: Number(config.diretor_indicacao_indireta_pct),
          regras: {
            meses: Number(config.diretor_recorrente_meses),
            descricao: `${config.diretor_indicacao_indireta_pct}% sobre rede de franqueados por ${config.diretor_recorrente_meses} meses`,
          },
          ativo: true,
        },
      ];

      const { error } = await (supabase as any)
        .from("config_comissoes")
        .upsert(rows, { onConflict: "tipo_parceria,tipo_comissao" });

      if (error) throw error;
      toast.success("Configuração de comissões salva com sucesso!");
      await load();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof RoleConfig,
    suffix: string,
    hint?: string
  ) => (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-slate-700 block">{label}</label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          max={suffix === "%" ? "100" : "999"}
          value={config[key]}
          onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
          className="h-10 w-28 text-slate-900 border-slate-200 font-bold"
        />
        <span className="text-sm font-bold text-slate-500">{suffix}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Diagrama visual da hierarquia */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
        <div className="flex items-start gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-800 mb-1">Como funciona a hierarquia de comissões:</p>
            <div className="space-y-1 text-xs">
              <p>🟠 <strong>Afiliado</strong> → indica clientes → ganha % na adesão + % recorrente por X meses sobre a assinatura do indicado</p>
              <p>🔵 <strong>Franqueado</strong> → tem afiliados abaixo → ganha % sobre adesões + % recorrente sobre assinaturas dos afiliados da sua rede</p>
              <p>🟣 <strong>Diretor</strong> → tem franqueados abaixo → ganha % sobre toda a rede (afiliados diretos + franqueados) por X meses</p>
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
              <CardDescription className="text-xs">
                Indica clientes diretamente. Ganha comissão na adesão e recorrente sobre a assinatura do indicado.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {field(
              "% na Adesão",
              "afiliado_adesao_pct",
              "%",
              "Comissão única quando o indicado assina"
            )}
            {field(
              "% Recorrente",
              "afiliado_recorrente_pct",
              "%",
              "% sobre cada mensalidade do indicado"
            )}
            {field(
              "Por quantos meses",
              "afiliado_recorrente_meses",
              "meses",
              "Duração da comissão recorrente"
            )}
          </div>
          <div className="mt-4 p-3 bg-orange-50 rounded-lg text-xs text-orange-700">
            <strong>Exemplo:</strong> Afiliado indica cliente que paga R$ 100/mês →
            recebe R$ {((Number(config.afiliado_adesao_pct) / 100) * 100).toFixed(0)} na adesão +
            R$ {((Number(config.afiliado_recorrente_pct) / 100) * 100).toFixed(0)}/mês por {config.afiliado_recorrente_meses} meses
            = R$ {(
              (Number(config.afiliado_adesao_pct) / 100) * 100 +
              (Number(config.afiliado_recorrente_pct) / 100) * 100 * Number(config.afiliado_recorrente_meses)
            ).toFixed(0)} total
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
              <CardDescription className="text-xs">
                Gerencia afiliados. Ganha sobre as adesões e assinaturas geradas pelos afiliados da sua rede.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {field(
              "% sobre Adesões dos Afiliados",
              "franqueado_adesao_pct",
              "%",
              "% sobre cada adesão gerada pelos afiliados da rede"
            )}
            {field(
              "% Recorrente sobre Afiliados",
              "franqueado_recorrente_pct",
              "%",
              "% sobre as mensalidades dos indicados dos afiliados"
            )}
            {field(
              "Por quantos meses",
              "franqueado_recorrente_meses",
              "meses",
              "Duração da comissão recorrente"
            )}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <strong>Exemplo:</strong> Franqueado tem 10 afiliados, cada um gera R$ 100/mês em assinaturas →
            recebe R$ {((Number(config.franqueado_recorrente_pct) / 100) * 100 * 10).toFixed(0)}/mês por {config.franqueado_recorrente_meses} meses
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
              <CardDescription className="text-xs">
                Topo da hierarquia. Ganha sobre toda a rede — afiliados diretos e franqueados abaixo dele.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {field(
              "% sobre Rede de Afiliados",
              "diretor_indicacao_direta_pct",
              "%",
              "% sobre assinaturas geradas pelos afiliados da rede"
            )}
            {field(
              "% sobre Rede de Franqueados",
              "diretor_indicacao_indireta_pct",
              "%",
              "% sobre assinaturas geradas pelos franqueados da rede"
            )}
            {field(
              "Por quantos meses",
              "diretor_recorrente_meses",
              "meses",
              "Duração das comissões recorrentes"
            )}
          </div>
          <div className="mt-4 p-3 bg-purple-50 rounded-lg text-xs text-purple-700">
            <strong>Exemplo:</strong> Diretor tem 5 franqueados com 10 afiliados cada, gerando R$ 100/mês →
            recebe R$ {((Number(config.diretor_indicacao_indireta_pct) / 100) * 100 * 50).toFixed(0)}/mês por {config.diretor_recorrente_meses} meses
          </div>
        </CardContent>
      </Card>

      {/* Resumo visual */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Resumo da Configuração Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <p className="text-orange-400 font-black uppercase tracking-widest mb-2">Afiliado</p>
              <p className="text-white">Adesão: <strong>{config.afiliado_adesao_pct}%</strong></p>
              <p className="text-white">Recorrente: <strong>{config.afiliado_recorrente_pct}%</strong> × <strong>{config.afiliado_recorrente_meses} meses</strong></p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-400 font-black uppercase tracking-widest mb-2">Franqueado</p>
              <p className="text-white">Adesão rede: <strong>{config.franqueado_adesao_pct}%</strong></p>
              <p className="text-white">Recorrente: <strong>{config.franqueado_recorrente_pct}%</strong> × <strong>{config.franqueado_recorrente_meses} meses</strong></p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-purple-400 font-black uppercase tracking-widest mb-2">Diretor</p>
              <p className="text-white">Afiliados: <strong>{config.diretor_indicacao_direta_pct}%</strong></p>
              <p className="text-white">Franqueados: <strong>{config.diretor_indicacao_indireta_pct}%</strong></p>
              <p className="text-white">Duração: <strong>{config.diretor_recorrente_meses} meses</strong></p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-8 rounded-xl gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar Configuração de Comissões"}
        </Button>
      </div>
    </div>
  );
}
