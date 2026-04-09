import {
  Calendar, CreditCard, Gift, MessageSquare, Bot, Users, Zap
} from "lucide-react";

const features = [
  {
    title: "Agenda Inteligente 24h",
    description: "Clientes agendam online a qualquer hora, direto pelo celular. Você só precisa aparecer.",
    icon: Calendar,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    title: "IA no WhatsApp",
    description: "Assistente inteligente atende por texto e áudio, agenda e remarca automaticamente.",
    icon: Bot,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    title: "Lembretes Automáticos",
    description: "Confirmações e lembretes automáticos por WhatsApp. Reduza faltas em até 70%.",
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    title: "Cashback Automatizado",
    description: "Fidelize clientes devolvendo parte do valor. Eles voltam para usar o crédito.",
    icon: Gift,
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
  {
    title: "Pagamentos Integrados",
    description: "PIX, cartão, split de comissões. Tudo cai na conta certa automaticamente.",
    icon: CreditCard,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    title: "Programa de Parceiros",
    description: "Transforme clientes em vendedores. Cada indicação gera comissão automática.",
    icon: Users,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-sm font-medium text-blue-600 mb-6">
            Funcionalidades
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Tudo que seu negócio precisa em <span className="text-orange-500">uma plataforma</span>
          </h2>
          <p className="text-slate-600">
            Escolha seu segmento, configure em minutos e comece a receber agendamentos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="group p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 border border-transparent hover:border-slate-100">
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
