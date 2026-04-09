import {
  Calendar, CreditCard, Gift, MessageSquare, Bot, Users, Zap
} from "lucide-react";

const Features = () => {
  const features = [
    {
      title: "Agenda Universal Multi-Nicho",
      description: "Uma plataforma que se adapta a qualquer segmento: beleza, saúde, educação, pets, automotivo e mais.",
      icon: Calendar,
    },
    {
      title: "IA no WhatsApp (Texto & Áudio)",
      description: "Assistente inteligente que agenda, remarca e atende seus clientes automaticamente por texto e voz.",
      icon: Bot,
    },
    {
      title: "Fila de Espera Inteligente",
      description: "Vaga abriu? O sistema notifica o próximo da fila. 20 min para responder ou passa para o seguinte.",
      icon: Zap,
    },
    {
      title: "Cashback & Fidelização",
      description: "Sistema de cashback, pontos de fidelidade e promoções automáticas para cada nicho.",
      icon: Gift,
    },
    {
      title: "Pagamentos Integrados",
      description: "PIX, cartão, split de comissões e gestão financeira completa para qualquer tipo de negócio.",
      icon: CreditCard,
    },
    {
      title: "Programa de Parceiros",
      description: "Sistema multinível de afiliados com comissões automáticas e rastreamento de conversões.",
      icon: Users,
    },
  ];

  return (
    <section id="features" className="py-24 px-2 sm:px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 47% 8%) 100%)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px" style={{ background: "linear-gradient(to right, transparent, hsl(42 100% 50% / 0.3), transparent)" }} />

      <div className="container relative z-10 mx-auto px-2 sm:px-0">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(42 100% 50% / 0.1)", color: "hsl(42 100% 55%)" }}>
            Funcionalidades Principais
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            Tudo que você precisa{" "}
            <span className="text-gradient-gold">em uma plataforma</span>
          </h2>
          <p className="text-base sm:text-lg" style={{ color: "hsl(220 9% 60%)" }}>
            Escolha seu nicho, configure em 5 minutos e tenha uma agenda inteligente funcionando para você.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="group relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 hover:translate-y-[-2px]" style={{ background: "linear-gradient(145deg, hsl(222 30% 14%), hsl(222 30% 11%))", borderColor: "hsl(0 0% 100% / 0.08)" }}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "hsl(38 92% 50% / 0.03)" }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: "hsl(38 92% 50% / 0.15)" }}>
                  <feature.icon className="w-6 h-6" style={{ color: "hsl(38 92% 55%)" }} />
                </div>
                <h3 className="font-display text-lg font-bold mb-2" style={{ color: "hsl(0 0% 95%)" }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(220 9% 55%)" }}>
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
