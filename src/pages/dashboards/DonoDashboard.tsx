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
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
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

const DonoDashboard = () => {
    const { user, profile, signOut } = useAuth();
    const { barbershop, loading } = useBarbershop();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [commExpanded, setCommExpanded] = useState(false);
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

    // Auto-expand comm menu if on comm route
    useEffect(() => {
        if (location.pathname.startsWith("/painel-dono/comunicacao")) {
            setCommExpanded(true);
        }
    }, [location.pathname]);

    if (loading) return <DashboardLoadingSkeleton />;

    const navItems = [
        { icon: <LayoutDashboard />, label: "Geral", path: "/painel-dono", exact: true },
        { icon: <Calendar />, label: "Operações", path: "/painel-dono/operacoes" },
        { icon: <Users />, label: "Gestão", path: "/painel-dono/gestao" },
        { icon: <Wallet />, label: "Financeiro", path: "/painel-dono/financeiro" },
        { icon: <TrendingUp />, label: "Crescimento", path: "/painel-dono/crescimento" },
    ];

    const navItemsBottom = [
        { icon: <Settings />, label: "Ajustes", path: "/painel-dono/configuracoes" },
    ];

    const commSubItems = [
        { icon: <Smartphone size={14} />, label: "WhatsApp", path: "/painel-dono/comunicacao", tab: "whatsapp" },
        { icon: <CalendarClock size={14} />, label: "Mensagens", path: "/painel-dono/comunicacao", tab: "mensagens" },
        { icon: <Megaphone size={14} />, label: "Campanhas", path: "/painel-dono/comunicacao", tab: "campanhas" },
    ];

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
                className={`fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-white/5 z-40 transition-transform duration-500 ease-premium ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="flex flex-col h-full bg-grid-slate-800/[0.03]">
                    {/* Brand */}
                    <div className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-10 h-10 bg-gradient-gold rounded-2xl flex items-center justify-center shadow-gold transition-premium group-hover:rotate-12 group-hover:scale-110">
                                <Zap className="w-6 h-6 text-black fill-black" />
                            </div>
                            <div>
                                <span className="text-xl font-black text-white tracking-tighter">CASHBACK</span>
                                <p className="text-[10px] font-black text-orange-400 tracking-[0.2em] italic uppercase -mt-1 opacity-70">Salão Pro</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="lg:hidden text-slate-500 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 italic">Painel do Dono</p>
                        {navItems.map((item) => {
                            const isActive = item.exact 
                                ? location.pathname === item.path 
                                : location.pathname.startsWith(item.path);
                            
                            return (
                                <Link 
                                    key={item.path} 
                                    to={item.path}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-premium group relative overflow-hidden ${isActive ? 'bg-gradient-gold text-black font-black shadow-gold diamond-glow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className={`transition-premium ${isActive ? 'text-black' : 'group-hover:scale-110 text-orange-400/50 group-hover:text-orange-400'}`}>
                                        {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                                    </span>
                                    <span className="text-sm tracking-tight">{item.label}</span>
                                    {isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-50 animate-in slide-in-from-left duration-300" />}
                                </Link>
                            );
                        })}

                        {/* ── Comunicação com sub-menu ── */}
                        <div>
                            <button
                                onClick={() => setCommExpanded(!commExpanded)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-premium group relative overflow-hidden ${
                                    location.pathname.startsWith("/painel-dono/comunicacao")
                                        ? 'bg-gradient-gold text-black font-black shadow-gold diamond-glow'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <span className={`transition-premium ${location.pathname.startsWith("/painel-dono/comunicacao") ? 'text-black' : 'group-hover:scale-110 text-orange-400/50 group-hover:text-orange-400'}`}>
                                    <MessageCircle size={20} />
                                </span>
                                <span className="text-sm tracking-tight flex-1 text-left">Comunicação</span>
                                <ChevronDown
                                    size={14}
                                    className={`opacity-50 transition-transform duration-500 ${commExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Sub-items */}
                            <div className={`overflow-hidden transition-all duration-300 ${commExpanded ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <div className="ml-4 pl-4 border-l border-white/5 space-y-0.5">
                                    {commSubItems.map((sub) => (
                                        <Link
                                            key={sub.tab}
                                            to={sub.path}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-orange-400 hover:bg-white/5 transition-premium group"
                                        >
                                            <span className="group-hover:scale-110 transition-premium">{sub.icon}</span>
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Ajustes (sempre por último) ── */}
                        {navItemsBottom.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-premium group ${isActive ? 'bg-gradient-gold text-black font-black shadow-gold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className={`transition-premium ${isActive ? 'text-black' : 'group-hover:scale-110 text-orange-400/50 group-hover:text-orange-400'}`}>
                                        {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                                    </span>
                                    <span className="text-sm tracking-tight">{item.label}</span>
                                    {isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / User */}
                    <div className="p-6 mt-auto border-t border-white/5 bg-slate-950/20 backdrop-blur-sm">
                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 mb-4 group hover:border-orange-500/20 transition-premium cursor-pointer">
                            <Avatar className="w-10 h-10 border-2 border-white/10 group-hover:border-orange-500/50 transition-premium shadow-premium">
                                <AvatarImage src={profile?.avatar_url || ""} />
                                <AvatarFallback className="bg-slate-800 text-slate-400 text-xs font-black">DO</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white truncate">{profile?.name || "Dono"}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">Plano Enterprise</p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl h-12 font-bold transition-premium"
                            onClick={() => signOut()}
                        >
                            <LogOut className="w-5 h-5 mr-3" /> Sair com Segurança
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`transition-all duration-500 ease-premium ${isSidebarOpen ? 'lg:pl-72' : ''}`}>
                {/* Header */}
                <header className="sticky top-0 z-30 h-20 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-2 w-96 group focus-within:border-orange-500/30 transition-premium">
                            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Buscar agendamentos, clientes ou ferramentas..." 
                                className="bg-transparent border-none text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-0 w-full font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <LanguageSelector />
                        <button className="relative p-2 text-slate-400 hover:text-white transition-premium group">
                            <Bell className="w-6 h-6 group-hover:scale-110" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-4 ring-slate-950 group-hover:scale-125 transition-premium" />
                        </button>
                        <div className="w-px h-6 bg-white/10 hidden sm:block" />
                        <div className="hidden sm:flex items-center gap-3">
                            <HelpCircle className="w-5 h-5 text-slate-600 hover:text-white cursor-pointer transition-colors" />
                            <p className="text-xs font-black text-slate-600 uppercase tracking-widest italic pt-1">Suporte VIP</p>
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
                            <Route path="configuracoes/*" element={<SettingsHub />} />
                            <Route path="*" element={<Navigate to="/painel-dono" replace />} />
                        </Routes>
                    </Suspense>
                </div>
                
                {/* Footer Insight */}
                <footer className="p-12 border-t border-white/5 opacity-40">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-xs font-medium text-slate-500 italic">Salão CashBack v4.5.2 • Inteligência Artificial de Gestão</p>
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
