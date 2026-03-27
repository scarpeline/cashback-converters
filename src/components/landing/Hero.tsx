// @ts-nocheck
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users, Play } from "lucide-react";
import logo from "@/assets/logo.png";
import { useNiche } from "@/hooks/useNiche";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Hero = () => {
  const { nicheLabel, nicheLabelPlural } = useNiche();
  const { t } = useTranslation("common");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-24 pb-16">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-[15%] w-72 h-72 rounded-full blur-3xl bg-accent/10"
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 left-[10%] w-96 h-96 rounded-full blur-3xl bg-primary/10"
      />

      <div className="container relative z-10 mx-auto">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">
              {t("niche.saas_for_niche", { niche: nicheLabel })}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] mb-6 text-foreground"
          >
            {t("niche.automate_niche", { niche: nicheLabel })}
            <br />
            <span className="text-foreground">{t("hero.and_have")} </span>
            <span className="text-gradient-orange">{t("hero.full_schedule")}</span>
          </motion.h1>

          {/* Logo floating */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative my-6"
          >
            <div className="absolute inset-0 blur-3xl scale-150 bg-accent/10 rounded-full" />
            <img
              src={logo}
              alt="SalãoCashBack"
              className="relative w-40 sm:w-48 lg:w-56 h-auto drop-shadow-2xl animate-float"
            />
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl lg:text-2xl mb-4 text-muted-foreground font-medium max-w-3xl"
          >
            {t("hero.complete_management")}{" "}
            {t("hero.automation_of")}{" "}
            <span className="text-accent font-bold">{t("hero.marketing_financial")}</span>
          </motion.p>

          {/* Copy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-base sm:text-lg mb-10 max-w-xl text-muted-foreground"
          >
            {t("hero.reduce_work")} {t("hero.and_have")}{" "}
            <strong className="text-foreground font-bold">{t("hero.full_control")}</strong>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/login">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all hover:scale-105"
              >
                {t("hero.test_system")}
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-border hover:bg-muted"
              >
                <Play className="w-4 h-4 mr-1" />
                {t("hero.view_demo")}
              </Button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-3 gap-8 sm:gap-16 mt-16 pt-10 border-t border-border/50 w-full max-w-2xl"
          >
            {[
              { icon: Users, value: "500+", label: `${nicheLabelPlural} ${t("hero.active")}` },
              { icon: TrendingUp, value: "60%", label: t("hero.time_saving") },
              { icon: Sparkles, value: t("hero.seven_days"), label: t("hero.free_trial") },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-accent" />
                  <span className="text-2xl sm:text-3xl font-display font-black text-foreground">
                    {value}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
