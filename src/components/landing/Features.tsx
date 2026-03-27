import {
  Calendar, CreditCard, Gift, MessageSquare, PieChart, Shield, Smartphone, Users, Zap, Briefcase, FileText
} from "lucide-react";
import { useNiche } from "@/hooks/useNiche";
import { useTranslation } from "react-i18next";

const Features = () => {
  const { nicheLabel } = useNiche();
  const { t } = useTranslation();

  const features = [
    {
      title: t("integrated_payments"),
      description: t("integrated_payments_desc"),
      icon: CreditCard,
    },
    {
      title: t("online_booking"),
      description: t("online_booking_desc"),
      icon: Calendar,
    },
    {
      title: t("auto_cashback"),
      description: t("auto_cashback_desc"),
      icon: Gift,
    },
    {
      title: t("whatsapp_reminders"),
      description: t("whatsapp_reminders_desc"),
      icon: MessageSquare,
    },
    {
      title: t("integrated_management"),
      description: t("integrated_management_desc"),
      icon: Smartphone,
    },
    {
      title: t("affiliate_system"),
      description: t("affiliate_system_desc"),
      icon: Users,
    },
  ];

  return (
    <section id="features" className="py-24 px-2 sm:px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 47% 8%) 100%)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px" style={{ background: "linear-gradient(to right, transparent, hsl(42 100% 50% / 0.3), transparent)" }} />

      <div className="container relative z-10 mx-auto px-2 sm:px-0">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4" style={{ background: "hsl(42 100% 50% / 0.1)", color: "hsl(42 100% 55%)" }}>
            <span className="text-xs sm:text-sm">{t("features_title")}</span>
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            <span className="text-2xl sm:text-3xl lg:text-5xl">{t("everything_you_need")}</span>
            <br className="sm:hidden" />
            <span className="text-2xl sm:text-3xl lg:text-5xl">{" "}</span>
            <span className="text-gradient-gold text-2xl sm:text-3xl lg:text-5xl">{t("in_one_place")}</span>
          </h2>
          <p className="text-base sm:text-lg" style={{ color: "hsl(220 9% 60%)" }}>
            <span className="text-sm sm:text-base">{t("features_subtitle")}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div key={feature.title} className="group relative p-4 sm:p-6 rounded-2xl border transition-all duration-300" style={{ background: "linear-gradient(145deg, hsl(25 95% 60%), hsl(25 95% 50%))", borderColor: "hsl(25 95% 40%)" }}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "hsl(25 95% 70% / 0.1)" }} />
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform" style={{ background: "hsl(0 0% 100% / 0.2)" }}>
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "hsl(0 0% 100%)" }} />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold mb-2 transition-colors" style={{ color: "hsl(0 0% 100%)" }}>
                  <span className="text-base sm:text-lg lg:text-xl">{feature.title}</span>
                </h3>
                <p className="text-sm sm:text-sm leading-relaxed" style={{ color: "hsl(0 0% 95%)" }}>
                  <span className="text-sm sm:text-base lg:text-lg">{feature.description}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
