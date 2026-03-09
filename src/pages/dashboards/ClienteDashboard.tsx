import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar, Gift, History, Bell, User, LogOut, Menu, X, QrCode,
  Users, Clock, Search, MapPin, Star, ChevronRight, Phone, Wallet, MessageCircle, FileText, Loader2, ClipboardList, Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import { formatWhatsAppBR } from "@/lib/input-masks";
import SejaAfiliadoPage from "@/components/shared/SejaAfiliadoPage";

const ClienteDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/app";

  const navigation = [
    { name: "Agendar", href: basePath, icon: Calendar },
    { name: "Meus Agendamentos", href: `${basePath}/agendamentos`, icon: Clock },
    { name: "Minhas Dívidas", href: `${basePath}/dividas`, icon: Wallet },
    { name: "Serviços Contábeis", href: `${basePath}/servicos-contabeis`, icon: FileText },
    { name: "Cashback", href: `${basePath}/cashback`, icon: Gift },
    { name: "Histórico", href: `${basePath}/historico`, icon: History },
    { name: "Indique Amigos", href: `${basePath}/indicar`, icon: Users },
    { name: "Ação entre Amigos", href: `${basePath}/acao-entre-amigos`, icon: Gift },
    { name: "Suporte", href: `${basePath}/suporte`, icon: MessageCircle },
    { name: "Notificações", href: `${basePath}/notificacoes`, icon: Bell },
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
              <span className="font-display font-bold text-lg text-sidebar-primary">SalãoCashBack</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground/60" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 border-b border-sidebar-border">
            <p className="font-medium truncate text-sidebar-foreground">{profile?.name || "Cliente"}</p>
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
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={signOut}><LogOut className="w-5 h-5" />Sair</Button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link to={`${basePath}/notificacoes`}><Button variant="ghost" size="icon"><Bell className="w-5 h-5" /></Button></Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="agendamentos" element={<AgendamentosPage />} />
            <Route path="dividas" element={<MinhasDividasPage />} />
            <Route path="servicos-contabeis" element={<ServicosContabeisPage />} />
            <Route path="cashback" element={<CashbackPage />} />
            <Route path="historico" element={<HistoricoPage />} />
            <Route path="indicar" element={<IndicarPage />} />
            <Route path="acao-entre-amigos" element={<AcaoEntreAmigosPage />} />
            <Route path="rifas" element={<AcaoEntreAmigosPage />} />
            <Route path="suporte" element={<SuporteClientePage />} />
            <Route path="notificacoes" element={<NotificacoesPage />} />
            <Route path="perfil" element={<PerfilPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const MOCK_BARBERSHOPS = [
  { id: "1", name: "Barbearia Teste", address: "Rua das Flores, 123", rating: 4.8, services: 5 },
  { id: "2", name: "Corte & Estilo", address: "Av. Principal, 456", rating: 4.5, services: 8 },
  { id: "3", name: "Barbearia Premium", address: "Rua Central, 789", rating: 4.9, services: 6 },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const filtered = MOCK_BARBERSHOPS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold">Olá! 👋</h1><p className="text-muted-foreground">Encontre uma barbearia e agende seu horário</p></div>
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => navigate("/app/agendamentos")} className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center hover:bg-primary/20 transition-colors">
          <Clock className="w-6 h-6 text-primary mx-auto mb-1" /><span className="text-xs font-medium text-primary">Meus Agendamentos</span>
        </button>
        <button onClick={() => navigate("/app/cashback")} className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center hover:bg-primary/20 transition-colors">
          <Gift className="w-6 h-6 text-primary mx-auto mb-1" /><span className="text-xs font-medium text-primary">Meu Cashback</span>
        </button>
        <button onClick={() => navigate("/app/dividas")} className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center hover:bg-destructive/20 transition-colors">
          <Wallet className="w-6 h-6 text-destructive mx-auto mb-1" /><span className="text-xs font-medium text-destructive">Dívidas</span>
        </button>
      </div>
      <div className="relative"><Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" /><Input placeholder="Buscar barbearia..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Barbearias Disponíveis</h2>
        {filtered.map((shop) => (
          <Card key={shop.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => toast.success(`Abrindo ${shop.name}... (Simulação)`)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><span className="text-xl">✂️</span></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{shop.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {shop.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3 fill-yellow-500" /> {shop.rating}</span>
                  <span className="text-xs text-muted-foreground">• {shop.services} serviços</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const AgendamentosPage = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Meus Agendamentos</h1>
        <Button variant="gold" onClick={() => navigate("/app")}><Calendar className="w-4 h-4 mr-2" />Novo</Button>
      </div>
      <Card><CardContent className="py-12 text-center"><Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum agendamento encontrado.</p><Button variant="gold" className="mt-4" onClick={() => navigate("/app")}>Fazer meu primeiro agendamento</Button></CardContent></Card>
    </div>
  );
};

// ============ MINHAS DÍVIDAS (view for client) ============

const MinhasDividasPage = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("debts").select("*, barbershops:barbershop_id(name)")
      .eq("client_user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setDebts(data || []); setLoading(false); });
  }, [user]);

  const totalPending = debts.filter(d => d.status === 'pending').reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Minhas Dívidas</h1>
      {totalPending > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Total Pendente</p><p className="text-2xl font-bold text-destructive">R$ {totalPending.toFixed(2)}</p></div>
            <Wallet className="w-8 h-8 text-destructive" />
          </CardContent>
        </Card>
      )}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : debts.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma dívida pendente. Tudo certo! 🎉</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {debts.map(d => (
            <Card key={d.id}><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{(d as any).barbershops?.name || "Barbearia"}</p>
                  <p className="text-sm text-muted-foreground">{d.description || "Fiado"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">R$ {Number(d.amount).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'pending' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                    {d.status === 'pending' ? 'Pendente' : 'Pago'}
                  </span>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};

const CashbackPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Meu Cashback</h1>
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader><CardDescription>Saldo Disponível</CardDescription><CardTitle className="text-4xl text-gradient-gold">R$ 0,00</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground mb-3">Use seu cashback no próximo agendamento!</p><Button variant="gold" size="sm" onClick={() => toast.info("Cashback será aplicado automaticamente no próximo agendamento.")}>Como usar?</Button></CardContent>
    </Card>
    <Card><CardHeader><CardTitle>Histórico de Cashback</CardTitle></CardHeader>
      <CardContent className="text-center py-8"><Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum cashback recebido ainda.</p></CardContent>
    </Card>
  </div>
);

const HistoricoPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Histórico</h1>
    <Card><CardContent className="py-12 text-center"><History className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum histórico encontrado.</p></CardContent></Card>
  </div>
);

const IndicarPage = () => {
  const referralCode = "SCB-TESTE01";
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Indique e Ganhe</h1>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader><CardTitle>Ganhe cashback indicando amigos!</CardTitle><CardDescription>Quando seu amigo fizer o primeiro agendamento, vocês dois ganham R$ 10,00 de cashback.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="text-xs text-muted-foreground">SEU CÓDIGO DE INDICAÇÃO</Label>
            <div className="p-4 bg-background rounded-lg flex items-center justify-between mt-1 border border-border">
              <code className="text-lg font-bold text-primary">{referralCode}</code>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(`salao.app/r/${referralCode}`); toast.success("Link copiado!"); }}>Copiar Link</Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="gold" className="flex-1" onClick={() => toast.info("QR Code: " + referralCode)}><QrCode className="w-4 h-4 mr-2" />Ver QR Code</Button>
            <Button variant="outline" className="flex-1" onClick={() => { if (navigator.share) navigator.share({ title: "SalãoCashBack", url: `https://salao.app/r/${referralCode}` }); else toast.info("Compartilhe: salao.app/r/" + referralCode); }}>Compartilhar</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center"><CardContent className="pt-4 pb-4"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Indicados</p></CardContent></Card>
        <Card className="text-center"><CardContent className="pt-4 pb-4"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Convertidos</p></CardContent></Card>
        <Card className="text-center border-primary/20"><CardContent className="pt-4 pb-4"><p className="text-2xl font-bold text-gradient-gold">R$ 0</p><p className="text-xs text-muted-foreground">Ganhos</p></CardContent></Card>
      </div>
    </div>
  );
};

const NotificacoesPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => setNotifications(data || []));
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Notificações</h1>
      {notifications.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma notificação.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className={!n.is_read ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="p-4">
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ============ SUPORTE (com chat real) ============

const SuporteClientePage = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("support_chats").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).then(({ data }) => {
      setChats(data || []);
      if (data && data.length > 0) { setActiveChat(data[0]); loadMessages(data[0].id); }
    });
  }, [user]);

  const loadMessages = async (chatId: string) => {
    const { data } = await supabase.from("support_messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const startNewChat = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("support_chats").insert({ user_id: user.id }).select().single();
    if (error) { toast.error("Erro ao iniciar chat."); return; }
    setActiveChat(data);
    setChats([data, ...chats]);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeChat || !user) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      chat_id: activeChat.id, sender_id: user.id, message: newMsg.trim(), is_from_support: false,
    });
    setSending(false);
    if (error) { toast.error("Erro ao enviar."); return; }
    setNewMsg("");
    loadMessages(activeChat.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Suporte</h1>
        <Button variant="gold" onClick={startNewChat}><MessageCircle className="w-4 h-4 mr-2" />Nova Conversa</Button>
      </div>
      {!activeChat ? (
        <Card><CardContent className="py-12 text-center"><MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum chat aberto.</p><Button variant="gold" className="mt-4" onClick={startNewChat}>Iniciar Conversa</Button></CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="border-b"><CardTitle className="text-sm">Chat #{activeChat.id.slice(0,8)} • {activeChat.status}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="h-80 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Envie sua primeira mensagem.</p>
              ) : messages.map(m => (
                <div key={m.id} className={`flex ${m.is_from_support ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${m.is_from_support ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'}`}>
                    {m.message}
                    <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2">
              <Input placeholder="Digite sua mensagem..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
              <Button variant="gold" onClick={sendMessage} disabled={sending}>Enviar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const PerfilPage = () => {
  const { profile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "" });
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({ name: profile?.name || "", whatsapp: profile?.whatsapp || "" });
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: form.name, whatsapp: form.whatsapp || null }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Perfil atualizado!"); setEditing(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Meu Perfil</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-8 h-8 text-primary" /></div>
            <div><p className="font-bold text-lg">{profile?.name || "Cliente"}</p><p className="text-sm text-muted-foreground">Perfil Ativo</p></div>
          </div>
          {editing ? (
            <>
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: formatWhatsAppBR(e.target.value) })} className="mt-1" placeholder="(11) 99999-0000" /></div>
              <div className="flex gap-2"><Button variant="gold" onClick={saveProfile} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button></div>
            </>
          ) : (
            <>
              <div className="grid gap-3">
                <div className="p-3 bg-muted rounded-lg"><label className="text-xs text-muted-foreground">Nome</label><p className="font-medium">{profile?.name || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><label className="text-xs text-muted-foreground">WhatsApp</label><p className="font-medium">{profile?.whatsapp || "-"}</p></div>
                <div className="p-3 bg-muted rounded-lg"><label className="text-xs text-muted-foreground">E-mail</label><p className="font-medium">{profile?.email || "-"}</p></div>
              </div>
              <Button variant="gold" className="w-full" onClick={startEdit}>Editar Perfil</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============ SERVIÇOS CONTÁBEIS (cliente solicita) ============
const ServicosContabeisPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ service_type: "mei_declaration", description: "" });

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("fiscal_service_requests").select("*").eq("client_user_id", user.id).order("created_at", { ascending: false }).then(({ data }: any) => { setRequests(data || []); setLoading(false); });
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await (supabase as any).from("fiscal_service_requests").insert({ client_user_id: user.id, service_type: form.service_type, description: form.description || null });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Pedido enviado ao contador!");
    setShowForm(false); setForm({ service_type: "mei_declaration", description: "" });
    (supabase as any).from("fiscal_service_requests").select("*").eq("client_user_id", user.id).order("created_at", { ascending: false }).then(({ data }: any) => setRequests(data || []));
  };

  const serviceLabels: Record<string, string> = { mei_declaration: "Declaração MEI", me_declaration: "Declaração ME", income_tax: "Imposto de Renda", cnpj_opening: "Abertura de CNPJ", cnpj_closing: "Encerramento de CNPJ", other: "Outro" };
  const statusLabels: Record<string, string> = { pending: "Pendente", accepted: "Aceito", in_progress: "Em Andamento", completed: "Concluído", rejected: "Rejeitado" };
  const statusColors: Record<string, string> = { pending: "bg-primary/10 text-primary", accepted: "bg-blue-500/10 text-blue-600", in_progress: "bg-yellow-500/10 text-yellow-600", completed: "bg-success/10 text-success", rejected: "bg-destructive/10 text-destructive" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Serviços Contábeis</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}><ClipboardList className="w-4 h-4 mr-2" />Solicitar</Button>
      </div>
      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle>Solicitar Serviço</CardTitle><CardDescription>Envie seu pedido para um contador da plataforma</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Tipo de Serviço</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })}>
                {Object.entries(serviceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><Label>Descrição / Observações</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalhes do que precisa..." className="mt-1" /></div>
            <div className="flex gap-2"><Button variant="gold" onClick={handleSubmit} disabled={saving}>{saving ? "Enviando..." : "Enviar Pedido"}</Button><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
          </CardContent>
        </Card>
      )}
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : requests.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum pedido realizado.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">{requests.map(r => (
          <Card key={r.id}><CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div><p className="font-semibold">{serviceLabels[r.service_type] || r.service_type}</p>{r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}<p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p></div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[r.status] || ""}`}>{statusLabels[r.status] || r.status}</span>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
};

const AcaoEntreAmigosPage = () => {
  const [raffles, setRaffles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("raffles").select("*").eq("status", "open").order("created_at", { ascending: false }).then(({ data }) => {
      setRaffles(data || []); setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Ação entre Amigos</h1>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader><CardTitle>Participe e ganhe créditos!</CardTitle><CardDescription>O valor do prêmio é convertido em saldo para você usar no salão.</CardDescription></CardHeader>
      </Card>
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : raffles.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma ação aberta no momento.</CardContent></Card>
      ) : (
        <div className="grid gap-4">{raffles.map(r => (
          <Card key={r.id}><CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold">{r.name}</h3>
              <p className="text-sm text-muted-foreground">Prêmio: <span className="text-primary font-bold">R$ {Number(r.credit_award).toFixed(2)} em créditos</span></p>
              <p className="text-xs text-muted-foreground">Preço do Bilhete: R$ {Number(r.ticket_price).toFixed(2)}</p>
            </div>
            <Button variant="gold" size="sm" onClick={() => toast.success("Bilhete adquirido! (Simulação)")}>Garantir Bilhete</Button>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
};

export default ClienteDashboard;

