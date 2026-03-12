import {
  Calendar, CreditCard, Gift, MessageSquare, PieChart, Shield, Smartphone, Users, Zap, Briefcase, FileText
} from "lucide-react";

const features = [
  { icon: Calendar, title: "Agendamento Inteligente", description: "Seus clientes agendam online, 24h. Você só foca em realizar o atendimento." },
  { icon: CreditCard, title: "PIX, Crédito e Débito", description: "Receba de qualquer forma. Split automático de pagamentos entre os profissionais." },
  { icon: Gift, title: "Cashback Automático", description: "O cliente consome, ganha crédito e sempre retorna de forma orgânica." },
  { icon: Users, title: "Afiliados que Vendem", description: "Seus clientes indicam amigos e ganham. Você escala seu negócio no piloto automático." },
  { icon: MessageSquare, title: "WhatsApp Automático", description: "Lembretes, confirmações e promoções. Tudo sincronizado sem esforço manual." },
  { icon: PieChart, title: "Gestão Financeira", description: "Dashboard completo para donos. Saiba exatamente quanto entra, sai e sobra no caixa." },
  { icon: Briefcase, title: "Múltiplos Perfis", description: "Acessos separados para Donos do Salão, Profissionais (barbeiros), Clientes e Afiliados." },
  { icon: FileText, title: "Acesso para Contadores", description: "Integração simplificada para seu contador extrair relatórios e faturamentos com um clique." },
  { icon: Zap, title: "Setup Rápido", description: "Sem implantações demoradas. Crie sua conta e comece a escalar imediatamente." },
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-2 sm:px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, var(--secondary-blue) 0%, var(--background-dark) 100%)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px" style={{ background: "linear-gradient(to right, transparent, var(--accent-orange), transparent)" }} />

      <div className="container relative z-10 mx-auto px-2 sm:px-0">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-block px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 border border-orange-500/30" style={{ background: "rgba(255, 122, 0, 0.1)", color: "var(--accent-orange)" }}>
            <span className="text-xs sm:text-sm">Funcionalidades</span>
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4" style={{ color: "var(--text-light)" }}>
            <span className="text-2xl sm:text-3xl lg:text-5xl">Tudo que você precisa</span>
            <br className="sm:hidden" />
            <span className="text-2xl sm:text-3xl lg:text-5xl">{" "}</span>
            <span className="text-gradient text-2xl sm:text-3xl lg:text-5xl">em um só lugar</span>
          </h2>
          <p className="text-base sm:text-lg" style={{ color: "var(--text-muted)" }}>
            <span className="text-sm sm:text-base">Automatize vendas, agendamentos e pagamentos. Foque no que importa: seu cliente.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group card-dark p-6 lg:p-8 text-center animate-fade-in" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 lg:mb-6 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{ background: "rgba(255, 122, 0, 0.15)" }}>
                <feature.icon className="w-6 h-6 lg:w-8 lg:h-8 transition-all duration-300" style={{ color: "var(--accent-orange)" }} />
              </div>
              <h3 className="font-bold text-lg lg:text-xl mb-3 transition-colors duration-300 group-hover:text-gradient" style={{ color: "var(--text-light)" }}>
                {feature.title}
              </h3>
              <p className="text-sm lg:text-base leading-relaxed transition-colors duration-300" style={{ color: "var(--text-muted)" }}>
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
