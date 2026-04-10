import { Calendar, Zap, CreditCard, Gift, Bot, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Calendar,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
    pain: "Chega de WhatsApp lotado",
    solution: "Agenda online 24h. Cliente marca sozinho, você só aparece.",
  },
  {
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-100",
    pain: "Ninguém mais falta sem avisar",
    solution: "Lembretes automáticos 24h antes. Reduza faltas em 70%.",
  },
  {
    icon: CreditCard,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-100",
    pain: "Receba na hora, sem complicação",
    solution: "PIX integrado com split automático. Cada centavo na conta certa.",
  },
  {
    icon: Gift,
    color: "text-pink-500",
    bg: "bg-pink-50",
    border: "border-pink-100",
    pain: "Cliente que volta vale 5x mais",
    solution: "Cashback automático. Eles voltam para usar o crédito.",
  },
  {
    icon: Bot,
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-100",
    pain: "IA que atende por você",
    solution: "Assistente no WhatsApp responde, agenda e remarca. Até de madrugada.",
  },
  {
    icon: BarChart3,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    pain: "Saiba exatamente quanto você ganhou",
    solution: "Dashboard financeiro em tempo real. Comissões, repasses, tudo claro.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 px-4 bg-slate-50">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-sm font-medium text-orange-600 mb-5">
            Funcionalidades
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Cada problema que você tem,{" "}
            <span className="text-orange-500">a gente resolve</span>
          </h2>
          <p className="text-slate-500 text-base">
            Pare de perder clientes por falta de organização. Automatize tudo e foque no que importa: atender bem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.pain}
              className={`group p-6 rounded-2xl bg-white border ${f.border} hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
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
