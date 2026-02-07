import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Gift, 
  History, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X,
  QrCode,
  Users,
  Clock
} from "lucide-react";
import logo from "@/assets/logo.png";

const ClienteDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/app/cliente";
  
  const navigation = [
    { name: "Agendar", href: basePath, icon: Calendar },
    { name: "Meus Agendamentos", href: `${basePath}/agendamentos`, icon: Clock },
    { name: "Cashback", href: `${basePath}/cashback`, icon: Gift },
    { name: "Histórico", href: `${basePath}/historico`, icon: History },
    { name: "Indique Amigos", href: `${basePath}/indicar`, icon: Users },
    { name: "Notificações", href: `${basePath}/notificacoes`, icon: Bell },
    { name: "Meu Perfil", href: `${basePath}/perfil`, icon: User },
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
                SalãoCashBack
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
            <p className="font-medium truncate">{profile?.name || "Cliente"}</p>
            <p className="text-sm text-muted-foreground truncate">{profile?.whatsapp}</p>
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
            <Link to={`${basePath}/notificacoes`}>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="agendamentos" element={<AgendamentosPage />} />
            <Route path="cashback" element={<CashbackPage />} />
            <Route path="historico" element={<HistoricoPage />} />
            <Route path="indicar" element={<IndicarPage />} />
            <Route path="notificacoes" element={<NotificacoesPage />} />
            <Route path="perfil" element={<PerfilPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const HomePage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold">Olá! 👋</h1>
      <p className="text-muted-foreground">O que deseja fazer hoje?</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Agendar Serviço</CardTitle>
          <CardDescription>Escolha uma barbearia e agende seu horário</CardDescription>
        </CardHeader>
      </Card>

      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Meu Cashback</CardTitle>
          <CardDescription>Veja seus créditos disponíveis</CardDescription>
        </CardHeader>
      </Card>

      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Indique e Ganhe</CardTitle>
          <CardDescription>Ganhe cashback indicando amigos</CardDescription>
        </CardHeader>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Próximo Agendamento</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Você não tem agendamentos futuros.
        </p>
        <Button variant="gold" className="w-full">
          <Calendar className="w-4 h-4 mr-2" />
          Agendar agora
        </Button>
      </CardContent>
    </Card>
  </div>
);

const AgendamentosPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Meus Agendamentos</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
        <Button variant="gold" className="mt-4">
          Fazer meu primeiro agendamento
        </Button>
      </CardContent>
    </Card>
  </div>
);

const CashbackPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Meu Cashback</h1>
    
    <Card className="bg-gradient-card border-primary/20">
      <CardHeader>
        <CardDescription>Saldo Disponível</CardDescription>
        <CardTitle className="text-4xl text-gradient-gold">R$ 0,00</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Use seu cashback no próximo agendamento!
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Histórico de Cashback</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum cashback recebido ainda.</p>
      </CardContent>
    </Card>
  </div>
);

const HistoricoPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Histórico</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum histórico encontrado.</p>
      </CardContent>
    </Card>
  </div>
);

const IndicarPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Indique e Ganhe</h1>
    
    <Card className="bg-gradient-card border-primary/20">
      <CardHeader>
        <CardTitle>Ganhe cashback indicando amigos!</CardTitle>
        <CardDescription>
          Quando seu amigo fizer o primeiro agendamento, vocês dois ganham.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-background rounded-lg flex items-center justify-between">
          <code className="text-sm">salao.app/r/SEU-CODIGO</code>
          <Button variant="outline" size="sm">
            Copiar
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="gold" className="flex-1">
            <QrCode className="w-4 h-4 mr-2" />
            Ver QR Code
          </Button>
          <Button variant="outline" className="flex-1">
            Compartilhar
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Quero ser Afiliado</CardTitle>
        <CardDescription>
          Ganhe ainda mais indicando barbearias para usar o SalãoCashBack
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full">
          Saber mais sobre o programa
        </Button>
      </CardContent>
    </Card>
  </div>
);

const NotificacoesPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Notificações</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma notificação.</p>
      </CardContent>
    </Card>
  </div>
);

const PerfilPage = () => {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Meu Perfil</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Nome</label>
            <p className="font-medium">{profile?.name || "-"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">WhatsApp</label>
            <p className="font-medium">{profile?.whatsapp || "-"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">E-mail</label>
            <p className="font-medium">{profile?.email || "-"}</p>
          </div>
          <Button variant="outline" className="w-full">
            Editar Perfil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClienteDashboard;
