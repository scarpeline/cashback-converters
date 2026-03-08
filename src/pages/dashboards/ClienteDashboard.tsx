import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar, Gift, History, Bell, User, LogOut, Menu, X, QrCode,
  Users, Clock, Search, MapPin, Star, ChevronRight, Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import { formatWhatsAppBR } from "@/lib/input-masks";

const ClienteDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/app";

  const navigation = [
    { name: "Agendar", href: basePath, icon: Calendar },
    { name: "Meus Agendamentos", href: `${basePath}/agendamentos`, icon: Clock },
    { name: "Cashback", href: `${basePath}/cashback`, icon: Gift },
    { name: "Histórico", href: `${basePath}/historico`, icon: History },
    { name: "Indique Amigos", href: `${basePath}/indicar`, icon: Users },
    { name: "Ação entre Amigos", href: `${basePath}/acao-entre-amigos`, icon: Gift },
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
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link to={basePath} className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-display font-bold text-lg text-gradient-gold">SalãoCashBack</span>
            </Link>
            <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 border-b border-border">
            <p className="font-medium truncate">{profile?.name || "Cliente"}</p>
            <p className="text-sm text-muted-foreground truncate">{profile?.whatsapp || profile?.email}</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <item.icon className="w-5 h-5" />{item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={signOut}><LogOut className="w-5 h-5" />Sair</Button>
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
            <Route path="cashback" element={<CashbackPage />} />
            <Route path="historico" element={<HistoricoPage />} />
            <Route path="indicar" element={<IndicarPage />} />
            <Route path="acao-entre-amigos" element={<AcaoEntreAmigosPage />} />
            <Route path="rifas" element={<AcaoEntreAmigosPage />} />
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
        <button onClick={() => navigate("/app/indicar")} className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center hover:bg-primary/20 transition-colors">
          <Users className="w-6 h-6 text-primary mx-auto mb-1" /><span className="text-xs font-medium text-primary">Indicar</span>
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
      <div className="flex gap-2">{["Próximos", "Concluídos", "Cancelados"].map((tab, i) => (
        <button key={tab} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{tab}</button>
      ))}</div>
      <Card><CardContent className="py-12 text-center"><Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum agendamento encontrado.</p><Button variant="gold" className="mt-4" onClick={() => navigate("/app")}>Fazer meu primeiro agendamento</Button></CardContent></Card>
    </div>
  );
};

const CashbackPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Meu Cashback</h1>
    <Card className="bg-gradient-card border-primary/20">
      <CardHeader><CardDescription>Saldo Disponível</CardDescription><CardTitle className="text-4xl text-gradient-gold">R$ 0,00</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground mb-3">Use seu cashback no próximo agendamento!</p><Button variant="gold" size="sm" onClick={() => toast.info("Cashback será aplicado automaticamente no próximo agendamento.")}>Como usar?</Button></CardContent>
    </Card>
    <Card><CardHeader><CardTitle>Histórico de Cashback</CardTitle></CardHeader>
      <CardContent className="text-center py-8"><Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum cashback recebido ainda.</p><p className="text-sm text-muted-foreground mt-2">Faça um agendamento para começar a ganhar!</p></CardContent>
    </Card>
  </div>
);

const HistoricoPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Histórico</h1>
    <div className="flex gap-2">{["Todos", "Pagamentos", "Cashback"].map((tab, i) => (
      <button key={tab} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{tab}</button>
    ))}</div>
    <Card><CardContent className="py-12 text-center"><History className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum histórico encontrado.</p></CardContent></Card>
  </div>
);

const IndicarPage = () => {
  const referralCode = "SCB-TESTE01";
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Indique e Ganhe</h1>
      <Card className="bg-gradient-card border-primary/20">
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
        <Card className="text-center bg-gradient-card border-primary/20"><CardContent className="pt-4 pb-4"><p className="text-2xl font-bold text-gradient-gold">R$ 0</p><p className="text-xs text-muted-foreground">Ganhos</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Quero ser Afiliado SaaS</CardTitle><CardDescription>Indique barbearias para usar o SalãoCashBack e ganhe comissões recorrentes!</CardDescription></CardHeader>
        <CardContent><Button variant="outline" className="w-full" onClick={() => toast.info("Entre em contato pelo WhatsApp para se tornar um Afiliado SaaS.")}>Saber mais sobre o programa</Button></CardContent>
      </Card>
    </div>
  );
};

const NotificacoesPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Notificações</h1>
    <Card><CardContent className="py-12 text-center"><Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma notificação.</p><p className="text-sm text-muted-foreground mt-2">As notificações de agendamentos e cashback aparecerão aqui.</p></CardContent></Card>
  </div>
);

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
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader><CardTitle>Participe e ganhe créditos!</CardTitle><CardDescription>O valor do prêmio é convertido em saldo para você usar no salão.</CardDescription></CardHeader>
      </Card>
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
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
