import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard,
  Building2,
  FileText,
  DollarSign,
  User,
  LogOut,
  Menu,
  X,
  Calculator
} from "lucide-react";
import logo from "@/assets/logo.png";

const ContadorDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/contador", icon: LayoutDashboard },
    { name: "Empresas", href: "/contador/empresas", icon: Building2 },
    { name: "Declarações", href: "/contador/declaracoes", icon: FileText },
    { name: "Meus Ganhos", href: "/contador/ganhos", icon: DollarSign },
    { name: "Meu Perfil", href: "/contador/perfil", icon: User },
  ];

  const isActive = (href: string) => {
    if (href === "/contador") return location.pathname === "/contador";
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
            <Link to="/contador" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <span className="font-display font-bold text-lg">
                Contador
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
            <p className="font-medium truncate">{profile?.name || "Contador"}</p>
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
          <div className="flex-1" />
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="empresas" element={<EmpresasPage />} />
            <Route path="declaracoes" element={<DeclaracoesPage />} />
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
      <h1 className="font-display text-2xl font-bold">Portal do Contador</h1>
      <p className="text-muted-foreground">Gerencie empresas e declarações</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Empresas Vinculadas</CardDescription>
          <CardTitle className="text-2xl">0</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Declarações Pendentes</CardDescription>
          <CardTitle className="text-2xl">0</CardTitle>
        </CardHeader>
      </Card>
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader className="pb-2">
          <CardDescription>Ganhos do Mês</CardDescription>
          <CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma atividade recente.</p>
      </CardContent>
    </Card>
  </div>
);

const EmpresasPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Empresas Vinculadas</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma empresa vinculada.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Empresas são vinculadas pelo Super Admin.
        </p>
      </CardContent>
    </Card>
  </div>
);

const DeclaracoesPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Declarações</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma declaração pendente.</p>
      </CardContent>
    </Card>
  </div>
);

const GanhosPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Meus Ganhos</h1>
    
    <Card className="bg-gradient-card border-primary/20">
      <CardHeader>
        <CardDescription>Total de Ganhos</CardDescription>
        <CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle>
      </CardHeader>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pagamentos</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum pagamento registrado.</p>
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
            <label className="text-sm text-muted-foreground">E-mail</label>
            <p className="font-medium">{profile?.email || "-"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">WhatsApp</label>
            <p className="font-medium">{profile?.whatsapp || "-"}</p>
          </div>
          <Button variant="outline" className="w-full">
            Editar Perfil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContadorDashboard;
