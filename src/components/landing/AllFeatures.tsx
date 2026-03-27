import {
  Calendar, CreditCard, Gift, MessageSquare, PieChart, Shield, Smartphone, Users, Zap,
  Briefcase, FileText, TrendingUp, Clock, Bell, DollarSign, BarChart3, UserCheck,
  Wallet, QrCode, Lock, Globe, Headphones, RefreshCw, Target, Award,
  Percent, Receipt, ClipboardList, Settings, Eye, Send, ShoppingBag
} from "lucide-react";
import { motion } from "framer-motion";

const featureCategories = [
  {
    title: "Agendamento & Atendimento",
    description: "Nunca mais perca um cliente por falta de organização",
    icon: Calendar,
    features: [
      { icon: Calendar, title: "Agendamento Online 24h", description: "Clientes agendam a qualquer hora, direto pelo celular." },
      { icon: Clock, title: "Gestão de Horários", description: "Configure horários, intervalos e bloqueios automaticamente." },
      { icon: Bell, title: "Lembretes Automáticos", description: "WhatsApp automático 24h antes. Reduza faltas em até 70%." },
      { icon: UserCheck, title: "Confirmação de Presença", description: "O cliente confirma pelo WhatsApp com um clique." },
      { icon: ClipboardList, title: "Ficha do Cliente", description: "Histórico completo de atendimentos e preferências." },
    ]
  },
  {
    title: "Pagamentos & Finanças",
    description: "Receba de todas as formas e tenha controle total",
    icon: CreditCard,
    features: [
      { icon: QrCode, title: "PIX Instantâneo", description: "QR Code na hora. Dinheiro cai em segundos." },
      { icon: CreditCard, title: "Cartão de Crédito", description: "Parcele em até 12x. Aumente o ticket médio." },
      { icon: CreditCard, title: "Cartão de Débito", description: "Receba na hora. Seguro e prático." },
      { icon: RefreshCw, title: "Split Automático", description: "Comissão vai direto para a conta do profissional." },
      { icon: Receipt, title: "Gestão de Fiados", description: "Controle dívidas. O sistema cobra automaticamente." },
      { icon: BarChart3, title: "Dashboard Financeiro", description: "Entradas, saídas, comissões e lucro líquido em tempo real." },
    ]
  },
  {
    title: "Fidelização & Cashback",
    description: "Transforme clientes ocasionais em fãs do seu negócio",
    icon: Gift,
    features: [
      { icon: Gift, title: "Cashback Configurável", description: "Defina % de cashback por serviço." },
      { icon: Wallet, title: "Carteira Digital", description: "Cliente acompanha seu saldo no app." },
      { icon: Award, title: "Sistema de Pontos", description: "Pontos acumulados a cada serviço." },
      { icon: Target, title: "Promoções Direcionadas", description: "Ofertas especiais para clientes inativos." },
    ]
  },
  {
    title: "Marketing & Afiliados",
    description: "Seus clientes viram vendedores no piloto automático",
    icon: Users,
    features: [
      { icon: Users, title: "Programa de Afiliados", description: "Link exclusivo por cliente. Indicou, ganhou." },
      { icon: Percent, title: "Comissões Automáticas", description: "Sistema calcula e paga automaticamente." },
      { icon: TrendingUp, title: "Rastreamento de Conversões", description: "Veja quem indicou quem." },
      { icon: DollarSign, title: "Ganhos em Tempo Real", description: "Afiliado acompanha ganhos no app." },
    ]
  },
  {
    title: "Comunicação Automática",
    description: "Fale com todos sem digitar uma mensagem sequer",
    icon: MessageSquare,
    features: [
      { icon: MessageSquare, title: "WhatsApp Automático", description: "Confirmações, lembretes e promoções automáticas." },
      { icon: Send, title: "SMS de Backup", description: "Se o WhatsApp falhar, o SMS assume." },
      { icon: Bell, title: "Notificações Push", description: "Alertas instantâneos no celular." },
      { icon: Target, title: "Campanhas Segmentadas", description: "Ofertas específicas para grupos de clientes." },
    ]
  },
  {
    title: "Gestão do Negócio",
    description: "Administre com inteligência e dados",
    icon: PieChart,
    features: [
      { icon: Briefcase, title: "Múltiplos Perfis", description: "Acessos separados para Dono, Profissionais e Clientes." },
      { icon: Eye, title: "Visão 360°", description: "Dashboard com todas as métricas que importam." },
      { icon: ShoppingBag, title: "Controle de Estoque", description: "Gerencie produtos e saiba quando repor." },
      { icon: FileText, title: "Relatórios Exportáveis", description: "Exporte dados para Excel facilmente." },
      { icon: Settings, title: "Configurações Flexíveis", description: "Personalize cores, valores, comissões e horários." },
    ]
  },
  {
    title: "Segurança & Suporte",
    description: "Dados protegidos e suporte sempre que precisar",
    icon: Shield,
    features: [
      { icon: Lock, title: "Criptografia Total", description: "Dados protegidos com padrão bancário." },
      { icon: Shield, title: "Anti-Fraude", description: "Detecção automática de comportamentos suspeitos." },
      { icon: Globe, title: "100% na Nuvem", description: "Acesse de qualquer lugar." },
      { icon: Headphones, title: "Suporte Humanizado", description: "Chat, WhatsApp e email em minutos." },
      { icon: Zap, title: "Setup em 5 Minutos", description: "Crie a conta e comece a usar." },
    ]
  },
];

const AllFeatures = () => {
  return (
    <section id="todas-funcionalidades" className="py-24 px-4 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 bg-accent/10 text-accent border border-accent/20">
            Sistema Completo
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Tudo que seu negócio precisa,{" "}
            <span className="text-gradient-orange">em um só lugar</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Enquanto você atende, o sistema trabalha por você.{" "}
            <strong className="text-accent">Agendamentos, pagamentos, marketing e fidelização</strong> — tudo automatizado.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {["+30 funcionalidades", "Atualizações constantes", "Sem taxa de implantação"].map(t => (
              <span key={t} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="space-y-8">
          {featureCategories.map((category, ci) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.05 }}
              className="rounded-2xl p-6 lg:p-8 bg-card border border-border/60"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <category.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-xl lg:text-2xl font-bold text-card-foreground">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.features.map((feature) => (
                  <div
                    key={feature.title}
                    className="group p-4 rounded-xl bg-muted/30 border border-border/40 hover:border-accent/20 hover:bg-muted/50 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <feature.icon className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-card-foreground mb-1">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-accent/5 border border-accent/20">
            <div className="text-left">
              <p className="font-display text-lg font-bold text-foreground">
                Todas essas funcionalidades por apenas
              </p>
              <p className="text-sm text-muted-foreground">
                A partir de R$ 16,65/mês no plano anual • 7 dias grátis
              </p>
            </div>
            <a href="#pricing" className="px-6 py-3 rounded-xl font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-md">
              Ver Planos
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AllFeatures;
