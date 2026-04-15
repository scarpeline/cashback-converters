// @ts-nocheck
import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutDashboard, DollarSign, Users, Link as LinkIcon, LogOut,
  Menu, X, TrendingUp,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { usePartnerByUserId } from "@/hooks/usePartners";
import { usePartnerCommissionConfig } from "@/hooks/usePartnerCommissionConfig";
import EarningsCalculator from "@/components/partners/EarningsCalculator";
import NetworkVisualizer from "@/components/partners/NetworkVisualizer";
import CommissionsPanel from "@/components/partners/CommissionsPanel";
import ReferralsPanel from "@/components/partners/ReferralsPanel";
import ReferralCodeDisplay from "@/components/partners/ReferralCodeDisplay";
import { formatCurrency } from "@/lib/formatters";

const DiretorDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const basePath = "/painel-parceiro";

  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Franqueados", href: `${basePath}/franqueados`, icon: Users },
    { name: "Comissões", href: `${basePath}/comissoes`, icon: DollarSign },
    { name: "Meu Link", href: `${basePath}/link`, icon: LinkIcon },
  ];

  const isActive = (href: string) => {
    if (href === basePath) return location.pathname === basePath || location.pathname === `${basePath}/`;
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <Link to={basePath} className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-display font-bold text-lg text-purple-600">👑 Diretor</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground/60" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 border-b border-sidebar-border">
            <p className="font-medium truncate text-sidebar-foreground">{profile?.name || "Diretor"}</p>
            <p className="text-sm text-sidebar-foreground/60 truncate">{profile?.email}</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-purple-600 text-white" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"}`}>
                <item.icon className="w-5 h-5" />{item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={signOut}><LogOut className="w-5 h-5" />Sair</Button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DiretorHome />} />
            <Route path="franqueados" element={<FranqueadosPage />} />
            <Route path="comissoes" element={<ComissoesPage />} />
            <Route path="link" element={<LinkPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const DiretorHome = () => {
  const { user } = useAuth();
  const { data: partner } = usePartnerByUserId(user?.id || '');
  const { config } = usePartnerCommissionConfig();
  const [franchisees, setFranchisees] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total_franchisees: 0,
    total_affiliates: 0,
    total_clients: 0,
    total_commissions: 0,
  });

  useEffect(() => {
    if (!partner?.id) return;
    (supabase as any)
      .from("partners")
      .select("id, users:user_id(name), status, total_indicados")
      .eq("parent_id", partner.id)
      .eq("type", "franqueado")
      .then(async ({ data }: { data: any[] | null }) => {
        if (!data) return;
        const mapped = await Promise.all(
          data.map(async (f: any) => {
            const { count } = await (supabase as any)
              .from("partners")
              .select("id", { count: "exact", head: true })
              .eq("parent_id", f.id)
              .eq("type", "afiliado");
            return {
              id: f.id,
              name: f.users?.name || "Franqueado",
              affiliates_count: count || 0,
              total_referrals: f.total_indicados || 0,
            };
          })
        );
        setFranchisees(mapped);
        setSummary({
          total_franchisees: mapped.length,
          total_affiliates: mapped.reduce((s, f) => s + f.affiliates_count, 0),
          total_clients: mapped.reduce((s, f) => s + f.total_referrals, 0),
          total_commissions: 0,
        });
      });
  }, [partner?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard do Diretor</h1>
        <p className="text-muted-foreground">Visão executiva da sua rede</p>
        <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
          👑 Diretor
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-2"><CardDescription>Franqueados</CardDescription><CardTitle className="text-2xl text-purple-600">{summary.total_franchisees}</CardTitle></CardHeader>
          <CardContent><p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Na sua rede</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Afiliados Totais</CardDescription><CardTitle className="text-2xl text-blue-600">{summary.total_affiliates}</CardTitle></CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">Todos os afiliados</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Clientes Totais</CardDescription><CardTitle className="text-2xl text-orange-500">{summary.total_clients}</CardTitle></CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">Em toda a rede</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Comissões</CardDescription><CardTitle className="text-2xl text-green-600">{formatCurrency(summary.total_commissions)}</CardTitle></CardHeader>
          <CardContent><p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Total acumulado</p></CardContent>
        </Card>
      </div>

      {/* Calculadora */}
      <EarningsCalculator partnerType="diretor" />

      {/* Rede visual */}
      <NetworkVisualizer partnerType="diretor" franchisees={franchisees} />

      {/* Regras de comissão */}
      <Card>
        <CardHeader><CardTitle>Suas Comissões</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">{config.comissao_adesao_diretor}%</p>
              <p className="text-sm text-muted-foreground">Sobre adesões (afiliados)</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">{config.comissao_recorrente_diretor}%</p>
              <p className="text-sm text-muted-foreground">Recorrente mensal (franqueados)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FranqueadosPage = () => {
  const { user } = useAuth();
  const { data: partner } = usePartnerByUserId(user?.id || '');

  if (!partner) return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Meus Franqueados</h1>
      <Card><CardContent className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Parceiro não encontrado.</p></CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Meus Franqueados</h1>
      <ReferralsPanel partnerId={partner.id} />
    </div>
  );
};

const ComissoesPage = () => {
  const { user } = useAuth();
  const { data: partner } = usePartnerByUserId(user?.id || '');

  if (!partner) return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Comissões</h1>
      <Card><CardContent className="py-12 text-center"><DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Parceiro não encontrado.</p></CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Comissões</h1>
      <CommissionsPanel partnerId={partner.id} />
    </div>
  );
};

const LinkPage = () => {
  const { user } = useAuth();
  const { data: partner } = usePartnerByUserId(user?.id || '');

  if (!partner) return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Meu Link</h1>
      <Card><CardContent className="py-12 text-center"><LinkIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Parceiro não encontrado.</p></CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Meu Link de Indicação</h1>
      <ReferralCodeDisplay referralCode={partner.referral_code || ''} partnerName={partner.users?.name || 'Diretor'} />
    </div>
  );
};

export default DiretorDashboard;
