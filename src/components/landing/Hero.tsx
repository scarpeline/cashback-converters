// @ts-nocheck
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";
import logo from "@/assets/logo.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-2 sm:px-4 py-20" style={{ background: "linear-gradient(135deg, hsl(212 78% 31%) 0%, hsl(212 78% 41%) 25%, hsl(212 78% 51%) 50%, hsl(212 78% 61%) 75%, hsl(212 78% 31%) 100%)" }}>
      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(38 92% 50% / 0.15), transparent 70%)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(0 0% 100% / 0.15), transparent 70%)" }} />

      <div className="container relative z-10 mx-auto px-2 sm:px-0">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 rounded-full border mb-8 sm:mb-10 animate-fade-in" style={{ background: "hsl(212 78% 95% / 0.9)", borderColor: "hsl(38 92% 50%)" }}>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(38 92% 50%)" }} />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: "hsl(212 78% 31%)" }}>SaaS para Barbearias e Salões</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black leading-tight mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: "0.1s", color: "hsl(0 0% 100%)", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
            <span className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl">Automatize sua barbearia</span>
            <br className="sm:hidden" />
            <span className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl"> e tenha uma</span>
            <br className="sm:hidden" />
            <span className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black" style={{ color: "hsl(38 92% 50%)", textShadow: "3px 3px 6px rgba(0,0,0,0.5)" }}>agenda sempre cheia.</span>
          </h1>

          {/* Logo */}
          <div className="relative my-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="absolute inset-0 blur-2xl scale-150" style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.2), transparent)" }} />
            <img src={logo} alt="SalãoCashBack" className="relative w-48 sm:w-56 lg:w-64 h-auto animate-float drop-shadow-2xl" />
          </div>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl lg:text-3xl mb-4 sm:mb-6 animate-fade-in font-semibold" style={{ animationDelay: "0.2s", color: "hsl(0 0% 100%)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
            <span className="text-xl sm:text-2xl lg:text-3xl">Gestão completa com agendamento inteligente,</span>
            <br className="sm:hidden" />
            <span className="text-xl sm:text-2xl lg:text-3xl"> automação de{" "}</span>
            <span className="font-black text-xl sm:text-2xl lg:text-3xl" style={{ color: "hsl(38 92% 50%)", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>marketing e controle financeiro.</span>
          </p>

          {/* Copy */}
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-10 lg:mb-12 max-w-xl animate-fade-in" style={{ animationDelay: "0.3s", color: "hsl(0 0% 100%)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
            <span className="text-lg sm:text-xl lg:text-2xl">Reduza o trabalho manual, aumente a ocupação da agenda</span>
            <br className="sm:hidden" />
            <span className="text-lg sm:text-xl lg:text-2xl"> e tenha o{" "}</span>
            <strong className="text-lg sm:text-xl lg:text-2xl font-black" style={{ color: "hsl(0 0% 100%)", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>controle completo do seu negócio em um único sistema.</strong>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/login">
              <Button variant="hero" size="lg" sm:size="xl" className="w-full sm:w-auto text-lg sm:text-xl lg:text-2xl px-8 py-4 font-bold" style={{ background: "hsl(38 92% 50%)", color: "hsl(0 0% 100%)", border: "2px solid hsl(38 92% 50%)" }}>
                <span className="text-lg sm:text-xl lg:text-2xl">Testar Sistema</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg sm:text-xl lg:text-2xl px-8 py-4 font-bold border-2" style={{ borderColor: "hsl(0 0% 100%)", color: "hsl(0 0% 100%)", background: "hsl(0 0% 100% / 0.1)" }}>
                <span className="text-lg sm:text-xl lg:text-2xl">Ver Demonstração</span>
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 pt-8 sm:pt-10 animate-fade-in" style={{ animationDelay: "0.5s", borderTop: "2px solid hsl(0 0% 100% / 0.3)" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" style={{ color: "hsl(38 92% 50%)" }} />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-black" style={{ color: "hsl(0 0% 100%)", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>500+</span>
              </div>
              <p className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: "hsl(0 0% 100%)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>Barbearias ativas</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" style={{ color: "hsl(38 92% 50%)" }} />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-black" style={{ color: "hsl(0 0% 100%)", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>60%</span>
              </div>
              <p className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: "hsl(0 0% 100%)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>Economia de tempo</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" style={{ color: "hsl(38 92% 50%)" }} />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-black" style={{ color: "hsl(0 0% 100%)", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>7 dias</span>
              </div>
              <p className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: "hsl(0 0% 100%)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>Teste grátis</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
