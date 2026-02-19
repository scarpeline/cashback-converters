import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard,
  Calendar, 
  DollarSign,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  Clock
} from "lucide-react";
import logo from "@/assets/logo.png";

const ProfissionalDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/painel-profissional";
  
  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Minha Agenda", href: `${basePath}/agenda`, icon: Calendar },
    { name: "Meus Ganhos", href: `${basePath}/ganhos`, icon: DollarSign },
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
                Profissional
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
            <p className="font-medium truncate">{profile?.name || "Profissional"}</p>
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
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="ganhos" element={<GanhosPage />} />
            <Route path="perfil" element={<PerfilPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const DashboardHome = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold">Olá! 👋</h1>
      <p className="text-muted-foreground">Sua agenda de hoje</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Agendamentos Hoje</CardDescription>
          <CardTitle className="text-2xl">0</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Ganhos Hoje</CardDescription>
          <CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Próximo Cliente</CardDescription>
          <CardTitle className="text-lg">Nenhum</CardTitle>
        </CardHeader>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Próximos Atendimentos</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum atendimento agendado para hoje.</p>
      </CardContent>
    </Card>
  </div>
);

const AgendaPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Minha Agenda</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum agendamento.</p>
      </CardContent>
    </Card>
  </div>
);

const GanhosPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Meus Ganhos</h1>
    
    <Card className="bg-gradient-card border-primary/20">
      <CardHeader>
        <CardDescription>Ganhos do Mês</CardDescription>
        <CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle>
      </CardHeader>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardDescription>A Receber</CardDescription>
          <CardTitle className="text-xl">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Atendimentos do Mês</CardDescription>
          <CardTitle className="text-xl">0</CardTitle>
        </CardHeader>
      </Card>
    </div>
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
          <div>
            <label className="text-sm text-muted-foreground">Chave PIX</label>
            <p className="font-medium">{profile?.pix_key || "Não configurada"}</p>
          </div>
          <Button variant="outline" className="w-full">
            Editar Perfil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfissionalDashboard;
