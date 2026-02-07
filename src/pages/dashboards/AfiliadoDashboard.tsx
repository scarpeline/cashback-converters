import { Copy, DollarSign, Link2, Share2, TrendingUp, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const AfiliadoDashboard = () => {
  const affiliateLink = "https://salaocashback.com/ref/seu-codigo";

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast.success("Link copiado!");
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <div>
              <span className="font-display font-bold text-gradient-gold block">SalãoCashBack</span>
              <span className="text-xs text-muted-foreground">Afiliado</span>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-6">
        {/* Balance Card */}
        <div className="p-6 rounded-2xl bg-gradient-card border border-primary/30 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Saldo Disponível</span>
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-display font-bold text-gradient-gold mb-4">
            R$ 0,00
          </div>
          <Button variant="gold" className="w-full" disabled>
            Sacar (mínimo 3 barbearias ativas)
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-gradient-card border border-border/50 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className="font-display text-xl font-bold">0</div>
            <span className="text-xs text-muted-foreground">Indicados</span>
          </div>
          <div className="p-4 rounded-xl bg-gradient-card border border-border/50 text-center">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <div className="font-display text-xl font-bold">0</div>
            <span className="text-xs text-muted-foreground">Ativos</span>
          </div>
          <div className="p-4 rounded-xl bg-gradient-card border border-border/50 text-center">
            <DollarSign className="w-5 h-5 text-gold mx-auto mb-2" />
            <div className="font-display text-xl font-bold">R$ 0</div>
            <span className="text-xs text-muted-foreground">Total Ganho</span>
          </div>
        </div>

        {/* Referral Link */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold mb-4">Seu Link de Indicação</h2>
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground truncate">
              {affiliateLink}
            </div>
            <Button variant="gold" size="icon" onClick={copyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Commission Structure */}
        <div className="p-6 rounded-xl bg-gradient-card border border-border/50">
          <h3 className="font-display font-bold mb-4">Como Você Ganha</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="font-display font-bold text-primary">60%</span>
              </div>
              <div>
                <div className="font-medium">Primeira Mensalidade</div>
                <div className="text-sm text-muted-foreground">De cada barbearia indicada</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-display font-bold text-primary">20%</span>
              </div>
              <div>
                <div className="font-medium">Recorrente</div>
                <div className="text-sm text-muted-foreground">De todas as mensalidades futuras</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                <span className="font-display font-bold text-primary">10%</span>
              </div>
              <div>
                <div className="font-medium">Sub-afiliados</div>
                <div className="text-sm text-muted-foreground">Do lucro de afiliados que você indicar</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border/50 px-4 py-3">
        <div className="flex justify-around">
          <button className="flex flex-col items-center gap-1 text-primary">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Link2 className="w-5 h-5" />
            <span className="text-xs">Link</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Wallet className="w-5 h-5" />
            <span className="text-xs">Saques</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AfiliadoDashboard;
