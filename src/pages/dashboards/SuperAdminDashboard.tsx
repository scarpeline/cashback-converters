import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  Settings,
  Shield,
  Image,
  MessageCircle,
  Bell,
  Calculator,
  LogOut,
  Menu,
  X,
  Activity,
  CheckCircle,
  TrendingUp,
  Plug,
  Loader2,
  Send
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
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link to={basePath} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <span className="font-display font-bold text-lg">Super Admin</span>
            </Link>
            <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-border">
            <p className="font-medium truncate">{profile?.name || "Admin"}</p>
            <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive(item.href) ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={signOut}>
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
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
            <Route path="suporte" element={<SuportePage />} />
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
    <Activity className="w-4 h-4" />
    <span>Sistema OK</span>
  </div>
);

const DashboardHome = () => {
  const [stats, setStats] = useState({ users: 0, barbershops: 0, affiliates: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("barbershops").select("id", { count: "exact", head: true }),
      supabase.from("affiliates").select("id", { count: "exact", head: true }),
    ]).then(([p, b, a]) => {
      setStats({
        users: p.count || 0,
        barbershops: b.count || 0,
        affiliates: a.count || 0,
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Painel Super Admin</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      <Card className="border-success/20 bg-success/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <CardTitle>Sistema Operacional</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {["Auth", "ASAAS", "Split", "Mensagens"].map(s => (
              <div key={s} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /><span>{s}</span></div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total de Usuários</CardDescription><CardTitle className="text-2xl">{stats.users}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Barbearias Ativas</CardDescription><CardTitle className="text-2xl">{stats.barbershops}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Afiliados Ativos</CardDescription><CardTitle className="text-2xl">{stats.affiliates}</CardTitle></CardHeader></Card>
        <Card className="bg-gradient-card border-primary/20"><CardHeader className="pb-2"><CardDescription>Receita do Mês</CardDescription><CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle></CardHeader></Card>
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
    if (!title || !message) {
      toast.error("Preencha título e mensagem.");
      return;
    }
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

    if (userIds.length === 0) {
      toast.error("Nenhum usuário encontrado para o filtro selecionado.");
      setSending(false);
      return;
    }

    // Always save in-app notifications
    const notifications = userIds.map(uid => ({
      user_id: uid,
      title,
      message,
      type: "info" as const,
      priority: "normal" as const,
    }));
    const { error } = await supabase.from("notifications").insert(notifications);

    // If SMS or WhatsApp, also send via Twilio
    if (channel === "sms" || channel === "whatsapp") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("whatsapp")
        .in("user_id", userIds);

      const phones = profiles?.map(p => p.whatsapp).filter(Boolean) || [];
      let sentCount = 0;

      for (const phone of phones) {
        try {
          await supabase.functions.invoke("send-sms", {
            body: {
              action: channel === "whatsapp" ? "whatsapp" : "sms",
              to: phone,
              body: `${title}: ${message}`,
            },
          });
          sentCount++;
        } catch (e) {
          console.error(`[NOTIF] Failed to send ${channel} to ${phone}:`, e);
        }
      }

      toast.success(`${sentCount} ${channel.toUpperCase()} enviado(s) + ${userIds.length} notificação(ões) no app!`);
    } else {
      if (error) {
        toast.error("Erro: " + error.message);
      } else {
        toast.success(`Notificação enviada para ${userIds.length} usuário(s)!`);
      }
    }

    setSending(false);
    setTitle("");
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Enviar Notificação</h1>

      <Card>
        <CardHeader>
          <CardTitle>Destinatários</CardTitle>
          <CardDescription>Selecione quem receberá a notificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "donos", "profissionais", "clientes"] as const).map((t) => (
              <Button
                key={t}
                variant={target === t ? "gold" : "outline"}
                size="sm"
                onClick={() => setTarget(t)}
              >
                {t === "all" ? "Todos" : t === "donos" ? "Donos" : t === "profissionais" ? "Profissionais" : "Clientes"}
              </Button>
            ))}
          </div>

          <div>
            <Label>Canal de Envio</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {([
                { key: "app" as const, label: "📱 App (interno)" },
                { key: "sms" as const, label: "💬 SMS" },
                { key: "whatsapp" as const, label: "📲 WhatsApp" },
              ]).map((c) => (
                <Button
                  key={c.key}
                  variant={channel === c.key ? "gold" : "outline"}
                  size="sm"
                  onClick={() => setChannel(c.key)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Título *</Label>
            <Input placeholder="Título da notificação" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Mensagem *</Label>
            <Input placeholder="Corpo da mensagem..." value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1" />
          </div>
          {channel !== "app" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
              <Bell className="w-3 h-3" />
              <span>{channel === "sms" ? "SMS será enviado via Twilio para números cadastrados." : "WhatsApp será enviado via Twilio API."}</span>
            </div>
          )}
          <Button variant="gold" onClick={handleSend} disabled={sending}>
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Enviando..." : `Enviar via ${channel === "app" ? "App" : channel.toUpperCase()}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ OTHER PAGES ============

const UsuariosPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("*, user_roles(role)").limit(50).then(({ data }) => {
      setUsers(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Usuários</h1>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : users.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum usuário.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email} {u.whatsapp ? `• ${u.whatsapp}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  {u.user_roles?.map((r: any) => (
                    <span key={r.role} className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">{r.role}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const BarbeariasPage = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "trial" | "incomplete" | "delinquent">("all");

  useEffect(() => {
    supabase.from("barbershops").select("*, profiles:owner_user_id(name, email, whatsapp)").then(({ data }) => {
      setShops(data || []);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const filtered = shops.filter((s) => {
    if (filter === "all") return true;
    if (filter === "active") return s.subscription_status === "active" || s.subscription_status === "paid";
    if (filter === "trial") return s.subscription_status === "trial" || !s.subscription_status;
    if (filter === "incomplete") return !s.phone && !s.address;
    if (filter === "delinquent") {
      if (!s.subscription_ends_at) return false;
      return new Date(s.subscription_ends_at) < now && s.subscription_status !== "active";
    }
    return true;
  });

  const counts = {
    all: shops.length,
    active: shops.filter(s => s.subscription_status === "active" || s.subscription_status === "paid").length,
    trial: shops.filter(s => s.subscription_status === "trial" || !s.subscription_status).length,
    incomplete: shops.filter(s => !s.phone && !s.address).length,
    delinquent: shops.filter(s => s.subscription_ends_at && new Date(s.subscription_ends_at) < now && s.subscription_status !== "active").length,
  };

  const filterLabels: Record<string, string> = {
    all: "Todos",
    active: "Assinantes",
    trial: "Em Teste",
    incomplete: "Incompletos",
    delinquent: "Inadimplentes",
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Barbearias</h1>

      <div className="flex flex-wrap gap-2">
        {(["all", "active", "trial", "incomplete", "delinquent"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "gold" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {filterLabels[f]} ({counts[f]})
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma barbearia nesta categoria.</p></CardContent></Card>
      ) : filtered.map(s => (
        <Card key={s.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  Dono: {(s as any).profiles?.name || "N/A"} • {(s as any).profiles?.email || ""} {(s as any).profiles?.whatsapp ? `• ${(s as any).profiles.whatsapp}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.phone || "Sem tel"} • {s.address || "Sem endereço"}
                  {s.subscription_ends_at && ` • Expira: ${new Date(s.subscription_ends_at).toLocaleDateString("pt-BR")}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.subscription_status === "active" || s.subscription_status === "paid"
                    ? "bg-success/10 text-success"
                    : s.subscription_status === "trial" || !s.subscription_status
                      ? "bg-secondary/10 text-secondary"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                  {s.subscription_status === "active" || s.subscription_status === "paid" ? "Ativo" : s.subscription_status === "trial" || !s.subscription_status ? "Trial" : s.subscription_status}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${s.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {s.is_active ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const AfiliadosPage = () => {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  useEffect(() => { supabase.from("affiliates").select("*, profiles:user_id(name, email)").then(({ data }) => setAffiliates(data || [])); }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Afiliados</h1>
      {affiliates.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum afiliado.</p></CardContent></Card>
      ) : affiliates.map(a => (
        <Card key={a.id}><CardContent className="p-4 flex items-center gap-4">
          <Users className="w-5 h-5 text-primary" />
          <div className="flex-1"><p className="font-semibold">{(a as any).profiles?.name || "Afiliado"}</p><p className="text-sm text-muted-foreground">Código: {a.referral_code}</p></div>
          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">{a.type}</span>
        </CardContent></Card>
      ))}
    </div>
  );
};

const ContadoresPage = () => {
  const [accountants, setAccountants] = useState<any[]>([]);
  useEffect(() => { supabase.from("accountants").select("*").then(({ data }) => setAccountants(data || [])); }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Contadores</h1>
      {accountants.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum contador.</p></CardContent></Card>
      ) : accountants.map(a => (
        <Card key={a.id}><CardContent className="p-4 flex items-center gap-4">
          <Calculator className="w-5 h-5 text-primary" />
          <div className="flex-1"><p className="font-semibold">{a.name}</p><p className="text-sm text-muted-foreground">{a.email}</p></div>
        </CardContent></Card>
      ))}
    </div>
  );
};

const FinanceiroPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Financeiro</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-card border-primary/20"><CardHeader><CardDescription>Receita Total</CardDescription><CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>Taxa SaaS</CardDescription><CardTitle className="text-2xl">R$ 0,00</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>Comissões Pagas</CardDescription><CardTitle className="text-2xl">R$ 0,00</CardTitle></CardHeader></Card>
    </div>
  </div>
);

const PixelsPage = () => {
  const [pixels, setPixels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPixel, setNewPixel] = useState({ platform: "facebook", pixel_id: "", is_active: true });

  useEffect(() => {
    supabase.from("pixels").select("*").eq("owner_type", "system").then(({ data }) => {
      setPixels(data || []);
      setLoading(false);
    });
  }, []);

  const handleAddPixel = async () => {
    if (!newPixel.pixel_id) return toast.error("Insira o ID do Pixel");
    const { data, error } = await supabase.from("pixels").insert([{
      ...newPixel,
      owner_type: "system",
      pixel_type: newPixel.platform
    }]).select();

    if (error) toast.error(error.message);
    else {
      setPixels([...pixels, ...data]);
      setShowAdd(false);
      toast.success("Pixel adicionado!");
    }
  };

  const togglePixel = async (id: string, active: boolean) => {
    const { error } = await supabase.from("pixels").update({ active }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      setPixels(pixels.map(p => p.id === id ? { ...p, active } : p));
      toast.success("Status atualizado");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Pixels Globais</h1>
        <Button variant="gold" onClick={() => setShowAdd(true)}>Adicionar Pixel</Button>
      </div>

      {showAdd && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle>Novo Pixel</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newPixel.platform}
                  onChange={e => setNewPixel({ ...newPixel, platform: e.target.value })}
                >
                  <option value="facebook">Facebook</option>
                  <option value="google">Google Ads</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Pixel ID / AW-ID</Label>
                <Input value={newPixel.pixel_id} onChange={e => setNewPixel({ ...newPixel, pixel_id: e.target.value })} placeholder="P-12345678" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button variant="gold" onClick={handleAddPixel}>Salvar Pixel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : pixels.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum pixel global.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {pixels.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold flex items-center gap-2">
                    <span className="capitalize">{p.platform}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">{p.pixel_id}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => togglePixel(p.id, !p.active)}>
                  {p.active ? "Desativar" : "Ativar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const MensagensSistemaPage = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState("all");

  useEffect(() => {
    (supabase as any).from("internal_system_messages").select("*").order("created_at", { ascending: false }).then(({ data }: any) => {
      setMessages(data || []);
      setLoading(false);
    });
  }, []);

  const handlePost = async () => {
    if (!title || !body) return toast.error("Preencha tudo");
    const { data, error } = await (supabase as any).from("internal_system_messages").insert([{
      title, body, target_role: role === "all" ? null : role
    }]).select();

    if (error) toast.error(error.message);
    else {
      setMessages([...(data || []), ...messages]);
      setShowAdd(false);
      setTitle("");
      setBody("");
      toast.success("Comunicado enviado!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Mensagens do Sistema</h1>
        <Button variant="gold" onClick={() => setShowAdd(true)}>Novo Comunicado</Button>
      </div>

      {showAdd && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle>Novo Comunicado Geral</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Para quem?</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="dono">Apenas Donos</option>
                <option value="cliente">Apenas Clientes</option>
                <option value="profissional">Apenas Profissionais</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Manutenção agendada" />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Conteúdo do comunicado..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button variant="gold" onClick={handlePost}>Postar Mensagem</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
        <div className="space-y-4">
          {messages.map(m => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{m.title}</h3>
                  <span className="text-[10px] bg-muted px-2 py-1 rounded">
                    {m.target_role ? `Role: ${m.target_role}` : "Todos"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{m.body}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {new Date(m.created_at).toLocaleString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const SuportePage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Suporte</h1>
    <Card><CardContent className="py-8 text-center"><MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum chat aberto.</p></CardContent></Card>
  </div>
);

const ConfiguracoesPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Configurações</h1>
    <div className="grid gap-4">
      <Card>
        <CardHeader><CardTitle>Planos e Preços</CardTitle><CardDescription>Configure os valores dos planos</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[{ l: "7 dias grátis", v: "R$ 0,00" }, { l: "Mês 1", v: "R$ 19,90" }, { l: "Mês 2+", v: "R$ 29,90" }, { l: "3 meses", v: "R$ 79,90" }, { l: "6 meses", v: "R$ 145,90" }, { l: "12 meses", v: "R$ 199,90" }].map(p => (
              <div key={p.l} className="p-3 bg-muted rounded-lg"><p className="text-muted-foreground">{p.l}</p><p className="font-bold">{p.v}</p></div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Taxa SaaS</CardTitle></CardHeader>
        <CardContent><div className="p-3 bg-muted rounded-lg inline-block"><p className="text-2xl font-bold text-gradient-gold">0,5%</p></div></CardContent>
      </Card>
    </div>
  </div>
);

export default SuperAdminDashboard;
