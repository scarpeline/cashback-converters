import { Calendar, Check, Clock, CreditCard, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const ProfissionalDashboard = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <div>
              <span className="font-display font-bold text-gradient-gold block">SalãoCashBack</span>
              <span className="text-xs text-muted-foreground">Profissional</span>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-6">
        {/* Today Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gradient-card border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Hoje</span>
            </div>
            <div className="font-display text-2xl font-bold">0</div>
            <span className="text-xs text-muted-foreground">Atendimentos</span>
          </div>
          <div className="p-4 rounded-xl bg-gradient-card border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Ganhos</span>
            </div>
            <div className="font-display text-2xl font-bold text-gradient-gold">R$ 0</div>
            <span className="text-xs text-muted-foreground">Hoje</span>
          </div>
        </div>

        {/* Agenda */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Agenda de Hoje</h2>
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="p-8 rounded-xl border border-dashed border-border text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Nenhum atendimento agendado para hoje
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Check className="w-6 h-6 text-green-400" />
            <span>Finalizar Atendimento</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            <span>Gerar Cobrança</span>
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border/50 px-4 py-3">
        <div className="flex justify-around">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">Agenda</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">Ganhos</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <User className="w-5 h-5" />
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default ProfissionalDashboard;
