import { useState, useEffect, useMemo } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { SocialProofManager } from "@/components/social-proof/SocialProofManager";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  LayoutDashboard, Users, Building2, DollarSign, Settings, Shield, Image, MessageCircle,
  Bell, Calculator, LogOut, Menu, X, Activity, CheckCircle, TrendingUp, Plug, Loader2, Send, Phone,
  LinkIcon, Edit, Calendar, UserPlus, Copy, ExternalLink, Package, CreditCard, Eye, Wallet
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { lazy, Suspense } from "react";

const IntegrationSettingsPage = lazy(() => import("@/pages/admin/IntegrationSettingsPage"));

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const SuperAdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/admin";

  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Usuários", href: `${basePath}/usuarios`, icon: Users },
    { name: "Barbearias", href: `${basePath}/barbearias`, icon: Building2 },
    { name: "Afiliados", href: `${basePath}/afiliados`, icon: Users },
    { name: "Contadores", href: `${basePath}/contadores`, icon: Calculator },
    { name: "Financeiro", href: `${basePath}/financeiro`, icon: DollarSign },
    { name: "Prova Social", href: `${basePath}/prova-social`, icon: Activity },
    { name: "Integrações", href: `${basePath}/integracoes`, icon: Plug },
    { name: "Pixels Globais", href: `${basePath}/pixels`, icon: Image },
    { name: "Mensagens Sistema", href: `${basePath}/mensagens-sistema`, icon: MessageCircle },
    { name: "Suporte", href: `${basePath}/suporte`, icon: MessageCircle },
    { name: "Notificações", href: `${basePath}/notificacoes`, icon: Bell },
    { name: "Configurações", href: `${basePath}/configuracoes`, icon: Settings },
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
              <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center"><Shield className="w-5 h-5 text-destructive" /></div>
              <span className="font-display font-bold text-lg text-sidebar-foreground">Super Admin</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground/60" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 border-b border-sidebar-border">
            <p className="font-medium truncate text-sidebar-foreground">{profile?.name || "Admin"}</p>
            <p className="text-sm text-sidebar-foreground/60 truncate">{profile?.email}</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-destructive text-destructive-foreground" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"}`}>
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
          <SystemStatus />
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="barbearias" element={<BarbeariasPage />} />
            <Route path="afiliados" element={<AfiliadosPage />} />
            <Route path="contadores" element={<ContadoresPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="integracoes" element={<Suspense fallback={<PageFallback />}><IntegrationSettingsPage /></Suspense>} />
            <Route path="pixels" element={<PixelsPage />} />
            <Route path="mensagens-sistema" element={<MensagensSistemaPage />} />
            <Route path="suporte" element={<SuporteAdminPage />} />
            <Route path="notificacoes" element={<NotificacoesAdminPage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const SystemStatus = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm">
    <Activity className="w-4 h-4" /><span>Sistema OK</span>
  </div>
);

const DashboardHome = () => {
  const [stats, setStats] = useState({ users: 0, barbershops: 0, affiliates: 0 });
  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("barbershops").select("id", { count: "exact", head: true }),
      supabase.from("affiliates").select("id", { count: "exact", head: true }),
    ]).then(([p, b, a]) => setStats({ users: p.count || 0, barbershops: b.count || 0, affiliates: a.count || 0 }));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold">Painel Super Admin</h1><p className="text-muted-foreground">Visão geral do sistema</p></div>
      <Card className="border-success/20 bg-success/5">
        <CardHeader><div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-success" /><CardTitle>Sistema Operacional</CardTitle></div></CardHeader>
        <CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">{["Auth", "ASAAS", "Split", "Mensagens"].map(s => (<div key={s} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /><span>{s}</span></div>))}</div></CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total de Usuários</CardDescription><CardTitle className="text-2xl">{stats.users}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Barbearias Ativas</CardDescription><CardTitle className="text-2xl">{stats.barbershops}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Afiliados Ativos</CardDescription><CardTitle className="text-2xl">{stats.affiliates}</CardTitle></CardHeader></Card>
        <Card className="border-primary/20"><CardHeader className="pb-2"><CardDescription>Receita do Mês</CardDescription><CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle></CardHeader></Card>
      </div>
    </div>
  );
};

// ============ SUPORTE ADMIN ============
const SuporteAdminPage = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("support_chats").select("*, profiles:user_id(name, email, whatsapp)")
      .order("updated_at", { ascending: false }).then(({ data }) => { setChats(data || []); setLoading(false); });
  }, []);

  const loadMessages = async (chatId: string) => {
    const { data } = await supabase.from("support_messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const selectChat = (chat: any) => { setActiveChat(chat); loadMessages(chat.id); };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeChat || !user) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({ chat_id: activeChat.id, sender_id: user.id, message: newMsg.trim(), is_from_support: true });
    setSending(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setNewMsg(""); loadMessages(activeChat.id);
  };

  const updateStatus = async (chatId: string, status: string) => {
    await supabase.from("support_chats").update({ status, assigned_to: user?.id }).eq("id", chatId);
    toast.success(`Chat ${status}`);
    supabase.from("support_chats").select("*, profiles:user_id(name, email, whatsapp)").order("updated_at", { ascending: false }).then(({ data }) => setChats(data || []));
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Suporte - Atendimento</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase">Chamados ({chats.length})</h2>
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : chats.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum chamado.</CardContent></Card>
          ) : chats.map(c => (
            <Card key={c.id} className={`cursor-pointer hover:border-primary transition-colors ${activeChat?.id === c.id ? 'border-primary bg-primary/5' : ''}`} onClick={() => selectChat(c)}>
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div><p className="font-medium text-sm">{(c as any).profiles?.name || "Usuário"}</p><p className="text-xs text-muted-foreground">{(c as any).profiles?.whatsapp || (c as any).profiles?.email || ""}</p></div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === 'open' ? 'bg-destructive/10 text-destructive' : c.status === 'in_progress' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                    {c.status === 'open' ? 'Aberto' : c.status === 'in_progress' ? 'Em Atendimento' : 'Fechado'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-2">
          {!activeChat ? (
            <Card><CardContent className="py-12 text-center"><MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Selecione um chat.</p></CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="border-b py-3">
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-sm">{(activeChat as any).profiles?.name}</CardTitle><CardDescription className="text-xs">{(activeChat as any).profiles?.whatsapp || (activeChat as any).profiles?.email}</CardDescription></div>
                  <div className="flex gap-2">
                    {activeChat.status === 'open' && <Button size="sm" variant="outline" onClick={() => updateStatus(activeChat.id, 'in_progress')}>Assumir</Button>}
                    {activeChat.status !== 'closed' && <Button size="sm" variant="outline" onClick={() => updateStatus(activeChat.id, 'closed')}>Fechar</Button>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-80 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">Nenhuma mensagem.</p> : messages.map(m => (
                    <div key={m.id} className={`flex ${m.is_from_support ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${m.is_from_support ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-foreground'}`}>
                        {m.message}
                        <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t flex gap-2">
                  <Input placeholder="Responder..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                  <Button variant="gold" onClick={sendMessage} disabled={sending}>Enviar</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ NOTIFICAÇÕES ADMIN ============
const NotificacoesAdminPage = () => {
  const [target, setTarget] = useState<"all" | "donos" | "profissionais" | "clientes">("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<"app" | "sms" | "whatsapp">("app");

  const handleSend = async () => {
    if (!title || !message) { toast.error("Preencha título e mensagem."); return; }
    setSending(true);
    let roleFilter: string | null = null;
    if (target === "donos") roleFilter = "dono";
    else if (target === "profissionais") roleFilter = "profissional";
    else if (target === "clientes") roleFilter = "cliente";

    let userIds: string[] = [];
    if (roleFilter) {
      const { data } = await supabase.from("user_roles").select("user_id").eq("role", roleFilter as any);
      userIds = data?.map(r => r.user_id) || [];
    } else {
      const { data } = await supabase.from("profiles").select("user_id");
      userIds = data?.map(r => r.user_id) || [];
    }

    if (userIds.length === 0) { toast.error("Nenhum usuário encontrado."); setSending(false); return; }

    const notifications = userIds.map(uid => ({ user_id: uid, title, message, type: "info" as const, priority: "normal" as const }));
    await supabase.from("notifications").insert(notifications);

    if (channel === "sms" || channel === "whatsapp") {
      const { data: profiles } = await supabase.from("profiles").select("whatsapp").in("user_id", userIds);
      const phones = profiles?.map(p => p.whatsapp).filter(Boolean) || [];
      let sent = 0;
      for (const phone of phones) {
        try { await supabase.functions.invoke("send-sms", { body: { action: channel === "whatsapp" ? "whatsapp" : "sms", to: phone, body: `${title}: ${message}` } }); sent++; } catch {}
      }
      toast.success(`${sent} ${channel.toUpperCase()} + ${userIds.length} notificações!`);
    } else {
      toast.success(`Notificação para ${userIds.length} usuário(s)!`);
    }
    setSending(false); setTitle(""); setMessage("");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Enviar Notificação</h1>
      <Card>
        <CardHeader><CardTitle>Destinatários</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "donos", "profissionais", "clientes"] as const).map(t => (
              <Button key={t} variant={target === t ? "gold" : "outline"} size="sm" onClick={() => setTarget(t)}>
                {t === "all" ? "Todos" : t === "donos" ? "Donos" : t === "profissionais" ? "Profissionais" : "Clientes"}
              </Button>
            ))}
          </div>
          <div><Label>Canal</Label><div className="flex flex-wrap gap-2 mt-1">
            {([{ key: "app" as const, label: "📱 App" }, { key: "sms" as const, label: "💬 SMS" }, { key: "whatsapp" as const, label: "📲 WhatsApp" }]).map(c => (
              <Button key={c.key} variant={channel === c.key ? "gold" : "outline"} size="sm" onClick={() => setChannel(c.key)}>{c.label}</Button>
            ))}
          </div></div>
          <div><Label>Título *</Label><Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} className="mt-1" /></div>
          <div><Label>Mensagem *</Label><Input placeholder="Mensagem..." value={message} onChange={e => setMessage(e.target.value)} className="mt-1" /></div>
          <Button variant="gold" onClick={handleSend} disabled={sending}><Send className="w-4 h-4 mr-2" />{sending ? "Enviando..." : "Enviar"}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ USUÁRIOS ============
const UsuariosPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("profiles").select("*, user_roles(role)").limit(50).then(({ data }) => { setUsers(data || []); setLoading(false); }); }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Usuários</h1>
      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : users.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum usuário.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">{users.map(u => (
          <Card key={u.id}><CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
            <div className="flex-1"><p className="font-semibold">{u.name}</p><p className="text-sm text-muted-foreground">{u.email} {u.whatsapp ? `• ${u.whatsapp}` : ""}</p></div>
            <div className="flex gap-1">{u.user_roles?.map((r: any) => (<span key={r.role} className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">{r.role}</span>))}</div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
};

// ============ BARBEARIAS (com liberar acesso + criar usuario free) ============
const BarbeariasPage = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "trial">("all");
  const [editingShop, setEditingShop] = useState<any>(null);
  const [accessDays, setAccessDays] = useState("30");
  const [saving, setSaving] = useState(false);
  const [showCreateFree, setShowCreateFree] = useState(false);
  const [freeForm, setFreeForm] = useState({ email: "", password: "", name: "", period: "30" });
  const [creatingFree, setCreatingFree] = useState(false);

  useEffect(() => { supabase.from("barbershops").select("*, profiles:owner_user_id(name, email, whatsapp)").then(({ data }) => { setShops(data || []); setLoading(false); }); }, []);

  const filtered = shops.filter(s => {
    if (filter === "all") return true;
    if (filter === "active") return s.subscription_status === "active" || s.subscription_status === "paid";
    return s.subscription_status === "trial" || !s.subscription_status;
  });

  const grantAccess = async (shop: any) => {
    setSaving(true);
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + parseInt(accessDays));
    const { error } = await supabase.from("barbershops").update({
      subscription_status: "active", subscription_ends_at: endsAt.toISOString(),
    }).eq("id", shop.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`Acesso liberado por ${accessDays} dias!`);
      setShops(shops.map(s => s.id === shop.id ? { ...s, subscription_status: "active", subscription_ends_at: endsAt.toISOString() } : s));
      setEditingShop(null);
    }
  };

  const createFreeUser = async () => {
    if (!freeForm.email || !freeForm.password || !freeForm.name) { toast.error("Preencha todos os campos."); return; }
    setCreatingFree(true);
    // Create user via bootstrap-role edge function 
    const { data, error } = await supabase.functions.invoke("bootstrap-role", {
      body: { action: "create-free-barbershop", email: freeForm.email, password: freeForm.password, name: freeForm.name, period_days: parseInt(freeForm.period) },
    });
    setCreatingFree(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao criar usuário."); return; }
    toast.success(`Usuário free criado com ${freeForm.period} dias de acesso!`);
    setShowCreateFree(false); setFreeForm({ email: "", password: "", name: "", period: "30" });
    supabase.from("barbershops").select("*, profiles:owner_user_id(name, email, whatsapp)").then(({ data }) => setShops(data || []));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="font-display text-2xl font-bold">Barbearias</h1>
        <Button variant="gold" onClick={() => setShowCreateFree(true)}><UserPlus className="w-4 h-4 mr-2" />Criar Usuário Free</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "active", "trial"] as const).map(f => (
          <Button key={f} variant={filter === f ? "gold" : "outline"} size="sm" onClick={() => setFilter(f)}>{f === "all" ? "Todos" : f === "active" ? "Ativos" : "Trial"}</Button>
        ))}
      </div>

      {showCreateFree && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle>Criar Usuário Free (Barbearia)</CardTitle><CardDescription>Cria um dono de barbearia com período de acesso gratuito</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nome *</Label><Input value={freeForm.name} onChange={e => setFreeForm({ ...freeForm, name: e.target.value })} placeholder="Nome completo" className="mt-1" /></div>
              <div><Label>E-mail *</Label><Input type="email" value={freeForm.email} onChange={e => setFreeForm({ ...freeForm, email: e.target.value })} placeholder="email@exemplo.com" className="mt-1" /></div>
              <div><Label>Senha *</Label><Input type="password" value={freeForm.password} onChange={e => setFreeForm({ ...freeForm, password: e.target.value })} placeholder="Min. 6 caracteres" className="mt-1" /></div>
              <div><Label>Período de Acesso</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["7", "15", "30", "60", "90", "365"].map(d => (
                    <Button key={d} variant={freeForm.period === d ? "gold" : "outline"} size="sm" onClick={() => setFreeForm({ ...freeForm, period: d })}>{d} dias</Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={createFreeUser} disabled={creatingFree}>{creatingFree ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}{creatingFree ? "Criando..." : "Criar Usuário"}</Button>
              <Button variant="ghost" onClick={() => setShowCreateFree(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editingShop && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" />Liberar Acesso: {editingShop.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Período (dias)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {["7", "15", "30", "90", "180", "365"].map(d => (
                  <Button key={d} variant={accessDays === d ? "gold" : "outline"} size="sm" onClick={() => setAccessDays(d)}>{d} dias</Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={() => grantAccess(editingShop)} disabled={saving}>{saving ? "..." : "Liberar Acesso"}</Button>
              <Button variant="ghost" onClick={() => setEditingShop(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : filtered.map(s => (
        <Card key={s.id}><CardContent className="p-4 flex items-center gap-4">
          <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm text-muted-foreground truncate">Dono: {(s as any).profiles?.name || "N/A"} • {(s as any).profiles?.email || ""}</p>
            {s.subscription_ends_at && <p className="text-xs text-muted-foreground">Expira: {new Date(s.subscription_ends_at).toLocaleDateString("pt-BR")}</p>}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.subscription_status === "active" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
            {s.subscription_status || "trial"}
          </span>
          <Button variant="outline" size="sm" onClick={() => setEditingShop(s)}><Calendar className="w-4 h-4 mr-1" />Liberar</Button>
        </CardContent></Card>
      ))}
    </div>
  );
};

// ============ AFILIADOS (convite + comissão individual) ============
const AfiliadosPage = () => {
  const { user } = useAuth();
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAffiliate, setEditingAffiliate] = useState<any>(null);
  const [commissions, setCommissions] = useState({ first: 60, recurring: 20, saas_tax: 10 });
  const [inviteLink, setInviteLink] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { supabase.from("affiliates").select("*, profiles:user_id(name, email)").then(({ data }) => { setAffiliates(data || []); setLoading(false); }); }, []);

  const generateInviteLink = async () => {
    setCreating(true);
    const { data, error } = await supabase.from("affiliate_invites" as any).insert([{
      affiliate_type: "afiliado_saas",
      commission_first: commissions.first,
      commission_recurring: commissions.recurring,
      commission_saas_tax: commissions.saas_tax,
      created_by: user?.id,
    }]).select().single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    const code = (data as any).invite_code;
    const link = `${window.location.origin}/cadastro?ref=${code}&type=afiliado`;
    setInviteLink(link);
    toast.success("Link de convite gerado!");
  };

  const copyLink = () => { navigator.clipboard.writeText(inviteLink); toast.success("Link copiado!"); };

  const saveCommission = async () => {
    if (!editingAffiliate) return;
    const { error } = await supabase.from("affiliates").update({
      commission_first: commissions.first,
      commission_recurring: commissions.recurring,
      commission_saas_tax: commissions.saas_tax,
    }).eq("id", editingAffiliate.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Comissão atualizada!");
      setAffiliates(affiliates.map(a => a.id === editingAffiliate.id ? { ...a, ...commissions } : a));
      setEditingAffiliate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="font-display text-2xl font-bold">Afiliados</h1>
        <Button variant="gold" onClick={generateInviteLink} disabled={creating}><LinkIcon className="w-4 h-4 mr-2" />{creating ? "..." : "Gerar Link de Convite"}</Button>
      </div>

      {inviteLink && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <Label className="text-sm font-medium">Link de Convite de Afiliado</Label>
            <div className="flex gap-2 mt-2">
              <Input value={inviteLink} readOnly className="text-xs" />
              <Button variant="outline" size="sm" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editingAffiliate && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="text-sm">Editar Comissão: {(editingAffiliate as any).profiles?.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">1ª Mensalidade (%)</Label><Input type="number" value={commissions.first} onChange={e => setCommissions({ ...commissions, first: +e.target.value })} /></div>
              <div><Label className="text-xs">Recorrente (%)</Label><Input type="number" value={commissions.recurring} onChange={e => setCommissions({ ...commissions, recurring: +e.target.value })} /></div>
              <div><Label className="text-xs">Taxa SaaS (%)</Label><Input type="number" value={commissions.saas_tax} onChange={e => setCommissions({ ...commissions, saas_tax: +e.target.value })} /></div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={saveCommission}>Salvar</Button>
              <Button variant="ghost" onClick={() => setEditingAffiliate(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : affiliates.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum afiliado.</p></CardContent></Card>
      ) : affiliates.map(a => (
        <Card key={a.id}><CardContent className="p-4 flex items-center gap-4">
          <Users className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-semibold">{(a as any).profiles?.name || "Afiliado"}</p>
            <p className="text-sm text-muted-foreground">Código: {a.referral_code} • {a.commission_first}% / {a.commission_recurring}% / {a.commission_saas_tax}%</p>
          </div>
          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">{a.type}</span>
          <Button variant="outline" size="sm" onClick={() => { setEditingAffiliate(a); setCommissions({ first: a.commission_first || 60, recurring: a.commission_recurring || 20, saas_tax: a.commission_saas_tax || 10 }); }}>
            <Edit className="w-4 h-4 mr-1" />Comissão
          </Button>
        </CardContent></Card>
      ))}
    </div>
  );
};

// ============ CONTADORES ============
const ContadoresPage = () => {
  const [accountants, setAccountants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", whatsapp: "", cpf_cnpj: "" });
  const [creating, setCreating] = useState(false);

  const loadAccountants = () => { supabase.from("accountants").select("*").then(({ data }) => { setAccountants(data || []); setLoading(false); }); };
  useEffect(() => { loadAccountants(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { toast.error("Preencha nome, e-mail e senha."); return; }
    if (form.password.length < 6) { toast.error("Senha mínima de 6 caracteres."); return; }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("bootstrap-role", {
      body: { action: "create-accountant", name: form.name, email: form.email, password: form.password, whatsapp: form.whatsapp || null, cpf_cnpj: form.cpf_cnpj || null },
    });
    setCreating(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro ao criar contador"); return; }
    toast.success("Contador criado com sucesso!");
    setShowCreate(false); setForm({ name: "", email: "", password: "", whatsapp: "", cpf_cnpj: "" });
    loadAccountants();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Contadores</h1>
        <Button variant="gold" onClick={() => setShowCreate(true)}><UserPlus className="w-4 h-4 mr-2" />Criar Contador</Button>
      </div>

      {showCreate && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle>Novo Contador</CardTitle><CardDescription>Crie login e senha de acesso ao portal do contador</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" className="mt-1" /></div>
              <div><Label>E-mail *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="mt-1" /></div>
              <div><Label>Senha *</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 caracteres" className="mt-1" /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-0000" className="mt-1" /></div>
              <div><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={e => setForm({ ...form, cpf_cnpj: e.target.value })} placeholder="000.000.000-00" className="mt-1" /></div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleCreate} disabled={creating}>{creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}{creating ? "Criando..." : "Criar Contador"}</Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : accountants.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum contador.</p></CardContent></Card>
      ) : accountants.map(a => (
        <Card key={a.id}><CardContent className="p-4 flex items-center gap-4">
          <Calculator className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-semibold">{a.name}</p>
            <p className="text-sm text-muted-foreground">{a.email} {a.whatsapp ? `• ${a.whatsapp}` : ""}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${a.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{a.is_active ? "Ativo" : "Inativo"}</span>
        </CardContent></Card>
      ))}
    </div>
  );
};

// ============ FINANCEIRO (receitas + transações detalhadas) ============
const FinanceiroPage = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("payments").select("amount, status, payment_method, created_at, paid_at, barbershop_id").order("created_at", { ascending: false }).limit(1000),
      supabase.from("affiliate_commissions").select("amount, status, created_at, paid_at").limit(500),
    ]).then(([p, c]) => { setPayments(p.data || []); setCommissions(c.data || []); setLoading(false); });
  }, []);

  const months = useMemo(() => {
    const result: { label: string; key: string; offset: number }[] = [];
    for (let i = -3; i <= 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      result.push({
        label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        offset: i,
      });
    }
    return result;
  }, []);

  const getMonthData = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const monthPayments = payments.filter(p => p.created_at?.startsWith(yearMonth));
    const monthCommissions = commissions.filter(c => c.created_at?.startsWith(yearMonth));

    const totalRevenue = monthPayments.filter(p => p.status === "paid" || p.status === "confirmed").reduce((s, p) => s + Number(p.amount), 0);
    const saasFee = totalRevenue * 0.005;
    const subscriptionRevenue = monthPayments.filter(p => p.payment_method === "subscription").reduce((s, p) => s + Number(p.amount), 0);
    const commissionsPaid = monthCommissions.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
    const commissionsPending = monthCommissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);

    const isFuture = offset > 0;
    if (isFuture) {
      const pastMonths = [-2, -1, 0].map(o => {
        const pd = new Date(); pd.setMonth(pd.getMonth() + o);
        const ym = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, "0")}`;
        return payments.filter(p => p.created_at?.startsWith(ym) && (p.status === "paid" || p.status === "confirmed")).reduce((s, p) => s + Number(p.amount), 0);
      });
      const avg = pastMonths.reduce((a, b) => a + b, 0) / 3;
      return { totalRevenue: avg, saasFee: avg * 0.005, subscriptionRevenue: avg * 0.6, commissionsPaid: 0, commissionsPending: 0, isFuture: true, count: 0, monthPayments: [] };
    }

    return { totalRevenue, saasFee, subscriptionRevenue, commissionsPaid, commissionsPending, isFuture: false, count: monthPayments.length, monthPayments };
  };

  const currentData = getMonthData(selectedMonth);

  // Global stats
  const totalAll = payments.filter(p => p.status === "paid" || p.status === "confirmed").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Financeiro</h1>
        <Button variant={showTransactions ? "gold" : "outline"} size="sm" onClick={() => setShowTransactions(!showTransactions)}>
          <Eye className="w-4 h-4 mr-2" />{showTransactions ? "Ocultar" : "Ver"} Todas as Transações
        </Button>
      </div>

      {/* Global totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20"><CardHeader className="pb-2"><CardDescription>Total Recebido (App)</CardDescription><CardTitle className="text-2xl text-gradient-gold">R$ {totalAll.toFixed(2)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Pendente</CardDescription><CardTitle className="text-2xl">R$ {totalPending.toFixed(2)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Transações</CardDescription><CardTitle className="text-2xl">{payments.length}</CardTitle></CardHeader></Card>
      </div>

      {/* All transactions view */}
      {showTransactions && (
        <Card>
          <CardHeader><CardTitle>Todas as Transações</CardTitle><CardDescription>{payments.length} registros</CardDescription></CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma transação.</p>
              ) : payments.slice(0, 100).map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">R$ {Number(p.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{p.payment_method} • {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'paid' || p.status === 'confirmed' ? 'bg-success/10 text-success' : p.status === 'pending' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>{p.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month selector */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {months.map(m => (
          <Button key={m.key} variant={selectedMonth === m.offset ? "gold" : "outline"} size="sm" className="text-xs whitespace-nowrap flex-shrink-0"
            onClick={() => setSelectedMonth(m.offset)}>
            {m.label} {m.offset > 0 && <TrendingUp className="w-3 h-3 ml-1" />}
          </Button>
        ))}
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
        <>
          {currentData.isFuture && (
            <Card className="border-primary/20 bg-primary/5"><CardContent className="p-3 text-sm text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />Previsão baseada na média dos últimos 3 meses
            </CardContent></Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-primary/20"><CardHeader className="pb-2"><CardDescription>Receita Total {currentData.isFuture ? "(Projeção)" : ""}</CardDescription><CardTitle className="text-2xl text-gradient-gold">R$ {currentData.totalRevenue.toFixed(2)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Receita Assinaturas</CardDescription><CardTitle className="text-2xl">R$ {currentData.subscriptionRevenue.toFixed(2)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Taxa SaaS (0,5%)</CardDescription><CardTitle className="text-2xl">R$ {currentData.saasFee.toFixed(2)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Comissões Pagas</CardDescription><CardTitle className="text-2xl text-destructive">R$ {currentData.commissionsPaid.toFixed(2)}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Comissões Pendentes</CardDescription><CardTitle className="text-2xl text-primary">R$ {currentData.commissionsPending.toFixed(2)}</CardTitle></CardHeader></Card>
            <Card className="border-success/20"><CardHeader className="pb-2"><CardDescription>Lucro Líquido</CardDescription><CardTitle className="text-2xl text-success">R$ {(currentData.totalRevenue - currentData.commissionsPaid).toFixed(2)}</CardTitle></CardHeader></Card>
          </div>

          {!currentData.isFuture && <Card><CardHeader><CardTitle>Transações do Período</CardTitle><CardDescription>{currentData.count} pagamentos registrados</CardDescription></CardHeader></Card>}
        </>
      )}
    </div>
  );
};

// ============ PIXELS ============
const PixelsPage = () => {
  const [pixels, setPixels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPixel, setNewPixel] = useState({ platform: "facebook", pixel_id: "" });

  useEffect(() => { supabase.from("pixels").select("*").eq("owner_type", "system").then(({ data }) => { setPixels(data || []); setLoading(false); }); }, []);

  const handleAddPixel = async () => {
    if (!newPixel.pixel_id) return toast.error("Insira o ID do Pixel");
    const { data, error } = await supabase.from("pixels").insert([{ ...newPixel, owner_type: "system", pixel_type: newPixel.platform }]).select();
    if (error) toast.error(error.message);
    else { setPixels([...pixels, ...(data || [])]); setShowAdd(false); toast.success("Pixel adicionado!"); }
  };

  const togglePixel = async (id: string, active: boolean) => {
    await supabase.from("pixels").update({ active }).eq("id", id);
    setPixels(pixels.map(p => p.id === id ? { ...p, active } : p)); toast.success("Status atualizado");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="font-display text-2xl font-bold">Pixels Globais</h1><Button variant="gold" onClick={() => setShowAdd(true)}>Adicionar Pixel</Button></div>
      {showAdd && (
        <Card className="border-primary/20 bg-primary/5"><CardHeader><CardTitle>Novo Pixel</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Plataforma</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newPixel.platform} onChange={e => setNewPixel({ ...newPixel, platform: e.target.value })}>
                  <option value="facebook">Facebook</option><option value="google">Google Ads</option><option value="tiktok">TikTok</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Pixel ID</Label><Input value={newPixel.pixel_id} onChange={e => setNewPixel({ ...newPixel, pixel_id: e.target.value })} placeholder="P-12345" /></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button><Button variant="gold" onClick={handleAddPixel}>Salvar</Button></div>
          </CardContent>
        </Card>
      )}
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : pixels.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum pixel global.</CardContent></Card>
      ) : (
        <div className="grid gap-4">{pixels.map(p => (
          <Card key={p.id}><CardContent className="p-4 flex justify-between items-center">
            <div><p className="font-bold capitalize">{p.platform} <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>{p.active ? "Ativo" : "Inativo"}</span></p><p className="text-sm text-muted-foreground">{p.pixel_id}</p></div>
            <Button variant="outline" size="sm" onClick={() => togglePixel(p.id, !p.active)}>{p.active ? "Desativar" : "Ativar"}</Button>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
};

// ============ MENSAGENS SISTEMA ============
const MensagensSistemaPage = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState("all");

  useEffect(() => {
    (supabase as any).from("internal_system_messages").select("*").order("created_at", { ascending: false }).then(({ data }: any) => { setMessages(data || []); setLoading(false); });
  }, []);

  const handlePost = async () => {
    if (!title || !body) return toast.error("Preencha tudo");
    const { data, error } = await (supabase as any).from("internal_system_messages").insert([{ title, body, target_role: role === "all" ? null : role }]).select();
    if (error) toast.error(error.message);
    else { setMessages([...(data || []), ...messages]); setShowAdd(false); setTitle(""); setBody(""); toast.success("Comunicado enviado!"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="font-display text-2xl font-bold">Mensagens do Sistema</h1><Button variant="gold" onClick={() => setShowAdd(true)}>Novo Comunicado</Button></div>
      {showAdd && (
        <Card className="border-primary/20 bg-primary/5"><CardHeader><CardTitle>Novo Comunicado</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Para quem?</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={role} onChange={e => setRole(e.target.value)}>
                <option value="all">Todos</option><option value="dono">Donos</option><option value="cliente">Clientes</option><option value="profissional">Profissionais</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" /></div>
            <div className="space-y-2"><Label>Mensagem</Label><textarea className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={body} onChange={e => setBody(e.target.value)} /></div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button><Button variant="gold" onClick={handlePost}>Postar</Button></div>
          </CardContent>
        </Card>
      )}
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
        <div className="space-y-4">{messages.map((m: any) => (
          <Card key={m.id}><CardContent className="p-4">
            <div className="flex justify-between items-start mb-2"><h3 className="font-bold">{m.title}</h3><span className="text-[10px] bg-muted px-2 py-1 rounded">{m.target_role || "Todos"}</span></div>
            <p className="text-sm text-muted-foreground">{m.body}</p>
            <p className="text-[10px] text-muted-foreground mt-2">{new Date(m.created_at).toLocaleString("pt-BR")}</p>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
};

// ============ CONFIGURAÇÕES (planos + pacotes SMS/WhatsApp + taxa SaaS) ============
const ConfiguracoesPage = () => {
  const [supportPhone, setSupportPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [saasFee, setSaasFee] = useState("0.5");
  const [savingFee, setSavingFee] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [pkgForm, setPkgForm] = useState({ name: "", quantity: "100", price: "29.90", channel: "sms" });
  const [editPkg, setEditPkg] = useState<any>(null);

  useEffect(() => {
    supabase.from("integration_settings").select("base_url").eq("service_name", "support_phone").maybeSingle().then(({ data }) => {
      if (data?.base_url) setSupportPhone(data.base_url);
    });
    supabase.from("integration_settings").select("base_url").eq("service_name", "saas_fee").maybeSingle().then(({ data }) => {
      if (data?.base_url) setSaasFee(data.base_url);
    });
    (supabase as any).from("subscription_plans").select("*").order("sort_order", { ascending: true }).then(({ data }: any) => {
      setPlans(data || []); setLoadingPlans(false);
    });
    supabase.from("messaging_packages").select("*").order("created_at", { ascending: true }).then(({ data }) => setPackages(data || []));
  }, []);

  const saveSupportPhone = async () => {
    setSaving(true);
    const { error } = await supabase.from("integration_settings").upsert({
      service_name: "support_phone", environment: "production", is_active: true, base_url: supportPhone,
    }, { onConflict: "service_name,environment" });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Telefone salvo!");
  };

  const saveSaasFeeConfig = async () => {
    setSavingFee(true);
    const { error } = await supabase.from("integration_settings").upsert({
      service_name: "saas_fee", environment: "production", is_active: true, base_url: saasFee,
    }, { onConflict: "service_name,environment" });
    setSavingFee(false);
    if (error) toast.error(error.message); else toast.success("Taxa SaaS salva!");
  };

  const savePlan = async () => {
    if (!editingPlan) return;
    const { error } = await (supabase as any).from("subscription_plans").update({
      name: editingPlan.name, price: editingPlan.price, duration_months: editingPlan.duration_months,
      asaas_checkout_id: editingPlan.asaas_checkout_id, is_active: editingPlan.is_active,
    }).eq("id", editingPlan.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Plano atualizado!");
      setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
      setEditingPlan(null);
    }
  };

  const addPackage = async () => {
    if (!pkgForm.name || !pkgForm.quantity || !pkgForm.price) { toast.error("Preencha todos os campos."); return; }
    const { data, error } = await supabase.from("messaging_packages").insert({
      name: pkgForm.name, quantity: parseInt(pkgForm.quantity), price: parseFloat(pkgForm.price), channel: pkgForm.channel,
    }).select();
    if (error) toast.error(error.message);
    else { setPackages([...packages, ...(data || [])]); setShowAddPkg(false); toast.success("Pacote criado!"); setPkgForm({ name: "", quantity: "100", price: "29.90", channel: "sms" }); }
  };

  const savePackage = async () => {
    if (!editPkg) return;
    const { error } = await supabase.from("messaging_packages").update({
      name: editPkg.name, quantity: editPkg.quantity, price: editPkg.price, channel: editPkg.channel, is_active: editPkg.is_active,
    }).eq("id", editPkg.id);
    if (error) toast.error(error.message);
    else { toast.success("Pacote atualizado!"); setPackages(packages.map(p => p.id === editPkg.id ? editPkg : p)); setEditPkg(null); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader><CardTitle><Phone className="w-5 h-5 inline mr-2" />Telefone de Suporte</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="(11) 99999-0000" value={supportPhone} onChange={e => setSupportPhone(e.target.value)} />
          <Button variant="gold" onClick={saveSupportPhone} disabled={saving}>{saving ? "..." : "Salvar"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Taxa SaaS por Transação</CardTitle><CardDescription>Percentual cobrado sobre cada pagamento processado</CardDescription></CardHeader>
        <CardContent className="flex gap-2 items-center">
          <Input type="number" step="0.1" value={saasFee} onChange={e => setSaasFee(e.target.value)} className="w-32" />
          <span className="text-lg font-bold">%</span>
          <Button variant="gold" onClick={saveSaasFeeConfig} disabled={savingFee}>{savingFee ? "..." : "Salvar"}</Button>
        </CardContent>
      </Card>

      {/* Messaging Packages */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div><CardTitle><Package className="w-5 h-5 inline mr-2" />Pacotes de Mensagens</CardTitle><CardDescription>Configure pacotes SMS e WhatsApp para donos assinarem</CardDescription></div>
            <Button variant="gold" size="sm" onClick={() => setShowAddPkg(true)}><CreditCard className="w-4 h-4 mr-2" />Novo Pacote</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddPkg && (
            <div className="p-4 border rounded-lg bg-primary/5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Nome *</Label><Input value={pkgForm.name} onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })} placeholder="100 SMS" className="mt-1" /></div>
                <div><Label>Canal</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={pkgForm.channel} onChange={e => setPkgForm({ ...pkgForm, channel: e.target.value })}>
                    <option value="sms">SMS</option><option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div><Label>Quantidade</Label><Input type="number" value={pkgForm.quantity} onChange={e => setPkgForm({ ...pkgForm, quantity: e.target.value })} className="mt-1" /></div>
                <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={pkgForm.price} onChange={e => setPkgForm({ ...pkgForm, price: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="flex gap-2">
                <Button variant="gold" onClick={addPackage}>Salvar</Button>
                <Button variant="ghost" onClick={() => setShowAddPkg(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {editPkg && (
            <div className="p-4 border rounded-lg bg-primary/5 space-y-3">
              <Label className="text-sm font-medium">Editar: {editPkg.name}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={editPkg.name} onChange={e => setEditPkg({ ...editPkg, name: e.target.value })} className="mt-1" /></div>
                <div><Label>Canal</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={editPkg.channel} onChange={e => setEditPkg({ ...editPkg, channel: e.target.value })}>
                    <option value="sms">SMS</option><option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div><Label>Quantidade</Label><Input type="number" value={editPkg.quantity} onChange={e => setEditPkg({ ...editPkg, quantity: +e.target.value })} className="mt-1" /></div>
                <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={editPkg.price} onChange={e => setEditPkg({ ...editPkg, price: +e.target.value })} className="mt-1" /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editPkg.is_active} onCheckedChange={v => setEditPkg({ ...editPkg, is_active: v })} />
                <Label>Ativo</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="gold" onClick={savePackage}>Salvar</Button>
                <Button variant="ghost" onClick={() => setEditPkg(null)}>Cancelar</Button>
              </div>
            </div>
          )}

          {packages.length === 0 && !showAddPkg ? (
            <p className="text-sm text-muted-foreground">Nenhum pacote configurado.</p>
          ) : packages.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border">
              <Package className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.quantity} {p.channel === 'sms' ? 'SMS' : 'WhatsApp'} • R$ {Number(p.price).toFixed(2)}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{p.is_active ? "Ativo" : "Inativo"}</span>
              <Button variant="outline" size="sm" onClick={() => setEditPkg({ ...p })}><Edit className="w-4 h-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Planos de Assinatura</CardTitle>
          <CardDescription>Edite valores, nomes e links de checkout dos planos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingPlans ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum plano cadastrado.</p>
          ) : plans.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <div className="flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.duration_months === 0 ? "Grátis" : `${p.duration_months} mês(es)`} • R$ {Number(p.price).toFixed(2)}</p>
                {p.asaas_checkout_id && <p className="text-xs text-muted-foreground">Checkout: {p.asaas_checkout_id}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{p.is_active ? "Ativo" : "Inativo"}</span>
              <Button variant="outline" size="sm" onClick={() => setEditingPlan({ ...p })}><Edit className="w-4 h-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {editingPlan && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="text-sm">Editar Plano: {editingPlan.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={editingPlan.price} onChange={e => setEditingPlan({ ...editingPlan, price: +e.target.value })} className="mt-1" /></div>
              <div><Label>Duração (meses)</Label><Input type="number" value={editingPlan.duration_months} onChange={e => setEditingPlan({ ...editingPlan, duration_months: +e.target.value })} className="mt-1" /></div>
              <div><Label>ASAAS Checkout ID</Label><Input value={editingPlan.asaas_checkout_id || ""} onChange={e => setEditingPlan({ ...editingPlan, asaas_checkout_id: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editingPlan.is_active} onChange={e => setEditingPlan({ ...editingPlan, is_active: e.target.checked })} className="rounded" />
                Plano Ativo
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={savePlan}>Salvar</Button>
              <Button variant="ghost" onClick={() => setEditingPlan(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
