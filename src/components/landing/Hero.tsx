// @ts-nocheck
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";
import logo from "@/assets/logo.png";
import { useNiche } from "@/hooks/useNiche";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const { nicheLabel, nicheLabelPlural } = useNiche();
  const { t } = useTranslation("common");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-2 sm:px-4 py-20" style={{ background: "var(--gradient-hero)" }}>
      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(255, 122, 0, 0.15), transparent 70%)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%)" }} />

      <div className="container relative z-10 mx-auto px-2 sm:px-0">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 rounded-full border mb-8 sm:mb-10 animate-fade-in card-dark">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "var(--accent-orange)" }} />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: "var(--text-light)" }}>
              {t("niche.saas_for_niche", { niche: nicheLabel }) || "SaaS para Barbearias e Salões"}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black leading-tight mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: "0.1s", color: "var(--text-light)", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
            <span className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl">{t("niche.automate_niche", { niche: nicheLabel }) || "Automatize sua barbearia"}</span>
            <br className="sm:hidden" />
            <span className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl"> {t("hero.and_have")}</span>
            <br className="sm:hidden" />
            <span className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-gradient" style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.5)" }}>{t("hero.full_schedule") || "agenda sempre cheia."}</span>
          </h1>

          {/* Logo */}
          <div className="relative my-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="absolute inset-0 blur-2xl scale-150" style={{ background: "radial-gradient(circle, rgba(255, 122, 0, 0.2), transparent)" }} />
            <img src={logo} alt="SalãoCashBack" className="relative w-48 sm:w-56 lg:w-64 h-auto animate-float drop-shadow-2xl" />
          </div>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl lg:text-3xl mb-4 sm:mb-6 animate-fade-in font-semibold" style={{ animationDelay: "0.2s", color: "var(--text-light)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
            <span className="text-xl sm:text-2xl lg:text-3xl">{t("hero.complete_management") || "Gestão completa com agendamento inteligente,"}</span>
            <br className="sm:hidden" />
            <span className="text-xl sm:text-2xl lg:text-3xl"> {t("hero.automation_of") || "automação de"}{" "}</span>
            <span className="font-black text-xl sm:text-2xl lg:text-3xl text-gradient" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>{t("hero.marketing_financial") || "marketing e controle financeiro."}</span>
          </p>

          {/* Copy */}
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-10 lg:mb-12 max-w-xl animate-fade-in" style={{ animationDelay: "0.3s", color: "var(--text-light)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
            <span className="text-lg sm:text-xl lg:text-2xl">{t("hero.reduce_work") || "Reduza o trabalho manual, aumente a ocupação da agenda"}</span>
            <br className="sm:hidden" />
            <span className="text-lg sm:text-xl lg:text-2xl"> {t("hero.and_have") || "e tenha o"}{" "}</span>
            <strong className="text-lg sm:text-xl lg:text-2xl font-black" style={{ color: "var(--text-light)", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>{t("hero.full_control") || "controle completo do seu negócio em um único sistema."}</strong>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/login">
              <Button className="button-primary w-full sm:w-auto text-lg sm:text-xl lg:text-2xl px-8 py-4 font-bold sm:px-10 sm:py-5">
                <span className="text-lg sm:text-xl lg:text-2xl">{t("hero.test_system") || "Testar Sistema"}</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg sm:text-xl lg:text-2xl px-8 py-4 font-bold border-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white" style={{ background: "rgba(255, 255, 255, 0.1)" }}>
                <span className="text-lg sm:text-xl lg:text-2xl">{t("hero.view_demo") || "Ver Demonstração"}</span>
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 pt-8 sm:pt-10 animate-fade-in" style={{ animationDelay: "0.5s", borderTop: "2px solid rgba(255, 255, 255, 0.3)" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" style={{ color: "var(--accent-orange)" }} />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-black" style={{ color: "var(--text-light)", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>500+</span>
              </div>
              <p className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: "var(--text-light)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>{nicheLabelPlural} {t("hero.active") || "Barbearias ativas"}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" style={{ color: "var(--accent-orange)" }} />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-black" style={{ color: "var(--text-light)", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>60%</span>
              </div>
              <p className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: "var(--text-light)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>{t("hero.time_saving") || "Economia de tempo"}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" style={{ color: "var(--accent-orange)" }} />
                <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-black" style={{ color: "var(--text-light)", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>{t("hero.seven_days") || "7 dias"}</span>
              </div>
              <p className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: "var(--text-light)", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>{t("hero.free_trial") || "Teste grátis"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
