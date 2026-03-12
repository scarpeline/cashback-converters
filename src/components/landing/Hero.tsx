import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";
import logo from "@/assets/logo.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-2 sm:px-4 py-20" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 30% 12%) 100%)" }}>
      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.08), transparent 70%)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(217 91% 50% / 0.08), transparent 70%)" }} />

      <div className="container relative z-10 mx-auto px-2 sm:px-0">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border mb-6 sm:mb-8 animate-fade-in" style={{ background: "hsl(42 100% 50% / 0.1)", borderColor: "hsl(42 100% 50% / 0.25)" }}>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "hsl(42 100% 50%)" }} />
            <span className="text-base sm:text-lg font-medium" style={{ color: "hsl(42 100% 55%)" }}>SaaS para Barbearias e Salões</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-black leading-tight mb-4 sm:mb-6 animate-fade-in" style={{ animationDelay: "0.1s", color: "hsl(0 0% 98%)" }}>
            <span className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl">Automatize sua barbearia</span>
            <br className="sm:hidden" />
            <span className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl"> e tenha uma</span>
            <br className="sm:hidden" />
            <span className="text-gradient-gold text-3xl sm:text-4xl lg:text-6xl xl:text-7xl">agenda sempre cheia.</span>
          </h1>

          {/* Logo */}
          <div className="relative my-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="absolute inset-0 blur-2xl scale-150" style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.2), transparent)" }} />
            <img src={logo} alt="SalãoCashBack" className="relative w-48 sm:w-56 lg:w-64 h-auto animate-float drop-shadow-2xl" />
          </div>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl lg:text-2xl mb-3 sm:mb-4 animate-fade-in" style={{ animationDelay: "0.2s", color: "hsl(220 9% 70%)" }}>
            <span className="text-base sm:text-lg lg:text-xl">Gestão completa com agendamento inteligente,</span>
            <br className="sm:hidden" />
            <span className="text-base sm:text-lg lg:text-xl"> automação de{" "}</span>
            <span className="font-semibold text-base sm:text-lg lg:text-xl" style={{ color: "hsl(42 100% 55%)" }}>marketing e controle financeiro.</span>
          </p>

          {/* Copy */}
          <p className="text-base sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-10 max-w-xl animate-fade-in" style={{ animationDelay: "0.3s", color: "hsl(220 9% 60%)" }}>
            <span className="text-base sm:text-base lg:text-lg">Reduza o trabalho manual, aumente a ocupação da agenda</span>
            <br className="sm:hidden" />
            <span className="text-base sm:text-base lg:text-lg"> e tenha o{" "}</span>
            <strong className="text-base sm:text-base lg:text-lg" style={{ color: "hsl(0 0% 100%)" }}>controle completo do seu negócio em um único sistema.</strong>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/login">
              <Button variant="hero" size="lg" sm:size="xl" className="w-full sm:w-auto text-base sm:text-base">
                <span className="text-base sm:text-base">Testar Sistema</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 text-base sm:text-base">
                <span className="text-base sm:text-base">Ver Demonstração</span>
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 sm:mt-12 pt-6 sm:pt-8 animate-fade-in" style={{ animationDelay: "0.5s", borderTop: "1px solid hsl(222 20% 18%)" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "hsl(42 100% 55%)" }} />
                <span className="text-lg sm:text-2xl lg:text-3xl font-display font-bold text-gradient-gold">500+</span>
              </div>
              <p className="text-sm sm:text-xs" style={{ color: "hsl(220 9% 55%)" }}>Barbearias ativas</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "hsl(42 100% 55%)" }} />
                <span className="text-lg sm:text-2xl lg:text-3xl font-display font-bold text-gradient-gold">60%</span>
              </div>
              <p className="text-sm sm:text-xs" style={{ color: "hsl(220 9% 55%)" }}>Economia de tempo</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "hsl(42 100% 55%)" }} />
                <span className="text-lg sm:text-2xl lg:text-3xl font-display font-bold text-gradient-gold">7 dias</span>
              </div>
              <p className="text-sm sm:text-xs" style={{ color: "hsl(220 9% 55%)" }}>Teste grátis</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
