import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, CreditCard, Smartphone, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNiche } from "@/hooks/useNiche";
import { useNavigate } from "react-router-dom";

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
    price: "79,90", priceLabel: t("per_3_months"), monthlyEquivalent: `26,63${t("per_month")}`, 
    features: allFeatures, popular: true, planIndex: 1, showTrialButton: false 
  },
  { 
    name: t("annual"), description: t("max_economy"), 
    price: "199,90", priceLabel: t("per_year"), monthlyEquivalent: `16,65${t("per_month")}`, 
    features: allFeatures, popular: false, bestValue: true, planIndex: 2, showTrialButton: false 
  },
];

const Pricing = () => {
  const { t } = useTranslation();
  const { nicheLabel } = useNiche();
  const navigate = useNavigate();
  const currentPlans = plans(t);

  return (
    <section id="pricing" className="py-28 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(230 35% 8%) 0%, hsl(230 30% 10%) 100%)" }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl" style={{ background: "hsl(262 83% 58% / 0.03)" }} />

      <div className="container relative z-10 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-5 py-1.5 rounded-full text-sm font-semibold mb-5" style={{ background: "hsl(262 83% 58% / 0.1)", color: "hsl(262 83% 75%)" }}>
            {t("pricing.title")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-black mb-5" style={{ color: "hsl(0 0% 98%)" }}>
            {t("pricing.subtitle")}{" "}<span className="text-gradient-gold">{t("pricing.subtitle_highlight")}</span>
          </h2>
          <p className="text-lg" style={{ color: "hsl(220 15% 60%)" }}>{t("pricing.trial_info")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {currentPlans.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl p-6 lg:p-8 transition-all duration-300 ${plan.popular ? "scale-105 z-10" : ""}`}
              style={{
                background: "linear-gradient(145deg, hsl(230 30% 13%), hsl(230 30% 9%))",
                border: plan.popular ? "2px solid hsl(262 83% 58%)" : "1px solid hsl(230 20% 18%)",
                boxShadow: plan.popular ? "0 4px 30px hsl(262 83% 58% / 0.15)" : "none",
              }}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-gold text-sm font-bold text-white">
                    <Sparkles className="w-4 h-4" />{t("pricing.most_popular")}
                  </div>
                </div>
              )}
              {plan.bestValue && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full text-sm font-bold text-white" style={{ background: "hsl(160 84% 39%)" }}>
                    {t("pricing.best_value")}
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="font-display text-xl font-bold mb-1" style={{ color: "hsl(0 0% 95%)" }}>{plan.name}</h3>
                <p className="text-sm" style={{ color: "hsl(220 15% 55%)" }}>{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                {plan.prices ? (
                  <div className="space-y-2">
                    {plan.prices.map((p) => (
                      <div key={p.label} className="flex items-center justify-center gap-2">
                        <span className="text-sm" style={{ color: "hsl(220 15% 55%)" }}>{p.label}:</span>
                        <span className="font-display text-2xl font-bold text-gradient-gold">R$ {p.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-lg" style={{ color: "hsl(220 15% 55%)" }}>R$</span>
                      <span className="font-display text-4xl lg:text-5xl font-black text-gradient-gold">{plan.price}</span>
                      <span style={{ color: "hsl(220 15% 55%)" }}>{plan.priceLabel}</span>
                    </div>
                    {plan.monthlyEquivalent && <p className="text-sm mt-1" style={{ color: "hsl(220 15% 55%)" }}>equivalente a R$ {plan.monthlyEquivalent}</p>}
                  </>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <Link to="/login" className="block">
                  <Button variant={plan.popular ? "gold" : "outline"} className={`w-full ${plan.popular ? "text-white" : "border-white/20 text-white hover:bg-white/10"}`} size="lg">
                    {t("pricing.start_free")}
                  </Button>
                </Link>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "hsl(160 84% 39% / 0.15)" }}>
                      <Check className="w-3 h-3" style={{ color: "hsl(160 84% 55%)" }} />
                    </div>
                    <span className="text-sm" style={{ color: "hsl(220 15% 60%)" }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment fees */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="rounded-2xl border p-6 lg:p-8" style={{ background: "linear-gradient(145deg, hsl(230 30% 13%), hsl(230 30% 9%))", borderColor: "hsl(0 0% 100% / 0.07)" }}>
            <div className="text-center mb-8">
              <h3 className="font-display text-xl font-bold mb-4" style={{ color: "hsl(0 0% 95%)" }}>
                "{t("pricing.fees_subtitle")}"
              </h3>
              <p className="font-display text-lg font-bold" style={{ color: "hsl(0 0% 90%)" }}>
                {t("pricing.fees_title")}
              </p>
              <p className="text-sm mt-2" style={{ color: "hsl(220 15% 55%)" }}>
                {t("app_fee_desc")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl p-4 text-center" style={{ background: "hsl(160 84% 39% / 0.06)", border: "1px solid hsl(160 84% 39% / 0.15)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "hsl(160 84% 39% / 0.12)" }}>
                  <Smartphone className="w-5 h-5" style={{ color: "hsl(160 84% 55%)" }} />
                </div>
                <p className="font-bold text-sm mb-2" style={{ color: "hsl(0 0% 90%)" }}>PIX</p>
                <div className="border-t pt-2" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
                  <span className="font-display text-xl font-black" style={{ color: "hsl(160 84% 55%)" }}>1,49%</span>
                  <p className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>{t("total_per_transaction")}</p>
                </div>
              </div>

              <div className="rounded-xl p-4 text-center" style={{ background: "hsl(262 83% 58% / 0.06)", border: "1px solid hsl(262 83% 58% / 0.15)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "hsl(262 83% 58% / 0.12)" }}>
                  <CreditCard className="w-5 h-5" style={{ color: "hsl(262 83% 68%)" }} />
                </div>
                <p className="font-bold text-sm mb-2" style={{ color: "hsl(0 0% 90%)" }}>{t("credit_card")}</p>
                <div className="border-t pt-2" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
                  <span className="font-display text-xl font-black" style={{ color: "hsl(262 83% 68%)" }}>3,49% + R$0,49</span>
                  <p className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>{t("per_transaction")}</p>
                </div>
              </div>

              <div className="rounded-xl p-4 text-center" style={{ background: "hsl(192 91% 42% / 0.06)", border: "1px solid hsl(192 91% 42% / 0.15)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "hsl(192 91% 42% / 0.12)" }}>
                  <Wifi className="w-5 h-5" style={{ color: "hsl(192 91% 55%)" }} />
                </div>
                <p className="font-bold text-sm mb-2" style={{ color: "hsl(0 0% 90%)" }}>{t("debit_nfc")}</p>
                <div className="border-t pt-2" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
                  <span className="font-display text-xl font-black" style={{ color: "hsl(192 91% 55%)" }}>2,49%</span>
                  <p className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>{t("total_per_transaction")}</p>
                </div>
              </div>
            </div>

            <p className="text-center text-[10px] mt-6 italic" style={{ color: "hsl(220 15% 50%)" }}>{t("pricing.fees_subject_to_update")}</p>
            <p className="text-center text-xs mt-2" style={{ color: "hsl(220 15% 50%)" }}>{t("pricing.secure_payments")} Asaas</p>
          </div>
        </div>

        {/* Partnership CTA */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="rounded-2xl p-8 lg:p-12 text-center" style={{ background: "linear-gradient(135deg, hsl(262 83% 45%), hsl(192 91% 42%))", border: "2px solid hsl(262 83% 58% / 0.3)" }}>
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="font-display text-2xl lg:text-3xl font-black mb-4 text-white">
              {t("pricing.partnership_title", { niche: nicheLabel })}
            </h3>
            <p className="text-lg mb-6 max-w-2xl mx-auto text-white/80">
              {t("pricing.partnership_desc", { niche: nicheLabel })}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 border-white/30 text-white hover:bg-white/10 font-bold" onClick={() => navigate("/seja-um-franqueado")}>
                {t("pricing.be_franchisee")}
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 border-white/10 text-white/80 hover:bg-white/5" onClick={() => navigate("/seja-um-franqueado")}>
                {t("pricing.view_partnership_models")}
              </Button>
            </div>
            <div className="mt-6 text-sm text-white/60">
              {t("partnership_benefits")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
