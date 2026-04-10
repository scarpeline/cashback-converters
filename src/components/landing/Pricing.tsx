import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, CreditCard, Smartphone, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNiche } from "@/hooks/useNiche";
import { useNavigate } from "react-router-dom";
import { usePricingConfig } from "@/hooks/usePricingConfig";


interface Plan {
  name: string;
  description: string;
  price: string;
  priceLabel: string;
  trial: string;
  monthlyEquivalent?: string;
  features: string[];
  popular: boolean;
  bestValue?: boolean;
  planIndex: number;
  showTrialButton: boolean;
}

const allFeatures = [
  "7 dias grátis para testar", "Agendamentos ilimitados", "Pagamentos PIX, Crédito e Débito",
  "Split automático de comissões", "Cashback configurável", "WhatsApp automático",
  "Dashboard financeiro completo", "Relatórios e métricas", "Múltiplos profissionais",
  "Sistema de afiliados", "Gestão de estoque e produtos", "Exportação de dados", "Suporte via chat",
];

const plans = (t: any): Plan[] => [
  {
    name: t("monthly"), description: t("perfect_to_start"),
    price: "19,90", priceLabel: t("first_month"),
    trial: t("from_second_month_price", { price: "29,90" }) || "A partir do 2º mês: R$29,90",
    features: allFeatures, popular: false, planIndex: 0, showTrialButton: true,
  },
  {
    name: t("quarterly"), description: t("smart_economy"),
    price: "79,90", priceLabel: t("per_3_months"),
    trial: `${t("equivalent_to") || "Equivale a"} R$26,63${t("per_month") || "/mês"}`,
    monthlyEquivalent: `26,63${t("per_month")}`,
    features: allFeatures, popular: true, planIndex: 1, showTrialButton: false,
  },
  {
    name: t("annual"), description: t("max_economy"),
    price: "199,90", priceLabel: t("per_year"),
    trial: `${t("equivalent_to") || "Equivale a"} R$16,65${t("per_month") || "/mês"}`,
    monthlyEquivalent: `16,65${t("per_month")}`,
    features: allFeatures, popular: false, bestValue: true, planIndex: 2, showTrialButton: false,
  },
];

const Pricing = () => {
  const { t } = useTranslation();
  const { nicheLabel } = useNiche();
  const navigate = useNavigate();
  const currentPlans = plans(t);

  return (
    <section id="pricing" className="py-24 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-sm font-semibold text-indigo-600 mb-6">
            <Sparkles className="w-4 h-4" />
            Preços Transparentes
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Escolha o plano ideal para{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">seu negócio</span>
          </h2>
          <p className="text-slate-500 text-lg">
            7 dias grátis em todos os planos. Sem cartão de crédito. Cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 bg-white border ${
                plan.popular ? "border-indigo-300 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-200" : "border-slate-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg">
                  Mais Popular
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {plan.description}
                </p>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    R${plan.price}
                  </span>
                  <span className="text-sm text-slate-500">
                    /{plan.priceLabel}
                  </span>
                </div>
                <p className="text-xs text-green-600 font-medium mt-1">
                  {plan.trial}
                </p>
              </div>

              <Link to="/onboarding" className="block mb-6">
                <Button
                  className={`w-full font-semibold py-5 rounded-xl ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/20"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.showTrialButton ? t("pricing.start_free") : t("pricing.buy_now")}
                </Button>
              </Link>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  O que está incluído
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
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
