import { UserPlus, Share2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    color: "text-orange-500",
    bg: "bg-orange-50",
    ring: "ring-orange-200",
    title: "Crie sua conta",
    description: "Escolha seu setor, configure seus serviços. Pronto em 2 minutos.",
  },
  {
    number: "02",
    icon: Share2,
    color: "text-blue-500",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    title: "Compartilhe seu link",
    description: "Envie para clientes pelo WhatsApp ou Instagram. Eles agendam sozinhos.",
  },
  {
    number: "03",
    icon: TrendingUp,
    color: "text-green-500",
    bg: "bg-green-50",
    ring: "ring-green-200",
    title: "Receba e fidelize",
    description: "Pagamentos automáticos, cashback e relatórios. Você só atende.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-sm font-medium text-green-600 mb-5">
            Como funciona
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Configure em 5 minutos.{" "}
            <span className="text-orange-500">Comece a receber hoje.</span>
          </h2>
          <p className="text-slate-500 text-base">
            Sem complicação, sem técnico, sem treinamento. Você configura sozinho e já começa a usar.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-gradient-to-r from-orange-200 via-blue-200 to-green-200" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="flex flex-col items-center text-center relative">
                {/* Step number + icon */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 rounded-2xl ${step.bg} ring-4 ${step.ring} flex items-center justify-center shadow-sm`}>
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to="/onboarding">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 h-auto text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25">
              Criar minha conta grátis →
            </Button>
          </Link>
          <p className="text-xs text-slate-400 mt-3">7 dias grátis · Sem cartão · Cancele quando quiser</p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
