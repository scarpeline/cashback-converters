// @ts-nocheck
import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Calendar, Gift, History, Bell, User, LogOut, Menu, X,
  Users, Clock, Wallet, MessageCircle, FileText, Share2, Zap,
  CreditCard, ChevronRight, ChevronDown, Star, Search, MapPin,
  QrCode, Loader2,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy pages
const SejaAfiliadoPage = lazy(() => import("@/components/shared/SejaAfiliadoPage"));
const SolicitarServicoFiscalPage = lazy(() => import("@/components/shared/SolicitarServicoFiscalPage"));
const ProfilePhotoUpload = lazy(() => import("@/components/shared/ProfilePhotoUpload").then(m => ({ default: m.ProfilePhotoUpload })));
const AIChat = lazy(() => import("@/components/AIChat").then(m => ({ default: m.AIChat })));

const HubLoader = () => (
  <div className="space-y-4 p-2 animate-pulse">
    <Skeleton className="h-10 w-64 bg-white/5 rounded-xl" />
    <div className="grid grid-cols-3 gap-4">
      <Skeleton className="h-28 bg-white/5 rounded-2xl" />
      <Skeleton className="h-28 bg-white/5 rounded-2xl" />
      <Skeleton className="h-28 bg-white/5 rounded-2xl" />
    </div>
    <Skeleton className="h-56 w-full bg-white/5 rounded-2xl" />
  </div>
);

// ─── Nav groups with sub-items ────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: "agendamentos",
    label: "Agendamentos",
    icon: Calendar,
    path: "/app/agendamentos",
    exact: false,
    sub: [
      { label: "Agendar", path: "/app", icon: Calendar },
      { label: "Meus Agendamentos", path: "/app/agendamentos", icon: Clock },
      { label: "Histórico", path: "/app/historico", icon: History },
    ],
  },
  {
    id: "recompensas",
    label: "Recompensas",
    icon: Gift,
    path: "/app/cashback",
    exact: false,
    sub: [
      { label: "Cashback", path: "/app/cashback", icon: Gift },
      { label: "Meus Planos", path: "/app/meus-planos", icon: CreditCard },
      { label: "Indique & Ganhe", path: "/app/indicar", icon: Users },
      { label: "Ação Entre Amigos", path: "/app/acao-entre-amigos", icon: Star },
    ],
  },
  {
    id: "servicos",
    label: "Serviços",
    icon: FileText,
    path: "/app/servicos-contabeis",
    exact: false,
    sub: [
      { label: "Serviços Contábeis", path: "/app/servicos-contabeis", icon: FileText },
      { label: "Minhas Dívidas", path: "/app/dividas", icon: Wallet },
      { label: "Suporte", path: "/app/suporte", icon: MessageCircle },
    ],
  },
];

const NAV_SINGLES = [
  { label: "IA Inteligente", path: "/app/ia", icon: Zap },
  { label: "Seja Afiliado", path: "/app/seja-afiliado", icon: Share2 },
  { label: "Notificações", path: "/app/notificacoes", icon: Bell },
  { label: "Meu Perfil", path: "/app/perfil", icon: User },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const ClienteDashboard = () => {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("agendamentos");

  // Auto-expand group with active route
  useEffect(() => {
    for (const g of NAV_GROUPS) {
      if (g.sub.some(s => location.pathname === s.path || (s.path !== "/app" && location.pathname.startsWith(s.path)))) {
        setExpandedGroup(g.id);
        return;
      }
    }
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === "/app" ? location.pathname === "/app" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Mobile toggle */}
      {!sidebarOpen && (
        <Button variant="ghost" size="icon"
          className="fixed top-6 left-6 z-50 lg:hidden text-white bg-slate-900 shadow-lg rounded-xl"
          onClick={() => setSidebarOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-white/5 z-40 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <Link to="/app" className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-9 h-9 rounded-xl" />
              <div>
                <span className="text-base font-black text-white tracking-tight">SalãoCashBack</span>
                <p className="text-[10px] font-black text-emerald-400 tracking-widest uppercase -mt-0.5 opacity-70">Cliente</p>
              </div>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User info */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
              <Avatar className="w-9 h-9 border border-white/10">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-slate-800 text-slate-400 text-xs font-black">
                  {profile?.name?.charAt(0) || "C"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{profile?.name || "Cliente"}</p>
                <p className="text-[10px] text-slate-500 truncate">{profile?.whatsapp || profile?.email}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            {/* Home */}
            <Link to="/app"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${location.pathname === "/app" ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              onClick={() => setSidebarOpen(false)}>
              <Calendar size={18} className={location.pathname === "/app" ? "text-white" : "text-emerald-400/60"} />
              Agendar
            </Link>

            {/* Groups */}
            {NAV_GROUPS.map((group) => {
              const isOpen = expandedGroup === group.id;
              const groupActive = group.sub.some(s => isActive(s.path) && s.path !== "/app");
              return (
                <div key={group.id}>
                  <button
                    onClick={() => setExpandedGroup(isOpen ? null : group.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${groupActive ? "text-white bg-white/5" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    <group.icon size={18} className={groupActive ? "text-emerald-400" : "text-emerald-400/40"} />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown size={13} className={`opacity-40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="ml-3 pl-3 border-l border-white/5 mt-0.5 space-y-0.5">
                      {group.sub.filter(s => s.path !== "/app").map((sub) => (
                        <Link key={sub.path} to={sub.path} onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isActive(sub.path) ? "bg-emerald-500/15 text-emerald-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}>
                          <sub.icon size={13} />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Singles */}
            <div className="pt-2 border-t border-white/5 mt-2 space-y-0.5">
              {NAV_SINGLES.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive(item.path) ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                  <item.icon size={18} className={isActive(item.path) ? "text-white" : "text-emerald-400/40"} />
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <LanguageSelector />
            </div>
            <Button variant="ghost" className="w-full justify-start text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl h-10 font-bold text-sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:pl-72 transition-all duration-300">
        <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        <div className="p-6 max-w-[1200px] mx-auto min-h-screen">
          <Suspense fallback={<HubLoader />}>
            <Routes>
              <Route index element={<HomeHub />} />
              <Route path="agendamentos" element={<AgendamentosHub />} />
              <Route path="historico" element={<HistoricoPage />} />
              <Route path="cashback" element={<CashbackPage />} />
              <Route path="meus-planos" element={<MeusplanosPage />} />
              <Route path="indicar" element={<IndicarPage />} />
              <Route path="acao-entre-amigos" element={<AcaoEntreAmigosPage />} />
              <Route path="dividas" element={<MinhasDividasPage />} />
              <Route path="servicos-contabeis" element={<ServicosContabeisPage />} />
              <Route path="suporte" element={<SuportePage />} />
              <Route path="notificacoes" element={<NotificacoesPage />} />
              <Route path="ia" element={<IAPage />} />
              <Route path="seja-afiliado" element={<SejaAfiliadoPage />} />
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="rifas" element={<AcaoEntreAmigosPage />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
};

// ─── Home Hub ─────────────────────────────────────────────────────────────────
const MOCK_BARBERSHOPS = [
  { id: "1", name: "Barbearia Teste", address: "Rua das Flores, 123", rating: 4.8, services: 5 },
  { id: "2", name: "Corte & Estilo", address: "Av. Principal, 456", rating: 4.5, services: 8 },
  { id: "3", name: "Barbearia Premium", address: "Rua Central, 789", rating: 4.9, services: 6 },
];

const HomeHub = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const filtered = MOCK_BARBERSHOPS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-1">{t("home.greeting")}</h1>
        <p className="text-slate-400 font-medium text-sm">{t("home.find_barbershop")}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("nav.my_appointments"), icon: Clock, path: "/app/agendamentos", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
          { label: t("nav.cashback"), icon: Gift, path: "/app/cashback", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
          { label: t("nav.my_debts"), icon: Wallet, path: "/app/dividas", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
        ].map((a) => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className={`p-4 rounded-2xl border text-center hover:opacity-80 transition-all ${a.color}`}>
            <a.icon className="w-6 h-6 mx-auto mb-1.5" />
            <span className="text-xs font-bold block leading-tight">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          placeholder={t("home.search_placeholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-900/50 border border-white/5 rounded-2xl h-12 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/30"
        />
      </div>

      {/* Barbershops */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t("home.available_barbershops")}</p>
        {filtered.map((shop) => (
          <div key={shop.id}
            className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all cursor-pointer"
            onClick={() => toast.success(`Abrindo ${shop.name}...`)}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-xl">✂️</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">{shop.name}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={11} /> {shop.address}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs flex items-center gap-1 text-yellow-400"><Star size={11} className="fill-yellow-400" /> {shop.rating}</span>
                <span className="text-xs text-slate-600">• {shop.services} serviços</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-600" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Agendamentos Hub ─────────────────────────────────────────────────────────
const AgendamentosHub = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <HubHeader title="Agendamentos" subtitle="Seus horários marcados" gradient="from-blue-400 to-cyan-400" />
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center">
        <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-500 font-medium mb-4">Nenhum agendamento encontrado.</p>
        <button onClick={() => navigate("/app")}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl h-11 px-6 text-sm hover:opacity-90 transition-opacity">
          Fazer meu primeiro agendamento
        </button>
      </div>
    </div>
  );
};

// ─── Histórico ────────────────────────────────────────────────────────────────
const HistoricoPage = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <HubHeader title="Histórico" subtitle="Seus atendimentos anteriores" gradient="from-slate-400 to-slate-300" />
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center">
      <History className="w-12 h-12 text-slate-700 mx-auto mb-4" />
      <p className="text-slate-500 font-medium">Nenhum histórico encontrado.</p>
    </div>
  </div>
);

// ─── Cashback ─────────────────────────────────────────────────────────────────
const CashbackPage = () => {
  const { user } = useAuth();
  const [cashback, setCashback] = useState({ balance: 0, total_earned: 0, history: [] as any[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      (supabase as any).from("cashback_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      (supabase as any).from("profiles").select("cashback_balance, total_cashback_earned").eq("user_id", user.id).maybeSingle(),
    ]).then(([txns, prof]) => {
      setCashback({ balance: Number(prof.data?.cashback_balance || 0), total_earned: Number(prof.data?.total_cashback_earned || 0), history: txns.data || [] });
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <HubHeader title="Cashback" subtitle="Seus créditos e recompensas" gradient="from-emerald-400 to-green-400" />
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-8">
        <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest mb-1">Saldo Disponível</p>
        <p className="text-5xl font-black text-white">{loading ? "..." : `R$ ${cashback.balance.toFixed(2)}`}</p>
        <p className="text-slate-500 text-sm mt-2">Total ganho: <span className="text-white font-bold">R$ {cashback.total_earned.toFixed(2)}</span></p>
      </div>
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
        <p className="text-sm font-black text-white mb-4">Histórico de Cashback</p>
        {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
          : cashback.history.length === 0
          ? <div className="text-center py-8"><Gift className="w-10 h-10 text-slate-700 mx-auto mb-3" /><p className="text-slate-500 text-sm">Nenhum cashback recebido ainda.</p></div>
          : cashback.history.map((tx: any) => (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div><p className="text-sm font-bold text-white">{tx.description || "Cashback"}</p><p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString("pt-BR")}</p></div>
              <span className={`font-black text-sm ${tx.type === "credit" ? "text-emerald-400" : "text-rose-400"}`}>{tx.type === "credit" ? "+" : "-"}R$ {Number(tx.amount).toFixed(2)}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

// ─── Meus Planos ──────────────────────────────────────────────────────────────
const MeusplanosPage = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <HubHeader title="Meus Planos" subtitle="Assinaturas e benefícios" gradient="from-purple-400 to-pink-400" />
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center">
      <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-4" />
      <p className="text-slate-500 font-medium">Nenhum plano ativo.</p>
    </div>
  </div>
);

// ─── Indicar ─────────────────────────────────────────────────────────────────
const IndicarPage = () => {
  const referralCode = "SCB-TESTE01";
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <HubHeader title="Indique & Ganhe" subtitle="Compartilhe e ganhe recompensas" gradient="from-orange-400 to-amber-400" />
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Seu Código de Indicação</p>
        <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5">
          <code className="text-xl font-black text-emerald-400">{referralCode}</code>
          <button onClick={() => { navigator.clipboard?.writeText(`salao.app/r/${referralCode}`); toast.success("Link copiado!"); }}
            className="text-xs font-black text-slate-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
            Copiar Link
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[["0", "Indicados"], ["0", "Convertidos"], ["R$ 0", "Ganhos"]].map(([v, l]) => (
            <div key={l} className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <p className="text-xl font-black text-white">{v}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Ação Entre Amigos ────────────────────────────────────────────────────────
const AcaoEntreAmigosPage = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <HubHeader title="Ação Entre Amigos" subtitle="Rifas e promoções especiais" gradient="from-pink-400 to-rose-400" />
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center">
      <Star className="w-12 h-12 text-slate-700 mx-auto mb-4" />
      <p className="text-slate-500 font-medium">Nenhuma ação disponível no momento.</p>
    </div>
  </div>
);

// ─── Minhas Dívidas ───────────────────────────────────────────────────────────
const MinhasDividasPage = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("debts").select("*, barbershops:barbershop_id(name)").eq("client_user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { setDebts(data || []); setLoading(false); });
  }, [user]);

  const totalPending = debts.filter(d => d.status === "pending").reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <HubHeader title="Minhas Dívidas" subtitle="Valores pendentes com barbearias" gradient="from-rose-400 to-red-400" />
      {totalPending > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div><p className="text-[10px] text-rose-400/60 font-black uppercase tracking-widest mb-1">Total Pendente</p><p className="text-2xl font-black text-rose-400">R$ {totalPending.toFixed(2)}</p></div>
          <Wallet className="w-8 h-8 text-rose-400/40" />
        </div>
      )}
      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-rose-400" /></div>
        : debts.length === 0
        ? <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center"><Wallet className="w-12 h-12 text-slate-700 mx-auto mb-4" /><p className="text-slate-500">Nenhuma dívida pendente. Tudo certo! 🎉</p></div>
        : <div className="space-y-3">{debts.map(d => (
          <div key={d.id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
            <div><p className="font-bold text-white text-sm">{(d as any).barbershops?.name || "Barbearia"}</p><p className="text-xs text-slate-500">{d.description || "Fiado"} • {new Date(d.created_at).toLocaleDateString("pt-BR")}</p></div>
            <div className="text-right"><p className="font-black text-white">R$ {Number(d.amount).toFixed(2)}</p><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${d.status === "pending" ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>{d.status === "pending" ? "Pendente" : "Pago"}</span></div>
          </div>
        ))}</div>}
    </div>
  );
};

// ─── Serviços Contábeis ───────────────────────────────────────────────────────
const ServicosContabeisPage = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <HubHeader title="Serviços Contábeis" subtitle="Solicite serviços fiscais e contábeis" gradient="from-blue-400 to-indigo-400" />
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
      <SolicitarServicoFiscalPage />
    </div>
  </div>
);

// ─── Suporte ──────────────────────────────────────────────────────────────────
const SuportePage = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("support_chats").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).then(({ data }) => {
      setChats(data || []);
      if (data?.length > 0) { setActiveChat(data[0]); loadMessages(data[0].id); }
    });
  }, [user]);

  const loadMessages = async (chatId: string) => {
    const { data } = await (supabase as any).from("support_messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const startNewChat = async () => {
    if (!user) return;
    const { data, error } = await (supabase as any).from("support_chats").insert({ user_id: user.id }).select().single();
    if (error) { toast.error("Erro ao iniciar chat."); return; }
    setActiveChat(data); setChats([data, ...chats]); setMessages([]);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeChat || !user) return;
    setSending(true);
    await (supabase as any).from("support_messages").insert({ chat_id: activeChat.id, sender_id: user.id, message: newMsg.trim(), is_from_support: false });
    setSending(false); setNewMsg(""); loadMessages(activeChat.id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <HubHeader title="Suporte" subtitle="Fale com nossa equipe" gradient="from-violet-400 to-purple-400" />
        <button onClick={startNewChat} className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black rounded-xl h-10 px-5 text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
          <MessageCircle size={14} /> Nova Conversa
        </button>
      </div>
      {!activeChat
        ? <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center"><MessageCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" /><p className="text-slate-500 mb-4">Nenhum chat aberto.</p><button onClick={startNewChat} className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black rounded-xl h-10 px-5 text-sm">Iniciar Conversa</button></div>
        : <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5"><p className="text-sm font-black text-white">Chat #{activeChat.id.slice(0, 8)}</p></div>
            <div className="h-72 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? <p className="text-center text-sm text-slate-500 py-8">Envie sua primeira mensagem.</p>
                : messages.map(m => (
                  <div key={m.id} className={`flex ${m.is_from_support ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${m.is_from_support ? "bg-white/5 text-white" : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"}`}>
                      {m.message}<p className="text-[10px] opacity-50 mt-1">{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
            </div>
            <div className="p-4 border-t border-white/5 flex gap-2">
              <input placeholder="Digite sua mensagem..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-sm text-white placeholder-slate-600 focus:outline-none" />
              <button onClick={sendMessage} disabled={sending} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl h-10 px-4 text-sm disabled:opacity-50">Enviar</button>
            </div>
          </div>}
    </div>
  );
};

// ─── Notificações ─────────────────────────────────────────────────────────────
const NotificacoesPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setNotifications(data || []));
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <HubHeader title="Notificações" subtitle="Suas mensagens e alertas" gradient="from-amber-400 to-orange-400" />
      {notifications.length === 0
        ? <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center"><Bell className="w-12 h-12 text-slate-700 mx-auto mb-4" /><p className="text-slate-500">Nenhuma notificação.</p></div>
        : <div className="space-y-2">{notifications.map(n => (
          <div key={n.id} className={`bg-slate-900/50 border rounded-2xl p-4 ${!n.is_read ? "border-emerald-500/20" : "border-white/5"}`}>
            <p className="font-bold text-white text-sm">{n.title}</p>
            <p className="text-slate-400 text-sm mt-0.5">{n.message}</p>
            <p className="text-xs text-slate-600 mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
          </div>
        ))}</div>}
    </div>
  );
};

// ─── IA ───────────────────────────────────────────────────────────────────────
const IAPage = () => {
  const { profile } = useAuth();
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <HubHeader title="IA Inteligente" subtitle="Assistente virtual do salão" gradient="from-cyan-400 to-blue-400" />
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <AIChat clientId={profile?.id || ""} clientName={profile?.name || "Cliente"} />
      </div>
    </div>
  );
};

// ─── Perfil ───────────────────────────────────────────────────────────────────
const PerfilPage = () => {
  const { profile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "" });
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setForm({ name: profile?.name || "", whatsapp: profile?.whatsapp || "" }); setEditing(true); };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await (supabase as any).from("profiles").update({ name: form.name, whatsapp: form.whatsapp || null }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Perfil atualizado!"); setEditing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <HubHeader title="Meu Perfil" subtitle="Seus dados pessoais" gradient="from-slate-400 to-slate-300" />
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          {user && <ProfilePhotoUpload userId={user.id} avatarUrl={profile?.avatar_url ?? null} onUpdate={() => {}} size="lg" />}
          <div><p className="font-black text-white">{profile?.name || "Cliente"}</p><p className="text-xs text-slate-500">Clique na foto para alterar</p></div>
        </div>
        {editing ? (
          <div className="space-y-4">
            {[["Nome", "name", "text", "Seu nome"], ["WhatsApp", "whatsapp", "text", "(11) 99999-0000"]].map(([l, k, t, p]) => (
              <div key={k}><label className="text-xs text-slate-500 font-bold uppercase tracking-widest">{l}</label><input type={t} placeholder={p} className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-white text-sm focus:outline-none" value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={saveProfile} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl h-11 px-6 text-sm disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
              <button onClick={() => setEditing(false)} className="border border-white/10 text-slate-400 hover:text-white rounded-xl h-11 px-4 text-sm transition-colors">Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[["Nome", profile?.name], ["WhatsApp", profile?.whatsapp], ["E-mail", profile?.email]].map(([l, v]) => (
              <div key={l} className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{l}</p>
                <p className="text-white font-medium text-sm">{v || "-"}</p>
              </div>
            ))}
            <button onClick={startEdit} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl h-11 text-sm mt-2 hover:opacity-90 transition-opacity">Editar Perfil</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Shared helpers ───────────────────────────────────────────────────────────
const HubHeader = ({ title, subtitle, gradient }: { title: string; subtitle: string; gradient: string }) => (
  <div>
    <h1 className="text-3xl font-black tracking-tight text-white mb-1">
      <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{title}</span>
    </h1>
    <p className="text-slate-400 font-medium text-sm">{subtitle}</p>
  </div>
);

export default ClienteDashboard;
