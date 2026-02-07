import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard,
  DollarSign,
  Users,
  Link as LinkIcon,
  History,
  User,
  LogOut,
  Menu,
  X,
  Copy,
  TrendingUp,
  Wallet
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

const AfiliadoDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/afiliado-saas/dashboard";
  
  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Meus Indicados", href: `${basePath}/indicados`, icon: Users },
    { name: "Comissões", href: `${basePath}/comissoes`, icon: DollarSign },
    { name: "Histórico", href: `${basePath}/historico`, icon: History },
    { name: "Meu Link", href: `${basePath}/link`, icon: LinkIcon },
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
                Afiliado SaaS
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
            <p className="font-medium truncate">{profile?.name || "Afiliado"}</p>
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
            <Route path="indicados" element={<IndicadosPage />} />
            <Route path="comissoes" element={<ComissoesPage />} />
            <Route path="historico" element={<HistoricoPage />} />
            <Route path="link" element={<LinkPage />} />
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
      <h1 className="font-display text-2xl font-bold">Dashboard do Afiliado</h1>
      <p className="text-muted-foreground">Acompanhe seus ganhos e indicações</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader className="pb-2">
          <CardDescription>Ganhos Totais</CardDescription>
          <CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Desde o início
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Saldo Disponível</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Para saque</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Empresas Ativas</CardDescription>
          <CardTitle className="text-2xl">0</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Mínimo 3 para saque</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Ganhos Pendentes</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Como você ganha</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-gradient-gold">60%</p>
            <p className="text-sm text-muted-foreground">Primeira mensalidade</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-gradient-gold">20%</p>
            <p className="text-sm text-muted-foreground">Mensalidades recorrentes</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-gradient-gold">10%</p>
            <p className="text-sm text-muted-foreground">Taxa SaaS (0,5%)</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Ganhos adicionais disponíveis conforme serviços contratados.
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Saque
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="font-medium">Você precisa de 3 empresas ativas</p>
            <p className="text-sm text-muted-foreground">para liberar saques</p>
          </div>
          <Button variant="gold" disabled>
            Solicitar Saque
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const IndicadosPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Meus Indicados</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma empresa indicada ainda.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Compartilhe seu link e comece a ganhar!
        </p>
      </CardContent>
    </Card>
  </div>
);

const ComissoesPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Minhas Comissões</h1>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader>
          <CardDescription>Total de Comissões</CardDescription>
          <CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Pendente de Pagamento</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Histórico de Comissões</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma comissão registrada.</p>
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
        <p className="text-muted-foreground">Nenhuma atividade registrada.</p>
      </CardContent>
    </Card>
  </div>
);

const LinkPage = () => {
  const referralCode = "MEUCOD01";
  const referralLink = `salao.app/r/${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${referralLink}`);
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Meu Link de Indicação</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Compartilhe seu link</CardTitle>
          <CardDescription>
            Quando alguém se cadastrar pelo seu link, você ganha comissões automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <code className="flex-1 p-3 bg-muted rounded-lg text-sm overflow-x-auto">
              {referralLink}
            </code>
            <Button variant="gold" onClick={copyLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Compartilhar WhatsApp
            </Button>
            <Button variant="outline" className="flex-1">
              Compartilhar Redes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Código de Referência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 bg-muted rounded-lg">
            <p className="text-3xl font-bold tracking-wider">{referralCode}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

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
          <div>
            <label className="text-sm text-muted-foreground">CPF/CNPJ</label>
            <p className="font-medium">{profile?.cpf_cnpj || "-"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Chave PIX (recebimento)</label>
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

export default AfiliadoDashboard;
