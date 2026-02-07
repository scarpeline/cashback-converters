import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  Settings,
  Shield,
  Image,
  MessageCircle,
  Bell,
  Calculator,
  LogOut,
  Menu,
  X,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from "lucide-react";
import logo from "@/assets/logo.png";

const SuperAdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    { name: "Usuários", href: "/super-admin/usuarios", icon: Users },
    { name: "Barbearias", href: "/super-admin/barbearias", icon: Building2 },
    { name: "Afiliados", href: "/super-admin/afiliados", icon: Users },
    { name: "Contadores", href: "/super-admin/contadores", icon: Calculator },
    { name: "Financeiro", href: "/super-admin/financeiro", icon: DollarSign },
    { name: "Pixels Globais", href: "/super-admin/pixels", icon: Image },
    { name: "Suporte", href: "/super-admin/suporte", icon: MessageCircle },
    { name: "Notificações", href: "/super-admin/notificacoes", icon: Bell },
    { name: "Configurações", href: "/super-admin/configuracoes", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/super-admin") return location.pathname === "/super-admin";
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
            <Link to="/super-admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <span className="font-display font-bold text-lg">
                Super Admin
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
            <p className="font-medium truncate">{profile?.name || "Admin"}</p>
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
                    ? "bg-destructive text-destructive-foreground" 
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
          <div className="flex-1" />
          <SystemStatus />
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="barbearias" element={<BarbeariasPage />} />
            <Route path="afiliados" element={<AfiliadosPage />} />
            <Route path="contadores" element={<ContadoresPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="pixels" element={<PixelsPage />} />
            <Route path="suporte" element={<SuportePage />} />
            <Route path="notificacoes" element={<NotificacoesPage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const SystemStatus = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-sm">
    <Activity className="w-4 h-4" />
    <span>SYSTEM_STATUS = OK</span>
  </div>
);

const DashboardHome = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold">Painel Super Admin</h1>
      <p className="text-muted-foreground">Visão geral do sistema</p>
    </div>

    {/* System Check */}
    <Card className="border-green-500/20 bg-green-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <CardTitle>Sistema Operacional</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Auth</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>ASAAS</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Split</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Mensagens</span>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Stats */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total de Usuários</CardDescription>
          <CardTitle className="text-2xl">0</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +0 esta semana
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Barbearias Ativas</CardDescription>
          <CardTitle className="text-2xl">0</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Afiliados Ativos</CardDescription>
          <CardTitle className="text-2xl">0</CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-card border-primary/20">
        <CardHeader className="pb-2">
          <CardDescription>Receita do Mês</CardDescription>
          <CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
    </div>

    {/* Quick Actions */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Adicionar Contador</CardTitle>
          <CardDescription>Cadastrar novo contador parceiro</CardDescription>
        </CardHeader>
      </Card>

      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Enviar Notificação</CardTitle>
          <CardDescription>Notificar usuários ou perfis</CardDescription>
        </CardHeader>
      </Card>

      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Configurar Planos</CardTitle>
          <CardDescription>Editar preços e taxas</CardDescription>
        </CardHeader>
      </Card>
    </div>
  </div>
);

const UsuariosPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Usuários</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Listagem de usuários em desenvolvimento.</p>
      </CardContent>
    </Card>
  </div>
);

const BarbeariasPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Barbearias</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma barbearia cadastrada.</p>
      </CardContent>
    </Card>
  </div>
);

const AfiliadosPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Afiliados</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum afiliado cadastrado.</p>
      </CardContent>
    </Card>
  </div>
);

const ContadoresPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl font-bold">Contadores</h1>
      <Button variant="gold">Adicionar Contador</Button>
    </div>
    <Card>
      <CardContent className="py-12 text-center">
        <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum contador cadastrado.</p>
      </CardContent>
    </Card>
  </div>
);

const FinanceiroPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Financeiro</h1>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader>
          <CardDescription>Receita Total</CardDescription>
          <CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Taxa SaaS Acumulada</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Comissões Pagas</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
    </div>
  </div>
);

const PixelsPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl font-bold">Pixels Globais</h1>
      <Button variant="gold">Adicionar Pixel</Button>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Pixels do SaaS</CardTitle>
        <CardDescription>Rastreamento global da plataforma</CardDescription>
      </CardHeader>
      <CardContent className="text-center py-8">
        <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum pixel configurado.</p>
      </CardContent>
    </Card>
  </div>
);

const SuportePage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Suporte</h1>
    <Card>
      <CardHeader>
        <CardTitle>Chats Abertos</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum chat aberto.</p>
      </CardContent>
    </Card>
  </div>
);

const NotificacoesPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl font-bold">Notificações</h1>
      <Button variant="gold">Enviar Notificação</Button>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Enviar para</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" size="sm">Todos</Button>
          <Button variant="outline" size="sm">Donos</Button>
          <Button variant="outline" size="sm">Profissionais</Button>
          <Button variant="outline" size="sm">Clientes</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ConfiguracoesPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Configurações</h1>
    
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Planos e Preços</CardTitle>
          <CardDescription>Configure os valores dos planos do SaaS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">7 dias grátis</p>
              <p className="font-bold">R$ 0,00</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">Mês 1</p>
              <p className="font-bold">R$ 19,90</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">Mês 2+</p>
              <p className="font-bold">R$ 29,90</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">3 meses</p>
              <p className="font-bold">R$ 79,90</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">6 meses</p>
              <p className="font-bold">R$ 145,90</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">12 meses</p>
              <p className="font-bold">R$ 199,90</p>
            </div>
          </div>
          <Button variant="outline" className="mt-4">Editar Planos</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxa SaaS</CardTitle>
          <CardDescription>Porcentagem sobre transações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-gradient-gold">0,5%</p>
            </div>
            <Button variant="outline">Editar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Landing Page</CardTitle>
          <CardDescription>Personalize textos, cores e imagens</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Editar Landing Page</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Módulo Fiscal</CardTitle>
          <CardDescription>Ativar/desativar módulo fiscal</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Configurar</Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default SuperAdminDashboard;
