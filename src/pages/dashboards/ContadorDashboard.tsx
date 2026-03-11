import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  LayoutDashboard, Building2, FileText, DollarSign, User, LogOut, Menu, X, Calculator,
  Loader2, CreditCard, ClipboardList, CheckCircle, Clock, AlertCircle, BarChart3
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { formatCpfCnpjBR } from "@/lib/input-masks";
import { AccountingDocumentsPanel } from "@/components/shared/AccountingDocumentsPanel";
import { AccountingLinksPanel } from "@/components/shared/AccountingLinksPanel";
import { AccountingTaxesPanel } from "@/components/shared/AccountingTaxesPanel";
import { AccountingMessagesPanel } from "@/components/shared/AccountingMessagesPanel";
import { FiscalAutomationPanel } from "@/components/fiscal/FiscalAutomationPanel";

const ContadorDashboard = () => {
  const { profile, user, signOut, roles } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountantVerified, setAccountantVerified] = useState<boolean | null>(null);

  // Verify the user is actually a registered, active contador
  useEffect(() => {
    if (!user) return;
    supabase.rpc("is_authorized_contador", { _user_id: user.id }).then(({ data }) => {
      setAccountantVerified(!!data);
    });
  }, [user]);

  // If verified as NOT a contador, show access denied
  if (accountantVerified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Sua conta não está registrada como contador ativo no sistema. 
              Contadores são cadastrados exclusivamente pelo administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="gold" onClick={signOut}>Sair</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state while verifying
  if (accountantVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Verificando registro de contador...</p>
        </div>
      </div>
    );
  }

  const basePath = "/contador2026";
  
  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Serviços e Valores", href: `${basePath}/servicos`, icon: DollarSign },
    { name: "Pedidos de Serviço", href: `${basePath}/pedidos`, icon: ClipboardList },
    { name: "Automação Fiscal", href: `${basePath}/automacao-fiscal`, icon: BarChart3 },
    { name: "Empresas", href: `${basePath}/empresas`, icon: Building2 },
    { name: "Vínculos", href: `${basePath}/vinculos`, icon: Building2 },
    { name: "Impostos & Guias", href: `${basePath}/impostos-guias`, icon: FileText },
    { name: "Mensagens", href: `${basePath}/mensagens`, icon: FileText },
    { name: "Declarações", href: `${basePath}/declaracoes`, icon: FileText },
    { name: "Meus Ganhos", href: `${basePath}/ganhos`, icon: DollarSign },
    { name: "Conta Bancária", href: `${basePath}/conta-bancaria`, icon: CreditCard },
    { name: "Meu Perfil", href: `${basePath}/perfil`, icon: User },
  ];

  const isActive = (href: string) => {
    if (href === basePath) return location.pathname === basePath || location.pathname === `${basePath}/`;
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <Link to={basePath} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Calculator className="w-5 h-5 text-primary" /></div>
              <span className="font-display font-bold text-lg text-sidebar-foreground">Contador</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground/60" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 border-b border-sidebar-border">
            <p className="font-medium truncate text-sidebar-foreground">{profile?.name || "Contador"}</p>
            <p className="text-sm text-sidebar-foreground/60 truncate">{profile?.email}</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"}`}>
                <item.icon className="w-5 h-5" />{item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={signOut}><LogOut className="w-5 h-5" />Sair</Button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="servicos" element={<ServicosContabeisPage />} />
            <Route path="pedidos" element={<PedidosServicoPage />} />
            <Route path="automacao-fiscal" element={<AutomacaoFiscalContadorPage />} />
            <Route path="empresas" element={<EmpresasPage />} />
            <Route path="vinculos" element={<AccountingLinksPanel mode="accountant" />} />
            <Route path="impostos-guias" element={<AccountingTaxesPanel mode="accountant" />} />
            <Route path="mensagens" element={<AccountingMessagesPanel mode="accountant" />} />
            <Route path="declaracoes" element={<DeclaracoesPage />} />
            <Route path="ganhos" element={<GanhosPage />} />
            <Route path="conta-bancaria" element={<ContaBancariaPage />} />
            <Route path="perfil" element={<PerfilPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ companies: 0, pendingRequests: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("accountants").select("id").eq("user_id", user.id).maybeSingle(),
    ]).then(async ([acc]) => {
      if (!acc.data?.id) { setLoading(false); return; }
      const accId = acc.data.id;
      const [companies, requests, fiscal] = await Promise.all([
        supabase.from("fiscal_records").select("entity_user_id").eq("accountant_id", accId),
        supabase.from("fiscal_service_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("fiscal_records").select("amount").eq("accountant_id", accId).eq("status", "completed"),
      ]);
      const uniqueCompanies = new Set(companies.data?.map((c: any) => c.entity_user_id) || []).size;
      const totalEarnings = (fiscal.data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      setStats({ companies: uniqueCompanies, pendingRequests: requests.count || 0, totalEarnings });
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold">Portal do Contador</h1><p className="text-muted-foreground">Gerencie empresas, declarações e pedidos de serviço</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Empresas Vinculadas</CardDescription><CardTitle className="text-2xl">{loading ? "..." : stats.companies}</CardTitle></CardHeader></Card>
        <Card className={stats.pendingRequests > 0 ? "border-primary/30 bg-primary/5" : ""}>
          <CardHeader className="pb-2"><CardDescription>Pedidos Pendentes</CardDescription><CardTitle className="text-2xl">{loading ? "..." : stats.pendingRequests}</CardTitle></CardHeader>
        </Card>
        <Card className="bg-gradient-card border-primary/20"><CardHeader className="pb-2"><CardDescription>Ganhos do Mês</CardDescription><CardTitle className="text-2xl text-gradient-gold">R$ {stats.totalEarnings.toFixed(2)}</CardTitle></CardHeader></Card>
      </div>
      <Card><CardHeader><CardTitle>Atividades Recentes</CardTitle></CardHeader>
        <CardContent className="text-center py-8"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma atividade recente.</p></CardContent>
      </Card>
    </div>
  );
};

// ============ SERVIÇOS E VALORES ============
type FiscalServiceTypeStatus = "pending" | "approved" | "rejected";
type FiscalServiceRequiredField = {
  key: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "select" | "textarea";
  options?: Array<{ value: string; label: string }>;
};
type FiscalServiceType = {
  id: string;
  service_type: string;
  label: string;
  description: string | null;
  price: number;
  required_fields: FiscalServiceRequiredField[] | null;
  status: FiscalServiceTypeStatus;
  proposed_price: number | null;
  proposed_required_fields: FiscalServiceRequiredField[] | null;
  proposed_description: string | null;
};

const ServicosContabeisPage = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<FiscalServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    const { data } = await db.from("fiscal_service_types").select("*").order("service_type");
    setServices((data || []) as unknown as FiscalServiceType[]);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  const proposeChange = async () => {
    if (!editing || !user) return;
    let parsedRf: any[] = [];
    try {
      parsedRf = typeof editing.required_fields === "string" 
        ? JSON.parse(editing.required_fields || "[]") 
        : (editing.required_fields || []);
      if (!Array.isArray(parsedRf)) parsedRf = [];
    } catch {
      toast.error("Campos requerentes: JSON inválido.");
      return;
    }
    setSaving(true);
    const { error } = await db.from("fiscal_service_types").update({
      status: "pending",
      proposed_price: Number(editing.price),
      proposed_required_fields: parsedRf,
      proposed_description: (editing.description || "").trim() || null,
      proposed_by: user.id,
      proposed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", String(editing.id));
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Alteração enviada para aprovação do Super Admin.");
    setEditing(null);
    fetchServices();
  };

  const serviceLabels: Record<string, string> = {
    cnpj_opening: "Abertura de CNPJ",
    mei_declaration: "Declaração MEI",
    me_declaration: "Declaração ME",
    income_tax: "Imposto de Renda",
    cnpj_migration: "Migração CPF→CNPJ",
    cnpj_closing: "Encerramento de CNPJ",
    other: "Outro",
  };

  const createService = async () => {
    if (!user) return;
    if (!editing?.service_type?.trim()) { toast.error("Informe o código do serviço (service_type)."); return; }
    if (!editing?.label?.trim()) { toast.error("Informe o nome do serviço (label)."); return; }
    let parsedRf: any[] = [];
    try {
      parsedRf = typeof editing.required_fields === "string"
        ? JSON.parse(editing.required_fields || "[]")
        : (editing.required_fields || []);
      if (!Array.isArray(parsedRf)) parsedRf = [];
    } catch {
      toast.error("Campos requerentes: JSON inválido.");
      return;
    }
    setSaving(true);
    const payload = {
      service_type: String(editing.service_type).trim(),
      label: String(editing.label).trim(),
      price: 0,
      required_fields: [],
      description: null,
      status: "pending",
      proposed_price: Number(editing.price || 0),
      proposed_required_fields: parsedRf,
      proposed_description: (editing.description || "").trim() || null,
      proposed_by: user.id,
      proposed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("fiscal_service_types").insert(payload as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Novo serviço enviado para aprovação do Super Admin.");
    setCreating(false);
    setEditing(null);
    fetchServices();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Serviços e Valores</h1>
          <p className="text-muted-foreground text-sm">Configure preço e dados requerentes. Alterações exigem aprovação do Super Admin.</p>
        </div>
        <Button
          variant="gold"
          onClick={() => {
            setCreating(true);
            setEditing({ service_type: "", label: "", price: 0, required_fields: "[]", description: "" });
          }}
          className="w-full sm:w-auto"
        >
          Adicionar Serviço
        </Button>
      </div>

      {creating && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Novo Serviço (pendente de aprovação)</CardTitle>
            <CardDescription>Será exibido para usuários/contador somente após aprovação do Super Admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Código (service_type) *</Label>
                <Input
                  value={editing?.service_type || ""}
                  onChange={(e) => setEditing({ ...editing, service_type: e.target.value.replace(/\s/g, "_").toLowerCase() })}
                  placeholder="ex: abertura_cnpj"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Sem espaços. Use letras, números e underline.</p>
              </div>
              <div>
                <Label>Nome do serviço (label) *</Label>
                <Input
                  value={editing?.label || ""}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  placeholder="ex: Abertura de CNPJ (MEI/ME)"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  className="mt-1"
                  placeholder="Explique o que esse serviço cobre e o que o cliente deve ter em mãos..."
                  value={editing?.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Preço proposto (R$)</Label>
                <Input type="number" step="0.01" min="0" value={editing?.price ?? 0} onChange={e => setEditing({ ...editing, price: e.target.value })} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label>Dados requerentes (JSON)</Label>
                <Textarea
                  className="mt-1 font-mono text-xs min-h-[100px]"
                  placeholder='[{"key":"cpf","label":"CPF","required":true}]'
                  value={typeof editing?.required_fields === "string" ? editing.required_fields : JSON.stringify(editing?.required_fields || [], null, 2)}
                  onChange={(e) => setEditing({ ...editing, required_fields: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={createService} disabled={saving}>{saving ? "Enviando..." : "Enviar para Aprovação"}</Button>
              <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      ) : services.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum serviço cadastrado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {services.map(s => {
            const isPending = s.status === "pending";
            const isEditing = editing?.id === s.id;
            return (
              <Card key={s.id} className={isPending ? "border-amber-500/50 bg-amber-500/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{serviceLabels[s.service_type] || s.label}</p>
                      <p className="text-sm text-muted-foreground">R$ {Number(s.price).toFixed(2)} {isPending && <span className="text-amber-600">(pendente aprovação)</span>}</p>
                    </div>
                    {isEditing ? (
                      <div className="flex flex-col gap-3 w-full md:max-w-md">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs shrink-0">Preço (R$)</Label>
                          <Input type="number" step="0.01" min="0" value={editing.price} onChange={e => setEditing({ ...editing, price: e.target.value })} className="w-24" />
                        </div>
                        <div>
                          <Label className="text-xs">Descrição</Label>
                          <Textarea
                            className="mt-1"
                            placeholder="Descrição do serviço (opcional)"
                            value={editing.description || ""}
                            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Dados requerentes (JSON)</Label>
                          <Textarea
                            className="mt-1 font-mono text-xs min-h-[80px]"
                            placeholder='[{"key":"full_name","label":"Nome Completo","required":true},...]'
                            value={typeof editing.required_fields === "string" ? editing.required_fields : JSON.stringify(editing.required_fields || [], null, 2)}
                            onChange={e => setEditing({ ...editing, required_fields: e.target.value })}
                          />
                          <p className="text-[10px] text-muted-foreground mt-0.5">Array de {`{key, label, required}`}. Use type, placeholder, options se necessário.</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="gold" onClick={proposeChange} disabled={saving}>{saving ? "Enviando..." : "Enviar para Aprovação"}</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setEditing({ ...s })} disabled={isPending}>Editar</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============ PEDIDOS DE SERVIÇO ============
const PedidosServicoPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountantId, setAccountantId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("accountants").select("id").eq("user_id", user.id).maybeSingle().then(async ({ data }) => {
      if (!data?.id) { setLoading(false); return; }
      setAccountantId(data.id);
      const { data: reqs } = await supabase.from("fiscal_service_requests")
        .select("*, profiles:client_user_id(name, email, whatsapp)")
        .order("created_at", { ascending: false });
      setRequests(reqs || []);
      setLoading(false);
    });
  }, [user]);

  const updateRequest = async (id: string, status: string) => {
    if (!accountantId) return;

    const current = requests.find(r => r.id === id);
    if (!current) return;

    const shouldClaim = (status === "accepted") && (!current.accountant_id);
    const updatePayload: any = shouldClaim ? { status, accountant_id: accountantId } : { status };

    let query = supabase.from("fiscal_service_requests").update(updatePayload).eq("id", id);
    if (shouldClaim) {
      query = query.is("accountant_id", null);
    }

    const { error } = await query;
    if (error) { toast.error(error.message); return; }

    toast.success(`Pedido ${status === 'accepted' ? 'aceito' : status === 'in_progress' ? 'em andamento' : status === 'completed' ? 'concluído' : 'atualizado'}!`);
    setRequests(requests.map(r => r.id === id ? { ...r, status, accountant_id: shouldClaim ? accountantId : r.accountant_id } : r));
  };

  const serviceLabels: Record<string, string> = {
    mei_declaration: "Declaração MEI",
    me_declaration: "Declaração ME",
    income_tax: "Imposto de Renda",
    cnpj_opening: "Abertura de CNPJ",
    cnpj_closing: "Encerramento de CNPJ",
    other: "Outro",
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Pendente", color: "bg-primary/10 text-primary", icon: Clock },
    accepted: { label: "Aceito", color: "bg-blue-500/10 text-blue-600", icon: CheckCircle },
    in_progress: { label: "Em Andamento", color: "bg-yellow-500/10 text-yellow-600", icon: AlertCircle },
    completed: { label: "Concluído", color: "bg-success/10 text-success", icon: CheckCircle },
    rejected: { label: "Rejeitado", color: "bg-destructive/10 text-destructive", icon: AlertCircle },
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Pedidos de Serviço</h1>
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : requests.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum pedido de serviço recebido.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const sc = statusConfig[r.status] || statusConfig.pending;
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{(r as any).profiles?.name || "Cliente"}</p>
                      <p className="text-sm text-muted-foreground">{(r as any).profiles?.email} {(r as any).profiles?.whatsapp ? `• ${(r as any).profiles?.whatsapp}` : ""}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${sc.color}`}>{sc.label}</span>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm"><span className="font-medium">Serviço:</span> {serviceLabels[r.service_type] || r.service_type}</p>
                    {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex gap-2">
                    {r.status === 'pending' && (
                      <>
                        <Button size="sm" variant="gold" onClick={() => updateRequest(r.id, 'accepted')}>Aceitar</Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateRequest(r.id, 'rejected')}>Rejeitar</Button>
                      </>
                    )}
                    {r.status === 'accepted' && <Button size="sm" variant="gold" onClick={() => updateRequest(r.id, 'in_progress')}>Iniciar</Button>}
                    {r.status === 'in_progress' && <Button size="sm" variant="gold" onClick={() => updateRequest(r.id, 'completed')}>Concluir</Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EmpresasPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Empresas Vinculadas</h1>
    <Card><CardContent className="py-12 text-center"><Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma empresa vinculada.</p><p className="text-sm text-muted-foreground mt-2">Empresas são vinculadas pelo Super Admin.</p></CardContent></Card>
  </div>
);

const DeclaracoesPage = () => <AccountingDocumentsPanel mode="accountant" />;

const GanhosPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Meus Ganhos</h1>
    <Card className="bg-gradient-card border-primary/20"><CardHeader><CardDescription>Total de Ganhos</CardDescription><CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle></CardHeader></Card>
    <Card><CardHeader><CardTitle>Histórico de Pagamentos</CardTitle></CardHeader>
      <CardContent className="text-center py-8"><DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum pagamento registrado.</p></CardContent>
    </Card>
  </div>
);

// ============ CONTA BANCÁRIA CONTADOR ============
const ContaBancariaPage = () => {
  const { user, profile } = useAuth();
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ bank_name: "", agency: "", account: "", account_type: "corrente", cpf_cnpj: "", pix_key: "", pix_key_type: "cpf" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("bank_info, pix_key, cpf_cnpj").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.bank_info) { setBankInfo(data.bank_info); setForm({ ...(data.bank_info as any), pix_key: data.pix_key || "", cpf_cnpj: data.cpf_cnpj || "" }); }
      else setForm(f => ({ ...f, pix_key: data?.pix_key || "", cpf_cnpj: data?.cpf_cnpj || "" }));
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!form.cpf_cnpj || !form.pix_key) { toast.error("CPF/CNPJ e chave PIX são obrigatórios."); return; }
    setSaving(true);
    const bankData = { bank_name: form.bank_name, agency: form.agency, account: form.account, account_type: form.account_type, pix_key_type: form.pix_key_type };
    const { error } = await supabase.from("profiles").update({ bank_info: bankData, pix_key: form.pix_key, cpf_cnpj: form.cpf_cnpj }).eq("user_id", user!.id);
    if (error) { toast.error("Erro: " + error.message); setSaving(false); return; }
    // Create wallet on gateway
    try {
      await supabase.functions.invoke("process-payment", {
        body: { action: "create-wallet", user_id: user!.id, cpf_cnpj: form.cpf_cnpj, name: profile?.name, pix_key: form.pix_key },
      });
      toast.success("Conta bancária salva e carteira criada no gateway!");
    } catch {
      toast.success("Conta bancária salva! Carteira será criada automaticamente.");
    }
    setSaving(false);
    setBankInfo(bankData); setEditing(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Conta Bancária / PIX</h1>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Dados para Recebimento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!editing && bankInfo ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Banco</p><p className="font-medium">{bankInfo.bank_name || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Agência</p><p className="font-medium">{bankInfo.agency || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Conta</p><p className="font-medium">{bankInfo.account || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Chave PIX</p><p className="font-medium">{form.pix_key || "-"}</p></div>
              </div>
              <Button variant="gold" onClick={() => setEditing(true)}>Editar Dados</Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>CPF/CNPJ *</Label><Input value={form.cpf_cnpj} onChange={e => setForm({ ...form, cpf_cnpj: formatCpfCnpjBR(e.target.value) })} placeholder="000.000.000-00" className="mt-1" /></div>
                <div><Label>Chave PIX *</Label><Input value={form.pix_key} onChange={e => setForm({ ...form, pix_key: e.target.value })} placeholder="Chave PIX" className="mt-1" /></div>
                <div><Label>Banco</Label><Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder="Nome do banco" className="mt-1" /></div>
                <div><Label>Agência</Label><Input value={form.agency} onChange={e => setForm({ ...form, agency: e.target.value })} className="mt-1" /></div>
                <div><Label>Conta</Label><Input value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="flex gap-2">
                <Button variant="gold" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
                {bankInfo && <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const PerfilPage = () => {
  const { profile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "", cpf_cnpj: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({ name: profile.name || "", whatsapp: profile.whatsapp || "", cpf_cnpj: profile.cpf_cnpj || "" });
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: form.name, whatsapp: form.whatsapp || null, cpf_cnpj: form.cpf_cnpj || null }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Perfil atualizado!"); setEditing(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Meu Perfil</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {editing ? (
            <>
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="mt-1" /></div>
              <div><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={e => setForm({ ...form, cpf_cnpj: formatCpfCnpjBR(e.target.value) })} className="mt-1" /></div>
              <div className="flex gap-2"><Button variant="gold" onClick={saveProfile} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button></div>
            </>
          ) : (
            <>
              <div><label className="text-sm text-muted-foreground">Nome</label><p className="font-medium">{profile?.name || "-"}</p></div>
              <div><label className="text-sm text-muted-foreground">E-mail</label><p className="font-medium">{profile?.email || "-"}</p></div>
              <div><label className="text-sm text-muted-foreground">WhatsApp</label><p className="font-medium">{profile?.whatsapp || "-"}</p></div>
              <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>Editar Perfil</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============ AUTOMAÇÃO FISCAL (CONTADOR) ============

const AutomacaoFiscalContadorPage = () => {
  const { user } = useAuth();
  const [linkedBarbershops, setLinkedBarbershops] = useState<{ id: string; name: string | null }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: acc } = await supabase.from("accountants").select("id").eq("user_id", user.id).maybeSingle();
      if (!acc?.id) { setLoading(false); return; }
      const { data: links } = await supabase
        .from("accountant_barbershop_links")
        .select("barbershop_id, barbershops(name)")
        .eq("accountant_id", acc.id)
        .eq("status", "active");
      const mapped = (links || []).map((r: any) => ({ id: r.barbershop_id, name: r.barbershops?.name || null }));
      setLinkedBarbershops(mapped);
      if (mapped[0]?.id) setSelectedId(mapped[0].id);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Automação Fiscal</CardTitle>
          <CardDescription>Selecione uma empresa vinculada para acessar a automação fiscal completa.</CardDescription>
        </CardHeader>
        <CardContent>
          {linkedBarbershops.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma empresa vinculada. Crie vínculos primeiro.</p>
          ) : (
            <div className="space-y-2">
              <Label>Empresa</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedId || ""}
                onChange={e => setSelectedId(e.target.value || null)}
              >
                <option value="">Selecione...</option>
                {linkedBarbershops.map(b => (
                  <option key={b.id} value={b.id}>{b.name || b.id}</option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedId && <FiscalAutomationPanel barbershopId={selectedId} mode="accountant" />}
    </div>
  );
};

export default ContadorDashboard;
