import { Calendar, Gift, History, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const ClienteDashboard = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <span className="font-display font-bold text-gradient-gold">SalãoCashBack</span>
          </div>
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-6">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-1">Olá, Cliente!</h1>
          <p className="text-muted-foreground">Bem-vindo ao SalãoCashBack</p>
        </div>

        {/* Cashback Card */}
        <div className="p-6 rounded-2xl bg-gradient-card border border-primary/30 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Seu Cashback</span>
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-display font-bold text-gradient-gold mb-1">
            R$ 0,00
          </div>
          <p className="text-xs text-muted-foreground">
            Disponível para uso em serviços
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button variant="gold" className="h-auto py-4 flex-col gap-2">
            <Calendar className="w-6 h-6" />
            <span>Agendar</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <History className="w-6 h-6" />
            <span>Histórico</span>
          </Button>
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="font-display text-lg font-bold mb-4">Próximos Agendamentos</h2>
          <div className="p-8 rounded-xl border border-dashed border-border text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Nenhum agendamento ainda
            </p>
            <Button variant="link" className="mt-2">
              Agendar agora
            </Button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border/50 px-4 py-3">
        <div className="flex justify-around">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">Agendar</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <History className="w-5 h-5" />
            <span className="text-xs">Histórico</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Gift className="w-5 h-5" />
            <span className="text-xs">Cashback</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Notificações</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default ClienteDashboard;
