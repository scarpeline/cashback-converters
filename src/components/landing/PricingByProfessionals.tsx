import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Users, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

const ALL_FEATURES = [
  "Agenda Online para os Clientes",
  "Cobrança PIX na Agenda Online",
  "Ficha de Anamnese e Contratos",
  "Gestão de Pacotes Inteligente",
  "Assinatura Eletrônica",
  "Fluxo de Caixa",
  "Controle de Estoque",
  "Controle de Compras",
  "Contas a Pagar e a Receber",
  "Emissão de Boletos Bancários",
  "Cálculo de Comissão Detalhada",
  "Relatórios Gerenciais e Gráficos",
  "Controle de Caixa por Profissional",
  "Permissão de Acesso por Profissional",
  "WhatsApp, SMS e E-mail Automático",
  "Confirmação/Cancelamento via WhatsApp",
  "Ranking de Clientes",
  "Cashback Automatizado",
  "Sistema de Afiliados",
];

interface ProfPlan {
  professionals: number;
  monthlyPrice: string;
  semestralPrice: string;
  annualPrice: string;
  annualMonthly: string;
  popular: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PROF_PLANS: ProfPlan[] = [
  {
    professionals: 1,
    monthlyPrice: "29,90",
    semestralPrice: "169,90",
    annualPrice: "299,90",
    annualMonthly: "24,99",
    popular: false,
    color: "text-orange-600",
    bgColor: "bg-orange-500",
    borderColor: "border-orange-200",
  },
  {
    professionals: 3,
    monthlyPrice: "49,90",
    semestralPrice: "269,90",
    annualPrice: "479,90",
    annualMonthly: "39,99",
    popular: false,
    color: "text-blue-600",
    bgColor: "bg-blue-500",
    borderColor: "border-blue-200",
  },
  {
    professionals: 5,
    monthlyPrice: "69,90",
    semestralPrice: "369,90",
    annualPrice: "659,90",
    annualMonthly: "54,99",
    popular: true,
    color: "text-green-600",
    bgColor: "bg-green-500",
    borderColor: "border-green-200",
  },
  {
    professionals: 10,
    monthlyPrice: "99,90",
    semestralPrice: "529,90",
    annualPrice: "959,90",
    annualMonthly: "79,99",
    popular: false,
    color: "text-purple-600",
    bgColor: "bg-purple-500",
    borderColor: "border-purple-200",
  },
];

type Period = "mensal" | "semestral" | "anual";

function PlanCard({ plan, period }: { plan: ProfPlan; period: Period }) {
  const [showAll, setShowAll] = useState(false);

  const price = period === "mensal"
    ? plan.monthlyPrice
    : period === "semestral"
    ? plan.semestralPrice
    : plan.annualPrice;

  const periodLabel = period === "mensal" ? "/mês" : period === "semestral" ? "/6 meses" : "/ano";
  const visibleFeatures = showAll ? ALL_FEATURES : ALL_FEATURES.slice(0, 6);

  return (
    <div className={`relative flex flex-col rounded-2xl border-2 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
      plan.popular ? "border-green-400 shadow-lg shadow-green-500/10" : "border-slate-200"
    }`}>
      {plan.popular && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
          POPULAR
        </div>
      )}

      {/* Header */}
      <div className={`${plan.bgColor} p-5 text-white text-center`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Users className="w-5 h-5" />
          <span className="text-xl font-black">{plan.professionals} {plan.professionals === 1 ? "Profissional" : "Profissionais"}</span>
        </div>
      </div>

      {/* Price */}
      <div className="p-5 text-center border-b border-slate-100">
        <div className="flex items-start justify-center gap-1">
          <span className="text-sm font-bold text-slate-500 mt-2">R$</span>
          <span className={`text-4xl font-black ${plan.color}`}>{price.split(",")[0]}</span>
          <span className={`text-xl font-black ${plan.color} mt-1`}>,{price.split(",")[1]}</span>
        </div>
        <p className="text-sm text-slate-500 mt-1">{periodLabel}</p>
        {period === "anual" && (
          <p className="text-xs text-green-600 font-semibold mt-1">
            Equivale a R${plan.annualMonthly}/mês
          </p>
        )}
        {period === "semestral" && (
          <p className="text-xs text-blue-600 font-semibold mt-1">
            Parcelado em 6x sem juros
          </p>
        )}
      </div>

      {/* Features */}
      <div className="p-5 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">
            {plan.professionals} {plan.professionals === 1 ? "Profissional" : "Profissionais"}
          </span>
        </div>

        <ul className="space-y-2 mb-3">
          {visibleFeatures.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-slate-600">{f}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors w-full justify-center py-2 border border-orange-200 rounded-lg hover:bg-orange-50"
        >
          {showAll ? (
            <><ChevronUp className="w-3 h-3" /> Ver menos</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Ver todas as {ALL_FEATURES.length} funcionalidades</>
          )}
        </button>

        <p className="text-[10px] text-slate-400 text-center mt-2">
          As funcionalidades são iguais para todos os planos, a única variação é a quantidade de profissionais.
        </p>
      </div>

      {/* CTA */}
      <div className="p-5 pt-0">
        <Link to="/onboarding">
          <Button className={`w-full font-bold py-5 rounded-xl text-white ${plan.bgColor} hover:opacity-90`}>
            Começar 14 dias grátis
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function PricingByProfessionals() {
  const [period, setPeriod] = useState<Period>("mensal");

  return (
    <section id="pricing-professionals" className="py-24 px-4 bg-slate-50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-sm font-semibold text-orange-600 mb-6">
            <Sparkles className="w-4 h-4" />
            Planos por Quantidade de Profissionais
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
            Escolha o plano certo para{" "}
            <span className="text-orange-500">sua equipe</span>
          </h2>
          <p className="text-slate-500 text-lg">
            Todas as funcionalidades em todos os planos. A única diferença é o número de profissionais.
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 gap-1 shadow-sm">
            {(["mensal", "semestral", "anual"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                  period === p
                    ? "bg-orange-500 text-white shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p === "mensal" ? "Mensal" : p === "semestral" ? "Semestral" : "Anual"}
                {p === "anual" && (
                  <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-black">
                    -17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROF_PLANS.map((plan) => (
            <PlanCard key={plan.professionals} plan={plan} period={period} />
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          14 dias grátis em todos os planos · Sem cartão de crédito · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}

export default PricingByProfessionals;
