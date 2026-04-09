import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-28 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(230 30% 10%) 0%, hsl(230 35% 6%) 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, hsl(262 83% 58% / 0.3), transparent)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, hsl(262 83% 58% / 0.05), transparent 70%)" }} />
      
      <div className="container relative z-10 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold shadow-gold mb-8 animate-pulse-gold">
            <Rocket className="w-8 h-8 text-white" />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-black mb-5" style={{ color: "hsl(0 0% 98%)" }}>
            Pronto para <span className="text-gradient-gold">automatizar</span> seu negócio?
          </h2>
          
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: "hsl(220 15% 60%)" }}>
            Junte-se a 500+ negócios que já usam a agenda universal com IA.
            Escolha seu nicho, configure em 5 minutos e comece a receber agendamentos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/onboarding">
              <Button variant="gold" size="lg" className="text-lg px-10 py-7 font-black shadow-gold text-white">
                Começar 7 Dias Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/seja-um-franqueado">
              <Button variant="outline" size="lg" className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300">
                Quero Ser Parceiro
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8" style={{ borderTop: "1px solid hsl(230 20% 18%)" }}>
            {[
              { value: "500+", label: "Negócios Ativos" },
              { value: "8+", label: "Nichos Suportados" },
              { value: "24/7", label: "IA no WhatsApp" },
              { value: "7 dias", label: "Teste Grátis" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-display font-black text-gradient-gold">{value}</div>
                <div className="text-xs" style={{ color: "hsl(220 15% 50%)" }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm font-semibold" style={{ color: "hsl(192 91% 55%)" }}>
              ⚡ Multi-nicho • IA integrada • Sem risco • Cancelamento a qualquer momento
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
