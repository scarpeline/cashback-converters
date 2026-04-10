/**
 * Painel para editar os textos da landing page de parceiros.
 * Salva em integration_settings e é consumido pela PartnershipPage via hook.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── Estrutura dos textos editáveis ──────────────────────────────────────────
interface LandingContent {
  // Hero
  hero_badge: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_cta: string;

  // Afiliado
  afiliado_titulo: string;
  afiliado_subtitulo: string;
  afiliado_descricao: string;
  afiliado_cta: string;

  // Franqueado
  franqueado_titulo: string;
  franqueado_subtitulo: string;
  franqueado_descricao: string;
  franqueado_cta: string;
  franqueado_badge: string;

  // Diretor
  diretor_titulo: string;
  diretor_subtitulo: string;
  diretor_descricao: string;
  diretor_cta: string;

  // Calculadora
  calc_titulo: string;
  calc_subtitulo: string;

  // Depoimentos
  dep1_nome: string;
  dep1_cargo: string;
  dep1_texto: string;
  dep2_nome: string;
  dep2_cargo: string;
  dep2_texto: string;
  dep3_nome: string;
  dep3_cargo: string;
  dep3_texto: string;

  // CTA final
  cta_titulo: string;
  cta_subtitulo: string;
  cta_botao: string;
}

const DEFAULTS: LandingContent = {
  hero_badge: "Mais de 500 parceiros ativos",
  hero_headline: "Ganhe dinheiro indicando o sistema que todo profissional precisa",
  hero_subheadline: "Seja afiliado, franqueado ou diretor. Comissões recorrentes, rede crescente, renda passiva real.",
  hero_cta: "Quero ser parceiro →",

  afiliado_titulo: "Comece Grátis",
  afiliado_subtitulo: "Afiliado",
  afiliado_descricao: "Indique clientes e receba comissões automáticas. Sem custo, sem burocracia.",
  afiliado_cta: "Começar Grátis",

  franqueado_titulo: "Escale sua Rede",
  franqueado_subtitulo: "Franqueado",
  franqueado_descricao: "Gerencie afiliados e ganhe sobre toda a produção da sua rede.",
  franqueado_cta: "Quero ser Franqueado",
  franqueado_badge: "Mais Popular",

  diretor_titulo: "Topo da Hierarquia",
  diretor_subtitulo: "Diretor",
  diretor_descricao: "Lidere franqueados e afiliados. Ganhe sobre toda a rede abaixo de você.",
  diretor_cta: "Quero ser Diretor",

  calc_titulo: "Quanto você pode ganhar?",
  calc_subtitulo: "Arraste os sliders e veja o potencial em tempo real",

  dep1_nome: "Carlos M.",
  dep1_cargo: "Afiliado",
  dep1_texto: "Comecei indicando 3 barbearias do meu bairro. Em 2 meses já estava recebendo mais de R$ 800 por mês sem fazer nada extra.",
  dep2_nome: "Fernanda L.",
  dep2_cargo: "Franqueada",
  dep2_texto: "Montei uma rede de 12 afiliados em 4 meses. O dashboard me mostra tudo em tempo real. Melhor investimento que fiz.",
  dep3_nome: "Ricardo T.",
  dep3_cargo: "Diretor",
  dep3_texto: "Com 5 franqueados e mais de 60 afiliados na rede, minha renda passiva já supera meu salário anterior. Incrível.",

  cta_titulo: "Pronto para começar?",
  cta_subtitulo: "Crie sua conta grátis agora e comece a ganhar comissões ainda esta semana.",
  cta_botao: "Criar conta grátis →",
};

const SERVICE_NAME = "partner_landing_content";

// ─── Hook para consumir na landing page ──────────────────────────────────────
export async function fetchPartnerLandingContent(): Promise<LandingContent> {
  const { data } = await (supabase as any)
    .from("integration_settings")
    .select("base_url")
    .eq("service_name", SERVICE_NAME)
    .maybeSingle();
  if (data?.base_url) {
    try { return { ...DEFAULTS, ...JSON.parse(data.base_url) }; } catch { /* fallback */ }
  }
  return DEFAULTS;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function PartnerLandingContentPanel() {
  const [content, setContent] = useState<LandingContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPartnerLandingContent().then(c => { setContent(c); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any).from("integration_settings").upsert(
      { service_name: SERVICE_NAME, environment: "production", is_active: true, base_url: JSON.stringify(content) },
      { onConflict: "service_name,environment" }
    );
    setSaving(false);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Textos da landing page salvos!");
  };

  const reset = () => { setContent(DEFAULTS); toast.info("Textos restaurados para o padrão. Clique em Salvar para confirmar."); };

  const f = (label: string, key: keyof LandingContent, multiline = false) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{label}</label>
      {multiline ? (
        <textarea
          value={content[key]}
          onChange={e => setContent(c => ({ ...c, [key]: e.target.value }))}
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400"
        />
      ) : (
        <Input
          value={content[key]}
          onChange={e => setContent(c => ({ ...c, [key]: e.target.value }))}
          className="h-10 text-slate-900 border-slate-200"
        />
      )}
    </div>
  );

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Edite os textos exibidos na landing page de parceiros. As alterações refletem imediatamente após salvar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Restaurar padrão
          </Button>
          <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar Textos"}
          </Button>
        </div>
      </div>

      {/* Hero */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🚀 Seção Hero</CardTitle>
          <CardDescription className="text-xs">Primeira seção da página — o que o visitante vê primeiro</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {f("Badge (ex: '500 parceiros ativos')", "hero_badge")}
          {f("Botão CTA", "hero_cta")}
          {f("Headline principal", "hero_headline", true)}
          {f("Subtítulo", "hero_subheadline", true)}
        </CardContent>
      </Card>

      {/* Afiliado */}
      <Card className="border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">🟠 Card Afiliado</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {f("Rótulo (ex: 'Afiliado')", "afiliado_subtitulo")}
          {f("Título do card", "afiliado_titulo")}
          {f("Botão CTA", "afiliado_cta")}
          {f("Descrição", "afiliado_descricao", true)}
        </CardContent>
      </Card>

      {/* Franqueado */}
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">🔵 Card Franqueado</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {f("Rótulo (ex: 'Franqueado')", "franqueado_subtitulo")}
          {f("Título do card", "franqueado_titulo")}
          {f("Badge destaque (ex: 'Mais Popular')", "franqueado_badge")}
          {f("Botão CTA", "franqueado_cta")}
          {f("Descrição", "franqueado_descricao", true)}
        </CardContent>
      </Card>

      {/* Diretor */}
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">🟣 Card Diretor</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {f("Rótulo (ex: 'Diretor')", "diretor_subtitulo")}
          {f("Título do card", "diretor_titulo")}
          {f("Botão CTA", "diretor_cta")}
          {f("Descrição", "diretor_descricao", true)}
        </CardContent>
      </Card>

      {/* Calculadora */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🧮 Seção Calculadora</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {f("Título", "calc_titulo")}
          {f("Subtítulo", "calc_subtitulo")}
        </CardContent>
      </Card>

      {/* Depoimentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">💬 Depoimentos</CardTitle>
          <CardDescription className="text-xs">3 depoimentos exibidos na seção de prova social</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {([1, 2, 3] as const).map(n => (
            <div key={n} className="p-4 bg-slate-50 rounded-xl space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Depoimento {n}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {f(`Nome`, `dep${n}_nome` as keyof LandingContent)}
                {f(`Cargo/Papel`, `dep${n}_cargo` as keyof LandingContent)}
              </div>
              {f(`Texto do depoimento`, `dep${n}_texto` as keyof LandingContent, true)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CTA Final */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🎯 CTA Final</CardTitle>
          <CardDescription className="text-xs">Última seção da página</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {f("Título", "cta_titulo")}
          {f("Botão", "cta_botao")}
          {f("Subtítulo", "cta_subtitulo", true)}
        </CardContent>
      </Card>

      {/* Botão salvar no final também */}
      <div className="flex justify-end pt-2">
        <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-8 gap-2 font-bold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar Todos os Textos"}
        </Button>
      </div>
    </div>
  );
}

export type { LandingContent };
export { DEFAULTS as PARTNER_LANDING_DEFAULTS, SERVICE_NAME as PARTNER_LANDING_SERVICE };
