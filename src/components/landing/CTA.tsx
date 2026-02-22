import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
      
      <div className="container relative z-10 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold shadow-gold mb-8 animate-pulse-gold">
            <Rocket className="w-8 h-8 text-primary-foreground" />
          </div>

          {/* Content */}
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Pronto para{" "}
            <span className="text-gradient-gold">transformar</span>
            {" "}seu negócio?
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de barbearias que já estão crescendo no automático.
            Configure em 5 minutos e comece a ver resultados.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button variant="hero" size="xl">
                Começar 7 Dias Grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/afiliado-saas/login">
              <Button variant="ghost" size="lg">
                Quero Ser Afiliado
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-border/30">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-gradient-gold">100%</div>
              <div className="text-xs text-muted-foreground">Seguro</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-gradient-gold">24/7</div>
              <div className="text-xs text-muted-foreground">Suporte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-gradient-gold">0</div>
              <div className="text-xs text-muted-foreground">Burocracia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-gradient-gold">∞</div>
              <div className="text-xs text-muted-foreground">Potencial</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
