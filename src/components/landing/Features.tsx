import { Calendar, Zap, CreditCard, Gift, Bot, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Calendar,
    gradient: "from-indigo-500 to-indigo-600",
    pain: "Chega de WhatsApp lotado",
    solution: "Agenda online 24h. Cliente marca sozinho, você só aparece.",
  },
  {
    icon: Zap,
    gradient: "from-amber-500 to-orange-500",
    pain: "Ninguém mais falta sem avisar",
    solution: "Lembretes automáticos 24h antes. Reduza faltas em 70%.",
  },
  {
    icon: CreditCard,
    gradient: "from-emerald-500 to-emerald-600",
    pain: "Receba na hora, sem complicação",
    solution: "PIX integrado com split automático. Cada centavo na conta certa.",
  },
  {
    icon: Gift,
    gradient: "from-pink-500 to-rose-500",
    pain: "Cliente que volta vale 5x mais",
    solution: "Cashback automático. Eles voltam para usar o crédito.",
  },
  {
    icon: Bot,
    gradient: "from-violet-500 to-purple-600",
    pain: "IA que atende por você",
    solution: "Assistente no WhatsApp responde, agenda e remarca. Até de madrugada.",
  },
  {
    icon: BarChart3,
    gradient: "from-cyan-500 to-cyan-600",
    pain: "Saiba exatamente quanto ganhou",
    solution: "Dashboard financeiro em tempo real. Comissões, repasses, tudo claro.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-4 bg-slate-50">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-sm font-semibold text-indigo-600 mb-6">
            ⚡ Funcionalidades
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Cada problema que você tem,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">a gente resolve</span>
          </h2>
          <p className="text-slate-500 text-lg">
            Pare de perder clientes por falta de organização. Automatize tudo e foque no que importa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.pain}
              className="group p-7 rounded-2xl bg-white border border-slate-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {f.pain}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {f.solution}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
