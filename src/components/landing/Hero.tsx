import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users, Zap, Bot, Calendar } from "lucide-react";

const niches = [
  "Barbearias", "Salões de Beleza", "Clínicas", "Consultórios",
  "Pet Shops", "Academias", "Estúdios", "Escolas",
];

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-2 sm:px-4 py-20" style={{ background: "linear-gradient(135deg, hsl(222 47% 8%) 0%, hsl(222 47% 12%) 40%, hsl(222 47% 8%) 100%)" }}>
      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(38 92% 50% / 0.1), transparent 70%)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(260 80% 60% / 0.08), transparent 70%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(38 92% 50% / 0.06), transparent 70%)" }} />

      <div className="container relative z-10 mx-auto px-2 sm:px-0">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border mb-8 animate-fade-in" style={{ background: "hsl(38 92% 50% / 0.1)", borderColor: "hsl(38 92% 50% / 0.3)" }}>
            <Sparkles className="w-4 h-4" style={{ color: "hsl(38 92% 50%)" }} />
            <span className="text-sm font-bold" style={{ color: "hsl(38 92% 60%)" }}>
              Plataforma Multi-Nicho com IA Integrada
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] mb-6 animate-fade-in" style={{ animationDelay: "0.1s", color: "hsl(0 0% 98%)" }}>
            A Agenda Universal
            <br />
            <span className="text-gradient-gold">que funciona para</span>
            <br />
            <span style={{ color: "hsl(0 0% 98%)" }}>qualquer negócio</span>
          </h1>

          {/* Niche pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            {niches.map((niche) => (
              <span key={niche} className="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors hover:border-orange-500/50" style={{ background: "hsl(0 0% 100% / 0.05)", borderColor: "hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 70%)" }}>
                {niche}
              </span>
            ))}
            <span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "hsl(38 92% 50% / 0.15)", color: "hsl(38 92% 60%)" }}>
              +50 nichos
            </span>
          </div>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 max-w-3xl animate-fade-in font-medium" style={{ animationDelay: "0.2s", color: "hsl(220 9% 65%)" }}>
            Agendamento online, WhatsApp com IA, fila de espera inteligente, 
            pagamentos automáticos e cashback — tudo em <strong style={{ color: "hsl(38 92% 55%)" }}>uma única plataforma</strong> que se adapta ao seu segmento.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            {[
              { icon: Bot, text: "IA por Texto e Áudio" },
              { icon: Calendar, text: "Agenda 24h" },
              { icon: Zap, text: "Automação Total" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                <Icon className="w-4 h-4" style={{ color: "hsl(38 92% 50%)" }} />
                <span className="text-sm font-bold" style={{ color: "hsl(0 0% 80%)" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/onboarding">
              <Button variant="gold" size="lg" className="text-lg px-10 py-6 font-black shadow-gold">
                Começar Grátis — 7 Dias
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 font-bold border-2" style={{ borderColor: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 85%)", background: "hsl(0 0% 100% / 0.05)" }}>
                Ver Demonstração
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-16 pt-10 animate-fade-in" style={{ animationDelay: "0.4s", borderTop: "1px solid hsl(0 0% 100% / 0.1)" }}>
            {[
              { icon: Users, value: "500+", label: "Negócios ativos" },
              { icon: TrendingUp, value: "60%", label: "Menos faltas" },
              { icon: Sparkles, value: "7 dias", label: "Teste grátis" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(38 92% 50%)" }} />
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-black" style={{ color: "hsl(0 0% 98%)" }}>{value}</span>
                </div>
                <p className="text-sm sm:text-base font-medium" style={{ color: "hsl(220 9% 55%)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
