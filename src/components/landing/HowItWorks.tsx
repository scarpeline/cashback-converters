import { UserPlus, Share2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    gradient: "from-indigo-500 to-indigo-600",
    title: "Crie sua conta",
    description: "Escolha seu setor, configure seus serviços. Pronto em 2 minutos.",
  },
  {
    number: "02",
    icon: Share2,
    gradient: "from-cyan-500 to-cyan-600",
    title: "Compartilhe seu link",
    description: "Envie para clientes pelo WhatsApp ou Instagram. Eles agendam sozinhos.",
  },
  {
    number: "03",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-emerald-600",
    title: "Receba e fidelize",
    description: "Pagamentos automáticos, cashback e relatórios. Você só atende.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-600 mb-6">
            Como funciona
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Configure em 5 minutos.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">Comece a receber hoje.</span>
          </h2>
          <p className="text-slate-500 text-lg">
            Sem complicação, sem técnico, sem treinamento.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="hidden lg:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-gradient-to-r from-indigo-200 via-cyan-200 to-emerald-200" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={step.number} className="flex flex-col items-center text-center relative">
                <div className="relative mb-8">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-xl shadow-indigo-500/10`}>
                    <step.icon className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center ring-4 ring-white">
                    {i + 1}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-14">
          <Link to="/onboarding">
            <Button className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white px-10 py-4 h-auto text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/25">
              Criar minha conta grátis →
            </Button>
          </Link>
          <p className="text-sm text-slate-400 mt-4">7 dias grátis · Sem cartão · Cancele quando quiser</p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
