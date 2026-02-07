import { 
  BarChart3, 
  Calendar, 
  CreditCard, 
  Package, 
  Plus, 
  Settings, 
  Users, 
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const DonoDashboard = () => {
  const stats = [
    { label: "Receita Hoje", value: "R$ 0,00", icon: Wallet, color: "text-primary" },
    { label: "Agendamentos", value: "0", icon: Calendar, color: "text-blue-400" },
    { label: "Profissionais", value: "0", icon: Users, color: "text-green-400" },
    { label: "Clientes", value: "0", icon: Users, color: "text-purple-400" },
  ];

  const quickActions = [
    { label: "Novo Serviço", icon: Plus },
    { label: "Ver Agenda", icon: Calendar },
    { label: "Receber PIX", icon: CreditCard },
    { label: "Estoque", icon: Package },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <div>
              <span className="font-display font-bold text-gradient-gold block">SalãoCashBack</span>
              <span className="text-xs text-muted-foreground">Painel do Dono</span>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-6 pb-24">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">Olá, Dono!</h1>
          <p className="text-muted-foreground text-sm">Aqui está o resumo do seu negócio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="p-4 rounded-xl bg-gradient-card border border-border/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="font-display text-xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="p-6 rounded-xl bg-gradient-card border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">Receita Semanal</h3>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
            Conecte o backend para ver os dados
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border/50 px-4 py-3">
        <div className="flex justify-around">
          <button className="flex flex-col items-center gap-1 text-primary">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Agenda</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Users className="w-5 h-5" />
            <span className="text-xs">Equipe</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Wallet className="w-5 h-5" />
            <span className="text-xs">Financeiro</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default DonoDashboard;
