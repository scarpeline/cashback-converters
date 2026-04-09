import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users, Zap, Bot, Calendar } from "lucide-react";

const niches = [
  "Barbearias", "Salões de Beleza", "Clínicas", "Consultórios",
  "Pet Shops", "Academias", "Estúdios", "Escolas",
];

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-2 sm:px-4 py-20" style={{ background: "linear-gradient(135deg, hsl(230 35% 7%) 0%, hsl(240 30% 10%) 40%, hsl(230 35% 7%) 100%)" }}>
      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(262 83% 58% / 0.12), transparent 70%)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(192 91% 42% / 0.1), transparent 70%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(262 83% 58% / 0.06), transparent 70%)" }} />

      <div className="container relative z-10 mx-auto px-2 sm:px-0">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border mb-8 animate-fade-in" style={{ background: "hsl(262 83% 58% / 0.1)", borderColor: "hsl(262 83% 58% / 0.3)" }}>
            <Sparkles className="w-4 h-4" style={{ color: "hsl(262 83% 68%)" }} />
            <span className="text-sm font-bold" style={{ color: "hsl(262 83% 75%)" }}>
              Plataforma Multi-Nicho com IA Integrada
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl font-black leading-[1.05] mb-6 animate-fade-in" style={{ animationDelay: "0.1s", color: "hsl(0 0% 98%)" }}>
            A Agenda Universal
            <br />
            <span className="text-gradient-gold">que funciona para</span>
            <br />
            <span style={{ color: "hsl(0 0% 98%)" }}>qualquer negócio</span>
          </h1>

          {/* Niche pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            {niches.map((niche) => (
              <span key={niche} className="px-4 py-2 rounded-full text-sm font-semibold border transition-colors hover:border-indigo-500/50" style={{ background: "hsl(0 0% 100% / 0.04)", borderColor: "hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 75%)" }}>
                {niche}
              </span>
            ))}
            <span className="px-4 py-2 rounded-full text-sm font-bold" style={{ background: "hsl(262 83% 58% / 0.15)", color: "hsl(262 83% 75%)" }}>
              +50 nichos
            </span>
          </div>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 max-w-3xl animate-fade-in font-medium" style={{ animationDelay: "0.2s", color: "hsl(220 15% 65%)" }}>
            Agendamento online, WhatsApp com IA, fila de espera inteligente, 
            pagamentos automáticos e cashback — tudo em <strong style={{ color: "hsl(192 91% 60%)" }}>uma única plataforma</strong> que se adapta ao seu segmento.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            {[
              { icon: Bot, text: "IA por Texto e Áudio" },
              { icon: Calendar, text: "Agenda 24h" },
              { icon: Zap, text: "Automação Total" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl" style={{ background: "hsl(262 83% 58% / 0.08)", border: "1px solid hsl(262 83% 58% / 0.15)" }}>
                <Icon className="w-5 h-5" style={{ color: "hsl(262 83% 68%)" }} />
                <span className="text-sm font-bold" style={{ color: "hsl(0 0% 85%)" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/onboarding">
              <Button variant="gold" size="lg" className="text-lg px-10 py-7 font-black shadow-gold text-white">
                Começar Grátis — 7 Dias
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" size="lg" className="text-lg px-8 py-7 font-bold border-2" style={{ borderColor: "hsl(0 0% 100% / 0.15)", color: "hsl(0 0% 85%)", background: "hsl(0 0% 100% / 0.04)" }}>
                Ver Demonstração
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-16 pt-10 animate-fade-in" style={{ animationDelay: "0.4s", borderTop: "1px solid hsl(0 0% 100% / 0.08)" }}>
            {[
              { icon: Users, value: "500+", label: "Negócios ativos" },
              { icon: TrendingUp, value: "60%", label: "Menos faltas" },
              { icon: Sparkles, value: "7 dias", label: "Teste grátis" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(192 91% 55%)" }} />
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-display font-black" style={{ color: "hsl(0 0% 98%)" }}>{value}</span>
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
