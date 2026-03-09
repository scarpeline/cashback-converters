import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard, Calendar, DollarSign, User, Bell, LogOut, Menu, X, Clock,
  Share2, Lock, Phone, Eye, EyeOff, CreditCard, Loader2
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { formatWhatsAppBR } from "@/lib/input-masks";
import ContaBancariaPage from "@/components/profissional/ContaBancariaPage";

const ProfissionalDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/painel-profissional";

  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Minha Agenda", href: `${basePath}/agenda`, icon: Calendar },
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
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-display font-bold text-lg text-sidebar-primary">Profissional</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground/60" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 border-b border-sidebar-border">
            <p className="font-medium truncate text-sidebar-foreground">{profile?.name || "Profissional"}</p>
            <p className="text-sm text-sidebar-foreground/60 truncate">{profile?.whatsapp || profile?.email}</p>
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
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={signOut}>
              <LogOut className="w-5 h-5" />Sair
            </Button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-4"><Button variant="ghost" size="icon"><Bell className="w-5 h-5" /></Button></div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="agenda" element={<AgendaPage />} />
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
  const handleShare = () => {
    const link = `${window.location.origin}/agendar`;
    if (navigator.share) {
      navigator.share({ title: "Agende seu horário", url: link });
    } else {
      navigator.clipboard?.writeText(link);
      toast.success("Link de agendamento copiado!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold">Olá! 👋</h1><p className="text-muted-foreground">Sua agenda de hoje</p></div>
        <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="w-4 h-4 mr-1" />Compartilhar Link</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Agendamentos Hoje</CardDescription><CardTitle className="text-2xl">0</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Ganhos Hoje</CardDescription><CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Próximo Cliente</CardDescription><CardTitle className="text-lg">Nenhum</CardTitle></CardHeader></Card>
      </div>
      <Card><CardHeader><CardTitle>Próximos Atendimentos</CardTitle></CardHeader>
        <CardContent className="text-center py-8"><Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum atendimento agendado para hoje.</p></CardContent>
      </Card>
    </div>
  );
};

const AgendaPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Minha Agenda</h1>
    <Card><CardContent className="py-12 text-center"><Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum agendamento.</p></CardContent></Card>
  </div>
);

const GanhosPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Meus Ganhos</h1>
    <Card className="bg-gradient-card border-primary/20"><CardHeader><CardDescription>Ganhos do Mês</CardDescription><CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle></CardHeader></Card>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card><CardHeader><CardDescription>A Receber</CardDescription><CardTitle className="text-xl">R$ 0,00</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>Atendimentos do Mês</CardDescription><CardTitle className="text-xl">0</CardTitle></CardHeader></Card>
    </div>
  </div>
);

// ============ CONTA BANCÁRIA / PIX ============
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

    // Create wallet on gateway
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Dados para Recebimento</CardTitle>
          <CardDescription>Configure sua conta para receber comissões automaticamente via PIX</CardDescription>
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
                <Button variant="gold" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  {saving ? "Salvando..." : "Salvar e Criar Conta no Gateway"}
                </Button>
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
  const [form, setForm] = useState({ name: "", whatsapp: "", pix_key: "" });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: "", confirmPassword: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const startEdit = () => {
    setForm({ name: profile?.name || "", whatsapp: profile?.whatsapp || "", pix_key: profile?.pix_key || "" });
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: form.name, whatsapp: form.whatsapp || null, pix_key: form.pix_key || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Perfil atualizado!"); setEditing(false);
  };

  const changePassword = async () => {
    if (pwForm.newPassword.length < 6) { toast.error("Mínimo 6 caracteres."); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Senhas não coincidem."); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword });
    setSavingPw(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Senha alterada com sucesso!"); setChangingPw(false); setPwForm({ newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Meu Perfil</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {editing ? (
            <>
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: formatWhatsAppBR(e.target.value) })} className="mt-1" /></div>
              <div><Label>Chave PIX</Label><Input value={form.pix_key} onChange={e => setForm({ ...form, pix_key: e.target.value })} className="mt-1" /></div>
              <div className="flex gap-2"><Button variant="gold" onClick={saveProfile} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button></div>
            </>
          ) : (
            <>
              <div className="grid gap-3">
                <div className="p-3 bg-muted rounded-lg"><label className="text-xs text-muted-foreground">Nome</label><p className="font-medium">{profile?.name || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><label className="text-xs text-muted-foreground">WhatsApp</label><p className="font-medium">{profile?.whatsapp || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><label className="text-xs text-muted-foreground">E-mail</label><p className="font-medium">{profile?.email || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><label className="text-xs text-muted-foreground">Chave PIX</label><p className="font-medium">{profile?.pix_key || "Não configurada"}</p></div>
              </div>
              <Button variant="gold" className="w-full" onClick={startEdit}>Editar Perfil</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><Lock className="w-5 h-5 inline mr-2" />Alterar Senha</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {changingPw ? (
            <>
              <div className="relative">
                <Label>Nova Senha</Label>
                <Input type={showPw ? "text" : "password"} value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} className="mt-1 pr-10" placeholder="Mínimo 6 caracteres" />
                <button type="button" className="absolute right-3 top-8 text-muted-foreground" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <div><Label>Confirmar Senha</Label><Input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="mt-1" /></div>
              <div className="flex gap-2"><Button variant="gold" onClick={changePassword} disabled={savingPw}>{savingPw ? "Salvando..." : "Alterar Senha"}</Button><Button variant="outline" onClick={() => setChangingPw(false)}>Cancelar</Button></div>
            </>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setChangingPw(true)}><Lock className="w-4 h-4 mr-2" />Alterar Senha</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfissionalDashboard;
