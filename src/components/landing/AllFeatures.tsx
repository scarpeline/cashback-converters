import {
  Calendar, CreditCard, Gift, MessageSquare, PieChart, Shield, Smartphone, Users, Zap, 
  Briefcase, FileText, TrendingUp, Clock, Bell, DollarSign, BarChart3, UserCheck, 
  Wallet, QrCode, Wifi, Lock, Globe, Headphones, RefreshCw, Target, Award, 
  Percent, Receipt, ClipboardList, Settings, Eye, Send, ShoppingBag
} from "lucide-react";

const featureCategories = [
  {
    title: "Agendamento & Atendimento",
    description: "Nunca mais perca um cliente por falta de organização",
    icon: Calendar,
    features: [
      { icon: Calendar, title: "Agendamento Online 24h", description: "Seus clientes agendam a qualquer hora, direto pelo celular. Você só recebe e atende." },
      { icon: Clock, title: "Gestão de Horários", description: "Configure horários de funcionamento, intervalos e bloqueios. O sistema faz o resto." },
      { icon: Bell, title: "Lembretes Automáticos", description: "WhatsApp automático 24h antes. Reduza faltas em até 70%." },
      { icon: UserCheck, title: "Confirmação de Presença", description: "O cliente confirma pelo WhatsApp. Você sabe exatamente quem vai aparecer." },
      { icon: ClipboardList, title: "Ficha do Cliente", description: "Histórico completo de atendimentos, preferências e anotações." },
    ]
  },
  {
    title: "Pagamentos & Finanças",
    description: "Receba de todas as formas e tenha controle total do caixa",
    icon: CreditCard,
    features: [
      { icon: QrCode, title: "PIX Instantâneo", description: "Gere QR Code na hora. O dinheiro cai em segundos na sua conta." },
      { icon: CreditCard, title: "Cartão de Crédito", description: "Parcele em até 12x. Aumente o ticket médio sem esforço." },
      { icon: Wifi, title: "NFC / Aproximação", description: "Aceite pagamentos por aproximação. Moderno e rápido." },
      { icon: RefreshCw, title: "Split Automático", description: "A comissão do barbeiro vai direto para a conta dele. Zero trabalho manual." },
      { icon: Receipt, title: "Gestão de Fiados", description: "Controle clientes com dívidas. O sistema cobra automaticamente." },
      { icon: BarChart3, title: "Dashboard Financeiro", description: "Veja em tempo real: entradas, saídas, comissões e lucro líquido." },
    ]
  },
  {
    title: "Fidelização & Cashback",
    description: "Transforme clientes ocasionais em fãs da sua barbearia",
    icon: Gift,
    features: [
      { icon: Gift, title: "Cashback Configurável", description: "Defina % de cashback por serviço. O cliente ganha crédito e volta sempre." },
      { icon: Wallet, title: "Carteira Digital", description: "O cliente acompanha seu saldo direto no app. Transparência total." },
      { icon: Award, title: "Sistema de Pontos", description: "A cada corte, pontos acumulados. Troque por serviços ou produtos." },
      { icon: Target, title: "Promoções Direcionadas", description: "Crie ofertas especiais para clientes inativos. Traga-os de volta." },
    ]
  },
  {
    title: "Marketing & Afiliados",
    description: "Seus clientes viram vendedores. Você escala no piloto automático",
    icon: Users,
    features: [
      { icon: Users, title: "Programa de Afiliados", description: "Cada cliente tem um link exclusivo. Indicou, ganhou comissão." },
      { icon: Percent, title: "Comissões Automáticas", description: "O sistema calcula e paga automaticamente. Você não precisa fazer nada." },
      { icon: TrendingUp, title: "Rastreamento de Conversões", description: "Veja quem indicou quem. Saiba exatamente de onde vem cada cliente." },
      { icon: DollarSign, title: "Ganhos em Tempo Real", description: "O afiliado acompanha seus ganhos no app. Motivação para indicar mais." },
    ]
  },
  {
    title: "Comunicação Automática",
    description: "Fale com todos os clientes sem digitar uma mensagem sequer",
    icon: MessageSquare,
    features: [
      { icon: MessageSquare, title: "WhatsApp Automático", description: "Confirmações, lembretes e promoções. Tudo no piloto automático." },
      { icon: Send, title: "SMS de Backup", description: "Se o WhatsApp falhar, o SMS assume. Nenhum cliente fica sem aviso." },
      { icon: Bell, title: "Notificações Push", description: "Alertas instantâneos no celular do cliente e do profissional." },
      { icon: Target, title: "Campanhas Segmentadas", description: "Envie ofertas específicas para grupos de clientes." },
    ]
  },
  {
    title: "Gestão do Negócio",
    description: "Tudo que você precisa para administrar com inteligência",
    icon: PieChart,
    features: [
      { icon: Briefcase, title: "Múltiplos Perfis", description: "Acessos separados para Dono, Barbeiros, Clientes e Afiliados." },
      { icon: Eye, title: "Visão 360° do Negócio", description: "Dashboard completo com todas as métricas que importam." },
      { icon: ShoppingBag, title: "Controle de Estoque", description: "Gerencie produtos, pomadas, lâminas. Saiba quando repor." },
      { icon: FileText, title: "Relatórios Exportáveis", description: "Exporte dados para Excel. Facilite a vida do seu contador." },
      { icon: Settings, title: "Configurações Flexíveis", description: "Personalize tudo: cores, valores, comissões, horários." },
    ]
  },
  {
    title: "Segurança & Suporte",
    description: "Seus dados protegidos e suporte sempre que precisar",
    icon: Shield,
    features: [
      { icon: Lock, title: "Criptografia Total", description: "Dados financeiros e pessoais protegidos com padrão bancário." },
      { icon: Shield, title: "Anti-Fraude Integrado", description: "Sistema detecta comportamentos suspeitos automaticamente." },
      { icon: Globe, title: "100% na Nuvem", description: "Acesse de qualquer lugar. Nada de computador travado." },
      { icon: Headphones, title: "Suporte Humanizado", description: "Chat, WhatsApp e email. Respondemos em minutos, não em dias." },
      { icon: Zap, title: "Setup em 5 Minutos", description: "Sem implantação demorada. Crie a conta e comece a usar." },
    ]
  },
];

const AllFeatures = () => {
  return (
    <section id="todas-funcionalidades" className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 30% 10%) 0%, hsl(222 47% 6%) 100%)" }}>
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px" style={{ background: "linear-gradient(to right, transparent, hsl(42 100% 50% / 0.3), transparent)" }} />
      <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.05), transparent 70%)" }} />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(217 91% 50% / 0.05), transparent 70%)" }} />

      <div className="container relative z-10 mx-auto">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(42 100% 50% / 0.1)", color: "hsl(42 100% 55%)" }}>
            Sistema Completo
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            Tudo que sua barbearia precisa,{" "}
            <span className="text-gradient-gold">em um só lugar</span>
          </h2>
          <p className="text-lg mb-6" style={{ color: "hsl(220 9% 60%)" }}>
            Enquanto você corta cabelo, o sistema trabalha por você.{" "}
            <strong style={{ color: "hsl(42 100% 55%)" }}>Agendamentos, pagamentos, marketing e fidelização</strong>{" "}
            — tudo automatizado.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm" style={{ color: "hsl(220 9% 55%)" }}>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "hsl(142 76% 45%)" }} />
              +30 funcionalidades
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "hsl(142 76% 45%)" }} />
              Atualizações constantes
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "hsl(142 76% 45%)" }} />
              Sem taxa de implantação
            </span>
          </div>
        </div>

        {/* Feature Categories */}
        <div className="space-y-12">
          {featureCategories.map((category, categoryIndex) => (
            <div key={category.title} className="rounded-3xl p-6 lg:p-8" style={{ background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))", border: "1px solid hsl(222 20% 18%)" }}>
              {/* Category Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(42 100% 50% / 0.1)" }}>
                  <category.icon className="w-7 h-7" style={{ color: "hsl(42 100% 55%)" }} />
                </div>
                <div>
                  <h3 className="font-display text-xl lg:text-2xl font-bold mb-1" style={{ color: "hsl(0 0% 95%)" }}>
                    {category.title}
                  </h3>
                  <p className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.features.map((feature) => (
                  <div key={feature.title} className="group p-4 rounded-xl transition-all duration-300 hover:translate-y-[-2px]" style={{ background: "hsl(222 47% 6% / 0.5)", border: "1px solid hsl(222 20% 20%)" }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: "hsl(42 100% 50% / 0.08)" }}>
                        <feature.icon className="w-5 h-5" style={{ color: "hsl(42 100% 55%)" }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1" style={{ color: "hsl(0 0% 95%)" }}>
                          {feature.title}
                        </h4>
                        <p className="text-xs leading-relaxed" style={{ color: "hsl(220 9% 55%)" }}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl" style={{ background: "linear-gradient(145deg, hsl(42 100% 50% / 0.1), hsl(42 100% 50% / 0.05))", border: "1px solid hsl(42 100% 50% / 0.2)" }}>
            <div className="text-left">
              <p className="font-display text-lg font-bold" style={{ color: "hsl(0 0% 95%)" }}>
                Todas essas funcionalidades por apenas
              </p>
              <p className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>
                A partir de R$ 16,65/mês no plano anual • 7 dias grátis para testar
              </p>
            </div>
            <a href="#pricing" className="px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-gold hover:shadow-gold" style={{ color: "hsl(222 47% 11%)" }}>
              Ver Planos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AllFeatures;
