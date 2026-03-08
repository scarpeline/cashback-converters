import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, CreditCard, Smartphone, Wifi } from "lucide-react";

const ASAAS_FEES = {
  pix: { gateway: 0.99, app: 0.5, total: 1.49 },
  card: { gateway: 2.99, extra: "R$0,49/tx", app: 0.5, total: 3.49 },
  nfc: { gateway: 1.99, app: 0.5, total: 2.49 },
};

const allFeatures = [
  "7 dias grátis para testar", "Agendamentos ilimitados", "Pagamentos PIX, Cartão e NFC",
  "Split automático de comissões", "Cashback configurável", "WhatsApp automático",
  "Dashboard financeiro completo", "Relatórios e métricas", "Múltiplos profissionais",
  "Sistema de afiliados", "Gestão de estoque e produtos", "Exportação de dados", "Suporte via chat",
];

const plans = [
  { name: "Mensal", description: "Ideal para começar", prices: [{ label: "1º mês", price: "19,90" }, { label: "A partir do 2º mês", price: "29,90" }], features: allFeatures, popular: false, planIndex: 0, showTrialButton: true },
  { name: "Trimestral", description: "Economize 11%", price: "79,90", priceLabel: "/3 meses", monthlyEquivalent: "26,63/mês", features: allFeatures, popular: true, planIndex: 1, showTrialButton: false },
  { name: "Anual", description: "Economize 44%", price: "199,90", priceLabel: "/ano", monthlyEquivalent: "16,65/mês", features: allFeatures, popular: false, bestValue: true, planIndex: 2, showTrialButton: false },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 30% 10%) 100%)" }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl" style={{ background: "hsl(42 100% 50% / 0.03)" }} />

      <div className="container relative z-10 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(42 100% 50% / 0.1)", color: "hsl(42 100% 55%)" }}>
            Preços Simples
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            Comece grátis,{" "}<span className="text-gradient-gold">cresça sem limites</span>
          </h2>
          <p className="text-lg" style={{ color: "hsl(220 9% 60%)" }}>7 dias grátis. Sem cartão de crédito.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl p-6 lg:p-8 transition-all duration-300 ${plan.popular ? "scale-105 z-10" : ""}`}
              style={{
                background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))",
                border: plan.popular ? "2px solid hsl(42 100% 50%)" : "1px solid hsl(222 20% 18%)",
                boxShadow: plan.popular ? "0 4px 30px hsl(42 100% 50% / 0.15)" : "none",
              }}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-gold text-sm font-semibold" style={{ color: "hsl(222 47% 11%)" }}>
                    <Sparkles className="w-4 h-4" />Mais Popular
                  </div>
                </div>
              )}
              {plan.bestValue && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full text-sm font-semibold" style={{ background: "hsl(142 76% 36%)", color: "white" }}>
                    Melhor Custo-Benefício
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="font-display text-xl font-bold mb-1" style={{ color: "hsl(0 0% 95%)" }}>{plan.name}</h3>
                <p className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                {plan.prices ? (
                  <div className="space-y-2">
                    {plan.prices.map((p) => (
                      <div key={p.label} className="flex items-center justify-center gap-2">
                        <span className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>{p.label}:</span>
                        <span className="font-display text-2xl font-bold text-gradient-gold">R$ {p.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-lg" style={{ color: "hsl(220 9% 55%)" }}>R$</span>
                      <span className="font-display text-4xl lg:text-5xl font-bold text-gradient-gold">{plan.price}</span>
                      <span style={{ color: "hsl(220 9% 55%)" }}>{plan.priceLabel}</span>
                    </div>
                    {plan.monthlyEquivalent && <p className="text-sm mt-1" style={{ color: "hsl(220 9% 55%)" }}>equivalente a R$ {plan.monthlyEquivalent}</p>}
                  </>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <Link to="/login" className="block">
                  <Button variant={plan.popular ? "gold" : "outline"} className={`w-full ${!plan.popular ? "border-white/20 text-white hover:bg-white/10" : ""}`} size="lg">
                    Começar Grátis
                  </Button>
                </Link>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "hsl(42 100% 50% / 0.15)" }}>
                      <Check className="w-3 h-3" style={{ color: "hsl(42 100% 55%)" }} />
                    </div>
                    <span className="text-sm" style={{ color: "hsl(220 9% 60%)" }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Fees */}
        <div className="max-w-3xl mx-auto mt-16">
          <div className="rounded-2xl p-6 lg:p-8" style={{ background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))", border: "1px solid hsl(222 20% 18%)" }}>
            <h3 className="text-center font-display text-lg font-bold mb-2" style={{ color: "hsl(0 0% 95%)" }}>
              Taxas por Método de Pagamento
            </h3>
            <p className="text-center text-sm mb-6" style={{ color: "hsl(220 9% 55%)" }}>Taxa do app: 0,5% por transação</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Smartphone, label: "PIX", fee: ASAAS_FEES.pix },
                { icon: CreditCard, label: "Cartão de Crédito", fee: ASAAS_FEES.card },
                { icon: Wifi, label: "NFC / Débito", fee: ASAAS_FEES.nfc },
              ].map(({ icon: Icon, label, fee }) => (
                <div key={label} className="rounded-xl p-4 text-center" style={{ background: "hsl(222 47% 6% / 0.5)", border: "1px solid hsl(222 20% 20%)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "hsl(217 91% 50% / 0.1)" }}>
                    <Icon className="w-5 h-5" style={{ color: "hsl(217 85% 60%)" }} />
                  </div>
                  <p className="font-semibold text-sm mb-2" style={{ color: "hsl(0 0% 95%)" }}>{label}</p>
                  <div className="pt-2" style={{ borderTop: "1px solid hsl(222 20% 20%)" }}>
                    <span className="font-display text-xl font-bold text-gradient-gold">{fee.total.toFixed(2)}%</span>
                    <p className="text-xs" style={{ color: "hsl(220 9% 50%)" }}>total por transação</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs mt-6" style={{ color: "hsl(220 9% 50%)" }}>
              🔒 Pagamentos processados de forma segura via <span className="font-medium" style={{ color: "hsl(42 100% 55%)" }}>ASAAS</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
