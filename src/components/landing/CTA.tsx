import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 30% 10%) 0%, hsl(222 47% 6%) 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, hsl(42 100% 50% / 0.3), transparent)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, hsl(42 100% 50% / 0.05), transparent 70%)" }} />
      
      <div className="container relative z-10 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold shadow-gold mb-8 animate-pulse-gold">
            <Rocket className="w-8 h-8" style={{ color: "hsl(222 47% 11%)" }} />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            Pronto para{" "}<span className="text-gradient-gold">transformar</span>{" "}seu negócio?
          </h2>
          
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: "hsl(220 9% 60%)" }}>
            Junte-se a centenas de barbearias que já estão crescendo no automático.
            Configure em 5 minutos e comece a ver resultados.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button variant="hero" size="xl">
                Começar 7 Dias Grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/afiliado-saas/login">
              <Button variant="ghost" size="lg" className="text-white/70 hover:text-white hover:bg-white/10">
                Quero Ser Afiliado
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8" style={{ borderTop: "1px solid hsl(222 20% 18%)" }}>
            {[
              { value: "100%", label: "Seguro" },
              { value: "24/7", label: "Suporte" },
              { value: "0", label: "Burocracia" },
              { value: "∞", label: "Potencial" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-display font-bold text-gradient-gold">{value}</div>
                <div className="text-xs" style={{ color: "hsl(220 9% 50%)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
