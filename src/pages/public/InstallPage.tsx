import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle, Zap, Bell, Wifi } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const benefits = [
    { icon: Zap, title: "Acesso Instantâneo", desc: "Abra direto da tela inicial, sem navegador" },
    { icon: Bell, title: "Notificações", desc: "Receba alertas de agendamentos e promoções" },
    { icon: Wifi, title: "Funciona Offline", desc: "Acesse dados básicos mesmo sem internet" },
    { icon: Smartphone, title: "Tela Cheia", desc: "Experiência nativa, sem barra de URL" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <span className="font-display font-bold text-lg">SalãoCashBack</span>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm">Entrar</Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        {isInstalled ? (
          <div className="text-center py-16">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="font-display text-3xl font-bold mb-2">App Instalado! 🎉</h1>
            <p className="text-muted-foreground mb-6">Abra o Salão CashBack pela tela inicial do seu dispositivo.</p>
            <Link to="/login"><Button variant="gold" size="lg">Acessar Agora</Button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
                <img src={logo} alt="Salão CashBack" className="w-full h-full object-cover" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-2">Instalar App</h1>
              <p className="text-muted-foreground">Tenha o Salão CashBack na palma da mão. Instale grátis!</p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3">
              {benefits.map(b => (
                <Card key={b.title} className="border-primary/10">
                  <CardContent className="p-4 text-center">
                    <b.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-bold text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Install CTA */}
            {deferredPrompt ? (
              <Button variant="gold" size="lg" className="w-full text-lg py-6" onClick={handleInstall}>
                <Download className="w-5 h-5 mr-2" />Instalar Agora — Grátis
              </Button>
            ) : isIOS ? (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5 space-y-3">
                  <p className="font-bold text-center">📱 Como instalar no iPhone/iPad:</p>
                  <ol className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="font-bold text-primary">1.</span> Toque no botão <strong>Compartilhar</strong> (ícone ↑) no Safari</li>
                    <li className="flex items-start gap-2"><span className="font-bold text-primary">2.</span> Role e toque em <strong>"Adicionar à Tela Início"</strong></li>
                    <li className="flex items-start gap-2"><span className="font-bold text-primary">3.</span> Toque em <strong>"Adicionar"</strong> para confirmar</li>
                  </ol>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5 space-y-3">
                  <p className="font-bold text-center">💻 Como instalar:</p>
                  <ol className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="font-bold text-primary">1.</span> No Chrome: clique no ícone de <strong>instalar</strong> na barra de endereço</li>
                    <li className="flex items-start gap-2"><span className="font-bold text-primary">2.</span> Ou acesse o menu (⋮) → <strong>"Instalar aplicativo"</strong></li>
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Platform badges */}
            <div className="flex justify-center gap-4 text-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="w-4 h-4" /><span>Android & iOS</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="w-4 h-4" /><span>Windows & Mac</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPage;
