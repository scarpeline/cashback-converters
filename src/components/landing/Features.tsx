import {
  Calendar, CreditCard, Gift, MessageSquare, Bot, Users, Zap
} from "lucide-react";

const Features = () => {
  const features = [
    {
      title: "Agenda Universal Multi-Nicho",
      description: "Uma plataforma que se adapta a qualquer segmento: beleza, saúde, educação, pets, automotivo e mais.",
      icon: Calendar,
      gradient: "from-indigo-500 to-purple-600",
      iconColor: "hsl(262 83% 68%)",
      iconBg: "hsl(262 83% 58% / 0.15)",
    },
    {
      title: "IA no WhatsApp (Texto & Áudio)",
      description: "Assistente inteligente que agenda, remarca e atende seus clientes automaticamente por texto e voz.",
      icon: Bot,
      gradient: "from-cyan-500 to-blue-600",
      iconColor: "hsl(192 91% 55%)",
      iconBg: "hsl(192 91% 42% / 0.15)",
    },
    {
      title: "Fila de Espera Inteligente",
      description: "Vaga abriu? O sistema notifica o próximo da fila. 20 min para responder ou passa para o seguinte.",
      icon: Zap,
      gradient: "from-emerald-500 to-teal-600",
      iconColor: "hsl(160 84% 50%)",
      iconBg: "hsl(160 84% 39% / 0.15)",
    },
    {
      title: "Cashback & Fidelização",
      description: "Sistema de cashback, pontos de fidelidade e promoções automáticas para cada nicho.",
      icon: Gift,
      gradient: "from-violet-500 to-pink-600",
      iconColor: "hsl(280 70% 65%)",
      iconBg: "hsl(280 70% 55% / 0.15)",
    },
    {
      title: "Pagamentos Integrados",
      description: "PIX, cartão, split de comissões e gestão financeira completa para qualquer tipo de negócio.",
      icon: CreditCard,
      gradient: "from-sky-500 to-indigo-600",
      iconColor: "hsl(210 90% 65%)",
      iconBg: "hsl(210 90% 55% / 0.15)",
    },
    {
      title: "Programa de Parceiros",
      description: "Sistema multinível de afiliados com comissões automáticas e rastreamento de conversões.",
      icon: Users,
      gradient: "from-teal-500 to-cyan-600",
      iconColor: "hsl(172 66% 55%)",
      iconBg: "hsl(172 66% 45% / 0.15)",
    },
  ];

  return (
    <section id="features" className="py-28 px-2 sm:px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(230 35% 6%) 0%, hsl(230 35% 9%) 100%)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px" style={{ background: "linear-gradient(to right, transparent, hsl(262 83% 58% / 0.3), transparent)" }} />

      <div className="container relative z-10 mx-auto px-2 sm:px-0">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <span className="inline-block px-5 py-1.5 rounded-full text-sm font-semibold mb-5" style={{ background: "hsl(262 83% 58% / 0.1)", color: "hsl(262 83% 75%)" }}>
            Funcionalidades Principais
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-black mb-5" style={{ color: "hsl(0 0% 98%)" }}>
            Tudo que você precisa{" "}
            <span className="text-gradient-gold">em uma plataforma</span>
          </h2>
          <p className="text-base sm:text-lg" style={{ color: "hsl(220 15% 60%)" }}>
            Escolha seu nicho, configure em 5 minutos e tenha uma agenda inteligente funcionando para você.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="group relative p-6 sm:p-8 rounded-2xl border transition-all duration-300 hover:translate-y-[-4px]" style={{ background: "linear-gradient(145deg, hsl(230 30% 14%), hsl(230 30% 10%))", borderColor: "hsl(0 0% 100% / 0.07)" }}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "hsl(262 83% 58% / 0.03)" }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform" style={{ background: feature.iconBg }}>
                  <feature.icon className="w-7 h-7" style={{ color: feature.iconColor }} />
                </div>
                <h3 className="font-display text-xl font-bold mb-3" style={{ color: "hsl(0 0% 95%)" }}>
                  {feature.title}
                </h3>
                <p className="text-base leading-relaxed" style={{ color: "hsl(220 15% 58%)" }}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
