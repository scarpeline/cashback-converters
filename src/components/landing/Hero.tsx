import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";
import logo from "@/assets/logo.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 30% 12%) 100%)" }}>
      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.08), transparent 70%)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(217 91% 50% / 0.08), transparent 70%)" }} />

      <div className="container relative z-10 mx-auto">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 animate-fade-in" style={{ background: "hsl(42 100% 50% / 0.1)", borderColor: "hsl(42 100% 50% / 0.25)" }}>
            <Sparkles className="w-4 h-4" style={{ color: "hsl(42 100% 50%)" }} />
            <span className="text-sm font-medium" style={{ color: "hsl(42 100% 55%)" }}>SaaS para Barbearias e Salões</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s", color: "hsl(0 0% 98%)" }}>
            Eleve sua empresa ao{" "}
            <span className="text-gradient-gold">próximo nível.</span>
          </h1>

          {/* Logo */}
          <div className="relative my-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="absolute inset-0 blur-2xl scale-150" style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.2), transparent)" }} />
            <img src={logo} alt="SalãoCashBack" className="relative w-48 sm:w-56 lg:w-64 h-auto animate-float drop-shadow-2xl" />
          </div>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl mb-4 animate-fade-in" style={{ animationDelay: "0.2s", color: "hsl(220 9% 70%)" }}>
            Transforme seus clientes em um{" "}
            <span className="font-semibold" style={{ color: "hsl(42 100% 55%)" }}>exército de vendedores.</span>
          </p>

          {/* Copy */}
          <p className="text-base sm:text-lg mb-10 max-w-xl animate-fade-in" style={{ animationDelay: "0.3s", color: "hsl(220 9% 60%)" }}>
            Você não precisa de mais clientes. Você precisa de clientes que tragam outros clientes.
            <strong style={{ color: "hsl(0 0% 100%)" }}> Enquanto você corta o cabelo, o sistema vende.</strong>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/login">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Começar Grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10">
                Ver Como Funciona
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 animate-fade-in" style={{ animationDelay: "0.5s", borderTop: "1px solid hsl(222 20% 18%)" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-4 h-4" style={{ color: "hsl(42 100% 55%)" }} />
                <span className="text-2xl sm:text-3xl font-display font-bold text-gradient-gold">500+</span>
              </div>
              <p className="text-xs sm:text-sm" style={{ color: "hsl(220 9% 55%)" }}>Barbearias ativas</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" style={{ color: "hsl(42 100% 55%)" }} />
                <span className="text-2xl sm:text-3xl font-display font-bold text-gradient-gold">40%</span>
              </div>
              <p className="text-xs sm:text-sm" style={{ color: "hsl(220 9% 55%)" }}>Aumento médio</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" style={{ color: "hsl(42 100% 55%)" }} />
                <span className="text-2xl sm:text-3xl font-display font-bold text-gradient-gold">7 dias</span>
              </div>
              <p className="text-xs sm:text-sm" style={{ color: "hsl(220 9% 55%)" }}>Grátis para testar</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
