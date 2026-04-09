import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Wallet, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Search,
  Zap,
  HelpCircle,
  ChevronRight,
  MessageCircle,
  Smartphone,
  CalendarClock,
  Megaphone,
  ChevronDown,
  Bot,
  Mic,
  Star,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBarbershop } from "./owner/hooks";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageSelector from "@/components/layout/LanguageSelector";

// Lazy loading Hubs for better performance
const DashboardHome = lazy(() => import("./owner/DashboardHome").then(m => ({ default: m.DashboardHome })));
const OperationsHub = lazy(() => import("./owner/OperationsHub").then(m => ({ default: m.OperationsHub })));
const ManagementHub = lazy(() => import("./owner/ManagementHub").then(m => ({ default: m.ManagementHub })));
const FinancialHub = lazy(() => import("./owner/FinancialHub").then(m => ({ default: m.FinancialHub })));
const GrowthHub = lazy(() => import("./owner/GrowthHub").then(m => ({ default: m.GrowthHub })));
const CommunicationHub = lazy(() => import("./owner/CommunicationHub").then(m => ({ default: m.CommunicationHub })));
const SettingsHub = lazy(() => import("./owner/SettingsHub").then(m => ({ default: m.SettingsHub })));
const AIHub = lazy(() => import("./owner/AIHub").then(m => ({ default: m.AIHub })));

// ── Sidebar group type ──────────────────────────────────────────────────
interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  exact?: boolean;
  children?: { icon: React.ReactNode; label: string; path: string }[];
}

const DonoDashboard = () => {
    const { user, profile, signOut } = useAuth();
    const { barbershop, loading } = useBarbershop();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const location = useLocation();
    const navigate = useNavigate();

    // Responsive sidebar control
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Declare navItems before any useEffect that uses it
    const navItems: SidebarItem[] = [
        { icon: <LayoutDashboard />, label: "Geral", path: "/painel-dono", exact: true },
        { 
            icon: <Calendar />, label: "Operações", path: "/painel-dono/operacoes",
            children: [
                { icon: <Calendar size={14} />, label: "Agenda", path: "/painel-dono/operacoes" },
                { icon: <CalendarClock size={14} />, label: "Recorrências", path: "/painel-dono/operacoes?tab=recurring" },
                { icon: <Users size={14} />, label: "Fila de Espera", path: "/painel-dono/operacoes?tab=waitlist" },
            ]
        },
        { icon: <Users />, label: "Gestão", path: "/painel-dono/gestao" },
        { icon: <Wallet />, label: "Financeiro", path: "/painel-dono/financeiro" },
        { 
            icon: <TrendingUp />, label: "Crescimento", path: "/painel-dono/crescimento",
            children: [
                { icon: <Megaphone size={14} />, label: "Marketing", path: "/painel-dono/crescimento" },
                { icon: <Star size={14} />, label: "Fidelidade", path: "/painel-dono/crescimento?tab=loyalty" },
                { icon: <Zap size={14} />, label: "Cashback", path: "/painel-dono/crescimento?tab=cashback" },
            ]
        },
        { 
            icon: <MessageCircle />, label: "Comunicação", path: "/painel-dono/comunicacao",
            children: [
                { icon: <Smartphone size={14} />, label: "WhatsApp", path: "/painel-dono/comunicacao" },
                { icon: <CalendarClock size={14} />, label: "Mensagens", path: "/painel-dono/comunicacao?tab=mensagens" },
                { icon: <Megaphone size={14} />, label: "Reativação", path: "/painel-dono/comunicacao?tab=campanhas" },
            ]
        },
        { 
            icon: <Bot />, label: "IA & Automação", path: "/painel-dono/ia",
            children: [
                { icon: <Mic size={14} />, label: "Assistente IA", path: "/painel-dono/ia" },
                { icon: <Zap size={14} />, label: "Automações", path: "/painel-dono/ia?tab=automations" },
            ]
        },
        { icon: <Settings />, label: "Ajustes", path: "/painel-dono/configuracoes" },
    ];

    // Auto-expand group if active
    useEffect(() => {
        const activeGroup = navItems.find(item =>
            item.children && (
                location.pathname.startsWith(item.path) ||
                item.children.some(c => location.pathname.startsWith(c.path))
            )
        );
        if (activeGroup && !expandedGroups.includes(activeGroup.label)) {
            setExpandedGroups(prev => [...prev, activeGroup.label]);
        }
    }, [location.pathname, navItems, expandedGroups]);

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev => 
            prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
        );
    };

    if (loading) return <DashboardLoadingSkeleton />;

    const isItemActive = (item: SidebarItem) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path.split('?')[0]);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
            {/* Sidebar Overlay for Mobile */}
            {!isSidebarOpen && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="fixed top-6 left-6 z-50 lg:hidden text-white bg-slate-900 shadow-premium rounded-xl"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <Menu className="w-6 h-6" />
                </Button>
            )}

            {/* Premium Sidebar */}
            <aside 
                className={`fixed top-0 left-0 h-full w-72 bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 z-40 transition-all duration-700 ease-premium ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="flex flex-col h-full bg-grid-white/[0.02]">
                    {/* Brand */}
                    <div className="p-10 flex items-center justify-between">
                        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-12 h-12 bg-gradient-gold rounded-[1.4rem] flex items-center justify-center shadow-gold transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                <Zap className="w-7 h-7 text-black fill-black" />
                            </div>
                            <div>
                                <span className="text-2xl font-black text-white tracking-tighter block leading-none">CASHBACK</span>
                                <p className="text-[10px] font-black text-orange-400 tracking-[0.3em] uppercase opacity-70">Diamond Edition</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-6 space-y-1 overflow-y-auto custom-scrollbar pt-4">
                        <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 italic opacity-50">Strategic Menu</p>
                        {navItems.map((item, idx) => {
                            const active = isItemActive(item);
                            const hasChildren = item.children && item.children.length > 0;
                            const isExpanded = expandedGroups.includes(item.label);

                            if (!hasChildren) {
                                return (
                                    <Link 
                                        key={item.path} 
                                        to={item.path}
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                        className={`flex items-center gap-4 px-5 py-3.5 rounded-[1.4rem] transition-all duration-500 group relative overflow-hidden animate-in slide-in-from-left-4 ${active ? 'bg-gradient-gold text-black font-black shadow-gold diamond-glow scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1'}`}
                                    >
                                        <span className={`transition-all duration-500 ${active ? 'text-black' : 'group-hover:scale-125 text-orange-400/50 group-hover:text-orange-400'}`}>
                                            {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
                                        </span>
                                        <span className="text-sm tracking-tight">{item.label}</span>
                                        {active && <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full animate-pulse" />}
                                    </Link>
                                );
                            }

                            return (
                                <div key={item.path} className="pt-1">
                                    <button
                                        onClick={() => { toggleGroup(item.label); navigate(item.path); }}
                                        className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.4rem] transition-all duration-500 group relative overflow-hidden ${
                                            active
                                                ? 'bg-gradient-gold text-black font-black shadow-gold diamond-glow scale-[1.02]'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span className={`transition-all duration-500 ${active ? 'text-black' : 'group-hover:scale-125 text-orange-400/50 group-hover:text-orange-400'}`}>
                                            {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
                                        </span>
                                        <span className="text-sm tracking-tight flex-1 text-left">{item.label}</span>
                                        <ChevronDown
                                            size={14}
                                            className={`opacity-50 transition-all duration-500 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-700 ease-premium ${isExpanded ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                        <div className="ml-6 pl-4 border-l-2 border-white/5 space-y-0.5">
                                            {item.children!.map((sub) => (
                                                <Link
                                                    key={sub.label}
                                                    to={sub.path}
                                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-orange-400 hover:bg-white/5 transition-all duration-300 group"
                                                >
                                                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-orange-400/10 transition-colors">
                                                       {sub.icon}
                                                    </div>
                                                    {sub.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    {/* Footer / User Diamond */}
                    <div className="p-8 mt-auto">
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-[1.8rem] border border-white/5 mb-6 group hover:border-orange-500/30 transition-all duration-500 cursor-pointer relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
                            <Avatar className="w-12 h-12 border-2 border-white/10 group-hover:border-orange-500/50 transition-all duration-500 shadow-2xl relative z-10">
                                <AvatarImage src={profile?.avatar_url || ""} />
                                <AvatarFallback className="bg-slate-800 text-slate-400 text-xs font-black uppercase">Admin</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 relative z-10">
                                <p className="text-sm font-black text-white truncate leading-none mb-1">{profile?.name || "Diretoria"}</p>
                                <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest truncate flex items-center gap-1">
                                    <span className="w-1 h-1 bg-orange-400 rounded-full animate-pulse" /> Global Admin
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start text-rose-500/60 hover:text-white hover:bg-rose-500 rounded-2xl h-14 font-black transition-all duration-500 group overflow-hidden relative"
                            onClick={() => signOut()}
                        >
                            <div className="absolute inset-0 bg-rose-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <span className="relative z-10 flex items-center">
                               <LogOut className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" /> Logout Diamond
                            </span>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`transition-all duration-700 ease-premium ${isSidebarOpen ? 'lg:pl-72' : ''}`}>
                {/* Diamond Header */}
                <header className="sticky top-0 z-30 h-24 bg-slate-950/40 backdrop-blur-[40px] border-b border-white/5 px-10 flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 rounded-[1.2rem] px-6 py-3 w-[450px] group focus-within:border-orange-500/40 focus-within:bg-slate-900/40 transition-all duration-500 shadow-2xl">
                            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Comando rápido: buscar clientes ou agendamentos..." 
                                className="bg-transparent border-none text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-0 w-full font-bold tracking-tight"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <LanguageSelector />
                        
                        <button className="relative p-3 text-slate-400 hover:text-white transition-all duration-500 group bg-white/5 rounded-2xl border border-white/5 hover:border-orange-500/30">
                            <Bell className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all" />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-4 border-slate-950 shadow-glow-rose animate-pulse" />
                        </button>

                        <div className="hidden xl:flex items-center gap-4 pl-4 border-l border-white/10">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Status do Servidor</p>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                                   <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> 100% Online
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Vista Principal com Hubs */}
                <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
                    <Suspense fallback={<HubLoading />}>
                        <Routes>
                            <Route index element={<DashboardHome />} />
                            <Route path="operacoes/*" element={<OperationsHub />} />
                            <Route path="gestao/*" element={<ManagementHub />} />
                            <Route path="financeiro/*" element={<FinancialHub />} />
                            <Route path="crescimento/*" element={<GrowthHub />} />
                            <Route path="comunicacao/*" element={<CommunicationHub />} />
                            <Route path="ia/*" element={<AIHub />} />
                            <Route path="configuracoes/*" element={<SettingsHub />} />
                            <Route path="*" element={<Navigate to="/painel-dono" replace />} />
                        </Routes>
                    </Suspense>
                </div>
                
                {/* Footer Insight */}
                <footer className="p-12 border-t border-white/5 opacity-40">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-xs font-medium text-slate-500 italic">Agenda Universal AI v5.0 • Plataforma Multi-Nicho</p>
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                            <span className="hover:text-orange-400 cursor-pointer transition-colors">Termos de Uso</span>
                            <span className="hover:text-orange-400 cursor-pointer transition-colors">Segurança</span>
                            <span className="hover:text-orange-400 cursor-pointer transition-colors">GDPR / LGPD</span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

const DashboardLoadingSkeleton = () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-8">
        <Zap className="w-12 h-12 text-orange-400 animate-pulse" />
        <div className="space-y-4 w-64">
            <Skeleton className="h-2 w-full bg-white/5" />
            <Skeleton className="h-2 w-3/4 bg-white/5 mx-auto" />
        </div>
    </div>
);

const HubLoading = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
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

export default DonoDashboard;
