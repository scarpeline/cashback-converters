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
    <section id="features" className="py-24 px-2 sm:px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, var(--secondary-blue) 0%, var(--background-dark) 100%)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px" style={{ background: "linear-gradient(to right, transparent, var(--accent-orange), transparent)" }} />

      <div className="container relative z-10 mx-auto px-2 sm:px-0">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 border border-orange-500/30" style={{ background: "rgba(255, 122, 0, 0.1)", color: "var(--accent-orange)" }}>
            <span className="text-xs sm:text-sm">{t("features_title") || "Funcionalidades"}</span>
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4" style={{ color: "var(--text-light)" }}>
            <span className="text-2xl sm:text-3xl lg:text-5xl">{t("everything_you_need") || "Tudo que você precisa"}</span>
            <br className="sm:hidden" />
            <span className="text-2xl sm:text-3xl lg:text-5xl">{" "}</span>
            <span className="text-gradient text-2xl sm:text-3xl lg:text-5xl">{t("in_one_place") || "em um só lugar"}</span>
          </h2>
          <p className="text-base sm:text-lg" style={{ color: "var(--text-muted)" }}>
            <span className="text-sm sm:text-base">{t("features_subtitle") || "Automatize vendas, agendamentos e pagamentos. Foque no que importa: seu cliente."}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group card-dark p-6 lg:p-8 text-center animate-fade-in" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 lg:mb-6 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{ background: "rgba(255, 122, 0, 0.15)" }}>
                <feature.icon className="w-6 h-6 lg:w-8 lg:h-8 transition-all duration-300" style={{ color: "var(--accent-orange)" }} />
              </div>
              <h3 className="font-bold text-lg lg:text-xl mb-3 transition-colors duration-300 group-hover:text-gradient" style={{ color: "var(--text-light)" }}>
                {feature.title}
              </h3>
              <p className="text-sm lg:text-base leading-relaxed transition-colors duration-300" style={{ color: "var(--text-muted)" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
