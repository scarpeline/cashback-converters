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
        <div className="min-h-screen bg-white text-slate-800 font-sans">
            {/* Mobile menu toggle */}
            {!isSidebarOpen && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="fixed top-5 left-5 z-50 lg:hidden text-slate-700 bg-white border border-slate-200 shadow-sm rounded-xl"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <Menu className="w-5 h-5" />
                </Button>
            )}

            {/* Sidebar */}
            <aside 
                className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-40 transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Brand — nome da empresa */}
                <div className="px-6 py-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                                {barbershop?.name || profile?.name || "Minha Empresa"}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">Painel de Gestão</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map((item, idx) => {
                        const active = isItemActive(item);
                        const hasChildren = item.children && item.children.length > 0;
                        const isExpanded = expandedGroups.includes(item.label);

                        if (!hasChildren) {
                            return (
                                <Link 
                                    key={item.path} 
                                    to={item.path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                                        active 
                                            ? 'bg-orange-500 text-white font-semibold' 
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-orange-500'}`}>
                                        {React.cloneElement(item.icon as React.ReactElement, { size: 17 })}
                                    </span>
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            );
                        }

                        return (
                            <div key={item.path}>
                                <button
                                    onClick={() => { toggleGroup(item.label); navigate(item.path); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                                        active
                                            ? 'bg-orange-500 text-white font-semibold'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-orange-500'}`}>
                                        {React.cloneElement(item.icon as React.ReactElement, { size: 17 })}
                                    </span>
                                    <span className="text-sm flex-1 text-left">{item.label}</span>
                                    <ChevronDown
                                        size={13}
                                        className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="ml-4 pl-3 border-l border-slate-100 mt-0.5 space-y-0.5">
                                        {item.children!.map((sub) => (
                                            <Link
                                                key={sub.label}
                                                to={sub.path}
                                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-orange-500 hover:bg-orange-50 transition-all duration-200"
                                            >
                                                <span className="text-slate-400">{sub.icon}</span>
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Footer — user + logout */}
                <div className="px-3 py-4 border-t border-slate-100 space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={profile?.avatar_url || ""} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold uppercase">
                                {profile?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{profile?.name || "Usuário"}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200 group"
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : ''}`}>
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-96 focus-within:border-blue-400 focus-within:bg-white transition-all duration-200">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar clientes ou agendamentos..." 
                                className="bg-transparent border-none text-sm text-slate-700 placeholder-slate-400 focus:outline-none w-full"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageSelector />
                        
                        <button className="relative p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
                        </button>

                        <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-slate-100">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <p className="text-xs text-slate-400">100% Online</p>
                        </div>
                    </div>
                </header>

                {/* Conteúdo principal */}
                <div className="hub-content p-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50">
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
                
                <footer className="px-6 py-4 border-t border-slate-100 bg-white">
                    <p className="text-xs text-slate-400 text-center">Plataforma Multi-Nicho • LGPD</p>
                </footer>
            </main>
        </div>
    );
};

const DashboardLoadingSkeleton = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div className="space-y-2 w-48">
            <Skeleton className="h-2 w-full bg-slate-100" />
            <Skeleton className="h-2 w-3/4 bg-slate-100 mx-auto" />
        </div>
    </div>
);

const HubLoading = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div className="space-y-2">
            <Skeleton className="h-8 w-56 bg-slate-200 rounded-xl" />
            <Skeleton className="h-4 w-80 bg-slate-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-40 bg-slate-100 rounded-2xl" />
            <Skeleton className="h-40 bg-slate-100 rounded-2xl" />
            <Skeleton className="h-40 bg-slate-100 rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full bg-slate-100 rounded-2xl" />
    </div>
);

export default DonoDashboard;
