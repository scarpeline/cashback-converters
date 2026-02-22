import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LayoutDashboard,
  Calendar, 
  Users, 
  Scissors,
  DollarSign,
  Package,
  Gift,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  TrendingUp,
  MessageCircle,
  Image,
  Plus,
  CheckCircle,
  Clock,
  ChevronRight,
  Phone,
  Send
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

const DonoDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/painel-dono";
  
  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Agendamentos", href: `${basePath}/agendamentos`, icon: Calendar },
    { name: "Profissionais", href: `${basePath}/profissionais`, icon: Users },
    { name: "Serviços", href: `${basePath}/servicos`, icon: Scissors },
    { name: "Financeiro", href: `${basePath}/financeiro`, icon: DollarSign },
    { name: "Estoque", href: `${basePath}/estoque`, icon: Package },
    { name: "Cashback", href: `${basePath}/cashback`, icon: Gift },
    { name: "Notificações", href: `${basePath}/notificacoes`, icon: Bell },
    { name: "Pixels & Marketing", href: `${basePath}/pixels`, icon: Image },
    { name: "Suporte", href: `${basePath}/suporte`, icon: MessageCircle },
    { name: "Configurações", href: `${basePath}/configuracoes`, icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === basePath) return location.pathname === basePath || location.pathname === `${basePath}/`;
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link to={basePath} className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-display font-bold text-lg text-gradient-gold">
                Painel Dono
              </span>
            </Link>
            <button 
              className="lg:hidden text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-border">
            <p className="font-medium truncate">{profile?.name || "Dono"}</p>
            <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors
                  ${isActive(item.href) 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card">
          <button 
            className="lg:hidden text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-4">
            <Link to={`${basePath}/notificacoes`}>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="agendamentos" element={<AgendamentosPage />} />
            <Route path="profissionais" element={<ProfissionaisPage />} />
            <Route path="servicos" element={<ServicosPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="estoque" element={<EstoquePage />} />
            <Route path="cashback" element={<CashbackPage />} />
            <Route path="notificacoes" element={<NotificacoesDonoPage />} />
            <Route path="pixels" element={<PixelsPage />} />
            <Route path="suporte" element={<SuportePage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// ============ HOOKS ============

function useBarbershop() {
  const { user } = useAuth();
  const [barbershop, setBarbershop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("barbershops")
      .select("*")
      .eq("owner_user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setBarbershop(data);
        setLoading(false);
      });
  }, [user]);

  return { barbershop, loading };
}

function useServices(barbershopId: string | undefined) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!barbershopId) return;
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("is_active", true);
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [barbershopId]);
  return { services, loading, refetch: fetch };
}

function useProfessionals(barbershopId: string | undefined) {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!barbershopId) return;
    const { data } = await supabase
      .from("professionals")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("is_active", true);
    setProfessionals(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [barbershopId]);
  return { professionals, loading, refetch: fetch };
}

function useAppointments(barbershopId: string | undefined) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!barbershopId) return;
    const { data } = await supabase
      .from("appointments")
      .select("*, services(name, price, duration_minutes), professionals(name)")
      .eq("barbershop_id", barbershopId)
      .order("scheduled_at", { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [barbershopId]);
  return { appointments, loading, refetch: fetch };
}

// ============ PAGES ============

const DashboardHome = () => {
  const navigate = useNavigate();
  const { barbershop } = useBarbershop();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {barbershop && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{barbershop.name} configurada</p>
              <p className="text-xs text-muted-foreground">Status: {barbershop.subscription_status || 'trial'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Faturamento Hoje</CardDescription>
            <CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 0% vs ontem
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Agendamentos Hoje</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Clientes Ativos</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Cashback Distribuído</CardDescription>
            <CardTitle className="text-2xl">R$ 0,00</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/painel-dono/agendamentos`)}>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Novo Agendamento</CardTitle>
            <CardDescription>Criar agendamento manual</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/painel-dono/profissionais`)}>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <CardTitle className="text-lg">Profissionais</CardTitle>
            <CardDescription>Gerenciar equipe</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/painel-dono/servicos`)}>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
              <Scissors className="w-5 h-5 text-secondary" />
            </div>
            <CardTitle className="text-lg">Serviços</CardTitle>
            <CardDescription>Gerenciar serviços</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

const AgendamentosPage = () => {
  const { barbershop } = useBarbershop();
  const { services } = useServices(barbershop?.id);
  const { professionals } = useProfessionals(barbershop?.id);
  const { appointments, refetch } = useAppointments(barbershop?.id);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_whatsapp: "",
    service_id: "",
    professional_id: "",
    scheduled_at: "",
    notes: "",
  });

  const handleCreate = async () => {
    if (!form.client_name || !form.service_id || !form.professional_id || !form.scheduled_at) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!barbershop) return;

    setSaving(true);
    const { error } = await supabase.from("appointments").insert({
      barbershop_id: barbershop.id,
      client_name: form.client_name,
      client_whatsapp: form.client_whatsapp || null,
      service_id: form.service_id,
      professional_id: form.professional_id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      notes: form.notes || null,
      status: "scheduled",
    });
    setSaving(false);

    if (error) {
      toast.error("Erro ao criar agendamento: " + error.message);
      return;
    }

    toast.success("Agendamento criado com sucesso!");
    setShowForm(false);
    setForm({ client_name: "", client_whatsapp: "", service_id: "", professional_id: "", scheduled_at: "", notes: "" });
    refetch();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success(`Status atualizado para "${status}"`);
    refetch();
  };

  const statusLabel: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Concluído",
    canceled: "Cancelado",
  };

  const statusColor: Record<string, string> = {
    scheduled: "bg-blue/10 text-blue",
    confirmed: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    canceled: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Agendamentos</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Novo Agendamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Cliente *</Label>
                <Input placeholder="Nome completo" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input placeholder="(11) 99999-0000" value={form.client_whatsapp} onChange={(e) => setForm({ ...form, client_whatsapp: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Serviço *</Label>
                <select
                  className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.service_id}
                  onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - R$ {Number(s.price).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Profissional *</Label>
                <select
                  className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.professional_id}
                  onChange={(e) => setForm({ ...form, professional_id: e.target.value })}
                >
                  <option value="">Selecione um profissional</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Data e Hora *</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Observações</Label>
                <Input placeholder="Observações..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleCreate} disabled={saving}>
                {saving ? "Salvando..." : "Criar Agendamento"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
            <Button variant="gold" className="mt-4" onClick={() => setShowForm(true)}>
              Criar primeiro agendamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{apt.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.services?.name} • {apt.professionals?.name}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[apt.status] || "bg-muted text-muted-foreground"}`}>
                    {statusLabel[apt.status] || apt.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(apt.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  <div className="flex gap-1">
                    {apt.status === "scheduled" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, "confirmed")}>Confirmar</Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus(apt.id, "canceled")}>Cancelar</Button>
                      </>
                    )}
                    {apt.status === "confirmed" && (
                      <Button size="sm" variant="gold" onClick={() => updateStatus(apt.id, "completed")}>Concluir</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfissionaisPage = () => {
  const { barbershop } = useBarbershop();
  const { professionals, refetch } = useProfessionals(barbershop?.id);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", commission: "60" });

  const handleAdd = async () => {
    if (!form.name || !barbershop) {
      toast.error("Preencha o nome.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("professionals").insert({
      barbershop_id: barbershop.id,
      name: form.name,
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      commission_percentage: Number(form.commission) || 60,
    });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(`"${form.name}" cadastrado!`);
    setShowForm(false);
    setForm({ name: "", email: "", whatsapp: "", commission: "60" });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Profissionais</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Novo Profissional</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>E-mail</Label><Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
              <div><Label>WhatsApp</Label><Input placeholder="(11) 99999-0000" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="mt-1" /></div>
              <div><Label>Comissão (%)</Label><Input type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleAdd} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {professionals.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum profissional.</p></CardContent></Card>
      ) : (
        professionals.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.email || p.whatsapp || "Sem contato"}</p>
              </div>
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">Ativo • {p.commission_percentage}%</span>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

const ServicosPage = () => {
  const { barbershop } = useBarbershop();
  const { services, refetch } = useServices(barbershop?.id);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", duration: "30", description: "" });

  const handleAdd = async () => {
    if (!form.name || !form.price || !barbershop) {
      toast.error("Preencha nome e preço.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("services").insert({
      barbershop_id: barbershop.id,
      name: form.name,
      price: Number(form.price),
      duration_minutes: Number(form.duration) || 30,
      description: form.description || null,
    });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(`"${form.name}" criado!`);
    setShowForm(false);
    setForm({ name: "", price: "", duration: "30", description: "" });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Serviços</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Criar Serviço
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Novo Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input placeholder="Ex: Corte Masculino" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Preço (R$) *</Label><Input type="number" placeholder="45.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1" /></div>
              <div><Label>Duração (min)</Label><Input type="number" placeholder="30" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="mt-1" /></div>
              <div><Label>Descrição</Label><Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleAdd} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {services.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum serviço.</p></CardContent></Card>
      ) : (
        services.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  R$ {Number(s.price).toFixed(2)} • <Clock className="w-3 h-3 inline" /> {s.duration_minutes} min
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

// ============ NOTIFICAÇÕES DO DONO ============

const NotificacoesDonoPage = () => {
  const { barbershop } = useBarbershop();
  const { professionals } = useProfessionals(barbershop?.id);
  const [target, setTarget] = useState<"all" | "professionals" | "clients_15" | "clients_30" | "clients_60">("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [clientCounts, setClientCounts] = useState({ c15: 0, c30: 0, c60: 0 });

  // Fetch client counts by booking period
  useEffect(() => {
    if (!barbershop?.id) return;
    const now = new Date();
    const d15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    Promise.all([
      supabase.from("appointments").select("client_user_id").eq("barbershop_id", barbershop.id).gte("scheduled_at", d15).not("client_user_id", "is", null),
      supabase.from("appointments").select("client_user_id").eq("barbershop_id", barbershop.id).gte("scheduled_at", d30).not("client_user_id", "is", null),
      supabase.from("appointments").select("client_user_id").eq("barbershop_id", barbershop.id).gte("scheduled_at", d60).not("client_user_id", "is", null),
    ]).then(([r15, r30, r60]) => {
      setClientCounts({
        c15: new Set(r15.data?.map(a => a.client_user_id)).size,
        c30: new Set(r30.data?.map(a => a.client_user_id)).size,
        c60: new Set(r60.data?.map(a => a.client_user_id)).size,
      });
    });
  }, [barbershop?.id]);

  const getTargetUserIds = async (): Promise<string[]> => {
    if (!barbershop?.id) return [];
    let userIds: string[] = [];

    if (target === "professionals" || target === "all") {
      const proUserIds = professionals.filter(p => p.user_id).map(p => p.user_id);
      userIds = [...userIds, ...proUserIds];
    }

    if (target === "all" || target.startsWith("clients_")) {
      let daysAgo = 60;
      if (target === "clients_15") daysAgo = 15;
      else if (target === "clients_30") daysAgo = 30;

      const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("appointments")
        .select("client_user_id")
        .eq("barbershop_id", barbershop.id)
        .gte("scheduled_at", since)
        .not("client_user_id", "is", null);

      const clientIds = [...new Set(data?.map(a => a.client_user_id).filter(Boolean) as string[])];
      userIds = [...new Set([...userIds, ...clientIds])];
    }

    return userIds;
  };

  const handleSend = async () => {
    if (!title || !message) {
      toast.error("Preencha título e mensagem.");
      return;
    }

    setSending(true);
    const userIds = await getTargetUserIds();

    if (userIds.length === 0) {
      toast.error("Nenhum destinatário encontrado para este filtro.");
      setSending(false);
      return;
    }

    const notifications = userIds.map(uid => ({
      user_id: uid,
      title,
      message,
      type: "info",
      priority: "normal",
    }));

    const { error } = await supabase.from("notifications").insert(notifications);
    setSending(false);

    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }

    toast.success(`Notificação enviada para ${userIds.length} usuário(s)!`);
    setTitle("");
    setMessage("");
  };

  const targets = [
    { key: "all" as const, label: "Todos" },
    { key: "professionals" as const, label: `Profissionais (${professionals.length})` },
    { key: "clients_15" as const, label: `Clientes 15 dias (${clientCounts.c15})` },
    { key: "clients_30" as const, label: `Clientes 30 dias (${clientCounts.c30})` },
    { key: "clients_60" as const, label: `Clientes 60 dias (${clientCounts.c60})` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Enviar Notificação</h1>

      <Card>
        <CardHeader>
          <CardTitle>Destinatários</CardTitle>
          <CardDescription>Selecione o grupo que receberá a notificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {targets.map((t) => (
              <Button
                key={t.key}
                variant={target === t.key ? "gold" : "outline"}
                size="sm"
                onClick={() => setTarget(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <div>
            <Label>Título *</Label>
            <Input placeholder="Título da notificação" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Mensagem *</Label>
            <Input placeholder="Escreva a mensagem..." value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Bell className="w-3 h-3" />
            <span>Notificação interna do app. SMS/WhatsApp requer integração ativa com Twilio.</span>
          </div>
          <Button variant="gold" onClick={handleSend} disabled={sending}>
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Enviando..." : "Enviar Notificação"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ REMAINING PAGES (unchanged logic) ============

const FinanceiroPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Financeiro</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader>
          <CardDescription>Saldo Disponível</CardDescription>
          <CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="gold" size="sm" className="w-full" onClick={() => toast.info("Saque via PIX em breve!")}>Sacar via PIX</Button>
        </CardContent>
      </Card>
      <Card><CardHeader><CardDescription>A Receber</CardDescription><CardTitle className="text-2xl">R$ 0,00</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>Faturamento do Mês</CardDescription><CardTitle className="text-2xl">R$ 0,00</CardTitle></CardHeader></Card>
    </div>
  </div>
);

const EstoquePage = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", quantity: "" });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Estoque</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Adicionar Produto</Button>
      </div>
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Novo Produto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Nome *</Label><Input placeholder="Ex: Pomada" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Preço (R$)</Label><Input type="number" placeholder="25.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1" /></div>
              <div><Label>Quantidade</Label><Input type="number" placeholder="10" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={() => { toast.success(`"${form.name}" adicionado! (Simulação)`); setShowForm(false); }}>Salvar</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card><CardContent className="py-12 text-center"><Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum produto.</p></CardContent></Card>
    </div>
  );
};

const CashbackPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Configurar Cashback</h1>
    <Card>
      <CardHeader><CardTitle>Regras de Cashback</CardTitle><CardDescription>Defina quanto seus clientes ganham de volta</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center"><p className="text-sm text-muted-foreground">Cashback por serviço</p><p className="text-3xl font-bold text-gradient-gold">5%</p></div>
          <div className="p-4 bg-muted rounded-lg text-center"><p className="text-sm text-muted-foreground">Total distribuído</p><p className="text-3xl font-bold">R$ 0,00</p></div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const PixelsPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Pixels & Marketing</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { name: "Meta Pixel", desc: "Facebook e Instagram", icon: "📘" },
        { name: "Google Ads", desc: "Google Tag Manager", icon: "🔍" },
        { name: "TikTok Pixel", desc: "TikTok Ads", icon: "🎵" },
      ].map((p) => (
        <Card key={p.name}>
          <CardHeader>
            <div className="text-2xl mb-1">{p.icon}</div>
            <CardTitle className="text-lg">{p.name}</CardTitle>
            <CardDescription>{p.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => toast.info(`Configurar ${p.name}: em breve!`)}>Configurar</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const SuportePage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Suporte</h1>
    <Card>
      <CardHeader><CardTitle>Falar com Suporte</CardTitle><CardDescription>Seg-Sex, 9h às 18h</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <Button variant="gold" className="w-full" onClick={() => toast.info("Chat em breve!")}><MessageCircle className="w-4 h-4 mr-2" />Iniciar Conversa</Button>
        <Button variant="outline" className="w-full" onClick={() => window.open("https://wa.me/5511999990000", "_blank")}><Phone className="w-4 h-4 mr-2" />WhatsApp</Button>
      </CardContent>
    </Card>
  </div>
);

const ConfiguracoesPage = () => {
  const { profile } = useAuth();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações</h1>
      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle>Dados da Barbearia</CardTitle></CardHeader>
          <CardContent><div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">Barbearia Teste</p></div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Plano Atual</CardTitle></CardHeader>
          <CardContent><div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Plano</p><p className="font-bold text-gradient-gold">Trial Gratuito</p></div></CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonoDashboard;
