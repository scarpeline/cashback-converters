import {
  Calendar, CreditCard, Gift, MessageSquare, PieChart, Shield, Smartphone, Users, Zap, 
  Briefcase, FileText, TrendingUp, Clock, Bell, DollarSign, BarChart3, UserCheck, 
  Wallet, QrCode, Lock, Globe, Headphones, RefreshCw, Target, Award, 
  Percent, Receipt, ClipboardList, Settings, Eye, Send, ShoppingBag, Bot, Mic
} from "lucide-react";

const featureCategories = [
  {
    title: "Agendamento Inteligente",
    description: "Agenda universal que se adapta a qualquer tipo de negócio",
    icon: Calendar,
    features: [
      { icon: Calendar, title: "Agendamento Online 24h", description: "Seus clientes agendam a qualquer hora, direto pelo celular." },
      { icon: Clock, title: "Gestão de Horários por Nicho", description: "Configure horários, intervalos e bloqueios para qualquer segmento." },
      { icon: Bell, title: "Lembretes Automáticos", description: "WhatsApp automático 24h antes. Reduza faltas em até 70%." },
      { icon: UserCheck, title: "Fila de Espera Inteligente", description: "Vaga abriu? O sistema notifica o próximo da fila automaticamente. 20 min para responder." },
      { icon: ClipboardList, title: "Ficha do Cliente Completa", description: "Histórico de atendimentos, preferências e anotações por segmento." },
    ]
  },
  {
    title: "IA & Automação",
    description: "Assistente inteligente que atende por texto e áudio no WhatsApp",
    icon: Bot,
    features: [
      { icon: Bot, title: "Atendimento IA por Texto", description: "A IA responde seus clientes no WhatsApp, agenda e remarca automaticamente." },
      { icon: Mic, title: "Atendimento IA por Áudio", description: "Transcrição automática de áudios e resposta inteligente por voz." },
      { icon: Zap, title: "Automações Configuráveis", description: "Crie regras: pós-atendimento, reativação, aniversário, follow-up." },
      { icon: RefreshCw, title: "Reativação de Clientes", description: "Clientes inativos recebem campanhas automáticas personalizadas." },
    ]
  },
  {
    title: "Pagamentos & Finanças",
    description: "Receba de todas as formas e tenha controle total",
    icon: CreditCard,
    features: [
      { icon: QrCode, title: "PIX Instantâneo", description: "Gere QR Code na hora. O dinheiro cai em segundos." },
      { icon: CreditCard, title: "Cartão Crédito/Débito", description: "Parcele em até 12x ou receba na hora." },
      { icon: RefreshCw, title: "Split de Comissões", description: "Comissão do profissional vai direto para a conta dele." },
      { icon: Receipt, title: "Gestão de Fiados", description: "Controle dívidas. O sistema cobra automaticamente." },
      { icon: BarChart3, title: "Dashboard Financeiro", description: "Entradas, saídas, comissões e lucro líquido em tempo real." },
    ]
  },
  {
    title: "Fidelização & Cashback",
    description: "Transforme clientes ocasionais em recorrentes",
    icon: Gift,
    features: [
      { icon: Gift, title: "Cashback Configurável", description: "Defina % de cashback por serviço. O cliente ganha crédito." },
      { icon: Wallet, title: "Carteira Digital", description: "O cliente acompanha seu saldo direto no app." },
      { icon: Award, title: "Sistema de Pontos", description: "Pontos por atendimento. Troque por serviços ou produtos." },
      { icon: Target, title: "Promoções Direcionadas", description: "Ofertas especiais para clientes inativos ou VIP." },
    ]
  },
  {
    title: "Marketing & Parceiros",
    description: "Seus clientes viram vendedores no piloto automático",
    icon: Users,
    features: [
      { icon: Users, title: "Programa de Afiliados", description: "Cada cliente tem link exclusivo. Indicou, ganhou comissão." },
      { icon: Percent, title: "Comissões Multinível", description: "Estrutura de parceiros com comissões automáticas." },
      { icon: TrendingUp, title: "Rastreamento de Conversões", description: "Saiba exatamente de onde vem cada cliente." },
      { icon: DollarSign, title: "Ganhos em Tempo Real", description: "O parceiro acompanha seus ganhos direto no painel." },
    ]
  },
  {
    title: "Multi-Nicho & Gestão",
    description: "Uma plataforma, dezenas de segmentos suportados",
    icon: PieChart,
    features: [
      { icon: Globe, title: "8+ Setores Suportados", description: "Beleza, Saúde, Educação, Automotivo, Pets, Jurídico e mais." },
      { icon: Briefcase, title: "Múltiplos Perfis", description: "Dono, Profissional, Cliente, Parceiro — cada um com seu painel." },
      { icon: Eye, title: "Dashboard 360°", description: "Todas as métricas que importam em um só lugar." },
      { icon: ShoppingBag, title: "Controle de Estoque", description: "Gerencie produtos e insumos. Saiba quando repor." },
      { icon: FileText, title: "Relatórios Exportáveis", description: "Exporte para Excel. Integração contábil facilitada." },
    ]
  },
  {
    title: "Segurança & Suporte",
    description: "Dados protegidos e suporte sempre disponível",
    icon: Shield,
    features: [
      { icon: Lock, title: "Criptografia Total", description: "Dados financeiros e pessoais com padrão bancário." },
      { icon: Shield, title: "Anti-Fraude", description: "Detecção automática de comportamentos suspeitos." },
      { icon: Globe, title: "100% na Nuvem", description: "Acesse de qualquer lugar, qualquer dispositivo." },
      { icon: Headphones, title: "Suporte Humanizado", description: "Chat, WhatsApp e email. Resposta em minutos." },
      { icon: Zap, title: "Setup em 5 Minutos", description: "Escolha seu nicho, configure e comece a usar." },
    ]
  },
];

const AllFeatures = () => {
  return (
    <section id="todas-funcionalidades" className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 30% 10%) 0%, hsl(222 47% 6%) 100%)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px" style={{ background: "linear-gradient(to right, transparent, hsl(42 100% 50% / 0.3), transparent)" }} />

      <div className="container relative z-10 mx-auto">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(42 100% 50% / 0.1)", color: "hsl(42 100% 55%)" }}>
            Plataforma Completa
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            Tudo que seu negócio precisa,{" "}
            <span className="text-gradient-gold">em uma só plataforma</span>
          </h2>
          <p className="text-lg mb-6" style={{ color: "hsl(220 9% 60%)" }}>
            Enquanto você atende, o sistema trabalha por você.{" "}
            <strong style={{ color: "hsl(42 100% 55%)" }}>Agendamento com IA, pagamentos, marketing e fidelização</strong>{" "}
            — tudo automatizado para qualquer nicho.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm" style={{ color: "hsl(220 9% 55%)" }}>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "hsl(142 76% 45%)" }} />
              +40 funcionalidades
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "hsl(142 76% 45%)" }} />
              IA integrada
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "hsl(142 76% 45%)" }} />
              Multi-nicho
            </span>
          </div>
        </div>

        <div className="space-y-12">
          {featureCategories.map((category) => (
            <div key={category.title} className="rounded-3xl p-6 lg:p-8" style={{ background: "linear-gradient(145deg, hsl(222 30% 14%), hsl(222 30% 11%))", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(38 92% 50% / 0.15)" }}>
                  <category.icon className="w-7 h-7" style={{ color: "hsl(38 92% 55%)" }} />
                </div>
                <div>
                  <h3 className="font-display text-xl lg:text-2xl font-bold mb-1" style={{ color: "hsl(0 0% 98%)" }}>
                    {category.title}
                  </h3>
                  <p className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.features.map((feature) => (
                  <div key={feature.title} className="group p-4 rounded-xl transition-all duration-300 hover:translate-y-[-2px]" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: "hsl(38 92% 50% / 0.1)" }}>
                        <feature.icon className="w-5 h-5" style={{ color: "hsl(38 92% 55%)" }} />
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

        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl" style={{ background: "linear-gradient(145deg, hsl(42 100% 50% / 0.1), hsl(42 100% 50% / 0.05))", border: "1px solid hsl(42 100% 50% / 0.2)" }}>
            <div className="text-left">
              <p className="font-display text-lg font-bold" style={{ color: "hsl(0 0% 95%)" }}>
                Todas essas funcionalidades a partir de
              </p>
              <p className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>
                R$ 16,65/mês no plano anual • 7 dias grátis • Qualquer nicho
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
