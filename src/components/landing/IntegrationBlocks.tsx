import {
  Rocket, Gift, Target, Zap, CreditCard, MessageSquare, BarChart3, Shield
} from "lucide-react";

import { useTranslation } from "react-i18next";

const integrations = [
  { icon: Rocket, title: "Crescimento no Piloto Automático", description: "Imagine acordar toda manhã com novos agendamentos feitos enquanto você dormia. Clientes indicando amigos sem você pedir. Comissões caindo no PIX automaticamente.", accent: "Isso não é futuro. É o que nossos clientes vivem hoje.", accentColor: "hsl(42 100% 55%)" },
  { icon: Gift, title: "Cashback que Multiplica", description: "Cliente faz um corte de R$50 e ganha R$2,50 em cashback. Parece pouco? Em 10 cortes ele tem R$25 acumulados. Isso significa que ele PRECISA voltar para usar.", accent: "Fidelização automática. Sem esforço.", accentColor: "hsl(142 76% 46%)" },
  { icon: Target, title: "Afiliados Internos = Marketing Grátis", description: "Cada cliente pode virar um \"vendedor\" da sua barbearia. Ele indica um amigo, o amigo agenda, e ele ganha comissão. Você não gasta um centavo com ads.", accent: "Boca a boca turbinado com recompensa real.", accentColor: "hsl(217 91% 60%)" },
  { icon: Zap, title: "Split Automático = Zero Dor de Cabeça", description: "Pagamento entrou? O sistema já divide: 60% pro barbeiro e 30% pro dono (% configurável pelo dono), além da comissão. Tudo cai no PIX de cada um. Sem planilha, sem erro.", accent: "Sua contabilidade agradece.", accentColor: "hsl(42 100% 55%)" },
];

const apiBlocks = [
  { icon: CreditCard, title: "Pagamentos", description: "Gateway integrado para PIX, crédito e débito", placeholder: "API de Pagamentos (ASAAS)", status: "ready" },
  { icon: MessageSquare, title: "WhatsApp", description: "Automação de mensagens, lembretes e confirmações", placeholder: "API WhatsApp Business", status: "ready" },
  { icon: BarChart3, title: "Analytics", description: "Pixels e tracking para Meta, Google e TikTok Ads", placeholder: "Pixels & Conversões", status: "ready" },
  { icon: Shield, title: "Fiscal", description: "Emissão de notas fiscais e compliance tributário", placeholder: "Integração Contábil", status: "coming" },
];

const IntegrationBlocks = () => {
  const { t } = useTranslation();
  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 30% 10%) 100%)" }}>
      <div className="container relative z-10 mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
            "{t("marketing_highlight", "Enquanto outros sistemas só agendam, nós transformamos cada cliente em uma máquina de indicações")}"
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {integrations.map((item, index) => (
            <div
              key={item.title}
              className="group relative p-8 rounded-2xl bg-white border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>
                <span className="text-xl lg:text-2xl xl:text-3xl">{item.title}</span>
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "hsl(0 0% 95%)" }}>
                <span className="text-sm lg:text-base xl:text-lg">{item.description}</span>
              </p>
              <p className="text-sm font-medium" style={{ color: "hsl(0 0% 100%)" }}>
                <span className="text-sm lg:text-base xl:text-lg">{item.accent}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(217 91% 50% / 0.1)", color: "hsl(217 85% 60%)" }}>
            Integrações
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            APIs e integrações{" "}
            <span style={{ color: "hsl(217 85% 60%)" }}>prontas</span>
          </h2>
          <p className="text-lg" style={{ color: "hsl(220 9% 60%)" }}>Turbine seu negócio com tecnologia de ponta</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {apiBlocks.map((block, index) => (
            <div
              key={block.title}
              className="group relative p-6 rounded-2xl bg-white border border-border shadow-sm hover:border-primary/30 transition-all duration-300 hover:shadow-md"
            >
              {/* Status Badge */}
              <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-semibold ${block.status === 'ready'
                ? 'bg-success/10 text-success'
                : 'bg-muted/50 text-muted-foreground'
                }`}>
                {block.status === 'ready' ? 'Ativo' : 'Em breve'}
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "hsl(0 0% 100% / 0.2)" }}>
                <block.icon className="w-6 h-6" style={{ color: "hsl(0 0% 100%)" }} />
              </div>
              <h3 className="font-display text-lg font-bold mb-2" style={{ color: "hsl(0 0% 100%)" }}>
                <span className="text-lg lg:text-xl xl:text-2xl">{block.title}</span>
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "hsl(0 0% 95%)" }}>
                <span className="text-sm lg:text-base xl:text-lg">{block.description}</span>
              </p>
              <div className="p-3 rounded-lg text-center" style={{ background: "hsl(25 95% 70% / 0.2)", border: "1px dashed hsl(25 95% 30%)" }}>
                <p className="text-xs" style={{ color: "hsl(0 0% 95%)" }}>
                  <span className="text-xs lg:text-sm xl:text-base">{block.placeholder}</span>
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
