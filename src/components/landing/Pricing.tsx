// @ts-nocheck
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, CreditCard, Smartphone, Wifi, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const ASAAS_FEES = {
  pix: { gateway: 0.99, total: 0.99 },
  card: { gateway: 2.99, extra: "R$0,49/tx", total: 3.49 },
  debit: { gateway: 1.99, total: 1.99 },
};

const allFeatures = [
  "7 dias grátis para testar", "Agendamentos ilimitados", "Pagamentos PIX, Crédito e Débito",
  "Split automático de comissões", "Cashback configurável", "WhatsApp automático",
  "Dashboard financeiro completo", "Relatórios e métricas", "Múltiplos profissionais",
  "Sistema de afiliados", "Gestão de estoque e produtos", "Exportação de dados", "Suporte via chat",
];

const plans = [
  { name: "Mensal", description: "Perfeito para começar", prices: [{ label: "1º mês", price: "19,90" }, { label: "A partir do 2º mês", price: "29,90" }], features: allFeatures, popular: false, planIndex: 0, showTrialButton: true },
  { name: "Trimestral", description: "Economia inteligente", price: "79,90", priceLabel: "/3 meses", monthlyEquivalent: "26,63/mês", features: allFeatures, popular: true, planIndex: 1, showTrialButton: false },
  { name: "Anual", description: "Máximo de economia", price: "199,90", priceLabel: "/ano", monthlyEquivalent: "16,65/mês", features: allFeatures, popular: false, bestValue: true, planIndex: 2, showTrialButton: false },
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
    <section id="pricing" className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 30% 10%) 100%)" }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl" style={{ background: "hsl(42 100% 50% / 0.03)" }} />

      <div className="container relative z-10 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(42 100% 50% / 0.1)", color: "hsl(42 100% 55%)" }}>
            Preços que Cabem no seu Bolso
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            Comece grátis,{" "}<span className="text-gradient-gold">fature mais</span>
          </h2>
          <p className="text-lg" style={{ color: "hsl(220 9% 60%)" }}>7 dias grátis. Sem cartão. Sem compromisso. Resultados imediatos.</p>
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

        {/* Partnership CTA */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="rounded-2xl p-8 lg:p-12 text-center" style={{ background: "linear-gradient(135deg, hsl(212 78% 31%), hsl(212 78% 51%))", border: "2px solid hsl(38 92% 50%)" }}>
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="font-display text-2xl lg:text-3xl font-bold mb-4" style={{ color: "hsl(0 0% 100%)" }}>
              Quer mais do que um sistema?
            </h3>
            <p className="text-lg mb-6 max-w-2xl mx-auto" style={{ color: "hsl(0 0% 100% / 80%)" }}>
              Torne-se um parceiro e ganhe comissões recorrentes indicando o melhor SaaS para barbearias do Brasil.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/seja-um-franqueado">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 font-bold">
                  🏆 Quero Ser Franqueado
                </Button>
              </Link>
              <Link to="/seja-um-franqueado">
                <Button variant="ghost" size="lg" className="text-white/70 hover:text-white hover:bg-white/10">
                  👥 Ver Modelos de Parceria
                </Button>
              </Link>
            </div>
            <div className="mt-6 text-sm" style={{ color: "hsl(0 0% 100% / 60%)" }}>
              💰 Ganhe até 65% de comissão • Construa sua rede • Suporte completo
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
