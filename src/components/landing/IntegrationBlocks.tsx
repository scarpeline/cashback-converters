import {
  Rocket, Gift, Target, Zap, CreditCard, MessageSquare, BarChart3, Shield
} from "lucide-react";

const integrations = [
  { icon: Rocket, title: "Crescimento no Piloto Automático", description: "Imagine acordar toda manhã com novos agendamentos feitos enquanto você dormia. Clientes indicando amigos sem você pedir. Comissões caindo no PIX automaticamente.", accent: "Isso não é futuro. É o que nossos clientes vivem hoje.", accentColor: "hsl(42 100% 55%)" },
  { icon: Gift, title: "Cashback que Multiplica", description: "Cliente faz um corte de R$50 e ganha R$2,50 em cashback. Parece pouco? Em 10 cortes ele tem R$25 acumulados. Isso significa que ele PRECISA voltar para usar.", accent: "Fidelização automática. Sem esforço.", accentColor: "hsl(142 76% 46%)" },
  { icon: Target, title: "Afiliados Internos = Marketing Grátis", description: "Cada cliente pode virar um \"vendedor\" da sua barbearia. Ele indica um amigo, o amigo agenda, e ele ganha comissão. Você não gasta um centavo com ads.", accent: "Boca a boca turbinado com recompensa real.", accentColor: "hsl(217 91% 60%)" },
  { icon: Zap, title: "Split Automático = Zero Dor de Cabeça", description: "Pagamento entrou? O sistema já divide: 60% pro barbeiro e 30% pro dono (% configurável pelo dono), além da comissão. Tudo cai no PIX de cada um. Sem planilha, sem erro.", accent: "Sua contabilidade agradece.", accentColor: "hsl(42 100% 55%)" },
];

const apiBlocks = [
  { icon: CreditCard, title: "Pagamentos", description: "Gateway integrado para PIX, cartão e NFC", placeholder: "API de Pagamentos (ASAAS)", status: "ready" },
  { icon: MessageSquare, title: "WhatsApp", description: "Automação de mensagens, lembretes e confirmações", placeholder: "API WhatsApp Business", status: "ready" },
  { icon: BarChart3, title: "Analytics", description: "Pixels e tracking para Meta, Google e TikTok Ads", placeholder: "Pixels & Conversões", status: "ready" },
  { icon: Shield, title: "Fiscal", description: "Emissão de notas fiscais e compliance tributário", placeholder: "Integração Contábil", status: "coming" },
];

const IntegrationBlocks = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 30% 10%) 100%)" }}>
      <div className="container relative z-10 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-6">
          <p className="text-lg mb-4" style={{ color: "hsl(220 9% 60%)" }}>
            Enquanto outros sistemas só agendam, nós transformamos cada cliente em uma máquina de indicações
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {integrations.map((item) => (
            <div key={item.title} className="group relative p-8 rounded-2xl border transition-all duration-300" style={{ background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))", borderColor: "hsl(222 20% 18%)" }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: "hsl(42 100% 50% / 0.1)" }}>
                <item.icon className="w-7 h-7" style={{ color: "hsl(42 100% 55%)" }} />
              </div>
              <h3 className="font-display text-xl font-bold mb-3" style={{ color: "hsl(0 0% 98%)" }}>{item.title}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "hsl(220 9% 55%)" }}>{item.description}</p>
              <p className="text-sm font-medium" style={{ color: item.accentColor }}>{item.accent}</p>
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
          {apiBlocks.map((block) => (
            <div key={block.title} className="group relative p-6 rounded-2xl border transition-all duration-300" style={{ background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))", borderColor: "hsl(222 20% 18%)" }}>
              <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-medium" style={block.status === 'ready' ? { background: "hsl(142 76% 36% / 0.2)", color: "hsl(142 76% 46%)" } : { background: "hsl(220 9% 20%)", color: "hsl(220 9% 55%)" }}>
                {block.status === 'ready' ? 'Ativo' : 'Em breve'}
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "hsl(217 91% 50% / 0.1)" }}>
                <block.icon className="w-6 h-6" style={{ color: "hsl(217 85% 60%)" }} />
              </div>
              <h3 className="font-display text-lg font-bold mb-2" style={{ color: "hsl(0 0% 95%)" }}>{block.title}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "hsl(220 9% 55%)" }}>{block.description}</p>
              <div className="p-3 rounded-lg text-center" style={{ background: "hsl(222 20% 16%)", border: "1px dashed hsl(222 20% 22%)" }}>
                <p className="text-xs" style={{ color: "hsl(220 9% 50%)" }}>{block.placeholder}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationBlocks;
