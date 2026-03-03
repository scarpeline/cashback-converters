import {
  Rocket,
  Gift,
  Target,
  Zap,
  CreditCard,
  MessageSquare,
  BarChart3,
  Shield
} from "lucide-react";

const integrations = [
  {
    icon: Rocket,
    title: "Crescimento no Piloto Automático",
    description: "Imagine acordar toda manhã com novos agendamentos feitos enquanto você dormia. Clientes indicando amigos sem você pedir. Comissões caindo no PIX automaticamente.",
    accent: "Isso não é futuro. É o que nossos clientes vivem hoje.",
    accentColor: "text-primary"
  },
  {
    icon: Gift,
    title: "Cashback que Multiplica",
    description: "Cliente faz um corte de R$50 e ganha R$2,50 em cashback. Parece pouco? Em 10 cortes ele tem R$25 acumulados. Isso significa que ele PRECISA voltar para usar.",
    accent: "Fidelização automática. Sem esforço.",
    accentColor: "text-success"
  },
  {
    icon: Target,
    title: "Afiliados Internos = Marketing Grátis",
    description: "Cada cliente pode virar um \"vendedor\" da sua barbearia. Ele indica um amigo, o amigo agenda, e ele ganha comissão. Você não gasta um centavo com ads.",
    accent: "Boca a boca turbinado com recompensa real.",
    accentColor: "text-primary"
  },
  {
    icon: Zap,
    title: "Split Automático = Zero Dor de Cabeça",
    description: "Pagamento entrou? O sistema já divide: 60% pro barbeiro, 30% pro dono, comissão do afiliado. Tudo cai no PIX de cada um. Sem planilha, sem erro.",
    accent: "Seu fechamento financeiro sem estresse.",
    accentColor: "text-accent"
  }
];

const apiBlocks = [
  {
    icon: CreditCard,
    title: "Pagamentos",
    description: "Gateway de pagamentos integrado para PIX, cartão e NFC",
    placeholder: "API de Pagamentos (ASAAS)",
    status: "ready"
  },
  {
    icon: MessageSquare,
    title: "WhatsApp",
    description: "Automação de mensagens, lembretes e confirmações",
    placeholder: "API WhatsApp Business",
    status: "ready"
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Pixels e tracking para Meta, Google e TikTok Ads",
    placeholder: "Pixels & Conversões",
    status: "ready"
  },
  {
    icon: Shield,
    title: "Fiscal",
    description: "Emissão de notas fiscais e compliance tributário",
    placeholder: "Integração Contábil",
    status: "coming"
  }
];

const IntegrationBlocks = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />

      <div className="container relative z-10 mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <p className="text-muted-foreground text-lg mb-4">
            Enquanto outros sistemas só agendam, nós transformamos cada cliente em uma máquina de indicações
          </p>
        </div>

        {/* Feature Cards - 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {integrations.map((item, index) => (
            <div
              key={item.title}
              className="group relative p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-bold mb-3 text-foreground">
                {item.title}
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {item.description}
              </p>

              {/* Accent Text */}
              <p className={`text-sm font-medium ${item.accentColor}`}>
                {item.accent}
              </p>
            </div>
          ))}
        </div>

        {/* API Integration Blocks Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Funcionalidades
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Tudo que você precisa{" "}
            <span className="text-gradient-gold">em um só lugar</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            APIs e integrações prontas para turbinar seu negócio
          </p>
        </div>

        {/* API Blocks - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {apiBlocks.map((block, index) => (
            <div
              key={block.title}
              className="group relative p-6 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-gold"
            >
              {/* Status Badge */}
              <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-medium ${block.status === 'ready'
                  ? 'bg-success/20 text-success'
                  : 'bg-muted text-muted-foreground'
                }`}>
                {block.status === 'ready' ? 'Ativo' : 'Em breve'}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <block.icon className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-display text-lg font-bold mb-2 text-foreground">
                {block.title}
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {block.description}
              </p>

              {/* Placeholder Box */}
              <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-border text-center">
                <p className="text-xs text-muted-foreground">
                  {block.placeholder}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationBlocks;
