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
            Pronto para <span className="text-gradient-gold">automatizar</span> seu negócio?
          </h2>
          
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: "hsl(220 9% 60%)" }}>
            Junte-se a 500+ negócios que já usam a agenda universal com IA.
            Escolha seu nicho, configure em 5 minutos e comece a receber agendamentos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/onboarding">
              <Button variant="gold" size="lg" className="text-lg px-10 py-6 font-black shadow-gold">
                Começar 7 Dias Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/seja-um-franqueado">
              <Button variant="outline" size="lg" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                Quero Ser Parceiro
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8" style={{ borderTop: "1px solid hsl(222 20% 18%)" }}>
            {[
              { value: "500+", label: "Negócios Ativos" },
              { value: "8+", label: "Nichos Suportados" },
              { value: "24/7", label: "IA no WhatsApp" },
              { value: "7 dias", label: "Teste Grátis" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-display font-bold text-gradient-gold">{value}</div>
                <div className="text-xs" style={{ color: "hsl(220 9% 50%)" }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium" style={{ color: "hsl(38 92% 50%)" }}>
              ⚡ Multi-nicho • IA integrada • Sem risco • Cancelamento a qualquer momento
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
