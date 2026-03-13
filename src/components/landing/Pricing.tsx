import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, CreditCard, Smartphone, Wifi, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

// Taxas Asaas (gateway) + taxa do app
const ASAAS_FEES = {
  pix: { gateway: 0.99, app: 0.5, total: 1.49 },
  card: { gateway: 2.99, extra: "R$0,49/tx", app: 0.5, total: 3.49 },
  nfc: { gateway: 1.99, app: 0.5, total: 2.49 },
};

const allFeatures = [
  "7 dias grátis para testar",
  "Agendamentos ilimitados",
  "Pagamentos PIX, Cartão e NFC",
  "Split automático de comissões",
  "Cashback configurável",
  "WhatsApp automático",
  "Dashboard financeiro completo",
  "Relatórios e métricas",
  "Múltiplos profissionais",
  "Sistema de afiliados",
  "Gestão de estoque e produtos",
  "Exportação de dados",
  "Suporte via chat",
];

const plans = [
  {
    name: "Mensal",
    description: "Ideal para começar",
    prices: [
      { label: "1º mês", price: "19,90" },
      { label: "A partir do 2º mês", price: "29,90" }
    ],
    features: allFeatures,
    popular: false,
    checkoutUrl: "https://sandbox.asaas.com/c/wyg2cu1i6z2e52el",
    planIndex: 0,
    showTrialButton: true,
  },
  {
    name: "Trimestral",
    description: "Economize 11%",
    price: "79,90",
    priceLabel: "/3 meses",
    monthlyEquivalent: "26,63/mês",
    features: allFeatures,
    popular: true,
    checkoutUrl: "https://sandbox.asaas.com/c/ntu1tp1iloyj99de",
    planIndex: 1,
    showTrialButton: false,
  },
  {
    name: "Anual",
    description: "Economize 44%",
    price: "199,90",
    priceLabel: "/ano",
    monthlyEquivalent: "16,65/mês",
    features: allFeatures,
    popular: false,
    bestValue: true,
    checkoutUrl: "https://sandbox.asaas.com/c/0yhsb6e32ieawwvv",
    planIndex: 2,
    showTrialButton: false,
  }
];

const Pricing = () => {
  const { t } = useTranslation();
  const handleSelectPlan = (plan: typeof plans[0]) => {
    // Store selected plan for post-login redirect
    localStorage.setItem("selected_plan", JSON.stringify({
      index: plan.planIndex,
      name: plan.name,
      checkoutUrl: plan.checkoutUrl,
    }));
  };

  return (
    <section id="pricing" className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-background-subtle" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/3 blur-3xl" />

      <div className="container relative z-10 mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Preços Simples
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {t("pricing_title_start", "Comece grátis,")}{" "}
            <span className="text-gradient-gold">{t("pricing_title_highlight", "cresça sem limites")}</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("trial_days")}. {t("no_credit_card")}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 lg:p-8 transition-all duration-300 ${plan.popular
                ? "bg-gradient-card border-2 border-primary shadow-gold scale-105 z-10"
                : "bg-gradient-card border border-border/50 hover:border-primary/30"
                }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-gold text-primary-foreground text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    Mais Popular
                  </div>
                </div>
              )}

              {/* Best Value Badge */}
              {plan.bestValue && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-success text-success-foreground text-sm font-semibold">
                    Melhor Custo-Benefício
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="font-display text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                {plan.prices ? (
                  <div className="space-y-2">
                    {plan.prices.map((p) => (
                      <div key={p.label} className="flex items-center justify-center gap-2">
                        <span className="text-muted-foreground text-sm">{p.label}:</span>
                        <span className="font-display text-2xl font-bold text-gradient-gold">
                          R$ {p.price}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-muted-foreground text-lg">R$</span>
                      <span className="font-display text-4xl lg:text-5xl font-bold text-gradient-gold">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">{plan.priceLabel}</span>
                    </div>
                    {plan.monthlyEquivalent && (
                      <p className="text-sm text-muted-foreground mt-1">
                        equivalente a R$ {plan.monthlyEquivalent}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* CTA */}
              <div className="space-y-3 mb-6">
                <Link to="/login" onClick={() => handleSelectPlan(plan)} className="block">
                  <Button
                    variant={plan.popular ? "gold" : "outline"}
                    className="w-full"
                    size="lg"
                  >
                    Começar Grátis
                  </Button>
                </Link>

                {/* Botão "Assinar agora e testar 7 dias grátis" apenas no plano Mensal */}
                {plan.showTrialButton ? (
                  <Link to="/login" onClick={() => handleSelectPlan(plan)} className="block">
                    <Button
                      variant="ghost"
                      className="w-full border border-primary/40 hover:bg-primary/10 text-primary font-semibold"
                      size="lg"
                    >
                      Assinar agora e testar 7 dias grátis
                    </Button>
                  </Link>
                ) : (
                  <Link to="/simulacao-pagamento" onClick={() => handleSelectPlan(plan)} className="block">
                    <Button
                      variant="ghost"
                      className="w-full border border-primary/20 hover:bg-primary/10 text-primary"
                      size="lg"
                    >
                      Assinar Agora
                    </Button>
                  </Link>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Taxas detalhadas por método de pagamento */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 shadow-sm">
            <div className="text-center mb-8">
              <h3 className="font-display text-xl font-bold mb-4">
                "{t("marketing_highlight", "Enquanto outros sistemas só agendam, nós transformamos cada cliente em uma máquina de indicações")}"
              </h3>
              <p className="font-display text-lg font-bold text-foreground">
                Taxas por Método de Pagamento
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                {t("app_fee_desc")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* PIX */}
              <div className="rounded-xl bg-gray-50 border border-border/50 p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <p className="font-bold text-sm mb-2 text-foreground">PIX</p>
                <div className="border-t border-border/30 pt-2">
                  <span className="font-display text-xl font-extrabold text-primary">
                    1,49%
                  </span>
                  <p className="text-xs text-muted-foreground font-medium">total por transação</p>
                </div>
              </div>

              {/* Cartão */}
              <div className="rounded-xl bg-gray-50 border border-primary/20 p-4 text-center relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <p className="font-bold text-sm mb-2 text-foreground">Cartão de Crédito</p>
                <div className="border-t border-border/30 pt-2">
                  <span className="font-display text-xl font-extrabold text-primary">
                    3,49% + R$0,49
                  </span>
                  <p className="text-xs text-muted-foreground font-medium">por transação</p>
                </div>
              </div>

              {/* NFC */}
              <div className="rounded-xl bg-gray-50 border border-border/50 p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Wifi className="w-5 h-5 text-primary" />
                </div>
                <p className="font-bold text-sm mb-2 text-foreground">NFC / Débito</p>
                <div className="border-t border-border/30 pt-2">
                  <span className="font-display text-xl font-extrabold text-primary">
                    2,49%
                  </span>
                  <p className="text-xs text-muted-foreground font-medium">total por transação</p>
                </div>
              </div>
            </div>

            <p className="text-center text-muted-foreground text-[10px] mt-6 italic">
              * Taxas totais integradas (Gateway Asaas + 0,5% App).
            </p>
            <p className="text-center text-muted-foreground text-xs mt-2">
              🔒 Pagamentos processados de forma segura via{" "}
              <span className="text-primary font-medium">ASAAS</span>.
              Taxas sujeitas à atualização conforme tabela oficial do gateway.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
