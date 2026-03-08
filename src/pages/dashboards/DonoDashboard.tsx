/**
 * DonoDashboard - Painel completo do Dono de Barbearia
 */

import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DonoOnboarding } from "@/components/onboarding/DonoOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  LayoutDashboard, Calendar, Users, Scissors, DollarSign, Package, Gift, Settings,
  Bell, LogOut, Menu, X, TrendingUp, MessageCircle, Image, Plus, CheckCircle,
  Clock, ChevronRight, Phone, Send, Share2, QrCode, CreditCard, Edit, Eye,
  Wallet, Link as LinkIcon, UserCheck, AlertCircle, Repeat, Smartphone
} from "lucide-react";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { formatWhatsAppBR, onlyDigits } from "@/lib/input-masks";

const DonoDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { barbershop: mainBarbershop, loading: barbershopLoading, refetch: refetchBarbershop } = useBarbershop();

  if (!barbershopLoading && !mainBarbershop) {
    return <DonoOnboarding onComplete={refetchBarbershop} />;
  }

  const basePath = "/painel-dono";

  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Agendamentos", href: `${basePath}/agendamentos`, icon: Calendar },
    { name: "Profissionais", href: `${basePath}/profissionais`, icon: Users },
    { name: "Serviços", href: `${basePath}/servicos`, icon: Scissors },
    { name: "Financeiro", href: `${basePath}/financeiro`, icon: DollarSign },
    { name: "Receber Dívida", href: `${basePath}/dividas`, icon: Wallet },
    { name: "Estoque", href: `${basePath}/estoque`, icon: Package },
    { name: "Cashback", href: `${basePath}/cashback`, icon: Gift },
    { name: "Ação entre Amigos", href: `${basePath}/acao-entre-amigos`, icon: Gift },
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
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <Link to={basePath} className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-display font-bold text-lg text-sidebar-primary">Painel Dono</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground/60" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 border-b border-sidebar-border">
            <p className="font-medium truncate text-sidebar-foreground">{profile?.name || "Dono"}</p>
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
          <div className="flex items-center gap-4">
            <Link to={`${basePath}/notificacoes`}><Button variant="ghost" size="icon"><Bell className="w-5 h-5" /></Button></Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="agendamentos" element={<AgendamentosPage />} />
            <Route path="profissionais" element={<ProfissionaisPage />} />
            <Route path="servicos" element={<ServicosPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="dividas" element={<DividasPage />} />
            <Route path="estoque" element={<EstoquePage />} />
            <Route path="cashback" element={<CashbackPage />} />
            <Route path="acao-entre-amigos" element={<AcaoEntreAmigosPage />} />
            <Route path="rifas" element={<AcaoEntreAmigosPage />} />
            <Route path="automacao" element={<NotificacoesDonoPage />} />
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

  const refetch = useCallback(async () => {
    if (!user) { setBarbershop(null); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("barbershops").select("*").eq("owner_user_id", user.id).order("created_at", { ascending: true }).limit(1);
    if (error) { console.error("[DONO] barbershop error:", error.message); setBarbershop(null); setLoading(false); return; }
    setBarbershop(data?.[0] ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);
  return { barbershop, loading, refetch };
}

function useServices(barbershopId: string | undefined) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    if (!barbershopId) return;
    const { data } = await supabase.from("services").select("*").eq("barbershop_id", barbershopId).eq("is_active", true);
    setServices(data || []); setLoading(false);
  };
  useEffect(() => { fetch(); }, [barbershopId]);
  return { services, loading, refetch: fetch };
}

function useProfessionals(barbershopId: string | undefined) {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    if (!barbershopId) return;
    const { data } = await supabase.from("professionals").select("*").eq("barbershop_id", barbershopId).eq("is_active", true);
    setProfessionals(data || []); setLoading(false);
  };
  useEffect(() => { fetch(); }, [barbershopId]);
  return { professionals, loading, refetch: fetch };
}

function useAppointments(barbershopId: string | undefined) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    if (!barbershopId) return;
    const { data } = await supabase.from("appointments").select("*, services(name, price, duration_minutes), professionals(name)").eq("barbershop_id", barbershopId).order("scheduled_at", { ascending: true });
    setAppointments(data || []); setLoading(false);
  };
  useEffect(() => { fetch(); }, [barbershopId]);
  return { appointments, loading, refetch: fetch };
}

// ============ DASHBOARD HOME ============

const DashboardHome = () => {
  const navigate = useNavigate();
  const { barbershop } = useBarbershop();
  const bookingLink = barbershop?.slug ? `${window.location.origin}/agendar/${barbershop.slug}` : "";

  const handleShare = () => {
    if (!bookingLink) { toast.error("Configure o slug da barbearia primeiro."); return; }
    if (navigator.share) {
      navigator.share({ title: barbershop?.name, text: "Agende seu horário!", url: bookingLink });
    } else {
      navigator.clipboard?.writeText(bookingLink);
      toast.success("Link copiado!");
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold">Dashboard</h1><p className="text-muted-foreground">Visão geral do seu negócio</p></div>
      {barbershop && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{barbershop.name}</p>
                <p className="text-xs text-muted-foreground">Status: {barbershop.subscription_status || 'trial'}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="w-4 h-4 mr-1" />Compartilhar Link</Button>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription className="text-xs">Faturamento Hoje</CardDescription><CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 0% vs ontem</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription className="text-xs">Agendamentos Hoje</CardDescription><CardTitle className="text-2xl">0</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription className="text-xs">Clientes Ativos</CardDescription><CardTitle className="text-2xl">0</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription className="text-xs">Cashback Distribuído</CardDescription><CardTitle className="text-2xl">R$ 0,00</CardTitle></CardHeader></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/painel-dono/agendamentos`)}>
          <CardHeader><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><Calendar className="w-5 h-5 text-primary" /></div><CardTitle className="text-lg">Novo Agendamento</CardTitle><CardDescription>Criar agendamento manual</CardDescription></CardHeader>
        </Card>
        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/painel-dono/profissionais`)}>
          <CardHeader><div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2"><Users className="w-5 h-5 text-secondary" /></div><CardTitle className="text-lg">Profissionais</CardTitle><CardDescription>Gerenciar equipe</CardDescription></CardHeader>
        </Card>
        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/painel-dono/dividas`)}>
          <CardHeader><div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2"><Wallet className="w-5 h-5 text-secondary" /></div><CardTitle className="text-lg">Receber Dívida</CardTitle><CardDescription>Cobrar fiados</CardDescription></CardHeader>
        </Card>
      </div>
    </div>
  );
};

// ============ AGENDAMENTOS ============

const AgendamentosPage = () => {
  const { barbershop } = useBarbershop();
  const { services } = useServices(barbershop?.id);
  const { professionals } = useProfessionals(barbershop?.id);
  const { appointments, refetch } = useAppointments(barbershop?.id);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_whatsapp: "", service_id: "", professional_id: "", scheduled_at: "", notes: "" });

  const handleCreate = async () => {
    if (!form.client_name || !form.service_id || !form.professional_id || !form.scheduled_at) { toast.error("Preencha todos os campos obrigatórios."); return; }
    if (!barbershop) return;
    setSaving(true);
    const { error } = await supabase.from("appointments").insert({ barbershop_id: barbershop.id, client_name: form.client_name, client_whatsapp: form.client_whatsapp || null, service_id: form.service_id, professional_id: form.professional_id, scheduled_at: new Date(form.scheduled_at).toISOString(), notes: form.notes || null, status: "scheduled" });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Agendamento criado!"); setShowForm(false);
    setForm({ client_name: "", client_whatsapp: "", service_id: "", professional_id: "", scheduled_at: "", notes: "" });
    refetch();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(`Status: "${status}"`); refetch();
  };

  const statusLabel: Record<string, string> = { scheduled: "Agendado", confirmed: "Confirmado", completed: "Concluído", canceled: "Cancelado" };
  const statusColor: Record<string, string> = { scheduled: "bg-blue-500/10 text-blue-600", confirmed: "bg-primary/10 text-primary", completed: "bg-green-500/10 text-green-600", canceled: "bg-destructive/10 text-destructive" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Agendamentos</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Novo</Button>
      </div>
      {showForm && (
        <Card className="border-primary/30"><CardHeader><CardTitle>Novo Agendamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome do Cliente *</Label><Input placeholder="Nome" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="mt-1" /></div>
              <div><Label>WhatsApp</Label><Input placeholder="(11) 99999-0000" value={form.client_whatsapp} onChange={(e) => setForm({ ...form, client_whatsapp: formatWhatsAppBR(e.target.value) })} className="mt-1" /></div>
              <div><Label>Serviço *</Label><select className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}><option value="">Selecione</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name} - R$ {Number(s.price).toFixed(2)}</option>)}</select></div>
              <div><Label>Profissional *</Label><select className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.professional_id} onChange={(e) => setForm({ ...form, professional_id: e.target.value })}><option value="">Selecione</option>{professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><Label>Data e Hora *</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="mt-1" /></div>
              <div><Label>Observações</Label><Input placeholder="..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2"><Button variant="gold" onClick={handleCreate} disabled={saving}>{saving ? "Salvando..." : "Criar"}</Button><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
          </CardContent>
        </Card>
      )}
      {appointments.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum agendamento.</p><Button variant="gold" className="mt-4" onClick={() => setShowForm(true)}>Criar primeiro</Button></CardContent></Card>
      ) : (
        <div className="space-y-3">{appointments.map((apt) => (
          <Card key={apt.id}><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>
                <div><p className="font-semibold">{apt.client_name}</p><p className="text-sm text-muted-foreground">{apt.services?.name} • {apt.professionals?.name}</p></div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[apt.status] || "bg-muted text-muted-foreground"}`}>{statusLabel[apt.status] || apt.status}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(apt.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
              <div className="flex gap-1">
                {apt.status === "scheduled" && (<><Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, "confirmed")}>Confirmar</Button><Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus(apt.id, "canceled")}>Cancelar</Button></>)}
                {apt.status === "confirmed" && <Button size="sm" variant="gold" onClick={() => updateStatus(apt.id, "completed")}>Concluir</Button>}
              </div>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
};

// ============ PROFISSIONAIS (com senha de acesso) ============

const ProfissionaisPage = () => {
  const { barbershop } = useBarbershop();
  const { professionals, refetch } = useProfessionals(barbershop?.id);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", commission: "60", password: "" });

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password || !barbershop) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    if (form.password.length < 6) { toast.error("Senha deve ter no mínimo 6 caracteres."); return; }

    setSaving(true);

    // 1. Create auth user for professional
    const { data: authData, error: authError } = await supabase.functions.invoke("bootstrap-role", {
      body: {
        action: "create-professional",
        email: form.email,
        password: form.password,
        name: form.name,
        barbershop_id: barbershop.id,
        whatsapp: form.whatsapp || null,
        commission_percentage: Number(form.commission) || 60,
      },
    });

    if (authError) {
      // Fallback: insert without auth user
      const { error } = await supabase.from("professionals").insert({
        barbershop_id: barbershop.id,
        name: form.name,
        email: form.email || null,
        whatsapp: form.whatsapp || null,
        commission_percentage: Number(form.commission) || 60,
      });
      setSaving(false);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success(`"${form.name}" cadastrado (sem login criado).`);
    } else {
      setSaving(false);
      toast.success(`"${form.name}" cadastrado com acesso ao painel!`);
    }

    setShowForm(false);
    setForm({ name: "", email: "", whatsapp: "", commission: "60", password: "" });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Profissionais</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
      </div>
      {showForm && (
        <Card className="border-primary/30"><CardHeader><CardTitle>Novo Profissional</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>E-mail *</Label><Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
              <div><Label>Senha de Acesso *</Label><Input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1" /></div>
              <div><Label>WhatsApp</Label><Input placeholder="(11) 99999-0000" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: formatWhatsAppBR(e.target.value) })} className="mt-1" /></div>
              <div><Label>Comissão (%)</Label><Input type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} className="mt-1" /></div>
            </div>
            <p className="text-xs text-muted-foreground">O profissional poderá acessar o painel com e-mail e senha.</p>
            <div className="flex gap-2"><Button variant="gold" onClick={handleAdd} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
          </CardContent>
        </Card>
      )}
      {professionals.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum profissional.</p></CardContent></Card>
      ) : (
        professionals.map((p) => (
          <Card key={p.id}><CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
            <div className="flex-1"><p className="font-semibold">{p.name}</p><p className="text-sm text-muted-foreground">{p.email || p.whatsapp || "Sem contato"}</p></div>
            <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">Ativo • {p.commission_percentage}%</span>
          </CardContent></Card>
        ))
      )}
    </div>
  );
};

// ============ SERVIÇOS ============

const ServicosPage = () => {
  const { barbershop } = useBarbershop();
  const { services, refetch } = useServices(barbershop?.id);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", duration: "30", description: "" });

  const handleAdd = async () => {
    if (!form.name || !form.price || !barbershop) { toast.error("Preencha nome e preço."); return; }
    setSaving(true);
    const { error } = await supabase.from("services").insert({ barbershop_id: barbershop.id, name: form.name, price: Number(form.price), duration_minutes: Number(form.duration) || 30, description: form.description || null });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(`"${form.name}" criado!`); setShowForm(false);
    setForm({ name: "", price: "", duration: "30", description: "" }); refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Serviços</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Criar Serviço</Button>
      </div>
      {showForm && (
        <Card className="border-primary/30"><CardHeader><CardTitle>Novo Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input placeholder="Ex: Corte Masculino" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Preço (R$) *</Label><Input type="number" placeholder="45.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1" /></div>
              <div><Label>Duração (min)</Label><Input type="number" placeholder="30" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="mt-1" /></div>
              <div><Label>Descrição</Label><Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2"><Button variant="gold" onClick={handleAdd} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
          </CardContent>
        </Card>
      )}
      {services.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum serviço.</p></CardContent></Card>
      ) : (
        services.map((s) => (
          <Card key={s.id}><CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Scissors className="w-5 h-5 text-primary" /></div>
            <div className="flex-1"><p className="font-semibold">{s.name}</p><p className="text-sm text-muted-foreground">R$ {Number(s.price).toFixed(2)} • <Clock className="w-3 h-3 inline" /> {s.duration_minutes} min</p></div>
          </CardContent></Card>
        ))
      )}
    </div>
  );
};

// ============ FINANCEIRO + REPASSE COMISSÕES ============

const FinanceiroPage = () => {
  const { barbershop } = useBarbershop();
  const { professionals } = useProfessionals(barbershop?.id);
  const [payments, setPayments] = useState<any[]>([]);
  const [showPayout, setShowPayout] = useState(false);
  const [payoutMode, setPayoutMode] = useState<"manual" | "auto">("manual");
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!barbershop?.id) return;
    supabase.from("payments").select("*").eq("barbershop_id", barbershop.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => setPayments(data || []));
  }, [barbershop?.id]);

  const totalReceived = payments.filter(p => p.status === 'paid' || p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

  const handlePayProfessional = async (prof: any) => {
    setPayingId(prof.id);
    try {
      const commAmount = totalReceived * (Number(prof.commission_percentage) / 100);
      if (commAmount <= 0) { toast.error("Sem valor para repasse."); setPayingId(null); return; }
      if (prof.pix_key || prof.asaas_wallet_id) {
        await supabase.functions.invoke("process-payment", {
          body: { action: "transfer", amount: commAmount, recipient_wallet_id: prof.asaas_wallet_id, pix_key: prof.pix_key, description: `Comissão ${prof.name}` },
        });
        toast.success(`R$ ${commAmount.toFixed(2)} enviado para ${prof.name}!`);
      } else {
        toast.error(`${prof.name} não tem PIX cadastrado. Peça para configurar em Conta Bancária.`);
      }
    } catch {
      toast.error("Erro ao processar repasse.");
    }
    setPayingId(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Financeiro</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader><CardDescription>Recebido</CardDescription><CardTitle className="text-3xl text-gradient-gold">R$ {totalReceived.toFixed(2)}</CardTitle></CardHeader>
          <CardContent><Button variant="gold" size="sm" className="w-full" onClick={() => toast.info("Saque via PIX em breve!")}>Sacar via PIX</Button></CardContent>
        </Card>
        <Card><CardHeader><CardDescription>Pendente</CardDescription><CardTitle className="text-2xl">R$ {totalPending.toFixed(2)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Faturamento do Mês</CardDescription><CardTitle className="text-2xl">R$ {(totalReceived + totalPending).toFixed(2)}</CardTitle></CardHeader></Card>
      </div>

      {/* REPASSE DE COMISSÕES */}
      <Card className="border-secondary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Repeat className="w-5 h-5" />Repasse de Comissões</CardTitle>
              <CardDescription>Repasse automático ou manual para profissionais</CardDescription>
            </div>
            <Button variant={showPayout ? "outline" : "gold"} size="sm" onClick={() => setShowPayout(!showPayout)}>
              {showPayout ? "Fechar" : "Gerenciar Repasses"}
            </Button>
          </div>
        </CardHeader>
        {showPayout && (
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button variant={payoutMode === "manual" ? "gold" : "outline"} size="sm" onClick={() => setPayoutMode("manual")}>Manual</Button>
              <Button variant={payoutMode === "auto" ? "gold" : "outline"} size="sm" onClick={() => setPayoutMode("auto")}>Automático</Button>
            </div>
            {payoutMode === "auto" && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">No modo automático, ao concluir um atendimento o sistema divide automaticamente o valor entre dono e profissional via split no gateway de pagamento.</p>
                <p className="text-sm font-medium mt-2 text-primary">✓ Split automático ativo para novos pagamentos</p>
              </div>
            )}
            {payoutMode === "manual" && (
              <div className="space-y-3">
                {professionals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum profissional cadastrado.</p>
                ) : professionals.map(prof => {
                  const commAmount = totalReceived * (Number(prof.commission_percentage) / 100);
                  return (
                    <div key={prof.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{prof.name}</p>
                        <p className="text-sm text-muted-foreground">Comissão: {prof.commission_percentage}% • PIX: {prof.pix_key || "Não cadastrado"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-gradient-gold">R$ {commAmount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">estimado</p>
                        </div>
                        <Button size="sm" variant="gold" disabled={payingId === prof.id || commAmount <= 0} onClick={() => handlePayProfessional(prof)}>
                          {payingId === prof.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                          Pagar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader><CardTitle>Comissões de Afiliados</CardTitle><CardDescription>Comissões pagas e pendentes</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg text-center"><p className="text-xs text-muted-foreground">Pagas</p><p className="text-xl font-bold text-green-600">R$ 0,00</p></div>
            <div className="p-3 bg-yellow-500/10 rounded-lg text-center"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-xl font-bold text-yellow-600">R$ 0,00</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cashback por Serviço</CardTitle><CardDescription>Créditos vinculados a clientes</CardDescription></CardHeader>
        <CardContent className="text-center py-6"><Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nenhum cashback distribuído ainda.</p></CardContent>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Últimos Pagamentos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {payments.slice(0, 10).map(p => (
              <div key={p.id} className="flex justify-between items-center p-2 border rounded">
                <div><p className="text-sm font-medium">R$ {Number(p.amount).toFixed(2)}</p><p className="text-xs text-muted-foreground">{p.payment_method} • {new Date(p.created_at).toLocaleDateString("pt-BR")}</p></div>
                <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'paid' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>{p.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============ RECEBER DÍVIDA ============

const DividasPage = () => {
  const { barbershop } = useBarbershop();
  const [debts, setDebts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_whatsapp: "", amount: "", description: "" });

  useEffect(() => {
    if (!barbershop?.id) return;
    supabase.from("debts").select("*").eq("barbershop_id", barbershop.id).order("created_at", { ascending: false }).then(({ data }) => setDebts(data || []));
  }, [barbershop?.id]);

  const handleCreate = async () => {
    if (!form.client_name || !form.amount || !barbershop) { toast.error("Preencha nome e valor."); return; }
    setSaving(true);
    const { error } = await supabase.from("debts").insert({
      barbershop_id: barbershop.id, client_name: form.client_name,
      client_whatsapp: form.client_whatsapp || null, amount: Number(form.amount),
      description: form.description || null,
    });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Dívida registrada!");
    setShowForm(false); setForm({ client_name: "", client_whatsapp: "", amount: "", description: "" });
    supabase.from("debts").select("*").eq("barbershop_id", barbershop.id).order("created_at", { ascending: false }).then(({ data }) => setDebts(data || []));
  };

  const handleReceive = async (debt: any) => {
    // Generate payment link via gateway
    try {
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          action: "charge",
          amount: Number(debt.amount),
          description: `Dívida: ${debt.client_name} - ${debt.description || "Fiado"}`,
          billing_type: "PIX",
          external_reference: debt.id,
        },
      });
      if (error) throw error;
      if (data?.pix_copy_paste) {
        navigator.clipboard?.writeText(data.pix_copy_paste);
        toast.success("PIX Copia e Cola copiado! Envie ao cliente.");
      } else if (data?.payment_link) {
        navigator.clipboard?.writeText(data.payment_link);
        toast.success("Link de pagamento copiado!");
      } else {
        toast.success("Cobrança gerada!");
      }
    } catch {
      toast.error("Erro ao gerar cobrança. Tente novamente.");
    }
  };

  const handleShareLink = (debt: any) => {
    const msg = `Olá ${debt.client_name}! Você tem um débito de R$ ${Number(debt.amount).toFixed(2)} conosco. Acesse para pagar: ${window.location.origin}/simulacao-pagamento?amount=${debt.amount}&ref=${debt.id}`;
    if (navigator.share) {
      navigator.share({ title: "Cobrança", text: msg });
    } else {
      navigator.clipboard?.writeText(msg);
      toast.success("Mensagem de cobrança copiada!");
    }
  };

  const totalPending = debts.filter(d => d.status === 'pending').reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <Card className="border-primary/30"><CardHeader><CardTitle>Registrar Dívida</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome do Cliente *</Label><Input placeholder="Nome" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} className="mt-1" /></div>
              <div><Label>WhatsApp</Label><Input placeholder="(11) 99999-0000" value={form.client_whatsapp} onChange={e => setForm({ ...form, client_whatsapp: formatWhatsAppBR(e.target.value) })} className="mt-1" /></div>
              <div><Label>Valor (R$) *</Label><Input type="number" placeholder="50.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1" /></div>
              <div><Label>Descrição</Label><Input placeholder="Ex: Corte + Barba" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2"><Button variant="gold" onClick={handleCreate} disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Button><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
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
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'}`}>{d.status === 'pending' ? 'Pendente' : 'Pago'}</span>
                </div>
              </div>
              {d.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="gold" onClick={() => handleReceive(d)}><QrCode className="w-4 h-4 mr-1" />PIX/QR</Button>
                  <Button size="sm" variant="outline" onClick={() => handleShareLink(d)}><Share2 className="w-4 h-4 mr-1" />Link</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    supabase.from("debts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", d.id).then(() => {
                      toast.success("Dívida marcada como paga!");
                      supabase.from("debts").select("*").eq("barbershop_id", barbershop.id).order("created_at", { ascending: false }).then(({ data }) => setDebts(data || []));
                    });
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

// ============ ESTOQUE (com preço compra/venda e lucro) ============

const EstoquePage = () => {
  const { barbershop } = useBarbershop();
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", buy_price: "", sell_price: "", quantity: "" });

  const fetchItems = async () => {
    if (!barbershop?.id) return;
    const { data } = await supabase.from("stock_items").select("*").eq("barbershop_id", barbershop.id).eq("is_active", true).order("name");
    setItems(data || []);
  };

  useEffect(() => { fetchItems(); }, [barbershop?.id]);

  const handleAdd = async () => {
    if (!form.name || !barbershop) { toast.error("Preencha o nome."); return; }
    setSaving(true);
    const { error } = await supabase.from("stock_items").insert({
      barbershop_id: barbershop.id, name: form.name,
      buy_price: Number(form.buy_price) || 0,
      sell_price: Number(form.sell_price) || 0,
      quantity: Number(form.quantity) || 0,
    });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(`"${form.name}" adicionado!`);
    setShowForm(false); setForm({ name: "", buy_price: "", sell_price: "", quantity: "" }); fetchItems();
  };

  const totalCost = items.reduce((s, i) => s + Number(i.buy_price) * i.quantity, 0);
  const totalRevenue = items.reduce((s, i) => s + Number(i.sell_price) * i.quantity, 0);
  const totalProfit = totalRevenue - totalCost;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Estoque</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Custo Total</CardDescription><CardTitle className="text-xl text-destructive">R$ {totalCost.toFixed(2)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Receita Potencial</CardDescription><CardTitle className="text-xl">R$ {totalRevenue.toFixed(2)}</CardTitle></CardHeader></Card>
        <Card className="bg-gradient-card border-primary/20"><CardHeader className="pb-2"><CardDescription>Lucro Líquido</CardDescription><CardTitle className="text-xl text-gradient-gold">R$ {totalProfit.toFixed(2)}</CardTitle></CardHeader></Card>
      </div>

      {showForm && (
        <Card className="border-primary/30"><CardHeader><CardTitle>Novo Produto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input placeholder="Ex: Pomada" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Qtd</Label><Input type="number" placeholder="10" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="mt-1" /></div>
              <div><Label>Preço de Compra (R$)</Label><Input type="number" placeholder="15.00" value={form.buy_price} onChange={e => setForm({ ...form, buy_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Preço de Venda (R$)</Label><Input type="number" placeholder="35.00" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2"><Button variant="gold" onClick={handleAdd} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum produto.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(i => {
            const profit = (Number(i.sell_price) - Number(i.buy_price)) * i.quantity;
            return (
              <Card key={i.id}><CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div>
                <div className="flex-1">
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Compra: R$ {Number(i.buy_price).toFixed(2)} • Venda: R$ {Number(i.sell_price).toFixed(2)} • Qtd: {i.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">lucro</p>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============ CASHBACK (editar + ver clientes) ============

const CashbackPage = () => {
  const { barbershop, refetch } = useBarbershop();
  const [percentage, setPercentage] = useState("5");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (barbershop?.cashback_percentage !== undefined) {
      setPercentage(String(barbershop.cashback_percentage));
    }
    if (barbershop?.id) {
      supabase.from("cashback_credits").select("*, profiles:user_id(name, whatsapp, email)")
        .eq("barbershop_id", barbershop.id)
        .order("created_at", { ascending: false })
        .limit(100)
        .then(({ data }) => setClients(data || []));
    }
  }, [barbershop]);

  const handleSave = async () => {
    if (!barbershop) return;
    setSaving(true);
    const { error } = await supabase.from("barbershops").update({ cashback_percentage: Number(percentage) }).eq("id", barbershop.id);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Cashback atualizado!"); setEditing(false); refetch();
  };

  const totalDistributed = clients.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurar Cashback</h1>
      <Card>
        <CardHeader><CardTitle>Regras de Cashback</CardTitle><CardDescription>Defina quanto seus clientes ganham de volta</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Cashback por serviço</p>
              {editing ? (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Input type="number" value={percentage} onChange={e => setPercentage(e.target.value)} className="w-20 text-center" min="0" max="100" />
                  <span className="text-lg font-bold">%</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-gradient-gold">{percentage}%</p>
              )}
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total distribuído</p>
              <p className="text-3xl font-bold">R$ {totalDistributed.toFixed(2)}</p>
            </div>
          </div>
          {editing ? (
            <div className="flex gap-2"><Button variant="gold" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button></div>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}><Edit className="w-4 h-4 mr-2" />Editar Percentual</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Clientes com Cashback</CardTitle><CardDescription>{clients.length} registros</CardDescription></CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-6"><Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nenhum cashback distribuído.</p></div>
          ) : (
            <div className="space-y-2">
              {clients.map(c => (
                <div key={c.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{(c as any).profiles?.name || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{(c as any).profiles?.whatsapp || (c as any).profiles?.email || "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">R$ {Number(c.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============ NOTIFICAÇÕES + AUTOMAÇÃO (unificados) ============

const NotificacoesDonoPage = () => {
  const { barbershop, refetch: refetchBarbershop } = useBarbershop();
  const { professionals } = useProfessionals(barbershop?.id);
  const [tab, setTab] = useState<"enviar" | "automacao" | "pacotes">("enviar");
  const [target, setTarget] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<"app" | "sms" | "whatsapp">("app");
  const [includeBookingLink, setIncludeBookingLink] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [clientCounts, setClientCounts] = useState({ c15: 0, c30: 0, c60: 0 });
  const [schedule, setSchedule] = useState<any[]>([]);
  const [scheduleMessage, setScheduleMessage] = useState("Olá! Aproveite nossos serviços hoje!");
  const [scheduleRepeat, setScheduleRepeat] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    if (!barbershop?.id) return;
    const now = new Date();
    const d15 = new Date(now.getTime() - 15 * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const d60 = new Date(now.getTime() - 60 * 86400000).toISOString();
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

    if (barbershop.automation_schedule) {
      setSchedule(Array.isArray(barbershop.automation_schedule) ? barbershop.automation_schedule : []);
    }

    supabase.from("messaging_packages").select("*").eq("is_active", true).then(({ data }) => setPackages(data || []));
  }, [barbershop?.id]);

  const loadContacts = async () => {
    if (!barbershop?.id) return;
    let userIds: string[] = [];
    if (target === "professionals") {
      const proIds = professionals.filter(p => p.user_id).map(p => p.user_id);
      userIds = proIds;
    } else {
      let days = 60;
      if (target === "clients_15") days = 15;
      else if (target === "clients_30") days = 30;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data } = await supabase.from("appointments").select("client_user_id").eq("barbershop_id", barbershop.id).gte("scheduled_at", since).not("client_user_id", "is", null);
      const clientIds = [...new Set(data?.map(a => a.client_user_id).filter(Boolean) as string[])];
      if (target === "all") {
        const proIds = professionals.filter(p => p.user_id).map(p => p.user_id);
        userIds = [...new Set([...proIds, ...clientIds])];
      } else {
        userIds = clientIds;
      }
    }
    if (userIds.length === 0) { setContacts([]); setShowContacts(true); return; }
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
    setContacts(profiles || []);
    setShowContacts(true);
  };

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
      const since = new Date(Date.now() - daysAgo * 86400000).toISOString();
      const { data } = await supabase.from("appointments").select("client_user_id").eq("barbershop_id", barbershop.id).gte("scheduled_at", since).not("client_user_id", "is", null);
      const clientIds = [...new Set(data?.map(a => a.client_user_id).filter(Boolean) as string[])];
      userIds = [...new Set([...userIds, ...clientIds])];
    }
    return userIds;
  };

  const handleSend = async () => {
    if (!title || !message) { toast.error("Preencha título e mensagem."); return; }
    setSending(true);
    const userIds = await getTargetUserIds();
    if (userIds.length === 0) { toast.error("Nenhum destinatário."); setSending(false); return; }

    const bookingLink = barbershop?.slug ? `\n\n📅 Agende: ${window.location.origin}/agendar/${barbershop.slug}` : "";
    const finalMsg = includeBookingLink ? message + bookingLink : message;

    const notifications = userIds.map(uid => ({ user_id: uid, title, message: finalMsg, type: "info", priority: "normal" }));
    const { error } = await supabase.from("notifications").insert(notifications);

    if (channel === "sms" || channel === "whatsapp") {
      const { data: profiles } = await supabase.from("profiles").select("whatsapp").in("user_id", userIds);
      const phones = profiles?.map(p => p.whatsapp).filter(Boolean) || [];
      let sent = 0;
      for (const phone of phones) {
        try {
          await supabase.functions.invoke("send-sms", { body: { action: channel === "whatsapp" ? "whatsapp" : "sms", to: phone, body: `${title}: ${finalMsg}` } });
          sent++;
        } catch {}
      }
      toast.success(`${sent} ${channel.toUpperCase()} + ${userIds.length} notificações enviadas!`);
    } else {
      if (error) toast.error("Erro: " + error.message);
      else toast.success(`Notificação para ${userIds.length} usuário(s)!`);
    }
    setSending(false); setTitle(""); setMessage("");
  };

  const daysLabels: Record<string, string> = { "0": "Domingo", "1": "Segunda", "2": "Terça", "3": "Quarta", "4": "Quinta", "5": "Sexta", "6": "Sábado" };

  const toggleDay = async (day: string) => {
    let newSchedule;
    const exists = schedule.find((s: any) => s.day === day);
    if (exists) {
      newSchedule = schedule.filter((s: any) => s.day !== day);
    } else {
      newSchedule = [...schedule, { day, message: scheduleMessage, active: true, repeat: scheduleRepeat, include_booking_link: true }];
    }
    const { error } = await supabase.from("barbershops").update({ automation_schedule: newSchedule }).eq("id", barbershop.id);
    if (!error) { setSchedule(newSchedule); toast.success("Automação atualizada!"); refetchBarbershop(); }
  };

  const targets = [
    { key: "all", label: "Todos" },
    { key: "professionals", label: `Profissionais (${professionals.length})` },
    { key: "clients_15", label: `Clientes 15d (${clientCounts.c15})` },
    { key: "clients_30", label: `Clientes 30d (${clientCounts.c30})` },
    { key: "clients_60", label: `Clientes 60d (${clientCounts.c60})` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Notificações & Automação</h1>

      <div className="flex gap-2">
        {(["enviar", "automacao", "pacotes"] as const).map(t => (
          <Button key={t} variant={tab === t ? "gold" : "outline"} size="sm" onClick={() => setTab(t)}>
            {t === "enviar" ? "📤 Enviar" : t === "automacao" ? "🔁 Automação" : "💳 Pacotes"}
          </Button>
        ))}
      </div>

      {tab === "enviar" && (
        <Card>
          <CardHeader><CardTitle>Enviar Notificação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Destinatários</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {targets.map(t => (
                  <Button key={t.key} variant={target === t.key ? "gold" : "outline"} size="sm" onClick={() => { setTarget(t.key); setShowContacts(false); }}>{t.label}</Button>
                ))}
              </div>
              <Button variant="link" size="sm" className="mt-1 p-0" onClick={loadContacts}><Eye className="w-3 h-3 mr-1" />Ver lista de contatos</Button>
            </div>

            {showContacts && (
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                {contacts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-2">Nenhum contato encontrado.</p> :
                  contacts.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground">{c.whatsapp || c.email || "-"}</span>
                    </div>
                  ))
                }
              </div>
            )}

            <div>
              <Label>Canal de Envio</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {([{ key: "app" as const, label: "📱 App" }, { key: "sms" as const, label: "💬 SMS" }, { key: "whatsapp" as const, label: "📲 WhatsApp" }]).map(c => (
                  <Button key={c.key} variant={channel === c.key ? "gold" : "outline"} size="sm" onClick={() => setChannel(c.key)}>{c.label}</Button>
                ))}
              </div>
            </div>
            <div><Label>Título *</Label><Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} className="mt-1" /></div>
            <div><Label>Mensagem *</Label><Input placeholder="Mensagem..." value={message} onChange={e => setMessage(e.target.value)} className="mt-1" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={includeBookingLink} onCheckedChange={setIncludeBookingLink} />
              <Label className="text-sm">Incluir link de agendamento</Label>
            </div>
            {channel !== "app" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                <Phone className="w-3 h-3" /><span>{channel === "sms" ? "SMS via Twilio" : "WhatsApp via Twilio API"}</span>
              </div>
            )}
            <Button variant="gold" onClick={handleSend} disabled={sending}><Send className="w-4 h-4 mr-2" />{sending ? "Enviando..." : `Enviar via ${channel === "app" ? "App" : channel.toUpperCase()}`}</Button>
          </CardContent>
        </Card>
      )}

      {tab === "automacao" && (
        <Card>
          <CardHeader><CardTitle>Programação Semanal</CardTitle><CardDescription>Envio automático via WhatsApp/SMS</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Mensagem padrão</Label><Input value={scheduleMessage} onChange={e => setScheduleMessage(e.target.value)} className="mt-1" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={scheduleRepeat} onCheckedChange={setScheduleRepeat} />
              <Label className="text-sm">Repetição infinita (ciclo semanal)</Label>
            </div>
            <div className="grid gap-3">
              {Object.entries(daysLabels).map(([key, label]) => {
                const flow = schedule.find((f: any) => f.day === key);
                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">{flow ? "✅ " + (flow.message || scheduleMessage) : "Desativado"}</p></div>
                    <Button variant={flow ? "gold" : "outline"} size="sm" onClick={() => toggleDay(key)}>{flow ? "Desativar" : "Ativar"}</Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "pacotes" && (
        <Card>
          <CardHeader><CardTitle>Pacotes de Mensagens</CardTitle><CardDescription>Compre créditos de SMS/WhatsApp para enviar notificações</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {packages.length === 0 ? (
              <div className="text-center py-6"><CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nenhum pacote disponível. Pacotes serão configurados pelo administrador.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map(p => (
                  <Card key={p.id} className="border-primary/20">
                    <CardContent className="p-4">
                      <p className="font-bold text-lg">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.quantity} {p.channel === 'sms' ? 'SMS' : 'WhatsApp'}</p>
                      <p className="text-xl font-bold text-gradient-gold mt-2">R$ {Number(p.price).toFixed(2)}</p>
                      <Button variant="gold" className="w-full mt-3" onClick={() => toast.info("Compra de pacote via PIX em breve!")}><CreditCard className="w-4 h-4 mr-2" />Comprar</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============ AÇÃO ENTRE AMIGOS (ex-Rifas) ============

const AcaoEntreAmigosPage = () => {
  const { barbershop } = useBarbershop();
  const [raffles, setRaffles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", ticket_price: "10", credit_award: "50", max_tickets: "100" });

  useEffect(() => {
    if (barbershop?.id) {
      supabase.from("raffles").select("*").eq("barbershop_id", barbershop.id).order("created_at", { ascending: false }).then(({ data }) => {
        setRaffles(data || []); setLoading(false);
      });
    }
  }, [barbershop?.id]);

  const handleCreate = async () => {
    if (!form.name || !barbershop?.id) return toast.error("Preencha o nome");
    const { data, error } = await supabase.from("raffles").insert([{
      barbershop_id: barbershop.id, name: form.name, description: form.description,
      ticket_price: Number(form.ticket_price), credit_award: Number(form.credit_award), max_tickets: Number(form.max_tickets)
    }]).select();
    if (error) toast.error(error.message);
    else { setRaffles([...(data as any[]), ...raffles]); setShowAdd(false); toast.success("Ação entre Amigos criada!"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Ação entre Amigos</h1>
        <Button variant="gold" onClick={() => setShowAdd(true)}>Criar Sorteio</Button>
      </div>
      {showAdd && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle>Novo Sorteio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Sorteio de Natal" /></div>
              <div className="space-y-2"><Label>Preço por Bilhete (R$)</Label><Input type="number" value={form.ticket_price} onChange={e => setForm({ ...form, ticket_price: e.target.value })} /></div>
              <div className="space-y-2"><Label>Prêmio em Créditos (R$)</Label><Input type="number" value={form.credit_award} onChange={e => setForm({ ...form, credit_award: e.target.value })} /></div>
              <div className="space-y-2"><Label>Máx. Bilhetes</Label><Input type="number" value={form.max_tickets} onChange={e => setForm({ ...form, max_tickets: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalhes..." /></div>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button><Button variant="gold" onClick={handleCreate}>Salvar</Button></div>
          </CardContent>
        </Card>
      )}
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : raffles.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma ação criada.</CardContent></Card>
      ) : (
        <div className="grid gap-4">{raffles.map(r => (
          <Card key={r.id}><CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold">{r.name}</h3>
              <p className="text-sm text-muted-foreground">Preço: R$ {Number(r.ticket_price).toFixed(2)} • Prêmio: R$ {Number(r.credit_award).toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">Status: <span className="capitalize">{r.status}</span></p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.info("Bilhetes em breve")}>Bilhetes</Button>
              <Button variant="destructive" size="sm" onClick={() => toast.info("Sorteio em breve")}>Sortear</Button>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
};

// ============ PIXELS ============

const PixelsPage = () => {
  const { barbershop } = useBarbershop();
  const [configs, setConfigs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: "meta", pixel_id: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!barbershop?.id) return;
    supabase.from("pixel_configurations").select("*").eq("barbershop_id", barbershop.id).then(({ data }) => setConfigs(data || []));
  }, [barbershop?.id]);

  const handleSave = async () => {
    if (!form.pixel_id || !barbershop?.id) { toast.error("Preencha o ID do pixel."); return; }
    setSaving(true);
    const { error } = await supabase.from("pixel_configurations").insert({
      barbershop_id: barbershop.id, platform: form.platform, pixel_id: form.pixel_id,
      events: ["signup", "booking_created", "booking_paid"], is_active: true,
    });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Pixel configurado!"); setShowForm(false); setForm({ platform: "meta", pixel_id: "" });
    supabase.from("pixel_configurations").select("*").eq("barbershop_id", barbershop.id).then(({ data }) => setConfigs(data || []));
  };

  const togglePixel = async (id: string, active: boolean) => {
    await supabase.from("pixel_configurations").update({ is_active: !active }).eq("id", id);
    supabase.from("pixel_configurations").select("*").eq("barbershop_id", barbershop?.id).then(({ data }) => setConfigs(data || []));
    toast.success(active ? "Pixel desativado" : "Pixel ativado");
  };

  const platforms = [
    { key: "meta", name: "Meta Pixel", icon: "📘", desc: "Facebook e Instagram" },
    { key: "google", name: "Google Ads", icon: "🔍", desc: "Google Tag Manager" },
    { key: "tiktok", name: "TikTok Pixel", icon: "🎵", desc: "TikTok Ads" },
    { key: "ga4", name: "Google Analytics 4", icon: "📊", desc: "GA4 Measurement ID" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Pixels & Marketing</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Adicionar Pixel</Button>
      </div>

      {showForm && (
        <Card className="border-primary/30"><CardHeader><CardTitle>Novo Pixel</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Plataforma</Label>
              <select className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                {platforms.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
            </div>
            <div><Label>ID do Pixel *</Label><Input placeholder="Ex: 123456789" value={form.pixel_id} onChange={e => setForm({ ...form, pixel_id: e.target.value })} className="mt-1" /></div>
            <div className="flex gap-2"><Button variant="gold" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
          </CardContent>
        </Card>
      )}

      {configs.length > 0 && (
        <div className="space-y-3">
          {configs.map(c => {
            const plat = platforms.find(p => p.key === c.platform);
            return (
              <Card key={c.id}><CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{plat?.icon || "📦"}</span>
                  <div><p className="font-semibold">{plat?.name || c.platform}</p><p className="text-sm text-muted-foreground">ID: {c.pixel_id}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={c.is_active} onCheckedChange={() => togglePixel(c.id, c.is_active)} />
                  <span className={`text-xs ${c.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>{c.is_active ? 'Ativo' : 'Inativo'}</span>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.filter(p => !configs.some(c => c.platform === p.key)).map(p => (
          <Card key={p.key}>
            <CardHeader>
              <div className="text-2xl mb-1">{p.icon}</div>
              <CardTitle className="text-lg">{p.name}</CardTitle>
              <CardDescription>{p.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => { setForm({ platform: p.key, pixel_id: "" }); setShowForm(true); }}>Configurar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ============ SUPORTE (chat real) ============

const SuportePage = () => {
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
          <CardHeader className="border-b"><CardTitle className="text-sm">Chat #{activeChat.id.slice(0,8)} • {activeChat.status === 'open' ? 'Aberto' : activeChat.status === 'in_progress' ? 'Em Atendimento' : 'Fechado'}</CardTitle></CardHeader>
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

// ============ CONFIGURAÇÕES ============

const ConfiguracoesPage = () => {
  const { barbershop, refetch } = useBarbershop();
  const { profile, user } = useAuth();
  const [rewardType, setRewardType] = useState("commission");
  const [editingShop, setEditingShop] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const [shopForm, setShopForm] = useState({ name: "", phone: "", address: "", description: "" });
  const [affiliateCommission, setAffiliateCommission] = useState("10");
  const [autoPay, setAutoPay] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneForm, setPhoneForm] = useState("");

  useEffect(() => {
    if (barbershop) {
      setShopForm({ name: barbershop.name || "", phone: barbershop.phone || "", address: barbershop.address || "", description: barbershop.description || "" });
      setRewardType(barbershop.affiliate_reward_type || "commission");
      setAffiliateCommission(String(barbershop.affiliate_commission_pct || 10));
      setAutoPay(barbershop.affiliate_auto_pay || false);
    }
    if (profile?.whatsapp) setPhoneForm(profile.whatsapp);
  }, [barbershop, profile]);

  const updateReward = async (type: string) => {
    const { error } = await supabase.from("barbershops").update({ affiliate_reward_type: type }).eq("id", barbershop.id);
    if (!error) { setRewardType(type); toast.success("Atualizado!"); refetch(); }
  };

  const saveShop = async () => {
    setSavingShop(true);
    const { error } = await supabase.from("barbershops").update({
      name: shopForm.name, phone: shopForm.phone || null, address: shopForm.address || null, description: shopForm.description || null,
    }).eq("id", barbershop.id);
    setSavingShop(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Dados salvos!"); setEditingShop(false); refetch();
  };

  const saveAffiliateConfig = async () => {
    const { error } = await supabase.from("barbershops").update({
      affiliate_commission_pct: Number(affiliateCommission), affiliate_auto_pay: autoPay,
    }).eq("id", barbershop.id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Comissões atualizadas!"); refetch(); }
  };

  const savePhone = async () => {
    if (!user) return;
    setSavingPhone(true);
    const { error } = await supabase.from("profiles").update({ whatsapp: phoneForm }).eq("user_id", user.id);
    setSavingPhone(false);
    if (error) toast.error("Erro: " + error.message);
    else toast.success("Telefone atualizado!");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações</h1>

      {/* Phone/WhatsApp */}
      <Card>
        <CardHeader><CardTitle><Phone className="w-5 h-5 inline mr-2" />Meu WhatsApp</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="(11) 99999-0000" value={phoneForm} onChange={e => setPhoneForm(formatWhatsAppBR(e.target.value))} />
            <Button variant="gold" onClick={savePhone} disabled={savingPhone}>{savingPhone ? "..." : "Salvar"}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Barbershop Data */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Dados da Barbearia</CardTitle></div>
          <Button variant="outline" size="sm" onClick={() => setEditingShop(!editingShop)}><Edit className="w-4 h-4 mr-1" />{editingShop ? "Cancelar" : "Editar"}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingShop ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nome</Label><Input value={shopForm.name} onChange={e => setShopForm({ ...shopForm, name: e.target.value })} className="mt-1" /></div>
                <div><Label>Telefone</Label><Input value={shopForm.phone} onChange={e => setShopForm({ ...shopForm, phone: formatWhatsAppBR(e.target.value) })} className="mt-1" /></div>
                <div><Label>Endereço</Label><Input value={shopForm.address} onChange={e => setShopForm({ ...shopForm, address: e.target.value })} className="mt-1" /></div>
                <div><Label>Descrição</Label><Input value={shopForm.description} onChange={e => setShopForm({ ...shopForm, description: e.target.value })} className="mt-1" /></div>
              </div>
              <Button variant="gold" onClick={saveShop} disabled={savingShop}>{savingShop ? "Salvando..." : "Salvar Dados"}</Button>
            </>
          ) : (
            <div className="grid gap-2">
              <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{barbershop?.name}</p></div>
              <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{barbershop?.phone || "-"}</p></div>
              <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Endereço</p><p className="font-medium">{barbershop?.address || "-"}</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affiliate Commission Config */}
      <Card>
        <CardHeader><CardTitle>Comissões de Afiliados</CardTitle><CardDescription>Configure como recompensar indicações</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant={rewardType === "commission" ? "gold" : "outline"} className="flex-1" onClick={() => updateReward("commission")}>💰 Comissão (Dinheiro)</Button>
            <Button variant={rewardType === "credit" ? "gold" : "outline"} className="flex-1" onClick={() => updateReward("credit")}>🎁 Créditos</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>% Comissão por indicação</Label><Input type="number" value={affiliateCommission} onChange={e => setAffiliateCommission(e.target.value)} className="mt-1" min="0" max="100" /></div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={autoPay} onCheckedChange={setAutoPay} />
              <Label>Pagamento automático</Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{autoPay ? "Comissão será paga automaticamente via gateway." : "Comissão será paga manualmente por você."}</p>
          <Button variant="outline" onClick={saveAffiliateConfig}>Salvar Comissões</Button>
        </CardContent>
      </Card>

      {/* View Affiliates */}
      <Card>
        <CardHeader><CardTitle>Dados de Afiliados</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-4"><Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Dados de afiliados vinculados aparecerão aqui.</p></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DonoDashboard;
