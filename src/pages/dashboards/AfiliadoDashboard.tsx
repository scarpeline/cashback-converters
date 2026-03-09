import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LayoutDashboard, DollarSign, Users, Link as LinkIcon, History, User, LogOut,
  Menu, X, Copy, TrendingUp, Wallet, Loader2, CreditCard, Building2, FileText
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { formatCpfCnpjBR } from "@/lib/input-masks";
import SolicitarServicoFiscalPage from "@/components/shared/SolicitarServicoFiscalPage";

const AfiliadoDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/afiliado-saas";
  
  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Meus Indicados", href: `${basePath}/indicados`, icon: Users },
    { name: "Comissões", href: `${basePath}/comissoes`, icon: DollarSign },
    { name: "Conta Bancária", href: `${basePath}/conta-bancaria`, icon: CreditCard },
    { name: "Histórico", href: `${basePath}/historico`, icon: History },
    { name: "Meu Link", href: `${basePath}/link`, icon: LinkIcon },
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
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-display font-bold text-lg text-sidebar-primary">Afiliado SaaS</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground/60" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 border-b border-sidebar-border">
            <p className="font-medium truncate text-sidebar-foreground">{profile?.name || "Afiliado"}</p>
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
            <Route path="indicados" element={<IndicadosPage />} />
            <Route path="comissoes" element={<ComissoesPage />} />
            <Route path="conta-bancaria" element={<ContaBancariaPage />} />
            <Route path="historico" element={<HistoricoPage />} />
            <Route path="link" element={<LinkPage />} />
            <Route path="perfil" element={<PerfilPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const DashboardHome = () => {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("affiliates").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setAffiliate(data));
  }, [user]);

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold">Dashboard do Afiliado</h1><p className="text-muted-foreground">Acompanhe seus ganhos e indicações</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="pb-2"><CardDescription>Ganhos Totais</CardDescription><CardTitle className="text-2xl text-gradient-gold">R$ {Number(affiliate?.total_earnings || 0).toFixed(2)}</CardTitle></CardHeader>
          <CardContent><p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Desde o início</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardDescription>Saldo Disponível</CardDescription><CardTitle className="text-2xl">R$ {Number(affiliate?.pending_earnings || 0).toFixed(2)}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Para saque</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Empresas Ativas</CardDescription><CardTitle className="text-2xl">{affiliate?.active_referrals || 0}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Mínimo 3 para saque</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Ganhos Pendentes</CardDescription><CardTitle className="text-2xl">R$ {Number(affiliate?.pending_earnings || 0).toFixed(2)}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Aguardando confirmação</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Como você ganha</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center"><p className="text-2xl font-bold text-gradient-gold">{affiliate?.commission_first || 60}%</p><p className="text-sm text-muted-foreground">Primeira mensalidade</p></div>
            <div className="p-4 bg-muted rounded-lg text-center"><p className="text-2xl font-bold text-gradient-gold">{affiliate?.commission_recurring || 20}%</p><p className="text-sm text-muted-foreground">Mensalidades recorrentes</p></div>
            <div className="p-4 bg-muted rounded-lg text-center"><p className="text-2xl font-bold text-gradient-gold">{affiliate?.commission_saas_tax || 10}%</p><p className="text-sm text-muted-foreground">Taxa SaaS (0,5%)</p></div>
          </div>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" />Saque</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div><p className="font-medium">Você precisa de 3 empresas ativas</p><p className="text-sm text-muted-foreground">para liberar saques</p></div>
            <Button variant="gold" disabled={(affiliate?.active_referrals || 0) < 3}>Solicitar Saque</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const IndicadosPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Meus Indicados</h1>
    <Card><CardContent className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma empresa indicada ainda.</p><p className="text-sm text-muted-foreground mt-2">Compartilhe seu link e comece a ganhar!</p></CardContent></Card>
  </div>
);

const ComissoesPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Minhas Comissões</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-gradient-card border-primary/20"><CardHeader><CardDescription>Total de Comissões</CardDescription><CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>Pendente de Pagamento</CardDescription><CardTitle className="text-2xl">R$ 0,00</CardTitle></CardHeader></Card>
    </div>
    <Card><CardHeader><CardTitle>Histórico de Comissões</CardTitle></CardHeader>
      <CardContent className="text-center py-8"><DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma comissão registrada.</p></CardContent>
    </Card>
  </div>
);

// ============ CONTA BANCÁRIA ============
const ContaBancariaPage = () => {
  const { user, profile } = useAuth();
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bank_name: "", agency: "", account: "", account_type: "corrente",
    cpf_cnpj: "", pix_key: "", pix_key_type: "cpf",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("bank_info, pix_key, cpf_cnpj").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.bank_info) {
        setBankInfo(data.bank_info);
        setForm({ ...(data.bank_info as any), pix_key: data.pix_key || "", cpf_cnpj: data.cpf_cnpj || "" });
      } else {
        setForm(f => ({ ...f, pix_key: data?.pix_key || "", cpf_cnpj: data?.cpf_cnpj || "" }));
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!form.cpf_cnpj || !form.pix_key) { toast.error("CPF/CNPJ e chave PIX são obrigatórios."); return; }
    setSaving(true);
    
    const bankData = { bank_name: form.bank_name, agency: form.agency, account: form.account, account_type: form.account_type, pix_key_type: form.pix_key_type };

    const { error } = await supabase.from("profiles").update({
      bank_info: bankData, pix_key: form.pix_key, cpf_cnpj: form.cpf_cnpj,
    }).eq("user_id", user!.id);

    if (error) { toast.error("Erro: " + error.message); setSaving(false); return; }

    // Try to register on gateway
    try {
      await supabase.functions.invoke("process-payment", {
        body: { action: "create-wallet", user_id: user!.id, cpf_cnpj: form.cpf_cnpj, name: profile?.name, pix_key: form.pix_key },
      });
      toast.success("Conta bancária salva e carteira criada no gateway!");
    } catch {
      toast.success("Conta bancária salva! Carteira será criada automaticamente.");
    }

    setBankInfo(bankData);
    setEditing(false);
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Conta Bancária / PIX</h1>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Dados para Recebimento</CardTitle>
          <CardDescription>Configure sua conta para receber saques automaticamente via gateway</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!editing && bankInfo ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Banco</p><p className="font-medium">{bankInfo.bank_name || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Agência</p><p className="font-medium">{bankInfo.agency || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Conta</p><p className="font-medium">{bankInfo.account || "-"} ({bankInfo.account_type})</p></div>
                <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Chave PIX</p><p className="font-medium">{form.pix_key || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">CPF/CNPJ</p><p className="font-medium">{form.cpf_cnpj || "-"}</p></div>
              </div>
              <Button variant="gold" onClick={() => setEditing(true)}>Editar Dados</Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>CPF/CNPJ *</Label><Input value={form.cpf_cnpj} onChange={e => setForm({ ...form, cpf_cnpj: formatCpfCnpjBR(e.target.value) })} placeholder="000.000.000-00" className="mt-1" /></div>
                <div><Label>Tipo de Chave PIX</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={form.pix_key_type} onChange={e => setForm({ ...form, pix_key_type: e.target.value })}>
                    <option value="cpf">CPF/CNPJ</option><option value="email">E-mail</option><option value="phone">Telefone</option><option value="random">Chave Aleatória</option>
                  </select>
                </div>
                <div><Label>Chave PIX *</Label><Input value={form.pix_key} onChange={e => setForm({ ...form, pix_key: e.target.value })} placeholder="Sua chave PIX" className="mt-1" /></div>
                <div><Label>Banco</Label><Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder="Nome do banco" className="mt-1" /></div>
                <div><Label>Agência</Label><Input value={form.agency} onChange={e => setForm({ ...form, agency: e.target.value })} placeholder="0001" className="mt-1" /></div>
                <div><Label>Conta</Label><Input value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} placeholder="12345-6" className="mt-1" /></div>
              </div>
              <div className="flex gap-2">
                <Button variant="gold" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}{saving ? "Salvando..." : "Salvar e Criar Conta no Gateway"}</Button>
                {bankInfo && <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const HistoricoPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Histórico</h1>
    <Card><CardContent className="py-12 text-center"><History className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma atividade registrada.</p></CardContent></Card>
  </div>
);

const LinkPage = () => {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("affiliates").select("referral_code").eq("user_id", user.id).maybeSingle().then(({ data }) => setAffiliate(data));
  }, [user]);

  const referralCode = affiliate?.referral_code || "MEUCOD01";
  const referralLink = `${window.location.origin}/cadastro?ref=${referralCode}`;

  const copyLink = () => { navigator.clipboard.writeText(referralLink); toast.success("Link copiado!"); };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Meu Link de Indicação</h1>
      <Card>
        <CardHeader><CardTitle>Compartilhe seu link</CardTitle><CardDescription>Quando alguém se cadastrar pelo seu link, você ganha comissões automaticamente.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <code className="flex-1 p-3 bg-muted rounded-lg text-sm overflow-x-auto">{referralLink}</code>
            <Button variant="gold" onClick={copyLink}><Copy className="w-4 h-4 mr-2" />Copiar</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { const url = `https://wa.me/?text=${encodeURIComponent(`Conheça o sistema: ${referralLink}`)}`; window.open(url, '_blank'); }}>Compartilhar WhatsApp</Button>
            <Button variant="outline" className="flex-1" onClick={() => { if (navigator.share) navigator.share({ title: "SalãoCashBack", url: referralLink }); else copyLink(); }}>Compartilhar Redes</Button>
          </div>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Código de Referência</CardTitle></CardHeader>
        <CardContent><div className="text-center p-6 bg-muted rounded-lg"><p className="text-3xl font-bold tracking-wider">{referralCode}</p></div></CardContent>
      </Card>
    </div>
  );
};

const PerfilPage = () => {
  const { profile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "", cpf_cnpj: "", pix_key: "" });
  const [saving, setSaving] = useState(false);
  const [bankInfo, setBankInfo] = useState<any>(null);

  useEffect(() => {
    if (profile) setForm({ name: profile.name || "", whatsapp: profile.whatsapp || "", cpf_cnpj: profile.cpf_cnpj || "", pix_key: profile.pix_key || "" });
    if (user) {
      supabase.from("profiles").select("bank_info").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data?.bank_info) setBankInfo(data.bank_info);
      });
    }
  }, [profile, user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: form.name, whatsapp: form.whatsapp || null, cpf_cnpj: form.cpf_cnpj || null, pix_key: form.pix_key || null }).eq("user_id", user.id);
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
              <div><Label>Chave PIX</Label><Input value={form.pix_key} onChange={e => setForm({ ...form, pix_key: e.target.value })} className="mt-1" /></div>
              <div className="flex gap-2"><Button variant="gold" onClick={saveProfile} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button></div>
            </>
          ) : (
            <>
              <div><label className="text-sm text-muted-foreground">Nome</label><p className="font-medium">{profile?.name || "-"}</p></div>
              <div><label className="text-sm text-muted-foreground">E-mail</label><p className="font-medium">{profile?.email || "-"}</p></div>
              <div><label className="text-sm text-muted-foreground">WhatsApp</label><p className="font-medium">{profile?.whatsapp || "-"}</p></div>
              <div><label className="text-sm text-muted-foreground">CPF/CNPJ</label><p className="font-medium">{profile?.cpf_cnpj || "-"}</p></div>
              <div><label className="text-sm text-muted-foreground">Chave PIX</label><p className="font-medium">{profile?.pix_key || "Não configurada"}</p></div>
              {bankInfo && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Conta Bancária</p>
                  <p className="text-sm">{bankInfo.bank_name} • Ag: {bankInfo.agency} • Cc: {bankInfo.account}</p>
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>Editar Perfil</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AfiliadoDashboard;
