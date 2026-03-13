import {
  Calendar,
  CreditCard,
  Gift,
  MessageSquare,
  PieChart,
  Shield,
  Smartphone,
  Users,
  Zap,
  Briefcase,
  FileText
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agendamento Inteligente",
    description: "Seus clientes agendam online, 24h. Você só foca em realizar o atendimento."
  },
  {
    icon: CreditCard,
    title: "PIX, Cartão e NFC",
    description: "Receba de qualquer forma com taxas integradas (Gateway + App) a partir de 1,49%. Split automático."
  },
  {
    icon: Gift,
    title: "Cashback Automático",
    description: "O cliente consome, ganha crédito e sempre retorna de forma orgânica."
  },
  {
    icon: Users,
    title: "Afiliados que Vendem",
    description: "Seus clientes indicam amigos e ganham. Você escala seu negócio no piloto automático."
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Automático",
    description: "Lembretes, confirmações e promoções. Tudo sincronizado sem esforço manual."
  },
  {
    icon: PieChart,
    title: "Gestão Financeira",
    description: "Dashboard completo para donos. Saiba exatamente quanto entra, sai e sobra no caixa."
  },
  {
    icon: Briefcase,
    title: "Múltiplos Perfis",
    description: "Acessos separados para Donos do Salão, Profissionais (barbeiros), Clientes e Afiliados."
  },
  {
    icon: FileText,
    title: "Acesso para Contadores",
    description: "Integração simplificada para seu contador extrair relatórios e faturamentos com um clique."
  },
  {
    icon: Zap,
    title: "Setup Rápido",
    description: "Sem implantações demoradas. Crie sua conta e comece a escalar imediatamente."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container relative z-10 mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Funcionalidades
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Tudo que você precisa{" "}
            <span className="text-gradient-gold">em um só lugar</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Automatize vendas, agendamentos e pagamentos. Foque no que importa: seu cliente.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-gold"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>

                <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed">
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
