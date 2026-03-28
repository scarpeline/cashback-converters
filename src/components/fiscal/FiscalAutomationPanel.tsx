import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Calculator, TrendingUp, AlertTriangle, FileText, CheckSquare,
  Calendar, BarChart3, Shield, RefreshCw, Download, DollarSign,
  ArrowRightLeft, Target, Loader2, ChevronRight, Clock, Check, X
} from "lucide-react";
import { toast } from "sonner";

// ===== TIPOS =====

interface MonthlyRevenue {
  id: string;
  barbershop_id: string;
  year_month: string;
  services_revenue: number;
  products_revenue: number;
  gross_revenue: number;
  services_count: number;
  payments_count: number;
  calculated_at: string;
}

interface Tax {
  id: string;
  barbershop_id: string;
  year_month: string;
  tax_regime: string;
  gross_revenue: number;
  tax_type: string;
  tax_rate: number;
  tax_amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

interface FiscalAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

interface FiscalChecklistItem {
  id: string;
  year_month: string;
  check_type: string;
  title: string;
  is_completed: boolean;
  auto_checked: boolean;
}

interface FiscalScore {
  score: number;
  breakdown: Record<string, number>;
  year_month: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  due_day: number | null;
  due_month: number | null;
  tax_regimes: string[];
}

interface SimulationResult {
  tax_type: string;
  tax_rate: number;
  tax_amount: number;
}

// ===== TABS =====

const FISCAL_TABS = [
  { key: "resumo", label: "Resumo", icon: BarChart3 },
  { key: "faturamento", label: "Faturamento", icon: DollarSign },
  { key: "impostos", label: "Impostos", icon: Calculator },
  { key: "alertas", label: "Alertas", icon: AlertTriangle },
  { key: "checklist", label: "Checklist", icon: CheckSquare },
  { key: "calendario", label: "Calendário", icon: Calendar },
  { key: "simulador", label: "Simulador", icon: ArrowRightLeft },
  { key: "relatorios", label: "Relatórios", icon: FileText },
];

// ===== HELPERS =====

const currentYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const formatDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("pt-BR");

const severityColor = (s: string) => {
  if (s === "critical") return "bg-destructive/10 text-destructive border-destructive/30";
  if (s === "warning") return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30";
  return "bg-blue-500/10 text-blue-700 border-blue-500/30";
};

const taxStatusLabel: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

const taxStatusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};

const regimeLabels: Record<string, string> = {
  mei: "MEI",
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
};

// ===== COMPONENTE PRINCIPAL =====

interface FiscalAutomationPanelProps {
  barbershopId: string;
  mode?: "owner" | "accountant";
}

export function FiscalAutomationPanel({ barbershopId, mode = "owner" }: FiscalAutomationPanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState("resumo");
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [loading, setLoading] = useState(false);

  // Estado do resumo
  const [revenue, setRevenue] = useState<MonthlyRevenue | null>(null);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [alerts, setAlerts] = useState<FiscalAlert[]>([]);
  const [checklist, setChecklist] = useState<FiscalChecklistItem[]>([]);
  const [score, setScore] = useState<FiscalScore | null>(null);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [barbershopRegime, setBarbershopRegime] = useState("mei");

  // Simulador
  const [simRegime, setSimRegime] = useState("simples_nacional");
  const [simResults, setSimResults] = useState<SimulationResult[]>([]);
  const [simLoading, setSimLoading] = useState(false);

  // ===== FETCH DATA =====

  const db = supabase as any;

  const fetchRevenue = useCallback(async () => {
    const { data } = await db
      .from("monthly_revenue")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("year_month", yearMonth)
      .maybeSingle();
    setRevenue(data || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershopId, yearMonth]);

  const fetchTaxes = useCallback(async () => {
    const { data } = await db
      .from("taxes")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("year_month", yearMonth)
      .order("due_date", { ascending: true });
    setTaxes(data || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershopId, yearMonth]);

  const fetchAlerts = useCallback(async () => {
    const { data } = await db
      .from("fiscal_alerts")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(20);
    setAlerts(data || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershopId]);

  const fetchChecklist = useCallback(async () => {
    const { data } = await db
      .from("fiscal_checklist_items")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("year_month", yearMonth)
      .order("created_at", { ascending: true });
    setChecklist(data || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershopId, yearMonth]);

  const fetchScore = useCallback(async () => {
    const { data } = await db
      .from("fiscal_scores")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("year_month", yearMonth)
      .maybeSingle();
    setScore(data || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershopId, yearMonth]);

  const fetchCalendar = useCallback(async () => {
    const { data } = await db
      .from("fiscal_calendar")
      .select("*")
      .eq("is_active", true)
      .order("due_day", { ascending: true });
    setCalendar(data || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBarbershopRegime = useCallback(async () => {
    const { data } = await db
      .from("barbershops")
      .select("tax_regime")
      .eq("id", barbershopId)
      .maybeSingle();
    setBarbershopRegime(data?.tax_regime || "mei");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershopId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchRevenue(), fetchTaxes(), fetchAlerts(),
      fetchChecklist(), fetchScore(), fetchCalendar(),
      fetchBarbershopRegime()
    ]);
    setLoading(false);
  }, [fetchRevenue, fetchTaxes, fetchAlerts, fetchChecklist, fetchScore, fetchCalendar, fetchBarbershopRegime]);

  useEffect(() => { if (barbershopId) fetchAll(); }, [barbershopId, yearMonth, fetchAll]);

  // ===== AÇÕES =====

  const calcularFaturamento = async () => {
    setLoading(true);
    const { error } = await db.rpc("calculate_monthly_revenue", {
      _barbershop_id: barbershopId,
      _year_month: yearMonth,
    });
    if (error) { toast.error("Erro ao calcular faturamento: " + error.message); }
    else { toast.success("Faturamento calculado!"); }
    await fetchRevenue();
    setLoading(false);
  };

  const calcularImpostos = async () => {
    setLoading(true);
    const { error } = await db.rpc("calculate_monthly_taxes", {
      _barbershop_id: barbershopId,
      _year_month: yearMonth,
    });
    if (error) { toast.error("Erro ao calcular impostos: " + error.message); }
    else { toast.success("Impostos calculados!"); }
    await fetchTaxes();
    setLoading(false);
  };

  const gerarChecklist = async () => {
    setLoading(true);
    const { error } = await db.rpc("generate_fiscal_checklist", {
      _barbershop_id: barbershopId,
      _year_month: yearMonth,
    });
    if (error) { toast.error("Erro: " + error.message); }
    else { toast.success("Checklist gerado!"); }
    await fetchChecklist();
    setLoading(false);
  };

  const calcularScore = async () => {
    setLoading(true);
    const { error } = await db.rpc("calculate_fiscal_score", {
      _barbershop_id: barbershopId,
      _year_month: yearMonth,
    });
    if (error) { toast.error("Erro: " + error.message); }
    else { toast.success("Score calculado!"); }
    await fetchScore();
    setLoading(false);
  };

  const marcarImpostoPago = async (taxId: string) => {
    const { error } = await db
      .from("taxes")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", taxId);
    if (error) toast.error(error.message);
    else { toast.success("Imposto marcado como pago!"); fetchTaxes(); }
  };

  const toggleChecklistItem = async (item: FiscalChecklistItem) => {
    const { error } = await db
      .from("fiscal_checklist_items")
      .update({
        is_completed: !item.is_completed,
        completed_at: !item.is_completed ? new Date().toISOString() : null,
        completed_by: !item.is_completed ? user?.id : null,
      })
      .eq("id", item.id);
    if (error) toast.error(error.message);
    else fetchChecklist();
  };

  const dismissAlert = async (alertId: string) => {
    await db.from("fiscal_alerts").update({ is_dismissed: true }).eq("id", alertId);
    fetchAlerts();
  };

  const simularRegime = async () => {
    setSimLoading(true);
    const { data, error } = await db.rpc("simulate_tax_regime", {
      _barbershop_id: barbershopId,
      _year_month: yearMonth,
      _target_regime: simRegime,
    });
    setSimLoading(false);
    if (error) { toast.error(error.message); return; }
    setSimResults(data || []);
  };

  const executarTudo = async () => {
    setLoading(true);
    toast.info("Executando automação completa...");
    await calcularFaturamento();
    await calcularImpostos();
    await gerarChecklist();
    await calcularScore();
    await fetchAlerts();
    toast.success("Automação concluída!");
    setLoading(false);
  };

  const exportarRelatorio = () => {
    const lines: string[] = [];
    lines.push("RELATÓRIO FISCAL - " + yearMonth);
    lines.push("=".repeat(40));
    lines.push("");
    if (revenue) {
      lines.push("FATURAMENTO");
      lines.push(`  Serviços: ${formatCurrency(revenue.services_revenue)}`);
      lines.push(`  Total Bruto: ${formatCurrency(revenue.gross_revenue)}`);
      lines.push(`  Qtd Serviços: ${revenue.services_count}`);
      lines.push("");
    }
    lines.push("IMPOSTOS");
    taxes.forEach(t => {
      lines.push(`  ${t.tax_type.toUpperCase()} - ${formatCurrency(t.tax_amount)} - ${taxStatusLabel[t.status] || t.status} - Venc: ${formatDate(t.due_date)}`);
    });
    lines.push("");
    lines.push("SCORE FISCAL: " + (score?.score ?? "N/A") + "/100");
    lines.push("");
    lines.push("CHECKLIST");
    checklist.forEach(c => {
      lines.push(`  [${c.is_completed ? "X" : " "}] ${c.title}`);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-fiscal-${yearMonth}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  // ===== SCORE VISUAL =====
  const scoreColor = (s: number) => {
    if (s >= 80) return "text-green-600";
    if (s >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  // Total de impostos do mês
  const totalTaxes = taxes.reduce((a, t) => a + t.tax_amount, 0);
  const pendingTaxes = taxes.filter(t => t.status === "pending" || t.status === "overdue");
  const unreadAlerts = alerts.filter(a => !a.is_read);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6" /> Automação Fiscal
          </h1>
          <p className="text-muted-foreground text-sm">Impostos, faturamento e checklist fiscal automatizados</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={yearMonth}
            onChange={e => setYearMonth(e.target.value)}
            className="w-40"
          />
          <Button variant="gold" onClick={executarTudo} disabled={loading} size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Executar Tudo
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        {FISCAL_TABS.map(t => (
          <Button
            key={t.key}
            variant={tab === t.key ? "gold" : "ghost"}
            size="sm"
            onClick={() => setTab(t.key)}
            className="gap-1"
          >
            <t.icon className="w-4 h-4" />{t.label}
            {t.key === "alertas" && unreadAlerts.length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground rounded-full text-[10px] w-5 h-5 flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* ===== TAB: RESUMO ===== */}
      {tab === "resumo" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Faturamento Bruto</p>
                <p className="text-2xl font-bold">{revenue ? formatCurrency(revenue.gross_revenue) : "—"}</p>
                <p className="text-xs text-muted-foreground">{revenue?.services_count || 0} serviços</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total de Impostos</p>
                <p className="text-2xl font-bold">{formatCurrency(totalTaxes)}</p>
                <p className="text-xs text-muted-foreground">{pendingTaxes.length} pendentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Score Fiscal</p>
                <p className={`text-2xl font-bold ${scoreColor(score?.score ?? 0)}`}>
                  {score?.score ?? "—"}/100
                </p>
                <p className="text-xs text-muted-foreground">Regime: {regimeLabels[barbershopRegime] || barbershopRegime}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Alertas Ativos</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
                <p className="text-xs text-muted-foreground">{unreadAlerts.length} não lidos</p>
              </CardContent>
            </Card>
          </div>

          {/* Previsão próximo mês */}
          {revenue && revenue.gross_revenue > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Previsão Próximo Mês</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Com base no faturamento atual de {formatCurrency(revenue.gross_revenue)}, a estimativa de imposto
                  para o próximo mês é de aproximadamente {formatCurrency(totalTaxes)}.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Checklist resumo */}
          {checklist.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Checklist do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {checklist.map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <button onClick={() => toggleChecklistItem(c)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${c.is_completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                        {c.is_completed && <Check className="w-3 h-3" />}
                      </button>
                      <span className={`text-sm ${c.is_completed ? "line-through text-muted-foreground" : ""}`}>{c.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== TAB: FATURAMENTO ===== */}
      {tab === "faturamento" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento Mensal — {yearMonth}</CardTitle>
              <CardDescription>Calculado automaticamente a partir dos pagamentos concluídos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="gold" onClick={calcularFaturamento} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Calcular Faturamento
              </Button>

              {revenue ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">Receita de Serviços</p>
                    <p className="text-xl font-bold">{formatCurrency(revenue.services_revenue)}</p>
                    <p className="text-xs text-muted-foreground">{revenue.services_count} serviços</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">Receita de Produtos</p>
                    <p className="text-xl font-bold">{formatCurrency(revenue.products_revenue)}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <p className="text-sm text-muted-foreground">Faturamento Bruto</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(revenue.gross_revenue)}</p>
                    <p className="text-xs text-muted-foreground">Calculado em {new Date(revenue.calculated_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm py-4">Nenhum faturamento calculado para {yearMonth}. Clique em "Calcular Faturamento".</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB: IMPOSTOS ===== */}
      {tab === "impostos" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impostos — {yearMonth}</CardTitle>
              <CardDescription>Regime: {regimeLabels[barbershopRegime] || barbershopRegime}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="gold" onClick={calcularImpostos} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
                  Calcular Impostos
                </Button>
              </div>

              {taxes.length > 0 ? (
                <div className="space-y-3">
                  {taxes.map(t => (
                    <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t.tax_type.replace("_", " ").toUpperCase()}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${taxStatusColor[t.status] || "bg-gray-100"}`}>
                            {taxStatusLabel[t.status] || t.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Alíquota: {(t.tax_rate * 100).toFixed(2)}% • Vencimento: {formatDate(t.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">{formatCurrency(t.tax_amount)}</span>
                        {(t.status === "pending" || t.status === "overdue") && (
                          <Button size="sm" variant="outline" onClick={() => marcarImpostoPago(t.id)}>
                            <Check className="w-4 h-4 mr-1" /> Pago
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                    <span className="font-semibold">Total de Impostos</span>
                    <span className="text-lg font-bold">{formatCurrency(totalTaxes)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm py-4">Nenhum imposto calculado. Calcule o faturamento primeiro.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB: ALERTAS ===== */}
      {tab === "alertas" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Fiscais</CardTitle>
              <CardDescription>Alertas automáticos sobre vencimentos, documentos e riscos</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum alerta ativo. Tudo em ordem!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(a => (
                    <div key={a.id} className={`flex items-start justify-between gap-3 p-4 rounded-lg border ${severityColor(a.severity)}`}>
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs mt-1 opacity-80">{a.message}</p>
                        <p className="text-[10px] mt-1 opacity-50">{new Date(a.created_at).toLocaleString("pt-BR")}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => dismissAlert(a.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB: CHECKLIST ===== */}
      {tab === "checklist" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checklist Fiscal — {yearMonth}</CardTitle>
              <CardDescription>Tarefas obrigatórias do mês</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="gold" onClick={gerarChecklist} disabled={loading} size="sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckSquare className="w-4 h-4 mr-2" />}
                Gerar Checklist
              </Button>

              {checklist.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">Nenhum item no checklist. Clique em "Gerar Checklist".</p>
              ) : (
                <div className="space-y-2">
                  {checklist.map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleChecklistItem(c)} className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${c.is_completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 hover:border-primary"}`}>
                          {c.is_completed && <Check className="w-4 h-4" />}
                        </button>
                        <span className={`text-sm ${c.is_completed ? "line-through text-muted-foreground" : "font-medium"}`}>{c.title}</span>
                      </div>
                      {c.is_completed && <span className="text-xs text-muted-foreground">Concluído</span>}
                    </div>
                  ))}
                  <div className="pt-2 text-sm text-muted-foreground">
                    {checklist.filter(c => c.is_completed).length}/{checklist.length} concluídos
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score */}
          <Card>
            <CardHeader>
              <CardTitle>Score Fiscal</CardTitle>
              <CardDescription>Pontuação baseada em organização fiscal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="gold" onClick={calcularScore} disabled={loading} size="sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                Calcular Score
              </Button>

              {score ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className={`text-5xl font-bold ${scoreColor(score.score)}`}>{score.score}</p>
                    <p className="text-sm text-muted-foreground">de 100 pontos</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(score.breakdown).map(([key, val]) => (
                      <div key={key} className="p-3 rounded border border-border text-center">
                        <p className="text-xs text-muted-foreground capitalize">{key.replace("_", " ")}</p>
                        <p className="text-lg font-semibold">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Calcule o score para ver sua pontuação fiscal.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB: CALENDÁRIO ===== */}
      {tab === "calendario" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendário Fiscal</CardTitle>
              <CardDescription>Datas de vencimento e prazos fiscais para regime {regimeLabels[barbershopRegime] || barbershopRegime}</CardDescription>
            </CardHeader>
            <CardContent>
              {calendar.filter(c => c.tax_regimes.includes(barbershopRegime)).length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">Nenhum evento fiscal para o regime atual.</p>
              ) : (
                <div className="space-y-3">
                  {calendar.filter(c => c.tax_regimes.includes(barbershopRegime)).map(c => (
                    <div key={c.id} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Vencimento: Dia {c.due_day || "—"}
                          {c.due_month ? ` / Mês ${c.due_month}` : " (todo mês)"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB: SIMULADOR ===== */}
      {tab === "simulador" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulador de Regime Tributário</CardTitle>
              <CardDescription>Simule quanto pagaria em outro regime usando o faturamento de {yearMonth}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Regime para simular</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={simRegime}
                    onChange={e => setSimRegime(e.target.value)}
                  >
                    <option value="mei">MEI</option>
                    <option value="simples_nacional">Simples Nacional</option>
                    <option value="lucro_presumido">Lucro Presumido</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button variant="gold" onClick={simularRegime} disabled={simLoading}>
                    {simLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
                    Simular
                  </Button>
                </div>
              </div>

              {revenue && (
                <p className="text-sm text-muted-foreground">
                  Faturamento base: {formatCurrency(revenue.gross_revenue)} ({yearMonth})
                </p>
              )}

              {simResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Resultado — {regimeLabels[simRegime] || simRegime}</h3>
                  {simResults.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <span className="font-medium text-sm">{r.tax_type.replace("_", " ").toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground ml-2">({(r.tax_rate * 100).toFixed(2)}%)</span>
                      </div>
                      <span className="font-bold">{formatCurrency(r.tax_amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="font-semibold">Total Simulado</span>
                    <span className="text-lg font-bold">{formatCurrency(simResults.reduce((a, r) => a + r.tax_amount, 0))}</span>
                  </div>

                  {/* Comparação */}
                  {totalTaxes > 0 && (
                    <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                      <p className="text-sm">
                        <strong>Comparação:</strong> Regime atual ({regimeLabels[barbershopRegime]}): {formatCurrency(totalTaxes)}
                        → Simulado ({regimeLabels[simRegime]}): {formatCurrency(simResults.reduce((a, r) => a + r.tax_amount, 0))}
                      </p>
                      {(() => {
                        const diff = totalTaxes - simResults.reduce((a, r) => a + r.tax_amount, 0);
                        if (diff > 0) return <p className="text-sm text-green-600 font-medium mt-1">Economia de {formatCurrency(diff)} com {regimeLabels[simRegime]}</p>;
                        if (diff < 0) return <p className="text-sm text-red-600 font-medium mt-1">Custo adicional de {formatCurrency(Math.abs(diff))} com {regimeLabels[simRegime]}</p>;
                        return <p className="text-sm text-muted-foreground mt-1">Valores iguais</p>;
                      })()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Simulador em tempo real */}
          <Card>
            <CardHeader>
              <CardTitle>Simulador em Tempo Real</CardTitle>
              <CardDescription>Veja o imposto estimado conforme digita um faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <RealtimeTaxSimulator regime={barbershopRegime} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB: RELATÓRIOS ===== */}
      {tab === "relatorios" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Fiscais</CardTitle>
              <CardDescription>Exporte relatórios do período selecionado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="gold" onClick={exportarRelatorio}>
                <Download className="w-4 h-4 mr-2" /> Exportar Relatório ({yearMonth})
              </Button>

              {revenue && (
                <div className="p-4 rounded-lg border border-border space-y-3">
                  <h3 className="font-semibold">Resumo do Período</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Faturamento:</span> <strong>{formatCurrency(revenue.gross_revenue)}</strong></div>
                    <div><span className="text-muted-foreground">Serviços:</span> <strong>{revenue.services_count}</strong></div>
                    <div><span className="text-muted-foreground">Total Impostos:</span> <strong>{formatCurrency(totalTaxes)}</strong></div>
                    <div><span className="text-muted-foreground">Impostos Pagos:</span> <strong>{taxes.filter(t => t.status === "paid").length}/{taxes.length}</strong></div>
                    <div><span className="text-muted-foreground">Score:</span> <strong className={scoreColor(score?.score ?? 0)}>{score?.score ?? "—"}/100</strong></div>
                    <div><span className="text-muted-foreground">Checklist:</span> <strong>{checklist.filter(c => c.is_completed).length}/{checklist.length}</strong></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ===== SUB-COMPONENTE: Simulador em tempo real =====

function RealtimeTaxSimulator({ regime }: { regime: string }) {
  const [revenue, setRevenue] = useState("");
  const amount = Number(revenue) || 0;

  const calculate = () => {
    if (amount <= 0) return [];
    const results: { label: string; rate: number; value: number }[] = [];

    if (regime === "mei") {
      results.push({ label: "DAS MEI", rate: amount > 0 ? 75.9 / amount : 0, value: 75.9 });
    } else if (regime === "simples_nacional") {
      let rate = 0.06;
      if (amount > 72000) rate = 0.16;
      else if (amount > 30000) rate = 0.135;
      else if (amount > 15000) rate = 0.112;
      results.push({ label: "DAS Simples", rate, value: Math.round(amount * rate * 100) / 100 });
      results.push({ label: "ISS", rate: 0.05, value: Math.round(amount * 0.05 * 100) / 100 });
    } else if (regime === "lucro_presumido") {
      results.push({ label: "IRPJ", rate: 0.048, value: Math.round(amount * 0.048 * 100) / 100 });
      results.push({ label: "CSLL", rate: 0.0288, value: Math.round(amount * 0.0288 * 100) / 100 });
      results.push({ label: "PIS", rate: 0.0065, value: Math.round(amount * 0.0065 * 100) / 100 });
      results.push({ label: "COFINS", rate: 0.03, value: Math.round(amount * 0.03 * 100) / 100 });
      results.push({ label: "ISS", rate: 0.05, value: Math.round(amount * 0.05 * 100) / 100 });
    }
    return results;
  };

  const results = calculate();
  const total = results.reduce((a, r) => a + r.value, 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Faturamento hipotético (R$)</Label>
        <Input
          type="number"
          placeholder="0,00"
          value={revenue}
          onChange={e => setRevenue(e.target.value)}
        />
      </div>
      {amount > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className="flex justify-between text-sm p-2 rounded border border-border">
              <span>{r.label} <span className="text-muted-foreground">({(r.rate * 100).toFixed(2)}%)</span></span>
              <span className="font-medium">{formatCurrency(r.value)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold p-2 rounded bg-muted/50">
            <span>Total Estimado</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Líquido estimado: {formatCurrency(amount - total)} ({((1 - total / amount) * 100).toFixed(1)}% do faturamento)
          </p>
        </div>
      )}
    </div>
  );
}
