import {
  Calendar, CreditCard, Gift, MessageSquare, Smartphone, Users
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    { title: t("integrated_payments"), description: t("integrated_payments_desc"), icon: CreditCard },
    { title: t("online_booking"), description: t("online_booking_desc"), icon: Calendar },
    { title: t("auto_cashback"), description: t("auto_cashback_desc"), icon: Gift },
    { title: t("whatsapp_reminders"), description: t("whatsapp_reminders_desc"), icon: MessageSquare },
    { title: t("integrated_management"), description: t("integrated_management_desc"), icon: Smartphone },
    { title: t("affiliate_system"), description: t("affiliate_system_desc"), icon: Users },
  ];

  return (
    <section id="features" className="py-24 px-4 relative overflow-hidden bg-muted/30">
      {/* Decorative line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 bg-accent/10 text-accent border border-accent/20">
            {t("features_title")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            {t("everything_you_need")}{" "}
            <span className="text-gradient-orange">{t("in_one_place")}</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("features_subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="group relative p-6 rounded-2xl bg-card border border-border/60 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2 text-card-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
