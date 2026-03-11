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
  Share2, Lock, Phone, Eye, EyeOff, CreditCard, Loader2, FileText, Wallet,
  Plus, QrCode, CheckCircle, Smartphone
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { formatWhatsAppBR } from "@/lib/input-masks";
import { ProfilePhotoUpload } from "@/components/shared/ProfilePhotoUpload";
import ContaBancariaPage from "@/components/profissional/ContaBancariaPage";
import SolicitarServicoFiscalPage from "@/components/shared/SolicitarServicoFiscalPage";
import SejaAfiliadoPage from "@/components/shared/SejaAfiliadoPage";
import { isPaymentRequestSupported, processNfcPayment } from "@/lib/nfc/payment";

const ProfissionalDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/painel-profissional";

  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Minha Agenda", href: `${basePath}/agenda`, icon: Calendar },
    { name: "Meus Ganhos", href: `${basePath}/ganhos`, icon: DollarSign },
    { name: "Receber Dívida", href: `${basePath}/receber-divida`, icon: Wallet },
    { name: "Conta Bancária", href: `${basePath}/conta-bancaria`, icon: CreditCard },
    { name: "Serviços Contábeis", href: `${basePath}/servicos-contabeis`, icon: FileText },
    { name: "Seja Afiliado", href: `${basePath}/seja-afiliado`, icon: Share2 },
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
            <Route path="receber-divida" element={<ReceberDividaProfPage />} />
            <Route path="conta-bancaria" element={<ContaBancariaPage />} />
            <Route path="servicos-contabeis" element={<SolicitarServicoFiscalPage />} />
            <Route path="seja-afiliado" element={<SejaAfiliadoPage />} />
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

// ============ RECEBER DÍVIDA - PROFISSIONAL ============
const ReceberDividaProfPage = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_whatsapp: "", amount: "", description: "" });
  const [nfcLoadingId, setNfcLoadingId] = useState<string | null>(null);
  const nfcSupported = isPaymentRequestSupported();

  const reload = () => {
    if (!user) return;
    (supabase as any).from("debts").select("*").eq("professional_user_id", user.id).order("created_at", { ascending: false }).then(({ data }: any) => setDebts(data || []));
  };

  useEffect(() => { reload(); }, [user?.id]);

  const handleCreate = async () => {
    if (!form.client_name || !form.amount || !user) { toast.error("Preencha nome e valor."); return; }
    setSaving(true);
    const { error } = await (supabase as any).from("debts").insert({
      professional_user_id: user.id,
      client_name: form.client_name,
      client_whatsapp: form.client_whatsapp || null,
      amount: Number(form.amount),
      description: form.description || null,
    });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Dívida registrada!");
    setShowForm(false);
    setForm({ client_name: "", client_whatsapp: "", amount: "", description: "" });
    reload();
  };

  const handleReceivePix = async (debt: any) => {
    try {
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: { action: "charge", amount: Number(debt.amount), description: `Dívida: ${debt.client_name}`, billing_type: "PIX", external_reference: debt.id },
      });
      if (error) throw error;
      const code = data?.pix_copy_paste || data?.payment_link;
      if (code) { navigator.clipboard?.writeText(code); toast.success("PIX copiado! Envie ao cliente."); }
      else toast.success("Cobrança gerada!");
    } catch { toast.error("Erro ao gerar cobrança."); }
  };

  const totalPending = debts.filter(d => d.status === "pending").reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">Receber Dívida (Fiado)</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Nova Dívida</Button>
      </div>

      <Card className="bg-gradient-card border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Total Pendente</p><p className="text-2xl font-bold text-gradient-gold">R$ {totalPending.toFixed(2)}</p></div>
          <Wallet className="w-8 h-8 text-primary" />
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Registrar Dívida</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome do Cliente *</Label><Input placeholder="Nome" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} className="mt-1" /></div>
              <div><Label>WhatsApp</Label><Input placeholder="(11) 99999-0000" value={form.client_whatsapp} onChange={e => setForm({ ...form, client_whatsapp: formatWhatsAppBR(e.target.value) })} className="mt-1" /></div>
              <div><Label>Valor (R$) *</Label><Input type="number" placeholder="50.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1" /></div>
              <div><Label>Descrição</Label><Input placeholder="Ex: Corte + Barba" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleCreate} disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {debts.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma dívida registrada.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {debts.map(d => (
            <Card key={d.id}><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div><p className="font-semibold">{d.client_name}</p><p className="text-sm text-muted-foreground">{d.description || "Fiado"}</p></div>
                <div className="text-right">
                  <p className="font-bold text-lg">R$ {Number(d.amount).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === "pending" ? "bg-yellow-500/10 text-yellow-600" : "bg-green-500/10 text-green-600"}`}>{d.status === "pending" ? "Pendente" : "Pago"}</span>
                </div>
              </div>
              {d.status === "pending" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="gold" onClick={() => handleReceivePix(d)}><QrCode className="w-4 h-4 mr-1" />PIX/QR</Button>
                  {nfcSupported && (
                    <Button size="sm" variant="default" className="bg-violet-600 hover:bg-violet-700 text-white" disabled={nfcLoadingId === d.id}
                      onClick={async () => {
                        setNfcLoadingId(d.id);
                        const result = await processNfcPayment({ amount: Number(d.amount), description: `Dívida: ${d.client_name}` });
                        setNfcLoadingId(null);
                        if (result.success) {
                          await supabase.from("debts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", d.id);
                          toast.success("Pagamento NFC recebido!"); reload();
                        } else { toast.error(result.error || "Falha no NFC"); }
                      }}
                    >
                      {nfcLoadingId === d.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Smartphone className="w-4 h-4 mr-1" />}NFC
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => {
                    supabase.from("debts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", d.id).then(() => { toast.success("Marcado como pago!"); reload(); });
                  }}><CheckCircle className="w-4 h-4 mr-1" />Pago</Button>
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}
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

// ContaBancariaPage is now imported from @/components/profissional/ContaBancariaPage
const PerfilPage = () => {
  const { profile, user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
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
          <div className="flex items-center gap-4 mb-4">
            <ProfilePhotoUpload userId={user!.id} avatarUrl={avatarUrl ?? profile?.avatar_url ?? null} onUpdate={setAvatarUrl} size="lg" />
            <div><p className="font-bold">{profile?.name || "Profissional"}</p><p className="text-xs text-muted-foreground">Passe o mouse e clique na câmera para alterar a foto</p></div>
          </div>
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
