import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";
import logo from "@/assets/logo.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div 
        className="absolute inset-0 opacity-30"
        style={{ background: "var(--gradient-glow)" }}
      />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-bronze/5 rounded-full blur-3xl" />

      <div className="container relative z-10 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">SaaS para Barbearias e Salões</span>
            </div>

            {/* Headline */}
            <h1 
              className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-6 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              Eleve sua empresa ao{" "}
              <span className="text-gradient-gold">próximo nível.</span>
            </h1>

            {/* Subheadline */}
            <p 
              className="text-xl sm:text-2xl text-muted-foreground mb-4 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Transforme seus clientes em um{" "}
              <span className="text-gold font-semibold">exército de vendedores.</span>
            </p>

            {/* Copy */}
            <p 
              className="text-base sm:text-lg text-muted-foreground/80 mb-10 max-w-xl mx-auto lg:mx-0 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              Você não precisa de mais clientes. Você precisa de clientes que tragam outros clientes.
              <strong className="text-foreground"> Enquanto você corta o cabelo, o sistema vende.</strong>
            </p>

            {/* CTAs */}
            <div 
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Começar Grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Ver Como Funciona
              </Button>
            </div>

            {/* Stats */}
            <div 
              className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border/50 animate-fade-in"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-2xl sm:text-3xl font-display font-bold text-gradient-gold">500+</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Barbearias ativas</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-2xl sm:text-3xl font-display font-bold text-gradient-gold">40%</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Aumento médio</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-2xl sm:text-3xl font-display font-bold text-gradient-gold">7 dias</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Grátis para testar</p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div 
            className="flex-1 flex justify-center lg:justify-end animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-2xl scale-150" />
              <img
                src={logo}
                alt="SalãoCashBack"
                className="relative w-72 sm:w-80 lg:w-[420px] xl:w-[500px] h-auto animate-float drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
