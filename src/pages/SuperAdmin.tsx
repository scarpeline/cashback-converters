import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertTriangle, 
  Check, 
  Loader2, 
  LogOut, 
  Palette, 
  Settings, 
  Shield, 
  Users,
  Wallet
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const AUTHORIZED_EMAILS = [
  "escarpelineparticular@gmail.com",
  "escarpelineparticular2@gmail.com"
];

const SuperAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!AUTHORIZED_EMAILS.includes(email)) {
      toast.error("E-mail não autorizado");
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setMagicLinkSent(true);
    toast.success("Link mágico enviado! Verifique seu e-mail.");
    
    // Simulate login for demo
    setTimeout(() => {
      setIsAuthenticated(true);
    }, 2000);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Super Admin</h1>
            <p className="text-muted-foreground">Acesso restrito</p>
          </div>

          {!magicLinkSent ? (
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail Autorizado</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Enviar Link Mágico
              </Button>
            </form>
          ) : (
            <div className="text-center p-6 rounded-xl bg-success/10 border border-success/30">
              <Check className="w-10 h-10 text-success mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Link enviado!</h3>
              <p className="text-sm text-muted-foreground">
                Verifique seu e-mail e clique no link para acessar.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <div>
              <span className="font-display font-bold text-gradient-gold block">Super Admin</span>
              <span className="text-xs text-muted-foreground">Painel de Controle</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsAuthenticated(false)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-8">
        {/* System Status */}
        <div className="p-6 rounded-xl bg-success/10 border border-success/30 mb-8">
          <div className="flex items-center gap-3">
            <Check className="w-6 h-6 text-success" />
            <div>
              <h3 className="font-semibold">Sistema Operacional</h3>
              <p className="text-sm text-muted-foreground">SYSTEM_STATUS = OK</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gradient-card border border-border/50">
            <Users className="w-5 h-5 text-primary mb-2" />
            <div className="font-display text-2xl font-bold">0</div>
            <span className="text-xs text-muted-foreground">Barbearias</span>
          </div>
          <div className="p-4 rounded-xl bg-gradient-card border border-border/50">
            <Users className="w-5 h-5 text-blue-400 mb-2" />
            <div className="font-display text-2xl font-bold">0</div>
            <span className="text-xs text-muted-foreground">Usuários</span>
          </div>
          <div className="p-4 rounded-xl bg-gradient-card border border-border/50">
            <Wallet className="w-5 h-5 text-green-400 mb-2" />
            <div className="font-display text-2xl font-bold">R$ 0</div>
            <span className="text-xs text-muted-foreground">Receita</span>
          </div>
          <div className="p-4 rounded-xl bg-gradient-card border border-border/50">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mb-2" />
            <div className="font-display text-2xl font-bold">0</div>
            <span className="text-xs text-muted-foreground">Alertas</span>
          </div>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold">Módulos do Sistema</h3>
            </div>
            <div className="space-y-3">
              {["Auth", "ASAAS", "Split", "Afiliados", "Mensagens", "Agendamentos"].map((module) => (
                <div key={module} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <span>{module}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">Ativo</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold">Customização</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Edite cores, textos e imagens do aplicativo.
            </p>
            <Button variant="outline" className="w-full">
              Abrir Editor
            </Button>
          </div>

          <div className="p-6 rounded-xl bg-gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold">Planos e Taxas</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Configure valores dos planos e comissões.
            </p>
            <Button variant="outline" className="w-full">
              Gerenciar Planos
            </Button>
          </div>

          <div className="p-6 rounded-xl bg-gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold">Sandbox</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ambiente de testes global.
            </p>
            <Button variant="outline" className="w-full">
              Ativar Sandbox
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdmin;
