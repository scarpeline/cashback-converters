// @ts-nocheck
import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatWhatsAppBR } from "@/lib/input-masks";
import {
  LayoutDashboard, Calendar, DollarSign, User, LogOut, Menu, X,
  Zap, ChevronRight, ChevronDown, TrendingUp, FileText,
  Share2, CreditCard, Wallet, Clock, Star, Bell, Search, 
  HelpCircle, Scissors, Users, CheckCircle2, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PostAppointmentNotificationsService } from "@/services/notifications/PostAppointmentNotifications";
import { ProfilePhotoUpload } from "@/components/shared/ProfilePhotoUpload";
import LanguageSelector from "@/components/layout/LanguageSelector";

// Lazy pages
const AgendaProfissional = lazy(() => import("@/components/profissional/AgendaProfissional").then(m => ({ default: m.AgendaProfissional })));
const ContaBancariaPage = lazy(() => import("@/components/profissional/ContaBancariaPage"));
const SejaAfiliadoPage = lazy(() => import("@/components/shared/SejaAfiliadoPage"));
const SolicitarServicoFiscalPage = lazy(() => import("@/components/shared/SolicitarServicoFiscalPage"));
const ContadorBuscaPanel = lazy(() => import("@/components/contabilidade/ContadorBuscaPanel").then(m => ({ default: m.ContadorBuscaPanel })));
const PedidoContabilPanel = lazy(() => import("@/components/contabilidade/PedidoContabilPanel").then(m => ({ default: m.PedidoContabilPanel })));
const AssinaturaContabilPanel = lazy(() => import("@/components/contabilidade/AssinaturaContabilPanel").then(m => ({ default: m.AssinaturaContabilPanel })));
const MarketingEmpresarial = lazy(() => import("@/components/marketing/MarketingEmpresarial"));

const HubLoader = () => (
  <div className="space-y-8 animate-in fade-in duration-500 p-4">
    <div className="space-y-2">
       <Skeleton className="h-10 w-64 bg-white/5 rounded-xl" />
       <Skeleton className="h-4 w-96 bg-white/5 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-48 bg-white/5 rounded-[2.5rem]" />
      <Skeleton className="h-48 bg-white/5 rounded-[2.5rem]" />
      <Skeleton className="h-48 bg-white/10 rounded-[2.5rem]" />
    </div>
    <Skeleton className="h-[400px] w-full bg-white/5 rounded-[3rem]" />
  </div>
);

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_MAIN = [
  { icon: LayoutDashboard, label: "Geral", path: "/painel-profissional", exact: true },
  { icon: Calendar, label: "Agenda", path: "/painel-profissional/agenda" },
  { icon: DollarSign, label: "Financeiro", path: "/painel-profissional/financeiro" },
  { icon: FileText, label: "Contabilidade", path: "/painel-profissional/contabilidade" },
  { icon: TrendingUp, label: "Crescimento", path: "/painel-profissional/crescimento" },
  { icon: User, label: "Perfil", path: "/painel-profissional/perfil" },
];

const ProfissionalDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (profile) PostAppointmentNotificationsService.startNotificationChecker();
  }, [profile]);

  useEffect(() => {
    const handle = () => setSidebarOpen(window.innerWidth >= 1024);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      {/* Sidebar Overlay for Mobile */}
      {!sidebarOpen && (
        <Button variant="ghost" size="icon"
          className="fixed top-6 left-6 z-50 lg:hidden text-white bg-slate-900 shadow-premium rounded-xl"
          onClick={() => setSidebarOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      )}

      {/* Diamond Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 z-40 transition-all duration-700 ease-premium ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full bg-grid-white/[0.02]">
          {/* Brand */}
          <div className="p-10 flex items-center justify-between">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-gold rounded-[1.4rem] flex items-center justify-center shadow-gold transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Zap className="w-7 h-7 text-black fill-black" />
              </div>
              <div>
                <span className="text-2xl font-black text-white tracking-tighter block leading-none">CASHBACK</span>
                <p className="text-[10px] font-black text-orange-400 tracking-[0.3em] uppercase opacity-70">Professional</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar pt-4">
            <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 italic opacity-50">Expert Dashboard</p>
            {NAV_MAIN.map((item, idx) => {
              const active = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className={`flex items-center gap-4 px-5 py-4 rounded-[1.4rem] transition-all duration-500 group relative overflow-hidden animate-in slide-in-from-left-4 ${active ? "bg-gradient-gold text-black font-black shadow-gold diamond-glow scale-[1.02]" : "text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1"}`}>
                  <item.icon size={18} className={`transition-all duration-500 ${active ? "text-black" : "text-orange-400/50 group-hover:text-orange-400 group-hover:scale-125"}`} />
                  <span className="text-sm tracking-tight">{item.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full animate-pulse" />}
                </Link>
              );
            })}
          </nav>

          {/* Diamond Footer */}
          <div className="p-8 mt-auto">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-[1.8rem] border border-white/5 mb-6 group hover:border-orange-500/30 transition-all duration-500 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
              <Avatar className="w-12 h-12 border-2 border-white/10 group-hover:border-orange-500/50 transition-all duration-500 shadow-2xl relative z-10">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-slate-800 text-slate-400 text-xs font-black uppercase">{profile?.name?.substring(0,2) || "PR"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-sm font-black text-white truncate leading-none mb-1">{profile?.name || "Professional"}</p>
                <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest truncate flex items-center gap-1">
                   <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse" /> Expert Partner
                </p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-rose-500/60 hover:text-white hover:bg-rose-500 rounded-2xl h-14 font-black transition-all duration-500 group overflow-hidden relative" onClick={signOut}>
               <div className="absolute inset-0 bg-rose-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
               <span className="relative z-10 flex items-center">
                  <LogOut className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" /> Logout Diamond
               </span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={`transition-all duration-700 ease-premium ${sidebarOpen ? "lg:pl-72" : ""}`}>
        {/* Diamond Header */}
        <header className="sticky top-0 z-30 h-24 bg-slate-950/40 backdrop-blur-[40px] border-b border-white/5 px-10 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
             <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 rounded-[1.2rem] px-6 py-3 w-[450px] group focus-within:border-orange-500/40 focus-within:bg-slate-900/40 transition-all duration-500 shadow-2xl">
                <Search className="w-4 h-4 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Comando Expert: buscar agenda ou ganhos..." 
                    className="bg-transparent border-none text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-0 w-full font-bold tracking-tight"
                />
             </div>
          </div>
          <div className="flex items-center gap-8">
            <LanguageSelector />
            <NotificationBell />
            <div className="hidden xl:flex items-center gap-4 pl-4 border-l border-white/10">
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Status Partner</p>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                       <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Connection Stable
                    </p>
                </div>
            </div>
          </div>
        </header>

        <div className="p-8 md:p-12 max-w-[1600px] mx-auto min-h-screen">
          <Suspense fallback={<HubLoader />}>
            <Routes>
              <Route index element={<ProfHome />} />
              <Route path="agenda" element={<AgendaHub />} />
              <Route path="financeiro/*" element={<FinanceiroHub />} />
              <Route path="contabilidade/*" element={<ContabilidadeHub />} />
              <Route path="crescimento/*" element={<CrescimentoHub />} />
              <Route path="perfil" element={<PerfilHub />} />
              <Route path="*" element={<Navigate to="/painel-profissional" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
};

// ─── Home Diamond ─────────────────────────────────────────────────────────────────────
const ProfHome = () => {
  const { profile } = useAuth();
  const hubs = [
    { label: "Agenda", desc: "Fluxo de cadeiras e horários", icon: Calendar, color: "text-blue-400 bg-blue-500/10", path: "/painel-profissional/agenda" },
    { label: "Financeiro", desc: "Relatórios de ganhos e faturas", icon: DollarSign, color: "text-emerald-400 bg-emerald-500/10", path: "/painel-profissional/financeiro" },
    { label: "Contabilidade", desc: "Expert Fiscal e Tributário", icon: FileText, color: "text-orange-400 bg-orange-500/10", path: "/painel-profissional/contabilidade" },
    { label: "Crescimento", desc: "Marketing e Afiliação Pro", icon: TrendingUp, color: "text-purple-400 bg-purple-500/10", path: "/painel-profissional/crescimento" },
    { label: "Perfil", desc: "Identidade Digital e Ajustes", icon: User, color: "text-slate-400 bg-slate-500/10", path: "/painel-profissional/perfil" },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in slide-in-from-left duration-1000">
        <div>
           <Badge className="bg-gradient-gold text-black font-black uppercase tracking-widest text-[10px] px-4 py-1 mb-4 rounded-full shadow-gold diamond-glow">Expert Cockpit</Badge>
           <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
             Bem-vindo, <span className="text-gradient-gold">{profile?.name?.split(" ")[0] || "Expert"}</span>
           </h1>
           <p className="text-slate-400 font-medium text-lg mt-2">Visão geral do seu desempenho profissional hoje.</p>
        </div>
        <div className="bg-white/5 backdrop-blur-3xl p-4 rounded-[2rem] border border-white/5 flex items-center gap-6 shadow-2xl">
           <div className="flex flex-col text-right">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Nível Diamond</span>
              <span className="text-xs font-black text-white uppercase tracking-tight italic">Top Performer</span>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <Award className="w-6 h-6 text-black" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Agendamentos Hoje", value: "0", icon: <Calendar className="text-orange-400" />, sub: "Cadeiras Ocupadas", gradient: "from-orange-500/5 to-transparent" },
          { label: "Projeção de Ganhos", value: "R$ 0,00", icon: <DollarSign className="text-emerald-400" />, sub: "Bruto Estimado", gradient: "from-emerald-500/5 to-transparent" },
          { label: "Score Profissional", value: "100%", icon: <Star className="text-yellow-400 fill-yellow-400/20" />, sub: "Excelência Diamond", gradient: "from-yellow-500/5 to-transparent" },
        ].map((m, idx) => (
          <div key={m.label} 
            style={{ animationDelay: `${idx * 150}ms` }}
            className={`bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 hover:border-orange-500/30 transition-all duration-700 group relative overflow-hidden animate-in zoom-in-95`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="w-14 h-14 rounded-[1.4rem] bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-gradient-gold group-hover:text-black transition-all duration-700">{m.icon}</div>
              <Badge variant="outline" className="rounded-full bg-white/5 border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest px-3 py-1">{m.sub}</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 tracking-widest relative z-10">{m.label}</p>
            <p className="text-4xl font-black text-white relative z-10 group-hover:text-gradient-gold transition-all">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in slide-in-from-bottom duration-1000">
        {hubs.map((h, idx) => (
          <Link key={h.path} to={h.path}
            style={{ animationDelay: `${idx * 100}ms` }}
            className="bg-slate-900/20 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 hover:border-white/20 hover:bg-slate-900/40 transition-all duration-500 group flex flex-col items-center text-center gap-4 cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 ${h.color} relative z-10`}>
              <h.icon size={28} />
            </div>
            <div className="relative z-10">
              <p className="font-black text-white text-sm uppercase tracking-tight">{h.label}</p>
              <p className="text-slate-600 text-[10px] font-bold mt-1 leading-tight">{h.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ─── Agenda Hub Diamond ───────────────────────────────────────────────────────────────
const AgendaHub = () => (
  <div className="space-y-8 animate-in fade-in duration-700">
    <HubHeader title="Agenda" subtitle="Fluxo operacional e atendimentos confirmados" gradient="from-blue-400 to-cyan-400" icon={<Calendar size={24} />} />
    <div className="glass-card p-4 md:p-8 rounded-[3rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl relative overflow-hidden">
       <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
      <AgendaProfissional />
    </div>
  </div>
);

// ─── Financeiro Hub Diamond ───────────────────────────────────────────────────────────
const FinanceiroHub = () => {
  const [tab, setTab] = useState<"ganhos" | "divida" | "banco">("ganhos");
  const tabs = [
    { id: "ganhos" as const, label: "Relatórios de Ganhos", icon: DollarSign },
    { id: "divida" as const, label: "Controle de Fiados", icon: Wallet },
    { id: "banco" as const, label: "Dados Bancários", icon: CreditCard },
  ];
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <HubHeader title="Financeiro" subtitle="Expert Financial Intelligence" gradient="from-emerald-400 to-green-400" icon={<DollarSign size={24} />} />
      <div className="flex bg-white/5 p-1.5 rounded-[1.8rem] border border-white/5 backdrop-blur-3xl w-fit gap-1">
         {tabs.map(t => (
           <Button key={t.id} variant={tab === t.id ? "gold" : "ghost"} size="sm" className={`rounded-2xl font-black px-6 h-11 transition-premium ${tab === t.id ? 'shadow-gold diamond-glow' : 'text-slate-400 hover:text-white'}`} onClick={() => setTab(t.id)}>
             <t.icon size={14} className="mr-2" /> {t.label}
           </Button>
         ))}
      </div>
      <div className="glass-card p-8 rounded-[3rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl min-h-[400px]">
        {tab === "ganhos" && <GanhosPage />}
        {tab === "divida" && <ReceberDividaPage />}
        {tab === "banco" && <ContaBancariaPage />}
      </div>
    </div>
  );
};

// ─── Contabilidade Hub Diamond ────────────────────────────────────────────────────────
const ContabilidadeHub = () => {
  const [tab, setTab] = useState<"solicitar" | "buscar" | "pedidos" | "assinatura">("solicitar");
  const tabs = [
    { id: "solicitar" as const, label: "Solicitar Expert", icon: FileText },
    { id: "buscar" as const, label: "Buscar Contador", icon: User },
    { id: "pedidos" as const, label: "Status de Pedidos", icon: Clock },
    { id: "assinatura" as const, label: "Plano Expert", icon: Star },
  ];
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <HubHeader title="Contabilidade" subtitle="Gestão Fiscal e Tributária Expert" gradient="from-orange-400 to-amber-400" icon={<FileText size={24} />} />
      <div className="flex bg-white/5 p-1.5 rounded-[1.8rem] border border-white/5 backdrop-blur-3xl w-fit gap-1 overflow-x-auto max-w-full">
         {tabs.map(t => (
           <Button key={t.id} variant={tab === t.id ? "gold" : "ghost"} size="sm" className={`rounded-2xl font-black px-6 h-11 transition-premium shrink-0 ${tab === t.id ? 'shadow-gold diamond-glow' : 'text-slate-400 hover:text-white'}`} onClick={() => setTab(t.id)}>
             <t.icon size={14} className="mr-2" /> {t.label}
           </Button>
         ))}
      </div>
      <div className="glass-card p-8 rounded-[3rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl min-h-[400px]">
        {tab === "solicitar" && <SolicitarServicoFiscalPage />}
        {tab === "buscar" && <ContadorBuscaPanel onAbrirChat={() => {}} />}
        {tab === "pedidos" && <PedidoContabilPanel />}
        {tab === "assinatura" && <AssinaturaContabilPanel />}
      </div>
    </div>
  );
};

// ─── Crescimento Hub Diamond ──────────────────────────────────────────────────────────
const CrescimentoHub = () => {
  const [tab, setTab] = useState<"marketing" | "afiliado">("marketing");
  const tabs = [
    { id: "marketing" as const, label: "Marketing Hub", icon: TrendingUp },
    { id: "afiliado" as const, label: "Network Afiliados", icon: Share2 },
  ];
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <HubHeader title="Crescimento" subtitle="Estratégias de Expansão Pro" gradient="from-purple-400 to-pink-400" icon={<TrendingUp size={24} />} />
      <div className="flex bg-white/5 p-1.5 rounded-[1.8rem] border border-white/5 backdrop-blur-3xl w-fit gap-1">
         {tabs.map(t => (
           <Button key={t.id} variant={tab === t.id ? "gold" : "ghost"} size="sm" className={`rounded-2xl font-black px-6 h-11 transition-premium ${tab === t.id ? 'shadow-gold diamond-glow' : 'text-slate-400 hover:text-white'}`} onClick={() => setTab(t.id)}>
             <t.icon size={14} className="mr-2" /> {t.label}
           </Button>
         ))}
      </div>
      <div className="glass-card p-8 rounded-[3rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl min-h-[400px]">
        {tab === "marketing" && <MarketingEmpresarial isOwner={false} />}
        {tab === "afiliado" && <SejaAfiliadoPage />}
      </div>
    </div>
  );
};

// ─── Perfil Hub Diamond ───────────────────────────────────────────────────────────────
const PerfilHub = () => {
  const { user, profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "", pix_key: "" });

  const startEdit = () => {
    setForm({ name: profile?.name || "", whatsapp: profile?.whatsapp || "", pix_key: profile?.pix_key || "" });
    setEditing(true);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: form.name, whatsapp: form.whatsapp, pix_key: form.pix_key }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Perfil Diamond atualizado!");
    setEditing(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <HubHeader title="Perfil" subtitle="Expert Identity & Settings" gradient="from-slate-400 to-slate-200" icon={<User size={24} />} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
           <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl text-center flex flex-col items-center">
              <div className="relative group">
                 {user && <ProfilePhotoUpload userId={user.id} avatarUrl={profile?.avatar_url ?? null} onUpdate={() => {}} size="xl" />}
                 <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold border-4 border-slate-950 animate-bounce">
                    <Star size={16} className="text-black" />
                 </div>
              </div>
              <h3 className="text-2xl font-black text-white mt-8 tracking-tight">{profile?.name || "Expert"}</h3>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] italic mt-2">Membro Diamond desde 2024</p>
              <div className="w-full h-px bg-white/5 my-8" />
              <div className="flex w-full justify-around">
                 <div className="text-center">
                    <p className="text-xl font-black text-white">100%</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Eficiência</p>
                 </div>
                 <div className="text-center">
                    <p className="text-xl font-black text-white">5.0</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Nota Média</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8">
          <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl">
            <div className="flex items-center justify-between mb-10">
               <h2 className="text-2xl font-black text-white">Dados da Conta</h2>
               {!editing && <Button variant="gold" size="sm" className="rounded-2xl px-6 h-11 font-black shadow-gold diamond-glow" onClick={startEdit}>Editar Dados</Button>}
            </div>
            
            {editing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label className="text-slate-500 font-black uppercase text-[10px] ml-1">Nome Completo</Label>
                     <input className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white font-bold focus:outline-none focus:ring-2 ring-orange-500/20 transition-premium" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-slate-500 font-black uppercase text-[10px] ml-1">WhatsApp Pro</Label>
                     <input className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white font-bold focus:outline-none focus:ring-2 ring-orange-500/20 transition-premium" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: formatWhatsAppBR(e.target.value) })} />
                   </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-500 font-black uppercase text-[10px] ml-1">Chave PIX (Para Recebimentos)</Label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white font-bold focus:outline-none focus:ring-2 ring-orange-500/20 transition-premium" value={form.pix_key} onChange={e => setForm({ ...form, pix_key: e.target.value })} />
                </div>
                <div className="flex gap-4 pt-6">
                  <Button className="flex-1 bg-gradient-gold text-black font-black rounded-2xl h-14 px-8 shadow-gold" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Confirmar Alterações"}</Button>
                  <Button variant="ghost" className="flex-1 rounded-2xl h-14 border border-white/10 font-bold" onClick={() => setEditing(false)}>Descartar</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[["Nome", profile?.name], ["WhatsApp", profile?.whatsapp], ["E-mail Profissional", profile?.email], ["Identificação PIX", profile?.pix_key || "Pendente"]].map(([l, v]) => (
                  <div key={l} className="p-6 bg-white/5 rounded-[1.8rem] border border-white/5 group hover:border-white/10 transition-premium">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">{l}</p>
                    <p className="text-white font-black text-lg tracking-tight group-hover:text-gradient-gold transition-all">{v || "-"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Ganhos Diamond ──────────────────────────────────────────────────────────────
const GanhosPage = () => (
  <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Ganhos em 2024</p>
        <p className="text-5xl font-black text-white group-hover:text-gradient-gold transition-all">R$ 0,00</p>
        <p className="text-xs font-bold text-emerald-400 mt-4 flex items-center gap-2"><TrendingUp size={14} /> +0% vs mês anterior</p>
      </div>
      <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Total de Atendimentos</p>
        <p className="text-5xl font-black text-white group-hover:text-gradient-gold transition-all">0</p>
        <p className="text-xs font-bold text-blue-400 mt-4 flex items-center gap-2"><CheckCircle2 size={14} /> Expert Performance</p>
      </div>
    </div>
    <div className="glass-card p-20 text-center rounded-[3rem] border-white/5 flex flex-col items-center">
       <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <DollarSign className="w-10 h-10 text-slate-700" />
       </div>
       <p className="text-slate-500 font-black tracking-tight uppercase text-xs tracking-widest italic shadow-premium">Aguardando seu primeiro atendimento Diamond.</p>
    </div>
  </div>
);

// ─── Receber Dívida Diamond ──────────────────────────────────────────────────────
const ReceberDividaPage = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_whatsapp: "", amount: "", description: "" });

  const reload = () => {
    if (!user) return;
    supabase.from("debts").select("*").eq("professional_user_id", user.id).order("created_at", { ascending: false }).then(({ data }: any) => setDebts(data || []));
  };
  useEffect(() => { reload(); }, [user?.id]);

  const handleCreate = async () => {
    if (!form.client_name || !form.amount || !user) { toast.error("Preencha campos obrigatórios."); return; }
    setSaving(true);
    const { error } = await supabase.from("debts").insert({ professional_user_id: user.id, client_name: form.client_name, client_whatsapp: form.client_whatsapp || null, amount: Number(form.amount), description: form.description || null });
    setSaving(false);
    if (error) { toast.error("Erro no registro"); return; }
    toast.success("Dívida registrada com sucesso!");
    setShowForm(false);
    setForm({ client_name: "", client_whatsapp: "", amount: "", description: "" });
    reload();
  };

  const totalPending = debts.filter(d => d.status === "pending").reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
      <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2rem] border border-white/5">
        <div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1 italic">Passivo de Terceiros</p>
          <p className="text-4xl font-black text-rose-400 group-hover:text-gradient-gold">R$ {totalPending.toFixed(2)}</p>
        </div>
        <Button variant="gold" className="rounded-2xl h-14 px-8 font-black shadow-gold diamond-glow hover:scale-105 transition-all" onClick={() => setShowForm(!showForm)}>
           <Plus className="mr-2" size={18} /> Registrar Novo Fiado
        </Button>
      </div>

      {showForm && (
        <div className="p-10 bg-slate-900 border border-orange-500/20 rounded-[3rem] shadow-gold animate-in zoom-in-95 duration-500 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px] rounded-full" />
          <h3 className="text-2xl font-black text-white relative z-10 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><Wallet className="text-orange-400" size={20} /></div>
             Controle de Recebíveis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-2">
               <Label className="text-slate-500 font-bold uppercase text-[10px] ml-1">Cliente *</Label>
               <input placeholder="Nome" className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white font-bold focus:ring-2 ring-orange-500/20" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
            </div>
            <div className="space-y-2">
               <Label className="text-slate-500 font-bold uppercase text-[10px] ml-1">Whatsapp</Label>
               <input placeholder="(11) 99999-0000" className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white font-bold focus:ring-2 ring-orange-500/20" value={form.client_whatsapp} onChange={e => setForm({ ...form, client_whatsapp: formatWhatsAppBR(e.target.value) })} />
            </div>
            <div className="space-y-2">
               <Label className="text-slate-500 font-bold uppercase text-[10px] ml-1">Valor (R$) *</Label>
               <input type="number" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white font-bold focus:ring-2 ring-orange-500/20" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
               <Label className="text-slate-500 font-bold uppercase text-[10px] ml-1">Descrição</Label>
               <input placeholder="Ex: Corte + Barba" className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white font-bold focus:ring-2 ring-orange-500/20" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-4 pt-4 relative z-10">
            <Button className="flex-1 bg-gradient-gold text-black font-black rounded-2xl h-16 shadow-gold" onClick={handleCreate} disabled={saving}>{saving ? "Auditando..." : "Confirmar Registro"}</Button>
            <Button variant="ghost" className="flex-1 rounded-2xl h-16 border border-white/10 font-bold" onClick={() => setShowForm(false)}>Descartar</Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {debts.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6"><Wallet className="text-slate-800" size={32} /></div>
             <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Parabéns! Nenhuma pendência externa.</p>
          </div>
        ) : (
          debts.map((d, idx) => (
            <div key={d.id} 
              style={{ animationDelay: `${idx * 100}ms` }}
              className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between group hover:border-orange-500/20 transition-all duration-500 animate-in slide-in-from-right relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="flex items-center gap-6 relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-gradient-gold group-hover:text-black transition-all">
                    <User size={24} />
                 </div>
                 <div>
                    <p className="text-xl font-black text-white group-hover:text-gradient-gold transition-all">{d.client_name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">{d.description || "Transação Diversa"}</p>
                 </div>
              </div>
              <div className="text-right relative z-10 mt-4 md:mt-0">
                <p className="text-2xl font-black text-white">R$ {Number(d.amount).toFixed(2)}</p>
                <div className="flex items-center justify-end gap-2 mt-2">
                   <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${d.status === 'pending' ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
                   <span className={`text-[9px] font-black uppercase tracking-widest ${d.status === "pending" ? "text-yellow-400" : "text-emerald-400"}`}>
                      {d.status === "pending" ? "Aguardando Recebimento" : "Recebido Diamond"}
                   </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Shared UI Helpers Diamond ────────────────────────────────────────────────────────
const HubHeader = ({ title, subtitle, gradient, icon }: { title: string; subtitle: string; gradient: string; icon?: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in slide-in-from-left duration-1000 border-b border-white/5 pb-8">
    <div className="flex items-center gap-6">
       {icon && (
         <div className={`w-16 h-16 rounded-[1.6rem] bg-gradient-to-r ${gradient} p-0.5 shadow-2xl`}>
            <div className="w-full h-full rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white">
               {icon}
            </div>
         </div>
       )}
       <div>
         <h1 className="text-5xl font-black tracking-tight text-white mb-2">
           <span className="text-gradient-gold">{title}</span>
         </h1>
         <p className="text-slate-500 font-medium tracking-tight text-lg italic">{subtitle}</p>
       </div>
    </div>
    <div className="hidden lg:flex items-center gap-2">
       <Badge variant="outline" className="rounded-xl border-white/5 bg-white/5 text-[9px] font-black text-slate-600 px-4 py-2 uppercase tracking-widest italic">Diamond Module v4.7</Badge>
    </div>
  </div>
);

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 block ${className}`}>
    {children}
  </label>
);

export default ProfissionalDashboard;
