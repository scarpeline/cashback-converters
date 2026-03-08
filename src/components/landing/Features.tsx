import {
  Calendar, CreditCard, Gift, MessageSquare, PieChart, Shield, Smartphone, Users, Zap, Briefcase, FileText
} from "lucide-react";

const features = [
  { icon: Calendar, title: "Agendamento Inteligente", description: "Seus clientes agendam online, 24h. Você só foca em realizar o atendimento." },
  { icon: CreditCard, title: "PIX, Cartão e NFC", description: "Receba de qualquer forma. Split automático de pagamentos entre os profissionais." },
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
    <section id="features" className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 30% 10%) 0%, hsl(222 47% 6%) 100%)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px" style={{ background: "linear-gradient(to right, transparent, hsl(42 100% 50% / 0.3), transparent)" }} />

      <div className="container relative z-10 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(42 100% 50% / 0.1)", color: "hsl(42 100% 55%)" }}>
            Funcionalidades
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            Tudo que você precisa{" "}
            <span className="text-gradient-gold">em um só lugar</span>
          </h2>
          <p className="text-lg" style={{ color: "hsl(220 9% 60%)" }}>
            Automatize vendas, agendamentos e pagamentos. Foque no que importa: seu cliente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={feature.title} className="group relative p-6 rounded-2xl border transition-all duration-300" style={{ background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))", borderColor: "hsl(222 20% 18%)" }}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "hsl(42 100% 50% / 0.03)" }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: "hsl(42 100% 50% / 0.1)" }}>
                  <feature.icon className="w-6 h-6" style={{ color: "hsl(42 100% 55%)" }} />
                </div>
                <h3 className="font-display text-xl font-bold mb-2 transition-colors" style={{ color: "hsl(0 0% 95%)" }}>
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
