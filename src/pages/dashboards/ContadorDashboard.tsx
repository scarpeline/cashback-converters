import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LayoutDashboard, Building2, FileText, DollarSign, User, LogOut, Menu, X, Calculator,
  Loader2, CreditCard, ClipboardList, CheckCircle, Clock, AlertCircle
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { formatCpfCnpjBR } from "@/lib/input-masks";

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
    { name: "Pedidos de Serviço", href: `${basePath}/pedidos`, icon: ClipboardList },
    { name: "Empresas", href: `${basePath}/empresas`, icon: Building2 },
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
            <Route path="pedidos" element={<PedidosServicoPage />} />
            <Route path="empresas" element={<EmpresasPage />} />
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
        (supabase as any).from("fiscal_service_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
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
      const { data: reqs } = await (supabase as any).from("fiscal_service_requests")
        .select("*, profiles:client_user_id(name, email, whatsapp)")
        .order("created_at", { ascending: false });
      setRequests(reqs || []);
      setLoading(false);
    });
  }, [user]);

  const updateRequest = async (id: string, status: string) => {
    if (!accountantId) return;
    const { error } = await (supabase as any).from("fiscal_service_requests").update({ status, accountant_id: accountantId }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Pedido ${status === 'accepted' ? 'aceito' : status === 'in_progress' ? 'em andamento' : status === 'completed' ? 'concluído' : 'atualizado'}!`);
    setRequests(requests.map(r => r.id === id ? { ...r, status, accountant_id: accountantId } : r));
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

const DeclaracoesPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Declarações</h1>
    <Card><CardContent className="py-12 text-center"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma declaração pendente.</p></CardContent></Card>
  </div>
);

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

export default ContadorDashboard;
