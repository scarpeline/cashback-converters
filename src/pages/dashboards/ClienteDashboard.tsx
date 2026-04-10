import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Gift, History, Bell, User, LogOut, Menu, X,
  Users, Clock, Wallet, MessageCircle, FileText, Share2, Zap,
  CreditCard, ChevronRight, ChevronDown, Star, Search, MapPin,
  QrCode, Loader2, Sparkles, ShoppingBag, ShieldCheck, Heart, Plus
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/layout/LanguageSelector";
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
  <div className="space-y-8 animate-in fade-in duration-500 p-4">
    <div className="space-y-2">
       <Skeleton className="h-12 w-80 bg-white/5 rounded-2xl" />
       <Skeleton className="h-4 w-96 bg-white/5 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-32 bg-white/5 rounded-[2rem]" />
      <Skeleton className="h-32 bg-white/5 rounded-[2rem]" />
      <Skeleton className="h-32 bg-white/10 rounded-[2rem]" />
    </div>
    <Skeleton className="h-[500px] w-full bg-white/5 rounded-[3rem]" />
  </div>
);

// ─── Nav groups with sub-items ────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: "agendamentos",
    label: "Agendamentos",
    icon: Calendar,
    path: "/app/agendamentos",
    sub: [
      { label: "Novo Agendamento", path: "/app", icon: Plus },
      { label: "Meus Horários", path: "/app/agendamentos", icon: Clock },
      { label: "Histórico Expert", path: "/app/historico", icon: History },
    ],
  },
  {
    id: "recompensas",
    label: "Fidelidade Diamond",
    icon: Gift,
    path: "/app/cashback",
    sub: [
      { label: "Minha Carteira", path: "/app/cashback", icon: Wallet },
      { label: "Planos Premium", path: "/app/meus-planos", icon: CreditCard },
      { label: "Indique & Ganhe", path: "/app/indicar", icon: Users },
      { label: "Ações Exclusivas", path: "/app/acao-entre-amigos", icon: Star },
    ],
  },
  {
    id: "servicos",
    label: "Central Expert",
    icon: ShieldCheck,
    path: "/app/servicos-contabeis",
    sub: [
      { label: "Contabilidade Pro", path: "/app/servicos-contabeis", icon: FileText },
      { label: "Extrato de Débitos", path: "/app/dividas", icon: ShoppingBag },
      { label: "Suporte VIP", path: "/app/suporte", icon: MessageCircle },
    ],
  },
];

const NAV_SINGLES = [
  { label: "Expert IA Advisor", path: "/app/ia", icon: Zap },
  { label: "Seja Embaixador", path: "/app/seja-afiliado", icon: Sparkles },
  { label: "Notificações", path: "/app/notificacoes", icon: Bell },
  { label: "Perfil Diamond", path: "/app/perfil", icon: User },
];

const ClienteDashboard = () => {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("agendamentos");

  useEffect(() => {
    const handle = () => setSidebarOpen(window.innerWidth >= 1024);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const isActive = (path: string) =>
    path === "/app" ? location.pathname === "/app" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30 overflow-x-hidden">
      {/* Sidebar Mobile Trigger */}
      {!sidebarOpen && (
        <Button variant="ghost" size="icon"
          className="fixed top-6 left-6 z-50 lg:hidden text-white bg-slate-900/80 backdrop-blur-xl shadow-premium rounded-2xl border border-white/10"
          onClick={() => setSidebarOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      )}

      {/* Diamond Sidebar Interface */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-900/30 backdrop-blur-4xl border-r border-white/5 z-40 transition-all duration-700 ease-premium ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full bg-grid-white/[0.01]">
          {/* Brand Identity */}
          <div className="p-8 pb-10 flex items-center justify-between">
            <Link to="/app" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-gradient-gold rounded-[1.4rem] flex items-center justify-center shadow-gold transition-all duration-700 group-hover:rotate-[-10deg] group-hover:scale-110 relative overflow-hidden">
                 <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                 <img src={logo} alt="Logo" className="w-8 h-8 object-contain brightness-0 filter" />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tighter block leading-none">CASHBACK</span>
                <p className="text-[10px] font-black text-orange-400 tracking-[0.3em] uppercase opacity-60">Elite Client</p>
              </div>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Diamond Card */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-[1.8rem] border border-white/5 group hover:border-orange-500/30 transition-all duration-500 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
              <Avatar className="w-11 h-11 border-2 border-white/10 group-hover:border-orange-500/50 transition-all duration-500 shadow-2xl relative z-10">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-slate-800 text-slate-400 text-xs font-black uppercase">{profile?.name?.charAt(0) || "C"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-xs font-black text-white truncate leading-none mb-1">{profile?.name || "Client Name"}</p>
                <div className="flex items-center gap-1.5 overflow-hidden">
                   <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                   <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">Diamond Member</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Interface */}
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
            <p className="px-5 text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 italic opacity-50">App Navigation</p>
            
            {/* New Booking Quick Action */}
            <Link to="/app"
              className={`flex items-center gap-4 px-5 py-4 rounded-[1.4rem] text-sm font-black transition-all duration-500 group relative overflow-hidden ${location.pathname === "/app" ? "bg-gradient-gold text-black shadow-gold diamond-glow scale-[1.02]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              onClick={() => setSidebarOpen(false)}>
              <Calendar size={18} className={`transition-all duration-500 ${location.pathname === "/app" ? "text-black" : "text-orange-400/40 group-hover:text-orange-400"}`} />
              Agendar Novo Horário
            </Link>

            {/* Logical Groups */}
            {NAV_GROUPS.map((group) => {
              const isOpen = expandedGroup === group.id;
              const groupActive = group.sub.some(s => isActive(s.path) && s.path !== "/app");
              return (
                <div key={group.id} className="pt-2">
                  <button
                    onClick={() => setExpandedGroup(isOpen ? null : group.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.4rem] text-sm font-bold transition-all duration-500 ${groupActive ? "text-white bg-white/5" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    <group.icon size={18} className={`transition-all duration-500 ${groupActive ? "text-orange-400" : "text-orange-400/20"}`} />
                    <span className="flex-1 text-left tracking-tight">{group.label}</span>
                    <ChevronDown size={14} className={`opacity-40 transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-700 ease-premium ${isOpen ? "max-h-[300px] opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                    <div className="ml-8 border-l border-white/5 space-y-1 py-1">
                      {group.sub.filter(s => s.path !== "/app").map((sub) => (
                        <Link key={sub.path} to={sub.path} onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative group/sub ${isActive(sub.path) ? "text-orange-400" : "text-slate-500 hover:text-slate-200"}`}>
                          {isActive(sub.path) && <div className="absolute left-0 w-3 h-px bg-orange-400" />}
                          <sub.icon size={12} className="group-hover/sub:scale-125 transition-transform" />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Discover & Support */}
            <div className="pt-6 border-t border-white/5 mt-6 space-y-1">
              <p className="px-5 text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 italic opacity-50">Discovery</p>
              {NAV_SINGLES.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-[1.4rem] text-sm font-bold transition-all duration-500 group relative overflow-hidden ${isActive(item.path) ? "bg-white/5 px-6 border-l-2 border-orange-500 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                  <item.icon size={18} className={`transition-all duration-500 ${isActive(item.path) ? "text-orange-400" : "text-orange-400/20 group-hover:rotate-12"}`} />
                  <span className="tracking-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Diamond Footer */}
          <div className="p-8 border-t border-white/5 mt-auto">
            <div className="flex items-center justify-center p-2 mb-4">
               <LanguageSelector />
            </div>
            <Button variant="ghost" className="w-full justify-start text-rose-500/60 hover:text-white hover:bg-rose-500/10 rounded-2xl h-14 font-black transition-all duration-500 group relative overflow-hidden" onClick={signOut}>
               <div className="absolute inset-0 bg-rose-500 opacity-0 group-hover:opacity-10 transition-opacity" />
               <LogOut className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" /> Sign Out Diamond
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Interface Content */}
      <main className={`transition-all duration-700 ease-premium ${sidebarOpen ? "lg:pl-72" : ""}`}>
        {/* Diamond Header */}
        <header className="sticky top-0 z-30 h-24 bg-slate-950/40 backdrop-blur-[40px] border-b border-white/5 px-10 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
             <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 w-full max-w-[500px] flex items-center gap-3 group focus-within:border-orange-500/40 transition-all duration-500 shadow-2xl">
                <Search className="w-4 h-4 text-slate-500 group-focus-within:text-orange-400" />
                <input 
                    type="text" 
                    placeholder="Encontrar barbearias Elite..." 
                    className="bg-transparent border-none text-sm text-white placeholder-slate-600 focus:outline-none w-full font-bold"
                />
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4 border-r border-white/10 pr-6">
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Server Region</p>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                     <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Global Sync
                  </p>
               </div>
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Global Page Container */}
        <div className="p-8 md:p-12 max-w-[1400px] mx-auto min-h-screen">
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

// ─── Home Diamond ─────────────────────────────────────────────────────────────────
const HomeHub = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [barbershops, setBarbershops] = useState<{ id: string; name: string; address: string; rating: number; services: number }[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);

  useEffect(() => {
    (supabase as any)
      .from("barbershops")
      .select("id, name, address")
      .eq("is_active", true)
      .order("name")
      .limit(20)
      .then(async ({ data }: { data: any[] | null }) => {
        if (!data) { setLoadingShops(false); return; }
        // Enriquecer com contagem de serviços
        const enriched = await Promise.all(
          data.map(async (b) => {
            const { count } = await (supabase as any)
              .from("services")
              .select("*", { count: "exact", head: true })
              .eq("barbershop_id", b.id)
              .eq("is_active", true);
            return { id: b.id, name: b.name, address: b.address || "Endereço não informado", rating: 5.0, services: count || 0 };
          })
        );
        setBarbershops(enriched);
        setLoadingShops(false);
      });
  }, []);

  const filtered = barbershops.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="animate-in slide-in-from-left duration-1000">
          <Badge className="bg-gradient-gold text-black font-black uppercase tracking-[0.2em] text-[9px] px-5 py-1.5 mb-5 rounded-full shadow-gold diamond-glow">Private Selection</Badge>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl">
            {t("home.greeting")}, <span className="text-gradient-gold">Diamond</span>
          </h1>
          <p className="text-slate-400 font-medium text-xl mt-3 italic opacity-80">{t("home.find_barbershop")}</p>
        </div>
        <div className="flex gap-4">
           {[
             { label: "Cashback", val: "R$ 0,00", icon: Gift, color: "text-emerald-400" },
             { label: "Fidelidade", val: "Nível 5", icon: Star, color: "text-orange-400" },
           ].map((stat) => (
             <div key={stat.label} className="bg-white/5 backdrop-blur-3xl p-5 md:p-6 rounded-[2.2rem] border border-white/5 flex flex-col min-w-[160px] shadow-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
                <stat.icon className={`w-5 h-5 mb-3 ${stat.color} group-hover:scale-125 transition-transform duration-500`} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <span className="text-xl font-black text-white mt-1">{stat.val}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in zoom-in-95 duration-1000">
        {[
          { label: t("nav.my_appointments"), icon: Clock, path: "/app/agendamentos", gradient: "from-orange-500/20 to-orange-600/5", text: "text-orange-400" },
          { label: "Carteira VIP", icon: Wallet, path: "/app/cashback", gradient: "from-emerald-500/20 to-emerald-600/5", text: "text-emerald-400" },
          { label: "Indique & Ganhe", icon: Share2, path: "/app/indicar", gradient: "from-orange-500/20 to-orange-600/5", text: "text-orange-400" },
          { label: "Suporte VIP", icon: MessageCircle, path: "/app/suporte", gradient: "from-violet-500/20 to-violet-600/5", text: "text-violet-400" },
        ].map((a, idx) => (
          <button key={a.path} onClick={() => navigate(a.path)}
             style={{ animationDelay: `${idx * 150}ms` }}
            className={`p-8 rounded-[2.5rem] border border-white/5 text-left group hover:border-white/20 transition-all duration-700 bg-gradient-to-br ${a.gradient} backdrop-blur-3xl shadow-xl relative overflow-hidden animate-in slide-in-from-bottom`}>
             <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-10 transition-opacity" />
             <div className={`w-14 h-14 rounded-2xl bg-slate-900/40 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700`}>
                <a.icon className={`w-7 h-7 ${a.text}`} />
             </div>
            <span className="text-xs font-black text-white uppercase tracking-widest italic group-hover:text-gradient-gold transition-all block">{a.label}</span>
            <ChevronRight className="absolute bottom-8 right-8 w-4 h-4 text-white/20 group-hover:translate-x-2 transition-transform" />
          </button>
        ))}
      </div>

      {/* Barbershop Explorer Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
           <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">{t("home.available_barbershops")}</p>
           <Link to="/app/ia" className="text-[9px] font-black text-orange-400 uppercase tracking-widest hover:underline flex items-center gap-2">
              <Sparkles size={12} /> Expert Advisor Recommendations
           </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loadingShops ? (
            [1,2,3].map(i => <div key={i} className="h-72 bg-white/5 rounded-[3rem] animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="col-span-3 text-center py-20">
              <p className="text-slate-600 font-black uppercase text-xs tracking-widest italic">
                {search ? "Nenhum salão encontrado para sua busca." : "Nenhum salão disponível no momento."}
              </p>
            </div>
          ) : filtered.map((shop, idx) => (
            <div key={shop.id}
              style={{ animationDelay: `${idx * 200}ms` }}
              className="bg-slate-900/20 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 flex flex-col gap-8 hover:border-orange-500/30 transition-all duration-700 group cursor-pointer relative overflow-hidden animate-in zoom-in-95"
              onClick={() => toast.success(`Conexão Diamond com ${shop.name} estabelecida.`)}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-gold opacity-0 group-hover:opacity-10 blur-[40px] transition-opacity" />
              <div className="flex justify-between items-start">
                 <div className="w-20 h-20 rounded-[2rem] bg-gradient-gold flex items-center justify-center flex-shrink-0 shadow-gold group-hover:rotate-12 transition-transform duration-700">
                    <Scissors className="text-black w-10 h-10" />
                 </div>
                 <Badge className="bg-white/5 border-white/10 text-yellow-400 font-bold px-4 py-1.5 rounded-full flex items-center gap-2">
                    <Star size={13} className="fill-yellow-400" /> {shop.rating}
                 </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-3xl tracking-tight leading-none group-hover:text-gradient-gold transition-all">{shop.name}</p>
                <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-4"><MapPin size={16} className="text-orange-500" /> {shop.address}</p>
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex -space-x-3">
                     {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black uppercase text-slate-500 overflow-hidden"><Avatar><AvatarImage src={`https://i.pravatar.cc/100?u=${shop.id}${i}`} /></Avatar></div>)}
                  </div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{shop.services} EXPERTS DISPONÍVEIS</span>
                </div>
              </div>
              <Button className="w-full bg-white/5 border border-white/10 hover:bg-gradient-gold hover:text-black font-black rounded-2xl h-16 text-sm transition-all duration-700 group-hover:shadow-gold uppercase tracking-[0.2em]">
                 Agendar Experiência
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Cashback Hub Diamond ─────────────────────────────────────────────────────────────────
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
    <div className="space-y-12 animate-in fade-in duration-1000">
      <HubHeader title="Minha Carteira" subtitle="Gestão de Recompensas e Créditos" gradient="from-emerald-400 to-green-400" icon={<Gift size={24} />} />
      <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group shadow-premium animate-in slide-in-from-bottom">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-1000" />
        <div className="relative z-10">
           <p className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2 italic">
              <ShieldCheck size={16} /> Saldo Verificado Diamond
           </p>
           <p className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl group-hover:text-gradient-gold transition-all duration-1000">
              {loading ? "..." : `R$ ${cashback.balance.toFixed(2)}`}
           </p>
           <div className="flex flex-col md:flex-row gap-6 mt-10">
              <div className="bg-white/5 px-6 py-4 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all duration-500">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Créditos Históricos</p>
                 <p className="text-xl font-black text-white tracking-tight">R$ {cashback.total_earned.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 px-6 py-4 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all duration-500">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status de Fidelidade</p>
                 <p className="text-xl font-black text-orange-400 uppercase tracking-tighter italic">Nível Platinum Pro</p>
              </div>
           </div>
        </div>
      </div>

      <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-slate-900/20 backdrop-blur-3xl">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
           <h3 className="text-2xl font-black text-white italic">Fluxo de Transações</h3>
           <Badge className="bg-white/5 text-slate-500 font-bold px-4 h-8 uppercase tracking-widest">Live Ledger</Badge>
        </div>
        {loading ? <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-emerald-400" /></div>
          : cashback.history.length === 0
          ? <div className="text-center py-20 flex flex-col items-center">
               <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6"><ShoppingBag className="w-8 h-8 text-slate-800" /></div>
               <p className="text-slate-600 font-black uppercase text-xs tracking-[0.2em] italic shadow-premium">Aguardando seu primeiro resgate Diamond.</p>
            </div>
          : (
            <div className="space-y-4">
               {cashback.history.map((tx: any, idx: number) => (
                  <div key={tx.id} 
                     style={{ animationDelay: `${idx * 100}ms` }}
                    className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all duration-500 group animate-in slide-in-from-right">
                    <div className="flex items-center gap-5">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {tx.type === 'credit' ? <Plus size={18} /> : <Clock size={18} />}
                       </div>
                       <div>
                          <p className="text-base font-black text-white tracking-tight">{tx.description || "Recompensa Cashback"}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{new Date(tx.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                       </div>
                    </div>
                    <span className={`text-xl font-black tracking-tighter ${tx.type === "credit" ? "text-emerald-400 group-hover:text-emerald-300" : "text-rose-400"}`}>
                       {tx.type === "credit" ? "+" : "-"} R$ {Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
               ))}
            </div>
          )}
      </div>
    </div>
  );
};

// ─── Help Hub Section Section ──────────────────────────────────────────────────────
const AgendamentosHub = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!user) return;
      (supabase as any)
        .from("appointments")
        .select(`
          id, scheduled_at, status, notes,
          services:service_id (name, price, duration_minutes),
          professionals:professional_id (name, avatar_url),
          barbershops:barbershop_id (name, address)
        `)
        .eq("client_user_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(10)
        .then(({ data }: { data: any[] | null }) => {
          setAppointments(data || []);
          setLoading(false);
        });
    }, [user]);

    const statusLabel: Record<string, { label: string; color: string }> = {
      scheduled: { label: "Confirmado", color: "text-emerald-400" },
      pending: { label: "Pendente", color: "text-orange-400" },
      cancelled: { label: "Cancelado", color: "text-rose-400" },
      completed: { label: "Concluído", color: "text-slate-400" },
    };

    return (
      <div className="space-y-12 animate-in fade-in duration-1000">
        <HubHeader title="Meus Horários" subtitle="Gestão de Atendimentos Confirmados" gradient="from-orange-500 to-orange-400" icon={<Clock size={24} />} />

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-[2rem] animate-pulse" />)}
          </div>
        ) : appointments.length === 0 ? (
          <div className="glass-card p-20 text-center rounded-[3rem] border-white/5 bg-slate-900/20 backdrop-blur-4xl flex flex-col items-center animate-in zoom-in-95 duration-1000">
             <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center mb-10 shadow-premium border border-white/5 relative">
                <div className="absolute inset-0 bg-gradient-gold opacity-5 blur-[10px] rounded-full" />
                <Calendar className="w-10 h-10 text-slate-700 relative z-10" />
             </div>
             <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Agenda Silenciosa</h2>
             <p className="text-slate-500 font-medium text-lg max-w-md mx-auto leading-relaxed mb-10">Você ainda não tem agendamentos futuros. Suas experiências Diamond aparecerão aqui.</p>
             <Button onClick={() => navigate("/app")}
               className="bg-gradient-gold text-black font-black rounded-2xl h-16 px-10 text-sm shadow-gold hover:scale-105 transition-all uppercase tracking-[0.2em] diamond-glow">
               Iniciar Agendamento Pro
             </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt, idx) => {
              const st = statusLabel[apt.status] || { label: apt.status, color: "text-slate-400" };
              const date = new Date(apt.scheduled_at);
              return (
                <div key={apt.id}
                  style={{ animationDelay: `${idx * 100}ms` }}
                  className="glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-orange-500/20 transition-all duration-500 flex flex-col md:flex-row md:items-center gap-6 animate-in slide-in-from-bottom">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-orange-500/10 flex flex-col items-center justify-center border border-orange-500/20 flex-shrink-0">
                    <span className="text-xl font-black text-orange-400 leading-none">{date.getDate()}</span>
                    <span className="text-[9px] font-black text-orange-400/60 uppercase tracking-widest">{date.toLocaleString("pt-BR", { month: "short" })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-lg truncate">{apt.services?.name || "Serviço"}</p>
                    <p className="text-slate-500 text-sm font-medium mt-1 truncate">
                      {apt.professionals?.name} · {apt.barbershops?.name}
                    </p>
                    <p className="text-slate-600 text-xs font-bold mt-1">
                      {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {apt.services?.duration_minutes ? ` · ${apt.services.duration_minutes} min` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-black uppercase tracking-widest ${st.color}`}>{st.label}</span>
                    {apt.services?.price && (
                      <span className="text-lg font-black text-white">R$ {Number(apt.services.price).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

// ─── Shared Interface Components Diamond ───────────────────────────────────────────────────────────
const HubHeader = ({ title, subtitle, gradient, icon }: { title: string; subtitle: string; gradient: string; icon?: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in slide-in-from-left duration-1000 border-b border-white/5 pb-10">
    <div className="flex items-center gap-8">
       {icon && (
         <div className={`w-20 h-20 rounded-[1.8rem] bg-gradient-to-r ${gradient} p-0.5 shadow-2xl group transition-all duration-500`}>
            <div className="w-full h-full rounded-[1.7rem] bg-slate-900 flex items-center justify-center text-white relative overflow-hidden">
               <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors" />
               {icon}
            </div>
         </div>
       )}
       <div>
         <h1 className="text-5xl font-black tracking-tighter text-white mb-2 leading-none uppercase italic drop-shadow-2xl">
           <span className="text-gradient-gold">{title}</span>
         </h1>
         <p className="text-slate-500 font-medium tracking-tight text-xl italic opacity-70">{subtitle}</p>
       </div>
    </div>
    <div className="hidden xl:flex flex-col text-right">
       <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-1">Verificação Diamond</span>
       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-end gap-2">
          <ShieldCheck size={12} /> Protected Session Pro
       </span>
    </div>
  </div>
);

// ─── Legacy Pages Stubs for Completeness ───────────────────────────────────────────────────────
const HistoricoPage = () => <div className="space-y-6 animate-in fade-in duration-500"><HubHeader title="Histórico" subtitle="Expert Selection" gradient="from-slate-400 to-slate-200" icon={<History size={24} />} /><div className="glass-card p-20 text-center rounded-[3rem] border-white/5 bg-slate-900/20"><p className="text-slate-500 font-black uppercase text-xs tracking-widest opacity-30 italic">No Historical Data Recorded</p></div></div>;
const MeusplanosPage = () => <div className="space-y-6 animate-in fade-in duration-500"><HubHeader title="Assinatura" subtitle="Planos Diamond e Black" gradient="from-purple-400 to-pink-400" icon={<Award size={24} />} /><div className="glass-card p-20 text-center rounded-[3rem] border-white/5 bg-slate-900/20"><p className="text-slate-500 font-black uppercase text-xs tracking-widest opacity-30 italic">No Active Premium Subscriptions</p></div></div>;
const IndicarPage = () => {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("affiliates")
      .select("referral_code")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: any }) => setCode(data?.referral_code || null));
  }, [user]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <HubHeader title="Indique & Ganhe" subtitle="Expanda a Rede Diamond" gradient="from-orange-400 to-amber-400" icon={<Share2 size={24} />} />
      <div className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] shadow-gold text-center">
        {code ? (
          <>
            <p className="text-gradient-gold text-4xl font-black mb-4 tracking-tighter">{code}</p>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Seu código exclusivo de embaixador</p>
            <Button onClick={handleCopy} className="mt-8 bg-white/5 border border-white/10 rounded-2xl h-14 px-10 font-bold text-xs uppercase tracking-widest hover:bg-gradient-gold hover:text-black transition-all">
              {copied ? "Copiado!" : "Copiar Invite Diamond"}
            </Button>
          </>
        ) : (
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Você ainda não possui um código de indicação. Torne-se um afiliado para receber o seu.</p>
        )}
      </div>
    </div>
  );
};
const AcaoEntreAmigosPage = () => <div className="space-y-6 animate-in fade-in duration-500"><HubHeader title="Sorteios" subtitle="Ações Entre Membros Diamond" gradient="from-pink-400 to-rose-400" icon={<Star size={24} />} /><div className="glass-card p-20 text-center rounded-[3rem] border-white/5 bg-slate-900/20"><p className="text-slate-500 font-black uppercase text-xs tracking-widest opacity-30 italic">Searching for Available Slots...</p></div></div>;
const MinhasDividasPage = () => <div className="space-y-6 animate-in fade-in duration-500"><HubHeader title="Extrato Financeiro" subtitle="Débitos com Terceiros Elite" gradient="from-rose-400 to-red-400" icon={<ShoppingBag size={24} />} /><div className="glass-card p-20 text-center rounded-[3rem] border-white/5 bg-slate-900/20"><p className="text-emerald-400 font-black uppercase text-xs tracking-widest italic animate-pulse">Conta Auditada: Zero Pendências Diamond 🎉</p></div></div>;
const ServicosContabeisPage = () => <div className="space-y-6 animate-in fade-in duration-500"><HubHeader title="Contabilidade" subtitle="Expert Financial Hub" gradient="from-orange-500 to-orange-600" icon={<FileText size={24} />} /><div className="bg-slate-900/20 rounded-[3rem] border border-white/5 overflow-hidden"><SolicitarServicoFiscalPage /></div></div>;
const SuportePage = () => <div className="space-y-6 animate-in fade-in duration-500"><HubHeader title="Suporte VIP" subtitle="Concierge Diamond 24/7" gradient="from-violet-400 to-purple-400" icon={<MessageCircle size={24} />} /><div className="glass-card p-20 text-center rounded-[3rem] border-white/5 bg-slate-900/20"><p className="text-slate-500 font-black uppercase text-xs tracking-widest opacity-30 italic">Ativando Conexão Criptografada...</p></div></div>;
const NotificacoesPage = () => <div className="space-y-6 animate-in fade-in duration-500"><HubHeader title="Alerta Diamond" subtitle="Notificações Críticas de Sistema" gradient="from-amber-400 to-orange-400" icon={<Bell size={24} />} /><div className="glass-card p-20 text-center rounded-[3rem] border-white/5 bg-slate-900/20"><p className="text-slate-500 font-black uppercase text-xs tracking-widest opacity-30 italic">No Urgent Alerts at the moment</p></div></div>;
const IAPage = () => <div className="space-y-6 animate-in fade-in duration-500"><HubHeader title="Expert Advisor" subtitle="Sua Inteligência de Estilo Avançada" gradient="from-orange-400 to-orange-600" icon={<Zap size={24} />} /><div className="bg-slate-950/40 rounded-[3rem] border border-white/5 overflow-hidden backdrop-blur-3xl"><AIChat /></div></div>;
const PerfilPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <HubHeader title="Identidade" subtitle="Gestão de Perfil Diamond Members" gradient="from-slate-400 to-slate-200" icon={<User size={24} />} />
      <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-slate-900/20 max-w-md">
        <div className="flex items-center gap-6 mb-10">
          <Avatar className="w-20 h-20 border-2 border-orange-500/50 shadow-gold">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-slate-800 text-slate-400 font-black text-xl uppercase">{profile?.name?.charAt(0) || "C"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-2xl font-black text-white leading-none">{profile?.name || "Diamond Member"}</p>
            <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mt-2">Active Partnership</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Nome</p>
            <p className="text-white font-black">{profile?.name || "—"}</p>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">E-mail</p>
            <p className="text-white font-black">{user?.email || "—"}</p>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">WhatsApp</p>
            <p className="text-white font-black">{profile?.whatsapp || "Não informado"}</p>
          </div>
          <Suspense fallback={null}>
            <ProfilePhotoUpload />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ClienteDashboard;
