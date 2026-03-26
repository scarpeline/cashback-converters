// @ts-nocheck
/**
 * DonoDashboard - Painel completo do Dono de Barbearia
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  WhatsAppAccountsPanel,
  MessagePackagesPanel,
  CostSplitConfigPanel,
  MessageReportsPanel,
  WhatsAppMonitoringPanel,
} from "@/components/whatsapp";
import SolicitarServicoFiscalPage from "@/components/shared/SolicitarServicoFiscalPage";
import { AccountingDocumentsPanel } from "@/components/shared/AccountingDocumentsPanel";
import { AccountingLinksPanel } from "@/components/shared/AccountingLinksPanel";
import { AccountingTaxesPanel } from "@/components/shared/AccountingTaxesPanel";
import { AccountingMessagesPanel } from "@/components/shared/AccountingMessagesPanel";
import { FiscalAutomationPanel } from "@/components/fiscal/FiscalAutomationPanel";
import { AutomationSettingsPanel } from "@/components/automation/AutomationSettingsPanel";
import { SmartMessagingPanel } from "@/components/automation/SmartMessagingPanel";
import { AgendaIntelligencePanel } from "@/components/agenda/AgendaIntelligencePanel";
import InteligenciaAgendaPage from "@/pages/dashboards/InteligenciaAgendaPage";
import MarketingEmpresarial from "@/components/marketing/MarketingEmpresarial";
import { RecurringAppointmentPanel } from "@/components/recurring/RecurringAppointmentPanel";
import { ContadorBuscaPanel } from "@/components/contabilidade/ContadorBuscaPanel";
import { ChatContadorPanel } from "@/components/contabilidade/ChatContadorPanel";
import { PedidoContabilPanel } from "@/components/contabilidade/PedidoContabilPanel";
import { AssinaturaContabilPanel } from "@/components/contabilidade/AssinaturaContabilPanel";
import { ServicosContabeisHubPage } from "@/components/contabilidade/ServicosContabeisHubPage";
import DadosBancariosPage from "@/components/shared/DadosBancariosPage";
import SejaAfiliadoPage from "@/components/shared/SejaAfiliadoPage";
import { SocialProofManager } from "@/components/social-proof/SocialProofManager";
import { SocialProofPopup } from "@/components/social-proof/SocialProofPopup";
import { DonoOnboarding } from "@/components/onboarding/DonoOnboarding";
import BookingPoliciesPanel from "@/components/settings/BookingPoliciesPanel";
import ResourcesPanel from "@/components/settings/ResourcesPanel";
import { ProfessionalWaitlistPanel } from "@/components/waitlist/ProfessionalWaitlistPanel";
import { AIAudioConfigPanel } from "@/components/ai/AIAudioConfigPanel";
import { ClientReviewsPanel } from "@/components/reviews/ClientReviewsPanel";
import { LoyaltyPanel } from "@/components/gamification/LoyaltyPanel";
import { WeeklySchedulePanel } from "@/components/messaging/WeeklySchedulePanel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Check,
  Clock,
  CalendarCheck,
  ChevronRight,
  Phone,
  Send,
  Share2,
  QrCode,
  CreditCard,
  Edit,
  Eye,
  Wallet,
  Link as LinkIcon,
  UserCheck,
  AlertCircle,
  Repeat,
  Smartphone,
  FileText,
  Calculator,
  Video,
  Zap,
  Percent,
  Activity,
  Briefcase,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { formatWhatsAppBR, onlyDigits } from "@/lib/input-masks";
import {
  isPaymentRequestSupported,
  processNfcPayment,
} from "@/lib/nfc/payment";
import { uploadImage } from "@/lib/upload-image";
import { ProfilePhotoUpload } from "@/components/shared/ProfilePhotoUpload";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import { ReportsPanel } from "@/components/shared/ReportsPanel";
import { AIChat } from "@/components/AIChat";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LanguageSelector } from "@/components/layout/LanguageSelector";

const DonoDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    barbershop: mainBarbershop,
    loading: barbershopLoading,
    refetch: refetchBarbershop,
  } = useBarbershop();

  if (!barbershopLoading && !mainBarbershop) {
    return <DonoOnboarding onComplete={refetchBarbershop} />;
  }

  const basePath = "/painel-dono";

  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Agendamentos", href: `${basePath}/agendamentos`, icon: Calendar },
    {
      name: "Agendamentos Fixos",
      href: `${basePath}/agendamentos-recorrentes`,
      icon: Repeat,
    },
    { name: "Fila de Espera", href: `${basePath}/fila-espera`, icon: Clock },
    { name: "Profissionais", href: `${basePath}/profissionais`, icon: Users },
    { name: "Serviços", href: `${basePath}/servicos`, icon: Scissors },
    { name: "Financeiro", href: `${basePath}/financeiro`, icon: DollarSign },
    { name: "Relatórios", href: `${basePath}/relatorios`, icon: TrendingUp },
    { name: "Meu Plano", href: `${basePath}/meu-plano`, icon: CreditCard },
    { name: "Receber Pagamento", href: `${basePath}/dividas`, icon: Wallet },
    { name: "Afiliados", href: `${basePath}/afiliados`, icon: UserCheck },
    { name: "Estoque", href: `${basePath}/estoque`, icon: Package },
    { name: "Vitrine", href: `${basePath}/vitrine`, icon: Image },
    { name: "Cashback", href: `${basePath}/cashback`, icon: Gift },
    {
      name: "Ação entre Amigos",
      href: `${basePath}/acao-entre-amigos`,
      icon: Gift,
    },
    {
      name: "Prova Social",
      href: `${basePath}/prova-social`,
      icon: TrendingUp,
    },
    { name: "Automações", href: `${basePath}/automacoes`, icon: Bell },
    { name: "IA Inteligente", href: `${basePath}/ia`, icon: Zap },
    {
      name: "Inteligência de Agenda",
      href: `${basePath}/inteligencia-agenda`,
      icon: Settings,
    },
    {
      name: "Marketing Empresarial",
      href: `${basePath}/marketing-empresarial`,
      icon: Video,
    },
    { name: "Pixels & Marketing", href: `${basePath}/pixels`, icon: Image },
    {
      name: "Serviços Contábeis",
      href: `${basePath}/servicos-contabeis`,
      icon: Calculator,
    },
    {
      name: "Dados Bancários",
      href: `${basePath}/dados-bancarios`,
      icon: CreditCard,
    },
    { name: "Nota Fiscal", href: `${basePath}/nota-fiscal`, icon: FileText },
    { name: "Seja Afiliado", href: `${basePath}/seja-afiliado`, icon: Share2 },
    { name: "Suporte", href: `${basePath}/suporte`, icon: MessageCircle },
    { name: "Configurações",
      href: `${basePath}/configuracoes`,
      icon: Settings,
    },
    { name: "Políticas de Agendamento", href: `${basePath}/politicas-agendamento`, icon: CalendarCheck },
    { name: "Recursos", href: `${basePath}/recursos`, icon: Briefcase },
    { name: "WhatsApp", href: `${basePath}/whatsapp-contas`, icon: MessageCircle },
    { name: "Pacotes de Mensagens", href: `${basePath}/whatsapp-pacotes`, icon: Package },
    { name: "Divisão de Custos", href: `${basePath}/whatsapp-custos`, icon: Percent },
    { name: "Relatório WhatsApp", href: `${basePath}/whatsapp-relatorios`, icon: TrendingUp },
    { name: "Monitoramento", href: `${basePath}/whatsapp-monitor`, icon: Activity },
    { name: "Assistente IA", href: `${basePath}/assistente-ia`, icon: Zap },
    { name: "Avaliações", href: `${basePath}/avaliacoes`, icon: Users },
    { name: "Fidelidade", href: `${basePath}/fidelidade`, icon: Gift },
    { name: "Ciclo Mensagens", href: `${basePath}/ciclo-mensagens`, icon: Bell },
  ];

  const isActive = useCallback(
    (href: string) => {
      if (href === basePath)
        return (
          location.pathname === basePath || location.pathname === `${basePath}/`
        );
      return location.pathname.startsWith(href);
    },
    [basePath, location.pathname],
  );

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <Link to={basePath} className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-display font-bold text-lg text-sidebar-primary">
                Painel Dono
              </span>
            </Link>
            <button
              className="lg:hidden text-sidebar-foreground/60"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 border-b border-sidebar-border">
            <p className="font-medium truncate text-sidebar-foreground">
              {profile?.name || "Dono"}
            </p>
            <p className="text-sm text-sidebar-foreground/60 truncate">
              {profile?.email}
            </p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"}`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground"
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
            <LanguageSelector />
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="agendamentos" element={<AgendamentosPage />} />
            <Route
              path="agendamentos-recorrentes"
              element={
                <RecurringAppointmentPanel
                  barbershopId={mainBarbershop?.id || ""}
                />
              }
            />
            <Route path="profissionais" element={<ProfissionaisPage />} />
            <Route path="servicos" element={<ServicosPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="relatorios" element={
              <ReportsPanel barbershopId={mainBarbershop?.id || ""} />
            } />
            <Route path="fila-espera" element={
              <ProfessionalWaitlistPanel barbershopId={mainBarbershop?.id || ""} />
            } />
            <Route path="meu-plano" element={
              <div className="space-y-6">
                <SubscriptionStatus />
                <SubscriptionPlans />
              </div>
            } />
            <Route path="dividas" element={<DividasPage />} />
            <Route path="afiliados" element={<AfiliadosBarbeariaPage />} />
            <Route path="estoque" element={<EstoquePage />} />
            <Route path="vitrine" element={<VitrinePage />} />
            <Route path="cashback" element={<CashbackPage />} />
            <Route path="acao-entre-amigos" element={<AcaoEntreAmigosPage />} />
            <Route path="rifas" element={<AcaoEntreAmigosPage />} />
            <Route
              path="prova-social"
              element={<SocialProofManager barbershopId={mainBarbershop?.id} />}
            />
            <Route path="automacao" element={<NotificacoesDonoPage />} />
            <Route path="automacoes" element={<NotificacoesDonoPage />} />
            <Route path="notificacoes" element={<NotificacoesDonoPage />} />
            <Route path="ia" element={
              <div className="h-full">
                <AIChat clientId={mainBarbershop?.id || ""} clientName={mainBarbershop?.name || "Barbearia"} />
              </div>
            } />
            <Route
              path="inteligencia-agenda"
              element={<InteligenciaAgendaPage />}
            />
            <Route
              path="marketing-empresarial"
              element={
                <div className="p-6">
                  <MarketingEmpresarial isOwner={true} />
                </div>
              }
            />
            <Route path="pixels" element={<PixelsPage />} />
            <Route
              path="servicos-contabeis/*"
              element={
                <ServicosContabeisHubPage barbershopId={mainBarbershop?.id} />
              }
            />
            <Route path="dados-bancarios" element={<DadosBancariosPage />} />
            <Route path="nota-fiscal" element={<NotaFiscalPage />} />
            <Route path="suporte" element={<SuportePage />} />
            <Route path="seja-afiliado" element={<SejaAfiliadoPage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
            <Route path="politicas-agendamento" element={<BookingPoliciesPanel />} />
            <Route path="recursos" element={<ResourcesPanel />} />
            <Route path="whatsapp-contas" element={
              <WhatsAppAccountsPanel barbershopId={mainBarbershop?.id || ""} />
            } />
            <Route path="whatsapp-pacotes" element={
              <MessagePackagesPanel barbershopId={mainBarbershop?.id || ""} />
            } />
            <Route path="whatsapp-custos" element={
              <CostSplitConfigPanel barbershopId={mainBarbershop?.id || ""} />
            } />
            <Route path="whatsapp-relatorios" element={
              <MessageReportsPanel barbershopId={mainBarbershop?.id || ""} />
            } />
            <Route path="whatsapp-monitor" element={
              <WhatsAppMonitoringPanel barbershopId={mainBarbershop?.id || ""} />
            } />
          </Routes>
          <SocialProofPopup currentPage="painel-dono" />
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
    if (!user) {
      setBarbershop(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("barbershops")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);
    if (error) {
      console.error("[DONO] barbershop error:", error.message);
      setBarbershop(null);
      setLoading(false);
      return;
    }
    setBarbershop(data?.[0] ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);
  return { barbershop, loading, refetch };
}

function useServices(barbershopId: string | undefined) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    if (!barbershopId) {
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await (supabase as any)
      .from("services")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("is_active", true);
    setServices(data || []);
    setLoading(false);
  };
  useEffect(() => {
    fetch();
  }, [barbershopId]);
  return { services, loading, refetch: fetch };
}

function useProfessionals(barbershopId: string | undefined) {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    if (!barbershopId) {
      setProfessionals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await (supabase as any)
      .from("professionals")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("is_active", true);
    setProfessionals(data || []);
    setLoading(false);
  };
  useEffect(() => {
    fetch();
  }, [barbershopId]);
  return { professionals, loading, refetch: fetch };
}

function useAppointments(barbershopId: string | undefined) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    if (!barbershopId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await (supabase as any)
      .from("appointments")
      .select("*, services(name, price, duration_minutes), professionals(name)")
      .eq("barbershop_id", barbershopId)
      .order("scheduled_at", { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  };
  useEffect(() => {
    fetch();
  }, [barbershopId]);
  return { appointments, loading, refetch: fetch };
}

// ============ DASHBOARD HOME ============

function useDashboardMetrics(barbershopId: string | undefined) {
  const [metrics, setMetrics] = useState({ todayRevenue: 0, todayAppointments: 0, activeClients: 0, cashbackTotal: 0 });
  useEffect(() => {
    if (!barbershopId) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    Promise.all([
      (supabase as any).from("appointments").select("id", { count: "exact", head: true })
        .eq("barbershop_id", barbershopId)
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString())
        .in("status", ["scheduled", "confirmed", "completed"]),
      (supabase as any).from("appointments").select("services(price)")
        .eq("barbershop_id", barbershopId)
        .eq("status", "completed")
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString()),
      (supabase as any).from("appointments").select("client_name", { count: "exact", head: true })
        .eq("barbershop_id", barbershopId),
    ]).then(([todayApts, completedApts, allClients]) => {
      const revenue = (completedApts.data || []).reduce((s: number, a: any) => s + Number(a.services?.price || 0), 0);
      setMetrics({
        todayAppointments: todayApts.count || 0,
        todayRevenue: revenue,
        activeClients: allClients.count || 0,
        cashbackTotal: 0,
      });
    });
  }, [barbershopId]);
  return metrics;
}

const DashboardHome = () => {
  const navigate = useNavigate();
  const { barbershop } = useBarbershop();
  const metrics = useDashboardMetrics(barbershop?.id);
  const bookingLink = useMemo(
    () =>
      barbershop?.slug
        ? `${window.location.origin}/agendar/${barbershop.slug}`
        : "",
    [barbershop?.slug],
  );

  const handleShare = useCallback(() => {
    if (!bookingLink) {
      toast.error("Configure o slug da barbearia primeiro.");
      return;
    }
    if (navigator.share) {
      navigator.share({ title: barbershop?.name, text: "Agende seu horário!", url: bookingLink });
    } else {
      navigator.clipboard?.writeText(bookingLink);
      toast.success("Link copiado!");
    }
  }, [bookingLink, barbershop?.name]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>
      {barbershop && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{barbershop.name}</p>
                <p className="text-xs text-muted-foreground">
                  Status: {barbershop.subscription_status || "trial"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" />
              Compartilhar Link
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">
              Faturamento Hoje
            </CardDescription>
            <CardTitle className="text-2xl text-gradient-gold">
              R$ {metrics.todayRevenue.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Atendimentos concluídos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">
              Agendamentos Hoje
            </CardDescription>
            <CardTitle className="text-2xl">{metrics.todayAppointments}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">
              Clientes Ativos
            </CardDescription>
            <CardTitle className="text-2xl">{metrics.activeClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">
              Cashback Distribuído
            </CardDescription>
            <CardTitle className="text-2xl">R$ {metrics.cashbackTotal.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="hover:border-primary transition-colors cursor-pointer"
          onClick={() => navigate(`/painel-dono/agendamentos`)}
        >
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Novo Agendamento</CardTitle>
            <CardDescription>Criar agendamento manual</CardDescription>
          </CardHeader>
        </Card>
        <Card
          className="hover:border-primary transition-colors cursor-pointer"
          onClick={() => navigate(`/painel-dono/profissionais`)}
        >
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <CardTitle className="text-lg">Profissionais</CardTitle>
            <CardDescription>Gerenciar equipe</CardDescription>
          </CardHeader>
        </Card>
        <Card
          className="hover:border-primary transition-colors cursor-pointer"
          onClick={() => navigate(`/painel-dono/dividas`)}
        >
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
              <Wallet className="w-5 h-5 text-secondary" />
            </div>
            <CardTitle className="text-lg">Receber Dívida</CardTitle>
            <CardDescription>Cobrar fiados</CardDescription>
          </CardHeader>
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
  const [form, setForm] = useState({
    client_name: "",
    client_whatsapp: "",
    service_id: "",
    professional_id: "",
    scheduled_at: "",
    notes: "",
  });

  const handleCreate = async () => {
    if (
      !form.client_name ||
      !form.service_id ||
      !form.professional_id ||
      !form.scheduled_at
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!barbershop) return;
    setSaving(true);
    const { error } = await (supabase as any).from("appointments").insert({
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
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Agendamento criado!");
    setShowForm(false);
    setForm({
      client_name: "",
      client_whatsapp: "",
      service_id: "",
      professional_id: "",
      scheduled_at: "",
      notes: "",
    });
    refetch();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any)
      .from("appointments")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success(`Status: "${status}"`);
    refetch();
  };

  const statusLabel: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Concluído",
    canceled: "Cancelado",
  };
  const statusColor: Record<string, string> = {
    scheduled: "bg-blue-500/10 text-blue-600",
    confirmed: "bg-primary/10 text-primary",
    completed: "bg-green-500/10 text-green-600",
    canceled: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Agendamentos</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo
        </Button>
      </div>
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Cliente *</Label>
                <Input
                  placeholder="Nome"
                  value={form.client_name}
                  onChange={(e) =>
                    setForm({ ...form, client_name: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  placeholder="(11) 99999-0000"
                  value={form.client_whatsapp}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client_whatsapp: formatWhatsAppBR(e.target.value),
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Serviço *</Label>
                <select
                  className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.service_id}
                  onChange={(e) =>
                    setForm({ ...form, service_id: e.target.value })
                  }
                >
                  <option value="">Selecione</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - R$ {Number(s.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Profissional *</Label>
                <select
                  className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.professional_id}
                  onChange={(e) =>
                    setForm({ ...form, professional_id: e.target.value })
                  }
                >
                  <option value="">Selecione</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Data e Hora *</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) =>
                    setForm({ ...form, scheduled_at: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Input
                  placeholder="..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleCreate} disabled={saving}>
                {saving ? "Salvando..." : "Criar"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento.</p>
            <Button
              variant="gold"
              className="mt-4"
              onClick={() => setShowForm(true)}
            >
              Criar primeiro
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
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[apt.status] || "bg-muted text-muted-foreground"}`}
                  >
                    {statusLabel[apt.status] || apt.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(apt.scheduled_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <div className="flex gap-1">
                    {apt.status === "scheduled" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(apt.id, "confirmed")}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => updateStatus(apt.id, "canceled")}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {apt.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => updateStatus(apt.id, "completed")}
                      >
                        Concluir
                      </Button>
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

// ============ PROFISSIONAIS (com senha de acesso) ============

const ProfissionaisPage = () => {
  const { barbershop } = useBarbershop();
  const { professionals, refetch } = useProfessionals(barbershop?.id);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    commission: "60",
    password: "",
  });

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password || !barbershop) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setSaving(true);

    // 1. Create auth user for professional
    const { data: authData, error: authError } =
      await supabase.functions.invoke("bootstrap-role", {
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
      const { error } = await (supabase as any).from("professionals").insert({
        barbershop_id: barbershop.id,
        name: form.name,
        email: form.email || null,
        whatsapp: form.whatsapp || null,
        commission_percentage: Number(form.commission) || 60,
      });
      setSaving(false);
      if (error) {
        toast.error("Erro: " + error.message);
        return;
      }
      toast.success(`"${form.name}" cadastrado (sem login criado).`);
    } else {
      setSaving(false);
      toast.success(`"${form.name}" cadastrado com acesso ao painel!`);
    }

    setShowForm(false);
    setForm({
      name: "",
      email: "",
      whatsapp: "",
      commission: "60",
      password: "",
    });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Profissionais</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Novo Profissional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Senha de Acesso *</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  placeholder="(11) 99999-0000"
                  value={form.whatsapp}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      whatsapp: formatWhatsAppBR(e.target.value),
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Comissão (%)</Label>
                <Input
                  type="number"
                  value={form.commission}
                  onChange={(e) =>
                    setForm({ ...form, commission: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              O profissional poderá acessar o painel com e-mail e senha.
            </p>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleAdd} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {professionals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum profissional.</p>
          </CardContent>
        </Card>
      ) : (
        professionals.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.email || p.whatsapp || "Sem contato"}
                </p>
              </div>
              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
                Ativo • {p.commission_percentage}%
              </span>
            </CardContent>
          </Card>
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "30",
    description: "",
  });

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      price: String(s.price),
      duration: String(s.duration_minutes || 30),
      description: s.description || "",
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !barbershop) {
      toast.error("Preencha nome e preço.");
      return;
    }
    setSaving(true);
    if (editingId) {
      const { error } = await (supabase as any)
        .from("services")
        .update({
          name: form.name,
          price: Number(form.price),
          duration_minutes: Number(form.duration) || 30,
          description: form.description || null,
        })
        .eq("id", editingId);
      setSaving(false);
      if (error) {
        toast.error("Erro: " + error.message);
        return;
      }
      toast.success(`"${form.name}" atualizado!`);
      setEditingId(null);
    } else {
      const { error } = await (supabase as any).from("services").insert({
        barbershop_id: barbershop.id,
        name: form.name,
        price: Number(form.price),
        duration_minutes: Number(form.duration) || 30,
        description: form.description || null,
      });
      setSaving(false);
      if (error) {
        toast.error("Erro: " + error.message);
        return;
      }
      toast.success(`"${form.name}" criado!`);
      setShowForm(false);
    }
    setForm({ name: "", price: "", duration: "30", description: "" });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Serviços</h1>
        <Button
          variant="gold"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm({ name: "", price: "", duration: "30", description: "" });
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Serviço
        </Button>
      </div>
      {(showForm || editingId) && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>
              {editingId ? "Editar Serviço" : "Novo Serviço"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Corte Masculino"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  placeholder="45.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Descrição"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm({
                    name: "",
                    price: "",
                    duration: "30",
                    description: "",
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {services.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum serviço.</p>
          </CardContent>
        </Card>
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
                  R$ {Number(s.price).toFixed(2)} •{" "}
                  <Clock className="w-3 h-3 inline" /> {s.duration_minutes} min
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </CardContent>
          </Card>
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
    supabase
      .from("payments")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setPayments(data || []));
  }, [barbershop?.id]);

  const totalReceived = useMemo(
    () =>
      payments
        .filter((p) => p.status === "paid" || p.status === "confirmed")
        .reduce((s, p) => s + Number(p.amount), 0),
    [payments],
  );
  const totalPending = useMemo(
    () =>
      payments
        .filter((p) => p.status === "pending")
        .reduce((s, p) => s + Number(p.amount), 0),
    [payments],
  );

  const handlePayProfessional = async (prof: any) => {
    setPayingId(prof.id);
    try {
      const commAmount =
        totalReceived * (Number(prof.commission_percentage) / 100);
      if (commAmount <= 0) {
        toast.error("Sem valor para repasse.");
        setPayingId(null);
        return;
      }
      if (prof.pix_key || prof.asaas_wallet_id) {
        await supabase.functions.invoke("process-payment", {
          body: {
            action: "transfer",
            amount: commAmount,
            recipient_wallet_id: prof.asaas_wallet_id,
            pix_key: prof.pix_key,
            description: `Comissão ${prof.name}`,
          },
        });
        toast.success(`R$ ${commAmount.toFixed(2)} enviado para ${prof.name}!`);
      } else {
        toast.error(
          `${prof.name} não tem PIX cadastrado. Peça para configurar em Conta Bancária.`,
        );
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
          <CardHeader>
            <CardDescription>Recebido</CardDescription>
            <CardTitle className="text-3xl text-gradient-gold">
              R$ {totalReceived.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="gold"
              size="sm"
              className="w-full"
              onClick={() => toast.info("Saque via PIX em breve!")}
            >
              Sacar via PIX
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pendente</CardDescription>
            <CardTitle className="text-2xl">
              R$ {totalPending.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Faturamento do Mês</CardDescription>
            <CardTitle className="text-2xl">
              R$ {(totalReceived + totalPending).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* REPASSE DE COMISSÕES */}
      <Card className="border-secondary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="w-5 h-5" />
                Repasse de Comissões
              </CardTitle>
              <CardDescription>
                Repasse automático ou manual para profissionais
              </CardDescription>
            </div>
            <Button
              variant={showPayout ? "outline" : "gold"}
              size="sm"
              onClick={() => setShowPayout(!showPayout)}
            >
              {showPayout ? "Fechar" : "Gerenciar Repasses"}
            </Button>
          </div>
        </CardHeader>
        {showPayout && (
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={payoutMode === "manual" ? "gold" : "outline"}
                size="sm"
                onClick={() => setPayoutMode("manual")}
              >
                Manual
              </Button>
              <Button
                variant={payoutMode === "auto" ? "gold" : "outline"}
                size="sm"
                onClick={() => setPayoutMode("auto")}
              >
                Automático
              </Button>
            </div>
            {payoutMode === "auto" && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No modo automático, ao concluir um atendimento o sistema
                  divide automaticamente o valor entre dono e profissional via
                  split no gateway de pagamento.
                </p>
                <p className="text-sm font-medium mt-2 text-primary">
                  ✓ Split automático ativo para novos pagamentos
                </p>
              </div>
            )}
            {payoutMode === "manual" && (
              <div className="space-y-3">
                {professionals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum profissional cadastrado.
                  </p>
                ) : (
                  professionals.map((prof) => {
                    const commAmount =
                      totalReceived *
                      (Number(prof.commission_percentage) / 100);
                    return (
                      <div
                        key={prof.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{prof.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Comissão: {prof.commission_percentage}% • PIX:{" "}
                            {prof.pix_key || "Não cadastrado"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-gradient-gold">
                              R$ {commAmount.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              estimado
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="gold"
                            disabled={payingId === prof.id || commAmount <= 0}
                            onClick={() => handlePayProfessional(prof)}
                          >
                            {payingId === prof.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <DollarSign className="w-4 h-4" />
                            )}
                            Pagar
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comissões de Afiliados</CardTitle>
          <CardDescription>Comissões pagas e pendentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Pagas</p>
              <p className="text-xl font-bold text-green-600">R$ 0,00</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-xl font-bold text-yellow-600">R$ 0,00</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>A Receber</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
          <p className="text-[10px] text-muted-foreground mt-1">
            Taxas integradas (Gateway + App) já descontadas.
          </p>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Faturamento do Mês</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
};

// ============ RECEBER PAGAMENTO RÁPIDO ============

const ReceberPagamentoRapido = ({ barbershopId }: { barbershopId: string }) => {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    qr_code?: string;
    copy_paste?: string;
    payment_link?: string;
    payment_id?: string;
  } | null>(null);
  const [nfcSupported] = useState(() => isPaymentRequestSupported());
  const [nfcLoading, setNfcLoading] = useState(false);

  // Vincular a devedor
  const [vincularDevedor, setVincularDevedor] = useState(false);
  const [devedorSelecionado, setDevedorSelecionado] = useState<string>("");
  const [devedores, setDevedores] = useState<any[]>([]);

  useEffect(() => {
    if (open && barbershopId) {
      supabase
        .from("debts")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .eq("status", "pending")
        .order("client_name")
        .then(({ data }) => setDevedores(data || []));
    }
  }, [open, barbershopId]);

  const handleGerar = async () => {
    const amount = Number(valor);
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    setLoading(true);
    setPixData(null);

    const devedorInfo =
      vincularDevedor && devedorSelecionado
        ? devedores.find((d) => d.id === devedorSelecionado)
        : null;

    try {
      const { data, error } = await supabase.functions.invoke(
        "process-payment",
        {
          body: {
            action: "charge",
            amount,
            description: devedorInfo
              ? `Pagamento dívida: ${devedorInfo.client_name}`
              : descricao || "Recebimento rápido",
            billing_type: "PIX",
            external_reference:
              devedorInfo?.id || `quick-${barbershopId}-${Date.now()}`,
          },
        },
      );
      if (error) throw error;
      setPixData({
        qr_code: data?.pix_qr_code || data?.qrCode,
        copy_paste: data?.pix_copy_paste || data?.copyPaste,
        payment_link: data?.payment_link || data?.invoiceUrl,
        payment_id: data?.payment_id,
      });
      toast.success("Cobrança gerada com sucesso!");
    } catch {
      toast.error("Erro ao gerar cobrança. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const handleMarcarPago = async () => {
    if (!vincularDevedor || !devedorSelecionado) return;

    const devedorInfo = devedores.find((d) => d.id === devedorSelecionado);
    const valorPago = Number(valor);
    const valorDivida = Number(devedorInfo?.amount || 0);

    try {
      if (valorPago >= valorDivida) {
        // Paga toda a dívida
        await (supabase as any)
          .from("debts")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", devedorSelecionado);
        toast.success(`Dívida de ${devedorInfo.client_name} quitada!`);
      } else {
        // Abate parcial
        const novoValor = valorDivida - valorPago;
        await (supabase as any)
          .from("debts")
          .update({
            amount: novoValor,
            description: `${devedorInfo.description || "Fiado"} (abatido R$ ${valorPago.toFixed(2)})`,
          })
          .eq("id", devedorSelecionado);
        toast.success(
          `Abatido R$ ${valorPago.toFixed(2)} da dívida de ${devedorInfo.client_name}. Restante: R$ ${novoValor.toFixed(2)}`,
        );
      }

      // Reset
      setPixData(null);
      setValor("");
      setDescricao("");
      setVincularDevedor(false);
      setDevedorSelecionado("");
      setOpen(false);
    } catch {
      toast.error("Erro ao marcar como pago.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Financeiro</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader>
            <CardDescription>Recebido</CardDescription>
            <CardTitle className="text-3xl text-gradient-gold">
              R$ {totalReceived.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="gold"
              size="sm"
              className="w-full"
              onClick={() => toast.info("Saque via PIX em breve!")}
            >
              Sacar via PIX
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pendente</CardDescription>
            <CardTitle className="text-2xl">
              R$ {totalPending.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Faturamento do Mês</CardDescription>
            <CardTitle className="text-2xl">
              R$ {(totalReceived + totalPending).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* REPASSE DE COMISSÕES */}
      <Card className="border-secondary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="w-5 h-5" />
                Repasse de Comissões
              </CardTitle>
              <CardDescription>
                Repasse automático ou manual para profissionais
              </CardDescription>
            </div>
            <Button
              variant={showPayout ? "outline" : "gold"}
              size="sm"
              onClick={() => setShowPayout(!showPayout)}
            >
              {showPayout ? "Fechar" : "Gerenciar Repasses"}
            </Button>
          </div>
        </CardHeader>
        {showPayout && (
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={payoutMode === "manual" ? "gold" : "outline"}
                size="sm"
                onClick={() => setPayoutMode("manual")}
              >
                Manual
              </Button>
              <Button
                variant={payoutMode === "auto" ? "gold" : "outline"}
                size="sm"
                onClick={() => setPayoutMode("auto")}
              >
                Automático
              </Button>
            </div>
            {payoutMode === "auto" && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No modo automático, ao concluir um atendimento o sistema
                  divide automaticamente o valor entre dono e profissional via
                  split no gateway de pagamento.
                </p>
                <p className="text-sm font-medium mt-2 text-primary">
                  ✓ Split automático ativo para novos pagamentos
                </p>
              </div>
            )}
            {payoutMode === "manual" && (
              <div className="space-y-3">
                {professionals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum profissional cadastrado.
                  </p>
                ) : (
                  professionals.map((prof) => {
                    const commAmount =
                      totalReceived *
                      (Number(prof.commission_percentage) / 100);
                    return (
                      <div
                        key={prof.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{prof.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Comissão: {prof.commission_percentage}% • PIX:{" "}
                            {prof.pix_key || "Não cadastrado"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-gradient-gold">
                              R$ {commAmount.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              estimado
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="gold"
                            disabled={payingId === prof.id || commAmount <= 0}
                            onClick={() => handlePayProfessional(prof)}
                          >
                            {payingId === prof.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <DollarSign className="w-4 h-4" />
                            )}
                            Pagar
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comissões de Afiliados</CardTitle>
          <CardDescription>Comissões pagas e pendentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Pagas</p>
              <p className="text-xl font-bold text-green-600">R$ 0,00</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-xl font-bold text-yellow-600">R$ 0,00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cashback por Serviço</CardTitle>
          <CardDescription>Créditos vinculados a clientes</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhum cashback distribuído ainda.
          </p>
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payments.slice(0, 10).map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center p-2 border rounded"
              >
                <div>
                  <p className="text-sm font-medium">
                    R$ {Number(p.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.payment_method} •{" "}
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${p.status === "paid" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}`}
                >
                  {p.status}
                </span>
              </div>
            ))}
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
  const [form, setForm] = useState({
    name: "",
    description: "",
    ticket_price: "10",
    credit_award: "50",
    max_tickets: "100",
    image_url: "",
  });
  const [uploadingImg, setUploadingImg] = useState(false);
  const raffleFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barbershop?.id) {
      supabase
        .from("raffles")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setRaffles(data || []);
          setLoading(false);
        });
    }
  }, [barbershop?.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const url = await uploadImage(file, "raffles", barbershop?.id?.slice(0, 8));
    setUploadingImg(false);
    if (url) setForm((f) => ({ ...f, image_url: url }));
    else toast.error("Erro ao enviar imagem.");
  };

  const handleCreate = async () => {
    if (!form.name || !barbershop?.id) return toast.error("Preencha o nome");
    const { data, error } = await (supabase as any)
      .from("raffles")
      .insert([
        {
          barbershop_id: barbershop.id,
          name: form.name,
          description: form.description,
          ticket_price: Number(form.ticket_price),
          credit_award: Number(form.credit_award),
          max_tickets: Number(form.max_tickets),
          image_url: form.image_url || null,
        },
      ])
      .select();
    if (error) toast.error(error.message);
    else {
      setRaffles([...(data as any[]), ...raffles]);
      setShowAdd(false);
      setForm({ ...form, image_url: "" });
      toast.success("Ação entre Amigos criada!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Ação entre Amigos</h1>
        <Button variant="gold" onClick={() => setShowAdd(true)}>
          Criar Sorteio
        </Button>
      </div>
      {showAdd && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Novo Sorteio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                {form.image_url ? (
                  <div className="relative">
                    <img
                      src={form.image_url}
                      alt=""
                      className="w-20 h-20 rounded-lg object-cover border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-6 w-6"
                      onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                    <input
                      ref={raffleFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={uploadingImg}
                      onClick={() => raffleFileRef.current?.click()}
                    >
                      {uploadingImg ? "..." : "+ Imagem"}
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Sorteio de Natal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço por Bilhete (R$)</Label>
                  <Input
                    type="number"
                    value={form.ticket_price}
                    onChange={(e) =>
                      setForm({ ...form, ticket_price: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prêmio em Créditos (R$)</Label>
                  <Input
                    type="number"
                    value={form.credit_award}
                    onChange={(e) =>
                      setForm({ ...form, credit_award: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. Bilhetes</Label>
                  <Input
                    type="number"
                    value={form.max_tickets}
                    onChange={(e) =>
                      setForm({ ...form, max_tickets: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição</Label>
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Detalhes..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
              <Button variant="gold" onClick={handleCreate}>
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      ) : raffles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma ação criada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {raffles.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{r.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Preço: R$ {Number(r.ticket_price).toFixed(2)} • Prêmio: R${" "}
                    {Number(r.credit_award).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Status:{" "}
                    <span
                      className={`capitalize font-bold ${r.status === "open" ? "text-success" : "text-destructive"}`}
                    >
                      {r.status === "open" ? "Aberta" : "Finalizada"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const { data, error } = await (supabase as any)
                        .from("raffle_tickets")
                        .select("*, profiles(name)")
                        .eq("raffle_id", r.id);
                      if (error) toast.error("Erro ao buscar bilhetes");
                      else
                        toast.info(`${data?.length || 0} bilhetes vendidos.`);
                    }}
                  >
                    Bilhetes
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={r.status !== "open"}
                    onClick={async () => {
                      if (
                        !confirm(
                          "Deseja realizar o sorteio agora? O prêmio será creditado automaticamente.",
                        )
                      )
                        return;
                      const { data, error } = await (supabase as any).rpc(
                        "draw_raffle_winner",
                        { _raffle_id: r.id },
                      );
                      if (error) toast.error(error.message);
                      else
                        toast.success(
                          `Sorteio realizado! Vencedor: ${data.winner_name}`,
                        );
                      setRaffles((current) =>
                        current.map((item) =>
                          item.id === r.id
                            ? { ...item, status: "closed" }
                            : item,
                        ),
                      );
                    }}
                  >
                    Sortear
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
    supabase
      .from("pixel_configurations")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .then(({ data }) => setConfigs(data || []));
  }, [barbershop?.id]);

  const handleSave = async () => {
    if (!form.pixel_id || !barbershop?.id) {
      toast.error("Preencha o ID do pixel.");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("pixel_configurations").insert({
      barbershop_id: barbershop.id,
      platform: form.platform,
      pixel_id: form.pixel_id,
      events: ["signup", "booking_created", "booking_paid"],
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Pixel configurado!");
    setShowForm(false);
    setForm({ platform: "meta", pixel_id: "" });
    supabase
      .from("pixel_configurations")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .then(({ data }) => setConfigs(data || []));
  };

  const togglePixel = async (id: string, active: boolean) => {
    await (supabase as any)
      .from("pixel_configurations")
      .update({ is_active: !active })
      .eq("id", id);
    supabase
      .from("pixel_configurations")
      .select("*")
      .eq("barbershop_id", barbershop?.id)
      .then(({ data }) => setConfigs(data || []));
    toast.success(active ? "Pixel desativado" : "Pixel ativado");
  };

  const platforms = [
    {
      key: "meta",
      name: "Meta Pixel",
      icon: "📘",
      desc: "Facebook e Instagram",
    },
    {
      key: "google",
      name: "Google Ads",
      icon: "🔍",
      desc: "Google Tag Manager",
    },
    { key: "tiktok", name: "TikTok Pixel", icon: "🎵", desc: "TikTok Ads" },
    {
      key: "ga4",
      name: "Google Analytics 4",
      icon: "📊",
      desc: "GA4 Measurement ID",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Pixels & Marketing</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Pixel
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Novo Pixel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Plataforma</Label>
              <select
                className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
              >
                {platforms.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>ID do Pixel *</Label>
              <Input
                placeholder="Ex: 123456789"
                value={form.pixel_id}
                onChange={(e) => setForm({ ...form, pixel_id: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {configs.length > 0 && (
        <div className="space-y-3">
          {configs.map((c) => {
            const plat = platforms.find((p) => p.key === c.platform);
            return (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{plat?.icon || "📦"}</span>
                    <div>
                      <p className="font-semibold">
                        {plat?.name || c.platform}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {c.pixel_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={c.is_active}
                      onCheckedChange={() => togglePixel(c.id, c.is_active)}
                    />
                    <span
                      className={`text-xs ${c.is_active ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {c.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms
          .filter((p) => !configs.some((c) => c.platform === p.key))
          .map((p) => (
            <Card key={p.key}>
              <CardHeader>
                <div className="text-2xl mb-1">{p.icon}</div>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <CardDescription>{p.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setForm({ platform: p.key, pixel_id: "" });
                    setShowForm(true);
                  }}
                >
                  Configurar
                </Button>
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
    supabase
      .from("support_chats")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setChats(data || []);
        if (data && data.length > 0) {
          setActiveChat(data[0]);
          loadMessages(data[0].id);
        }
      });
  }, [user]);

  const loadMessages = async (chatId: string) => {
    const { data } = await (supabase as any)
      .from("support_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const startNewChat = async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from("support_chats")
      .insert({ user_id: user.id })
      .select()
      .single();
    if (error) {
      toast.error("Erro ao iniciar chat.");
      return;
    }
    setActiveChat(data);
    setChats([data, ...chats]);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeChat || !user) return;
    setSending(true);
    const { error } = await (supabase as any).from("support_messages").insert({
      chat_id: activeChat.id,
      sender_id: user.id,
      message: newMsg.trim(),
      is_from_support: false,
    });
    setSending(false);
    if (error) {
      toast.error("Erro ao enviar.");
      return;
    }
    setNewMsg("");
    loadMessages(activeChat.id);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Suporte</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chat com Suporte</CardTitle>
              <CardDescription>
                Envie suas dúvidas e receba ajuda
              </CardDescription>
            </div>
            <Button variant="gold" size="sm" onClick={startNewChat}>
              Novo Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {chats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum chat iniciado. Clique em "Novo Chat" para começar.
            </p>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {chats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant={activeChat?.id === chat.id ? "gold" : "outline"}
                    size="sm"
                    onClick={() => {
                      setActiveChat(chat);
                      loadMessages(chat.id);
                    }}
                  >
                    Chat #{chat.id.slice(0, 6)}
                  </Button>
                ))}
              </div>
              {activeChat && (
                <>
                  <div className="border rounded-lg p-4 h-64 overflow-y-auto space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2 rounded-lg max-w-[80%] ${msg.is_from_support ? "bg-primary/10 mr-auto" : "bg-muted ml-auto"}`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button
                      variant="gold"
                      onClick={sendMessage}
                      disabled={sending}
                    >
                      Enviar
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============ CONFIGURAÇÕES ============

const ConfiguracoesPage = () => {
  const { barbershop, refetch } = useBarbershop();
  const { profile, user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile?.avatar_url ?? null,
  );
  const [rewardType, setRewardType] = useState("commission");
  const [editingShop, setEditingShop] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const [shopForm, setShopForm] = useState({
    name: "",
    phone: "",
    address: "",
    description: "",
  });
  const [affiliateCommission, setAffiliateCommission] = useState("10");
  const [autoPay, setAutoPay] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneForm, setPhoneForm] = useState("");

  useEffect(() => {
    if (barbershop) {
      setShopForm({
        name: barbershop.name || "",
        phone: barbershop.phone || "",
        address: barbershop.address || "",
        description: barbershop.description || "",
      });
      setRewardType(barbershop.affiliate_reward_type || "commission");
      setAffiliateCommission(String(barbershop.affiliate_commission_pct || 10));
      setAutoPay(barbershop.affiliate_auto_pay || false);
    }
    if (profile?.whatsapp) setPhoneForm(profile.whatsapp);
  }, [barbershop, profile]);

  const updateReward = async (type: string) => {
    const { error } = await (supabase as any)
      .from("barbershops")
      .update({ affiliate_reward_type: type })
      .eq("id", barbershop.id);
    if (!error) {
      setRewardType(type);
      toast.success("Atualizado!");
      refetch();
    }
  };

  const saveShop = async () => {
    setSavingShop(true);
    const { error } = await (supabase as any)
      .from("barbershops")
      .update({
        name: shopForm.name,
        phone: shopForm.phone || null,
        address: shopForm.address || null,
        description: shopForm.description || null,
      })
      .eq("id", barbershop.id);
    setSavingShop(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Dados salvos!");
    setEditingShop(false);
    refetch();
  };

  const saveAffiliateConfig = async () => {
    const { error } = await (supabase as any)
      .from("barbershops")
      .update({
        affiliate_commission_pct: Number(affiliateCommission),
        affiliate_auto_pay: autoPay,
      })
      .eq("id", barbershop.id);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Comissões atualizadas!");
      refetch();
    }
  };

  const savePhone = async () => {
    if (!user) return;
    setSavingPhone(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ whatsapp: phoneForm })
      .eq("user_id", user.id);
    setSavingPhone(false);
    if (error) toast.error("Erro: " + error.message);
    else toast.success("Telefone atualizado!");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações</h1>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>Foto exibida no app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ProfilePhotoUpload
              userId={user!.id}
              avatarUrl={avatarUrl ?? profile?.avatar_url ?? null}
              onUpdate={setAvatarUrl}
              size="lg"
            />
            <div>
              <p className="font-semibold">{profile?.name || "Dono"}</p>
              <p className="text-sm text-muted-foreground">
                Passe o mouse e clique na câmera para alterar a foto
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone/WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Phone className="w-5 h-5 inline mr-2" />
            Meu WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="(11) 99999-0000"
              value={phoneForm}
              onChange={(e) => setPhoneForm(formatWhatsAppBR(e.target.value))}
            />
            <Button variant="gold" onClick={savePhone} disabled={savingPhone}>
              {savingPhone ? "..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Barbershop Data */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dados da Barbearia</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingShop(!editingShop)}
          >
            <Edit className="w-4 h-4 mr-1" />
            {editingShop ? "Cancelar" : "Editar"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingShop ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={shopForm.name}
                    onChange={(e) =>
                      setShopForm({ ...shopForm, name: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={shopForm.phone}
                    onChange={(e) =>
                      setShopForm({
                        ...shopForm,
                        phone: formatWhatsAppBR(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input
                    value={shopForm.address}
                    onChange={(e) =>
                      setShopForm({ ...shopForm, address: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={shopForm.description}
                    onChange={(e) =>
                      setShopForm({ ...shopForm, description: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <Button variant="gold" onClick={saveShop} disabled={savingShop}>
                {savingShop ? "Salvando..." : "Salvar Dados"}
              </Button>
            </>
          ) : (
            <div className="grid gap-2">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="font-medium">{barbershop?.name}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="font-medium">{barbershop?.phone || "-"}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Endereço</p>
                <p className="font-medium">{barbershop?.address || "-"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affiliate Commission Config */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões de Afiliados</CardTitle>
          <CardDescription>
            Configure como recompensar indicações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={rewardType === "commission" ? "gold" : "outline"}
              className="flex-1"
              onClick={() => updateReward("commission")}
            >
              💰 Comissão (Dinheiro)
            </Button>
            <Button
              variant={rewardType === "credit" ? "gold" : "outline"}
              className="flex-1"
              onClick={() => updateReward("credit")}
            >
              🎁 Créditos
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>% Comissão por indicação</Label>
              <Input
                type="number"
                value={affiliateCommission}
                onChange={(e) => setAffiliateCommission(e.target.value)}
                className="mt-1"
                min="0"
                max="100"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={autoPay} onCheckedChange={setAutoPay} />
              <Label>Pagamento automático</Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {autoPay
              ? "Comissão será paga automaticamente via gateway."
              : "Comissão será paga manualmente por você."}
          </p>
          <Button variant="outline" onClick={saveAffiliateConfig}>
            Salvar Comissões
          </Button>
        </CardContent>
      </Card>

      {/* View Affiliates - link to dedicated page */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de Afiliados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Gerencie os afiliados da sua barbearia na página dedicada.
            </p>
            <Link to="/painel-dono/afiliados">
              <Button variant="gold">
                <UserCheck className="w-4 h-4 mr-2" />
                Ver Afiliados
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ AFILIADOS DA BARBEARIA ============

const AfiliadosBarbeariaPage = () => {
  const { barbershop, refetch: refetchBarbershop } = useBarbershop();
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardType, setRewardType] = useState("commission");
  const [commission, setCommission] = useState("10");
  const [autoPay, setAutoPay] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    if (!barbershop?.id) return;
    setRewardType(barbershop.affiliate_reward_type || "commission");
    setCommission(String(barbershop.affiliate_commission_pct || 10));
    setAutoPay(barbershop.affiliate_auto_pay || false);

    // Load affiliates linked to this barbershop
    supabase
      .from("affiliates")
      .select("*, profiles:user_id(name, email, whatsapp)")
      .eq("barbershop_id", barbershop.id)
      .eq("type", "afiliado_barbearia")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAffiliates(data || []);
        setLoading(false);
      });
  }, [barbershop?.id]);

  const toggleAffiliate = async (
    affiliateId: string,
    currentActive: boolean,
  ) => {
    const { error } = await (supabase as any)
      .from("affiliates")
      .update({ is_active: !currentActive })
      .eq("id", affiliateId);
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      return;
    }
    toast.success(currentActive ? "Afiliado desativado" : "Afiliado ativado!");
    setAffiliates((prev) =>
      prev.map((a) =>
        a.id === affiliateId ? { ...a, is_active: !currentActive } : a,
      ),
    );
  };

  const saveConfig = async () => {
    if (!barbershop?.id) return;
    setSavingConfig(true);
    const { error } = await (supabase as any)
      .from("barbershops")
      .update({
        affiliate_reward_type: rewardType,
        affiliate_commission_pct: Number(commission),
        affiliate_auto_pay: autoPay,
      })
      .eq("id", barbershop.id);
    setSavingConfig(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Configurações de afiliados salvas!");
    refetchBarbershop();
  };

  const totalEarnings = useMemo(
    () =>
      affiliates.reduce((sum, aff) => sum + Number(aff.total_earnings || 0), 0),
    [affiliates],
  );
  const activeCount = useMemo(
    () => affiliates.filter((a) => a.is_active).length,
    [affiliates],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Afiliados da Barbearia
          </h1>
          <p className="text-muted-foreground text-sm">
            Gerencie clientes que indicam seu negócio
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Afiliados</CardDescription>
            <CardTitle className="text-2xl">{affiliates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ativos</CardDescription>
            <CardTitle className="text-2xl text-primary">
              {activeCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Comissões Totais</CardDescription>
            <CardTitle className="text-2xl text-gradient-gold">
              R$ {totalEarnings.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configurações de Comissão
          </CardTitle>
          <CardDescription>
            Defina como seus afiliados são recompensados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Tipo de Recompensa
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setRewardType("commission")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  rewardType === "commission"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold">💰 Comissão em Dinheiro</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  O afiliado recebe o valor da comissão diretamente em dinheiro
                  (PIX/transferência).
                </p>
              </button>
              <button
                onClick={() => setRewardType("credit")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  rewardType === "credit"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-secondary" />
                  </div>
                  <p className="font-semibold">🎁 Créditos para Serviço</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  O afiliado acumula créditos que podem ser usados em serviços
                  da barbearia.
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>% Comissão por indicação</Label>
              <Input
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="mt-1"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: 10% = R$ 5,00 em um serviço de R$ 50,00
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <div className="flex items-center gap-3">
                <Switch checked={autoPay} onCheckedChange={setAutoPay} />
                <div>
                  <p className="text-sm font-medium">Pagamento automático</p>
                  <p className="text-xs text-muted-foreground">
                    {autoPay
                      ? "Comissão paga automaticamente via gateway"
                      : "Você paga manualmente"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button variant="gold" onClick={saveConfig} disabled={savingConfig}>
            {savingConfig ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {savingConfig ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>

      {/* Affiliate List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Afiliados</CardTitle>
          <CardDescription>
            {affiliates.length} afiliado(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : affiliates.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Nenhum afiliado cadastrado ainda.
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Seus clientes podem se tornar afiliados pelo app do cliente.
                Quando ativados, eles ganham comissões por cada indicação que
                fizer um serviço.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {affiliates.map((a) => {
                const profile = (a as any).profiles;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-4 border rounded-xl transition-all hover:border-primary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${a.is_active ? "bg-primary/10" : "bg-muted"}`}
                      >
                        <UserCheck
                          className={`w-5 h-5 ${a.is_active ? "text-primary" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {profile?.name || "Afiliado"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.whatsapp || profile?.email || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Código:{" "}
                          <span className="font-mono font-medium">
                            {a.referral_code}
                          </span>
                          {" • "}
                          {a.active_referrals || 0} indicações
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {rewardType === "credit" ? "🎁 " : "💰 "}
                          R$ {Number(a.total_earnings || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rewardType === "credit"
                            ? "em créditos"
                            : "em comissões"}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={a.is_active}
                          onCheckedChange={() =>
                            toggleAffiliate(a.id, a.is_active)
                          }
                        />
                        <span
                          className={`text-[10px] font-medium ${a.is_active ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {a.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============ PÁGINAS FALTANTES ============

const DividasPage = () => {
  const { barbershop } = useBarbershop();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barbershop?.id) return;
    supabase
      .from("debts")
      .select("*, profiles:client_id(name, whatsapp)")
      .eq("barbershop_id", barbershop.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setDebts(data || []); setLoading(false); });
  }, [barbershop?.id]);

  const total = debts.reduce((s, d) => s + Number(d.amount || 0), 0);
  const pending = debts.filter((d) => d.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dívidas de Clientes</h1>
        <p className="text-muted-foreground text-sm">Controle de valores em aberto</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total em Aberto</CardDescription><CardTitle className="text-2xl text-red-400">R$ {total.toFixed(2)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Pendentes</CardDescription><CardTitle className="text-2xl">{pending.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total de Registros</CardDescription><CardTitle className="text-2xl">{debts.length}</CardTitle></CardHeader></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Registros</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : debts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma dívida registrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {debts.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-semibold">{(d as any).profiles?.name || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{(d as any).profiles?.whatsapp || ""}</p>
                    <p className="text-xs text-muted-foreground">{d.description || ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-400">R$ {Number(d.amount || 0).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === "paid" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {d.status === "paid" ? "Pago" : "Pendente"}
                    </span>
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

const EstoquePage = () => {
  const { barbershop } = useBarbershop();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barbershop?.id) return;
    supabase
      .from("inventory")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .order("name")
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, [barbershop?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Estoque</h1>
        <p className="text-muted-foreground text-sm">Controle de produtos e insumos</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Itens em Estoque</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum item cadastrado no estoque.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category || "Sem categoria"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.quantity ?? 0} {item.unit || "un"}</p>
                    {item.min_quantity && item.quantity <= item.min_quantity && (
                      <span className="text-xs text-red-400">Estoque baixo</span>
                    )}
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

const VitrinePage = () => {
  const { barbershop } = useBarbershop();
  const vitrine = barbershop?.id ? `${window.location.origin}/v/${barbershop.id}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Vitrine Online</h1>
        <p className="text-muted-foreground text-sm">Página pública da sua barbearia</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-primary" />Link da Vitrine</CardTitle>
          <CardDescription>Compartilhe este link com seus clientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border">
            <LinkIcon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-mono break-all">{vitrine || "Carregando..."}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={() => { navigator.clipboard.writeText(vitrine); toast.success("Link copiado!"); }}>
              <Share2 className="w-4 h-4" />Copiar Link
            </Button>
            <Button variant="gold" className="gap-2" onClick={() => window.open(vitrine, "_blank")}>
              <Eye className="w-4 h-4" />Ver Vitrine
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CashbackPage = () => {
  const { barbershop } = useBarbershop();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Configuração de % de Cashback ---
  const [cashbackPct, setCashbackPct] = useState<string>("5");
  const [savingPct, setSavingPct] = useState(false);

  // --- Níveis VIP ---
  const [vipLevels, setVipLevels] = useState<any[]>([]);
  const [loadingVip, setLoadingVip] = useState(true);
  const [showVipForm, setShowVipForm] = useState(false);
  const [editingVip, setEditingVip] = useState<any>(null);
  const [vipForm, setVipForm] = useState({
    level_name: "",
    min_visits: "0",
    min_spent: "0",
    discount_percentage: "0",
    cashback_multiplier: "1.0",
    benefits: "",
  });

  useEffect(() => {
    if (!barbershop?.id) return;
    // Carregar % de cashback atual
    setCashbackPct(String(barbershop.cashback_percentage ?? 5));
    // Carregar histórico de transações
    supabase
      .from("cashback_transactions")
      .select("*, profiles:client_id(name)")
      .eq("barbershop_id", barbershop.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => { setTransactions(data || []); setLoading(false); });
    // Carregar níveis VIP
    supabase
      .from("vip_levels")
      .select("*")
      .eq("barbershop_id", barbershop.id)
      .order("min_visits", { ascending: true })
      .then(({ data }) => { setVipLevels(data || []); setLoadingVip(false); });
  }, [barbershop?.id]);

  const totalDistribuido = transactions.filter((t) => t.type === "earned").reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalResgatado = transactions.filter((t) => t.type === "redeemed").reduce((s, t) => s + Number(t.amount || 0), 0);

  const saveCashbackPct = async () => {
    if (!barbershop?.id) return;
    const pct = parseFloat(cashbackPct);
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error("Percentual inválido (0–100)"); return; }
    setSavingPct(true);
    const { error } = await supabase.from("barbershops").update({ cashback_percentage: pct }).eq("id", barbershop.id);
    setSavingPct(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); } else { toast.success("% de cashback atualizado!"); }
  };

  const openNewVip = () => {
    setEditingVip(null);
    setVipForm({ level_name: "", min_visits: "0", min_spent: "0", discount_percentage: "0", cashback_multiplier: "1.0", benefits: "" });
    setShowVipForm(true);
  };

  const openEditVip = (level: any) => {
    setEditingVip(level);
    setVipForm({
      level_name: level.level_name || "",
      min_visits: String(level.min_visits ?? 0),
      min_spent: String(level.min_spent ?? 0),
      discount_percentage: String(level.discount_percentage ?? 0),
      cashback_multiplier: String(level.cashback_multiplier ?? 1),
      benefits: Array.isArray(level.benefits) ? level.benefits.join(", ") : (level.benefits || ""),
    });
    setShowVipForm(true);
  };

  const saveVipLevel = async () => {
    if (!barbershop?.id) return;
    if (!vipForm.level_name.trim()) { toast.error("Informe o nome do nível"); return; }
    const payload = {
      barbershop_id: barbershop.id,
      level_name: vipForm.level_name.trim(),
      min_visits: parseInt(vipForm.min_visits) || 0,
      min_spent: parseFloat(vipForm.min_spent) || 0,
      discount_percentage: parseFloat(vipForm.discount_percentage) || 0,
      cashback_multiplier: parseFloat(vipForm.cashback_multiplier) || 1,
      benefits: vipForm.benefits ? vipForm.benefits.split(",").map(b => b.trim()).filter(Boolean) : [],
    };
    let error;
    if (editingVip) {
      ({ error } = await supabase.from("vip_levels").update(payload).eq("id", editingVip.id));
    } else {
      ({ error } = await supabase.from("vip_levels").insert(payload));
    }
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(editingVip ? "Nível atualizado!" : "Nível criado!");
    setShowVipForm(false);
    setLoadingVip(true);
    supabase.from("vip_levels").select("*").eq("barbershop_id", barbershop.id).order("min_visits", { ascending: true })
      .then(({ data }) => { setVipLevels(data || []); setLoadingVip(false); });
  };

  const deleteVipLevel = async (id: string) => {
    if (!confirm("Excluir este nível VIP?")) return;
    const { error } = await supabase.from("vip_levels").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir: " + error.message); return; }
    toast.success("Nível excluído.");
    setVipLevels(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Cashback & Fidelidade</h1>
        <p className="text-muted-foreground text-sm">Configure seu programa de recompensas e níveis VIP</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="pb-2"><CardDescription>Total Distribuído</CardDescription><CardTitle className="text-2xl text-gradient-gold">R$ {totalDistribuido.toFixed(2)}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total Resgatado</CardDescription><CardTitle className="text-2xl">R$ {totalResgatado.toFixed(2)}</CardTitle></CardHeader>
        </Card>
      </div>

      {/* Configuração de % de Cashback */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5 text-primary" />Percentual de Cashback Global</CardTitle>
          <CardDescription>Define quanto % do valor do serviço é devolvido ao cliente como cashback em cada atendimento.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <Label htmlFor="cashback-pct" className="text-sm">Porcentagem (%)</Label>
            <Input
              id="cashback-pct"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={cashbackPct}
              onChange={(e) => setCashbackPct(e.target.value)}
              className="mt-1"
              placeholder="Ex: 5"
            />
          </div>
          <Button variant="gold" onClick={saveCashbackPct} disabled={savingPct} className="gap-2">
            {savingPct ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Salvar
          </Button>
        </CardContent>
      </Card>

      {/* Níveis VIP */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Níveis de Fidelidade VIP</CardTitle>
            <CardDescription>Crie níveis baseados em visitas ou valor gasto para recompensar seus melhores clientes.</CardDescription>
          </div>
          {!showVipForm && (
            <Button variant="gold" size="sm" onClick={openNewVip} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />Novo Nível
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário de criação/edição */}
          {showVipForm && (
            <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
              <p className="font-semibold text-sm">{editingVip ? "Editar Nível" : "Novo Nível VIP"}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Nível *</Label>
                  <Input value={vipForm.level_name} onChange={e => setVipForm({ ...vipForm, level_name: e.target.value })} placeholder="Ex: Bronze, Prata, Ouro" className="mt-1" />
                </div>
                <div>
                  <Label>Visitas mínimas</Label>
                  <Input type="number" min="0" value={vipForm.min_visits} onChange={e => setVipForm({ ...vipForm, min_visits: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Valor gasto mínimo (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={vipForm.min_spent} onChange={e => setVipForm({ ...vipForm, min_spent: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Desconto adicional (%)</Label>
                  <Input type="number" min="0" max="100" step="0.5" value={vipForm.discount_percentage} onChange={e => setVipForm({ ...vipForm, discount_percentage: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Multiplicador de Cashback</Label>
                  <Input type="number" min="1" step="0.1" value={vipForm.cashback_multiplier} onChange={e => setVipForm({ ...vipForm, cashback_multiplier: e.target.value })} className="mt-1" placeholder="Ex: 1.5 = 50% a mais" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Benefícios (separados por vírgula)</Label>
                  <Input value={vipForm.benefits} onChange={e => setVipForm({ ...vipForm, benefits: e.target.value })} placeholder="Ex: Agendamento prioritário, Desconto em produtos" className="mt-1" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="gold" onClick={saveVipLevel} className="gap-2"><CheckCircle className="w-4 h-4" />{editingVip ? "Atualizar" : "Criar Nível"}</Button>
                <Button variant="outline" onClick={() => setShowVipForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Lista de níveis */}
          {loadingVip ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : vipLevels.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum nível VIP criado ainda.</p>
              <p className="text-xs mt-1">Crie níveis para recompensar seus clientes mais fiéis.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vipLevels.map((level) => (
                <div key={level.id} className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base">{level.level_name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span>🏆 Mín. {level.min_visits} visitas</span>
                      <span>💰 Mín. R$ {Number(level.min_spent || 0).toFixed(2)} gastos</span>
                      {level.discount_percentage > 0 && <span>🎟️ {level.discount_percentage}% desconto</span>}
                      {level.cashback_multiplier > 1 && <span>✨ {level.cashback_multiplier}x cashback</span>}
                    </div>
                    {Array.isArray(level.benefits) && level.benefits.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Benefícios: {level.benefits.join(" • ")}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEditVip(level)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteVipLevel(level.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader><CardTitle>Histórico de Transações</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma transação de cashback ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-semibold">{(t as any).profiles?.name || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <span className={`font-bold ${t.type === "earned" ? "text-primary" : "text-muted-foreground"}`}>
                    {t.type === "earned" ? "+" : "-"}R$ {Number(t.amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const NotificacoesDonoPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold">Automação & Notificações</h1>
      <p className="text-muted-foreground text-sm">Configure lembretes e mensagens automáticas</p>
    </div>
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex items-center justify-between sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Potencialize com Inteligência de Agenda
          </CardTitle>
          <CardDescription>
            Ative fila de espera, antecipação automática e regras inteligentes para preencher horários vagos.
          </CardDescription>
        </div>
        <Link to="/painel-dono/inteligencia-agenda" className="mt-3 sm:mt-0">
          <Button variant="default">Abrir Inteligência de Agenda</Button>
        </Link>
      </CardHeader>
    </Card>
    <SmartMessagingPanel />
    <AutomationSettingsPanel />
  </div>
);

const NotaFiscalPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold">Nota Fiscal</h1>
      <p className="text-muted-foreground text-sm">Emita e gerencie notas fiscais dos seus serviços</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Emitir Nota Fiscal</CardTitle>
        <CardDescription>Gere notas fiscais para seus clientes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Cliente</Label>
            <Input placeholder="Nome do cliente" className="mt-1" />
          </div>
          <div>
            <Label>CNPJ/CPF</Label>
            <Input placeholder="00.000.000/0000-00" className="mt-1" />
          </div>
          <div>
            <Label>Descrição do Serviço</Label>
            <Input placeholder="Ex: Corte de cabelo" className="mt-1" />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" placeholder="0.00" className="mt-1" />
          </div>
        </div>
        <Button variant="gold" className="w-full">
          <FileText className="w-4 h-4 mr-2" />
          Emitir Nota Fiscal
        </Button>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Notas Fiscais Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhuma nota fiscal emitida ainda.</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default DonoDashboard;
