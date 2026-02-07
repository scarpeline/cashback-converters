import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Image
} from "lucide-react";
import logo from "@/assets/logo.png";

const DonoDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/app/dashboard";
  
  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Agendamentos", href: `${basePath}/agendamentos`, icon: Calendar },
    { name: "Profissionais", href: `${basePath}/profissionais`, icon: Users },
    { name: "Serviços", href: `${basePath}/servicos`, icon: Scissors },
    { name: "Financeiro", href: `${basePath}/financeiro`, icon: DollarSign },
    { name: "Estoque", href: `${basePath}/estoque`, icon: Package },
    { name: "Cashback", href: `${basePath}/cashback`, icon: Gift },
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
            <Link to={basePath} className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-display font-bold text-lg text-gradient-gold">
                Painel Dono
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
            <p className="font-medium truncate">{profile?.name || "Dono"}</p>
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
                    ? "bg-primary text-primary-foreground" 
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
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="agendamentos" element={<AgendamentosPage />} />
            <Route path="profissionais" element={<ProfissionaisPage />} />
            <Route path="servicos" element={<ServicosPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="estoque" element={<EstoquePage />} />
            <Route path="cashback" element={<CashbackPage />} />
            <Route path="pixels" element={<PixelsPage />} />
            <Route path="suporte" element={<SuportePage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const DashboardHome = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Visão geral do seu negócio</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Faturamento Hoje</CardDescription>
          <CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 0% vs ontem
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Agendamentos Hoje</CardDescription>
          <CardTitle className="text-2xl">0</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">0 confirmados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Clientes Ativos</CardDescription>
          <CardTitle className="text-2xl">0</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Este mês</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Cashback Distribuído</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Este mês</p>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Adicionar Profissional</CardTitle>
        </CardHeader>
      </Card>

      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Scissors className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Criar Serviço</CardTitle>
        </CardHeader>
      </Card>

      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Novo Agendamento</CardTitle>
        </CardHeader>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Link de Agendamento</CardTitle>
        <CardDescription>Compartilhe com seus clientes</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <code className="flex-1 p-3 bg-muted rounded-lg text-sm">
          salao.app/b/seu-salao
        </code>
        <Button variant="outline">Copiar</Button>
      </CardContent>
    </Card>
  </div>
);

const AgendamentosPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl font-bold">Agendamentos</h1>
      <Button variant="gold">Novo Agendamento</Button>
    </div>
    <Card>
      <CardContent className="py-12 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum agendamento para hoje.</p>
      </CardContent>
    </Card>
  </div>
);

const ProfissionaisPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl font-bold">Profissionais</h1>
      <Button variant="gold">Adicionar Profissional</Button>
    </div>
    <Card>
      <CardContent className="py-12 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum profissional cadastrado.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Adicione profissionais para que possam receber agendamentos e comissões.
        </p>
      </CardContent>
    </Card>
  </div>
);

const ServicosPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl font-bold">Serviços</h1>
      <Button variant="gold">Criar Serviço</Button>
    </div>
    <Card>
      <CardContent className="py-12 text-center">
        <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum serviço cadastrado.</p>
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
          <CardDescription>Saldo Disponível</CardDescription>
          <CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>A Receber</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Faturamento do Mês</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
    </div>
  </div>
);

const EstoquePage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl font-bold">Estoque</h1>
      <Button variant="gold">Adicionar Produto</Button>
    </div>
    <Card>
      <CardContent className="py-12 text-center">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum produto no estoque.</p>
      </CardContent>
    </Card>
  </div>
);

const CashbackPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Configurar Cashback</h1>
    <Card>
      <CardHeader>
        <CardTitle>Regras de Cashback</CardTitle>
        <CardDescription>Defina quanto seus clientes ganham de volta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Porcentagem de cashback</p>
          <p className="text-2xl font-bold text-gradient-gold">5%</p>
        </div>
        <Button variant="outline" className="w-full">Editar Regras</Button>
      </CardContent>
    </Card>
  </div>
);

const PixelsPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Pixels & Marketing</h1>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meta Pixel</CardTitle>
          <CardDescription>Facebook e Instagram</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">Configurar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Google Ads</CardTitle>
          <CardDescription>Google Tag Manager</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">Configurar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">TikTok Pixel</CardTitle>
          <CardDescription>TikTok Ads</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">Configurar</Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

const SuportePage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Suporte</h1>
    <Card>
      <CardHeader>
        <CardTitle>Falar com Suporte</CardTitle>
        <CardDescription>Tire suas dúvidas com nossa equipe</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="gold" className="w-full">
          <MessageCircle className="w-4 h-4 mr-2" />
          Iniciar Conversa
        </Button>
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
          <CardTitle>Dados da Barbearia</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Editar</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Horário de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Configurar</Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default DonoDashboard;
