import {
  Rocket, Gift, Target, Zap, CreditCard, MessageSquare, BarChart3, Shield
} from "lucide-react";
import { useTranslation } from "react-i18next";

const integrations = [
  { icon: Rocket, title: "Crescimento no Piloto Automático", description: "Imagine acordar toda manhã com novos agendamentos feitos enquanto você dormia. Clientes indicando amigos sem você pedir. Comissões caindo no PIX automaticamente.", accent: "Isso não é futuro. É o que nossos clientes vivem hoje.", accentColor: "hsl(262 83% 75%)" },
  { icon: Gift, title: "Cashback que Multiplica", description: "Cliente faz um corte de R$50 e ganha R$2,50 em cashback. Parece pouco? Em 10 cortes ele tem R$25 acumulados. Isso significa que ele PRECISA voltar para usar.", accent: "Fidelização automática. Sem esforço.", accentColor: "hsl(160 84% 55%)" },
  { icon: Target, title: "Afiliados Internos = Marketing Grátis", description: "Cada cliente pode virar um \"vendedor\" da sua barbearia. Ele indica um amigo, o amigo agenda, e ele ganha comissão. Você não gasta um centavo com ads.", accent: "Boca a boca turbinado com recompensa real.", accentColor: "hsl(192 91% 55%)" },
  { icon: Zap, title: "Split Automático = Zero Dor de Cabeça", description: "Pagamento entrou? O sistema já divide: 60% pro barbeiro e 30% pro dono (% configurável pelo dono), além da comissão. Tudo cai no PIX de cada um. Sem planilha, sem erro.", accent: "Sua contabilidade agradece.", accentColor: "hsl(262 83% 75%)" },
];

const apiBlocks = [
  { icon: CreditCard, title: "Pagamentos", description: "Gateway integrado para PIX, crédito e débito", placeholder: "API de Pagamentos (ASAAS)", status: "ready", color: "hsl(160 84% 55%)" },
  { icon: MessageSquare, title: "WhatsApp", description: "Automação de mensagens, lembretes e confirmações", placeholder: "API WhatsApp Business", status: "ready", color: "hsl(262 83% 68%)" },
  { icon: BarChart3, title: "Analytics", description: "Pixels e tracking para Meta, Google e TikTok Ads", placeholder: "Pixels & Conversões", status: "ready", color: "hsl(192 91% 55%)" },
  { icon: Shield, title: "Fiscal", description: "Emissão de notas fiscais e compliance tributário", placeholder: "Integração Contábil", status: "coming", color: "hsl(220 15% 55%)" },
];

const IntegrationBlocks = () => {
  const { t } = useTranslation();
  return (
    <section className="py-28 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(230 35% 6%) 0%, hsl(230 35% 9%) 100%)" }}>
      <div className="container relative z-10 mx-auto">
        <div className="text-center max-w-4xl mx-auto mb-14">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-black leading-tight" style={{ color: "hsl(0 0% 90%)" }}>
            "{t("marketing_highlight", "Enquanto outros sistemas só agendam, nós transformamos cada cliente em uma máquina de indicações")}"
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-24">
          {integrations.map((item, index) => (
            <div key={item.title} className="group relative p-8 rounded-2xl border transition-all duration-300 hover:translate-y-[-3px]" style={{ background: "linear-gradient(145deg, hsl(230 30% 13%), hsl(230 30% 9%))", borderColor: "hsl(0 0% 100% / 0.07)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ background: "hsl(262 83% 58% / 0.12)" }}>
                <item.icon className="w-7 h-7" style={{ color: "hsl(262 83% 68%)" }} />
              </div>
              <h3 className="font-display text-xl lg:text-2xl font-bold mb-3" style={{ color: "hsl(0 0% 95%)" }}>
                {item.title}
              </h3>
              <p className="text-base leading-relaxed mb-4" style={{ color: "hsl(220 15% 60%)" }}>
                {item.description}
              </p>
              <p className="text-base font-semibold" style={{ color: item.accentColor }}>
                {item.accent}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-5 py-1.5 rounded-full text-sm font-semibold mb-5" style={{ background: "hsl(192 91% 42% / 0.1)", color: "hsl(192 91% 60%)" }}>
            Integrações
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-black mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            APIs e integrações{" "}
            <span className="text-gradient-gold">prontas</span>
          </h2>
          <p className="text-lg" style={{ color: "hsl(220 15% 60%)" }}>Turbine seu negócio com tecnologia de ponta</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {apiBlocks.map((block) => (
            <div key={block.title} className="group relative p-6 rounded-2xl border transition-all duration-300 hover:translate-y-[-3px]" style={{ background: "linear-gradient(145deg, hsl(230 30% 13%), hsl(230 30% 9%))", borderColor: "hsl(0 0% 100% / 0.07)" }}>
              <div className={`absolute top-4 right-4 px-3 py-0.5 rounded-full text-xs font-bold ${block.status === 'ready' ? '' : ''}`} style={{ background: block.status === 'ready' ? 'hsl(160 84% 39% / 0.12)' : 'hsl(220 15% 30% / 0.3)', color: block.status === 'ready' ? 'hsl(160 84% 55%)' : 'hsl(220 15% 55%)' }}>
                {block.status === 'ready' ? 'Ativo' : 'Em breve'}
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "hsl(262 83% 58% / 0.1)" }}>
                <block.icon className="w-6 h-6" style={{ color: block.color }} />
              </div>
              <h3 className="font-display text-lg lg:text-xl font-bold mb-2" style={{ color: "hsl(0 0% 95%)" }}>
                {block.title}
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "hsl(220 15% 58%)" }}>
                {block.description}
              </p>
              <div className="p-3 rounded-xl text-center" style={{ background: "hsl(262 83% 58% / 0.06)", border: "1px dashed hsl(262 83% 58% / 0.2)" }}>
                <p className="text-xs font-medium" style={{ color: "hsl(220 15% 60%)" }}>
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
