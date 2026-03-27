import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, CreditCard, Smartphone, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNiche } from "@/hooks/useNiche";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const allFeatures = [
  "7 dias grátis para testar", "Agendamentos ilimitados", "Pagamentos PIX, Crédito e Débito",
  "Split automático de comissões", "Cashback configurável", "WhatsApp automático",
  "Dashboard financeiro completo", "Relatórios e métricas", "Múltiplos profissionais",
  "Sistema de afiliados", "Gestão de estoque e produtos", "Exportação de dados", "Suporte via chat",
];

const plans = (t: any) => [
  {
    name: t("monthly"), description: t("perfect_to_start"),
    prices: [{ label: t("first_month"), price: "19,90" }, { label: t("from_second_month"), price: "29,90" }],
    features: allFeatures, popular: false, planIndex: 0, showTrialButton: true
  },
  {
    name: t("quarterly"), description: t("smart_economy"),
    price: "79,90", priceLabel: t("per_3_months"),
    monthlyEquivalent: `26,63${t("per_month")}`,
    features: allFeatures, popular: true, planIndex: 1, showTrialButton: false
  },
  {
    name: t("annual"), description: t("max_economy"),
    price: "199,90", priceLabel: t("per_year"),
    monthlyEquivalent: `16,65${t("per_month")}`,
    features: allFeatures, popular: false, bestValue: true, planIndex: 2, showTrialButton: false
  },
];

const Pricing = () => {
  const { t } = useTranslation();
  const { nicheLabel } = useNiche();
  const navigate = useNavigate();
  const currentPlans = plans(t);

  return (
    <section id="pricing" className="py-24 px-4 relative overflow-hidden bg-muted/30">
      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 bg-accent/10 text-accent border border-accent/20">
            {t("pricing.title")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            {t("pricing.subtitle")}{" "}
            <span className="text-gradient-orange">{t("pricing.subtitle_highlight")}</span>
          </h2>
          <p className="text-lg text-muted-foreground">{t("pricing.trial_info")}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {currentPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 lg:p-8 bg-card border transition-all duration-300 ${
                plan.popular
                  ? "border-accent shadow-lg shadow-accent/10 scale-[1.03] z-10"
                  : "border-border/60 hover:border-accent/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-md">
                    <Sparkles className="w-3 h-3" />{t("pricing.most_popular")}
                  </div>
                </div>
              )}
              {plan.bestValue && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-green-500 text-white text-xs font-bold shadow-md">
                    {t("pricing.best_value")}
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="font-display text-xl font-bold mb-1 text-card-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                {plan.prices ? (
                  <div className="space-y-2">
                    {plan.prices.map((p) => (
                      <div key={p.label} className="flex items-center justify-center gap-2">
                        <span className="text-sm text-muted-foreground">{p.label}:</span>
                        <span className="font-display text-2xl font-bold text-accent">R$ {p.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-lg text-muted-foreground">R$</span>
                      <span className="font-display text-4xl lg:text-5xl font-bold text-accent">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.priceLabel}</span>
                    </div>
                    {plan.monthlyEquivalent && (
                      <p className="text-sm mt-1 text-muted-foreground">equivalente a R$ {plan.monthlyEquivalent}</p>
                    )}
                  </>
                )}
              </div>

              <div className="mb-6">
                <Link to="/login" className="block">
                  <Button
                    className={`w-full ${plan.popular ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-md" : "bg-muted text-foreground hover:bg-muted/80"}`}
                    size="lg"
                  >
                    {t("pricing.start_free")}
                  </Button>
                </Link>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Taxas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="rounded-2xl border border-border/60 bg-card p-6 lg:p-8">
            <div className="text-center mb-8">
              <h3 className="font-display text-xl font-bold mb-2 text-card-foreground">
                {t("pricing.fees_title")}
              </h3>
              <p className="text-muted-foreground text-sm">{t("app_fee_desc")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Smartphone, label: "PIX", rate: "1,49%" },
                { icon: CreditCard, label: t("credit_card"), rate: "3,49% + R$0,49" },
                { icon: Wifi, label: t("debit_nfc"), rate: "2,49%" },
              ].map(({ icon: Icon, label, rate }) => (
                <div key={label} className="rounded-xl bg-muted/50 border border-border/40 p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm mb-2 text-card-foreground">{label}</p>
                  <span className="font-display text-xl font-bold text-primary">{rate}</span>
                  <p className="text-xs text-muted-foreground mt-1">{t("total_per_transaction")}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-muted-foreground text-xs mt-6">
              {t("pricing.secure_payments")} Asaas
            </p>
          </div>
        </motion.div>

        {/* Partnership CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="rounded-2xl p-8 lg:p-12 text-center bg-gradient-to-br from-primary to-primary/80 border border-primary/20">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="font-display text-2xl lg:text-3xl font-bold mb-4 text-primary-foreground">
              {t("pricing.partnership_title", { niche: nicheLabel })}
            </h3>
            <p className="text-lg mb-6 max-w-2xl mx-auto text-primary-foreground/80">
              {t("pricing.partnership_desc", { niche: nicheLabel })}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
                onClick={() => navigate("/seja-um-franqueado")}
              >
                {t("pricing.be_franchisee")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/seja-um-franqueado")}
              >
                {t("pricing.view_partnership_models")}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
