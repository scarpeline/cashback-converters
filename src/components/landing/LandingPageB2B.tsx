// @ts-nocheck
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  CreditCard,
  Settings,
  Globe,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  UsersRound,
  Briefcase,
  Target,
  Award,
  TrendingDown,
  Repeat,
  Smartphone,
  Headphones,
  Lock,
  Send,
  Bell,
  Calendar,
  PieChart,
  Receipt,
  Wallet,
  Percent,
  Star,
} from "lucide-react";
import logo from "@/assets/logo.png";

const STATS = [
  { value: "2.500+", label: "Empresas ativas", icon: Briefcase },
  { value: "R$ 12M+", label: "Processados monthly", icon: DollarSign },
  { value: "98%", label: "Uptime garantido", icon: Shield },
  { value: "7 dias", label: "Teste grátis", icon: Zap },
];

const PROBLEMS = [
  {
    icon: Clock,
    title: "Agenda sempre vazia?",
    description: "Você depende de agendamentos manuais ou ligações. Clientes não conseguem marcar horário fora do expediente. Vagas ficam vazias.",
  },
  {
    icon: TrendingDown,
    title: "Clientes não voltam?",
    description: "60% dos clientes vão uma vez e somem. Você não tem ferramenta para reativação automática.",
  },
  {
    icon: Receipt,
    title: "Desorganização no caixa?",
    description: "Fiado, dinheiro, PIX, cartão — cada um em um lugar. Comissões calculadas na mão. Relatório? Falta tempo para fazer.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp virabagunça?",
    description: "Você responde 50 mensagens por dia. Confirmação, lembrete, cobrança — tudo manual. Sua produtividade cai.",
  },
  {
    icon: Percent,
    title: "Comissões erradas?",
    description: "Calcular quanto cada profissional ganhou no mês leva horas. Erros geram conflito. Tempo que podia ser usado crescendo.",
  },
  {
    icon: UsersRound,
    title: "Time difícil de gerenciar?",
    description: "Horários, férias, comissão, produtividade — você gerenciando planilha. Seus profissionais querem autonomia.",
  },
];

const SOLUTIONS = [
  {
    icon: Calendar,
    title: "Agenda Inteligente 24h",
    description: "Seus clientes agendam pelo WhatsApp, site ou app. A IA confirma automaticamente. Você só precisa aparecer.",
    highlight: "Redução de 70% em faltas",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Business API",
    description: "Múltiplos números da sua equipe. Envio em massa com balanceamento. Relatórios de entrega. Sem banimento.",
    highlight: "Até 10 números por empresa",
  },
  {
    icon: Bell,
    title: "Automação de Lembretes",
    description: "Lembrete 24h, 12h e 2h antes. Cliente confirma pelo WhatsApp. Você sabe exatamente quem vaicomparecer.",
    highlight: "Menos 70% de faltas",
  },
  {
    icon: Target,
    title: "Reativação de Clientes",
    description: "IA identifica clientes que não voltam há 30, 60 ou 90 dias. Envia oferta personalizada automaticamente.",
    highlight: "Recupere 35% dos inativos",
  },
  {
    icon: CreditCard,
    title: "Pagamentos Instantâneos",
    description: "PIX, cartão crédito e débito. Split automático de comissões. Fiado com controle automático. Tudo em um lugar.",
    highlight: "Dinheiro em até 1 dia útil",
  },
  {
    icon: UsersRound,
    title: "Gestão de Equipe",
    description: "Cada profissional com acesso próprio. Veja produtividade, comissões e agenda individual. Autonomia com controle.",
    highlight: "Comissões automáticas",
  },
];

const FEATURES_B2B = [
  {
    category: "Operações",
    icon: PieChart,
    color: "blue",
    items: [
      { icon: Calendar, text: "Agendamento online 24/7" },
      { icon: Clock, text: "Gestão de horários e profissionais" },
      { icon: CheckCircle, text: "Confirmação automática de presença" },
      { icon: Repeat, text: "Agendamentos recorrentes" },
    ],
  },
  {
    category: "Financeiro",
    icon: DollarSign,
    color: "green",
    items: [
      { icon: CreditCard, text: "PIX, Crédito, Débito — tudo integrado" },
      { icon: Percent, text: "Split automático de comissões" },
      { icon: Receipt, text: "Controle de fiados" },
      { icon: BarChart3, text: "Dashboard financeiro em tempo real" },
    ],
  },
  {
    category: "Marketing & Fidelização",
    icon: Star,
    color: "gold",
    items: [
      { icon: MessageSquare, text: "WhatsApp multi-conta" },
      { icon: Send, text: "Campanhas segmentadas" },
      { icon: Award, text: "Programa de cashback configurável" },
      { icon: Target, text: "Reativação de clientes inativos" },
    ],
  },
  {
    category: "Growth & Vendas",
    icon: TrendingUp,
    color: "purple",
    items: [
      { icon: Users, text: "Programa de afiliados" },
      { icon: Briefcase, text: "Sistema de franquias" },
      { icon: Package, text: "Loja interna: produtos e cursos" },
      { icon: ShoppingCart, text: "Pacotes de sessões" },
    ],
  },
  {
    category: "Inteligência",
    icon: Zap,
    color: "orange",
    items: [
      { icon: Sparkles, text: "IA para agendamento via WhatsApp" },
      { icon: TrendingUp, text: "Análise preditiva de cancelamento" },
      { icon: Target, text: "Sugestão de horários otimizados" },
      { icon: Shield, text: "Anti-fraude integrado" },
    ],
  },
  {
    category: "Integrações",
    icon: Settings,
    color: "gray",
    items: [
      { icon: Briefcase, text: "Contabilidade integrada" },
      { icon: Receipt, text: "Emissão de notas fiscais" },
      { icon: Globe, text: "100% na nuvem — acesso em qualquer lugar" },
      { icon: Lock, text: "Segurança e criptografia bancária" },
    ],
  },
];

const PLANS = [
  {
    name: "Starter",
    description: "Para profissionais e pequenos negócios",
    monthlyPrice: "29,90",
    annualPrice: "199,90",
    annualLabel: "R$ 16,65/mês",
    features: [
      "1 profissional",
      "100 agendamentos/mês",
      "WhatsApp básico",
      "PIX e cartão",
      "Relatórios simples",
      "Suporte por email",
    ],
    notIncluded: [
      "Multiplos profissionais",
      "Campanhas de marketing",
      "Programa de afiliados",
      "IA de agendamento",
      "API de integração",
    ],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    name: "Business",
    description: "Para empresas em crescimento",
    monthlyPrice: "79,90",
    annualPrice: "599,90",
    annualLabel: "R$ 49,99/mês",
    features: [
      "5 profissionais",
      "Agendamentos ilimitados",
      "WhatsApp multi-conta",
      "PIX, Crédito, Débito + fiado",
      "Split automático de comissões",
      "Campanhas de marketing",
      "Cashback configurável",
      "Programa de afiliados",
      "Relatórios avançados",
      "Suporte prioritário",
      "API de integração",
    ],
    notIncluded: [
      "Sistema de franquias",
      "IA de agendamento completa",
    ],
    cta: "Começar Grátis",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Para redes e franquias",
    monthlyPrice: "199,90",
    annualPrice: "1.599,90",
    annualLabel: "R$ 133,32/mês",
    features: [
      "Profissionais ilimitados",
      "Agendamentos ilimitados",
      "WhatsApp multi-conta (10+ números)",
      "Sistema completo de franquias",
      "Gestão multinacional",
      "IA de agendamento completa",
      "Relatórios consolidados",
      "White label disponível",
      "Suporte dedicado",
      "Treinamento da equipe",
      " SLA garantido",
    ],
    notIncluded: [],
    cta: "Falar com Vendas",
    popular: false,
  },
];

const SOCIAL_PROOF = [
  { metric: "4.9/5", label: "satisfação", source: "Capterra" },
  { metric: "2.500+", label: "empresas", source: "Ativas no sistema" },
  { metric: "R$ 12M+", label: "transacionados", source: "Último mês" },
  { metric: "98%", label: "disponibilidade", source: "SLA garantido" },
];

const Footer = () => (
  <footer className="py-16 px-4 border-t" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(222 20% 15%)" }}>
    <div className="container mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h4 className="font-semibold mb-4" style={{ color: "hsl(0 0% 95%)" }}>Produto</h4>
          <ul className="space-y-2 text-sm" style={{ color: "hsl(220 9% 55%)" }}>
            <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
            <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
            <li><a href="#" className="hover:text-white transition-colors">API & Integrações</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4" style={{ color: "hsl(0 0% 95%)" }}>Empresa</h4>
          <ul className="space-y-2 text-sm" style={{ color: "hsl(220 9% 55%)" }}>
            <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Parceiros</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4" style={{ color: "hsl(0 0% 95%)" }}>Suporte</h4>
          <ul className="space-y-2 text-sm" style={{ color: "hsl(220 9% 55%)" }}>
            <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Status do Sistema</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4" style={{ color: "hsl(0 0% 95%)" }}>Legal</h4>
          <ul className="space-y-2 text-sm" style={{ color: "hsl(220 9% 55%)" }}>
            <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
            <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t" style={{ borderColor: "hsl(222 20% 15%)" }}>
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <img src={logo} alt="Logo" className="h-8" />
          <span className="font-display font-bold" style={{ color: "hsl(0 0% 95%)" }}>SalaoCashBack</span>
        </div>
        <p className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>
          © 2026 SalaoCashBack. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <a href="#" className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>LinkedIn</a>
          <a href="#" className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>Instagram</a>
          <a href="#" className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>YouTube</a>
        </div>
      </div>
    </div>
  </footer>
);

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "hsl(222 47% 8% / 0.95)", borderColor: "hsl(222 20% 15%)", backdropFilter: "blur(12px)" }}>
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="h-8" />
        <span className="font-display font-bold" style={{ color: "hsl(0 0% 95%)" }}>SalaoCashBack</span>
      </Link>
      <nav className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-sm font-medium hover:text-white transition-colors" style={{ color: "hsl(220 9% 65%)" }}>Funcionalidades</a>
        <a href="#pricing" className="text-sm font-medium hover:text-white transition-colors" style={{ color: "hsl(220 9% 65%)" }}>Preços</a>
        <a href="#" className="text-sm font-medium hover:text-white transition-colors" style={{ color: "hsl(220 9% 65%)" }}>API</a>
        <a href="#" className="text-sm font-medium hover:text-white transition-colors" style={{ color: "hsl(220 9% 65%)" }}>Sobre</a>
      </nav>
      <div className="flex items-center gap-3">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Entrar</Button>
        </Link>
        <Link to="/login">
          <Button variant="gold" size="sm">Testar Grátis</Button>
        </Link>
      </div>
    </div>
  </header>
);

const LandingPageB2B = () => {
  return (
    <div className="min-h-screen" style={{ background: "hsl(222 47% 6%)" }}>
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-16" style={{ background: "linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 47% 5%) 100%)" }}>
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(38 92% 50% / 0.08), transparent 70%)" }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(217 91% 60% / 0.05), transparent 70%)" }} />

        <div className="container relative z-10 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8" style={{ background: "hsl(38 92% 50% / 0.1)", borderColor: "hsl(38 92% 50% / 0.3)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "hsl(38 92% 55%)" }} />
              <span className="text-sm font-medium" style={{ color: "hsl(38 92% 55%)" }}>Plataforma SaaS B2B para empresas de serviços</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 leading-tight" style={{ color: "hsl(0 0% 98%)" }}>
              Digitalize sua empresa.
              <br />
              <span style={{ color: "hsl(38 92% 50%)" }}>Escale no piloto automático.</span>
            </h1>

            <p className="text-xl lg:text-2xl mb-4 max-w-2xl mx-auto" style={{ color: "hsl(220 9% 70%)" }}>
              Agendamento inteligente, pagamentos integrados, marketing automatizado e gestão completa da sua base de clientes.
            </p>
            <p className="text-lg mb-8" style={{ color: "hsl(220 9% 55%)" }}>
              da barbearia ao consultório, do salão à clínica — <strong style={{ color: "hsl(0 0% 95%)" }}>uma plataforma para todos os serviços</strong>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/login">
                <Button variant="gold" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 font-bold">
                  Testar 7 Dias Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Ver Funcionalidades
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <stat.icon className="w-5 h-5" style={{ color: "hsl(38 92% 55%)" }} />
                    <span className="font-display text-2xl lg:text-3xl font-bold" style={{ color: "hsl(0 0% 95%)" }}>{stat.value}</span>
                  </div>
                  <p className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-24 px-4" style={{ background: "hsl(222 47% 4%)" }}>
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(0 60% 50% / 0.1)", color: "hsl(0 70% 55%)" }}>
              Os problemas que você conhece
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 95%)" }}>
              Seu negócio merece mais do que <span style={{ color: "hsl(38 92% 50%)" }}>planilha e WhatsApp</span>
            </h2>
            <p className="text-lg" style={{ color: "hsl(220 9% 60%)" }}>
              Se você gerencia uma empresa de serviços, conhece essa rotina. E ela tem um custo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PROBLEMS.map((problem) => (
              <Card key={problem.title} className="border" style={{ background: "hsl(222 30% 8%)", borderColor: "hsl(222 20% 15%)" }}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "hsl(0 60% 50% / 0.1)" }}>
                    <problem.icon className="w-6 h-6" style={{ color: "hsl(0 70% 55%)" }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: "hsl(0 0% 95%)" }}>{problem.title}</h3>
                  <p className="text-sm" style={{ color: "hsl(220 9% 60%)" }}>{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="features" className="py-24 px-4" style={{ background: "hsl(222 47% 6%)" }}>
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(142 76% 40% / 0.1)", color: "hsl(142 76% 50%)" }}>
              A solução completa
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 95%)" }}>
              Tudo que sua empresa precisa, <span style={{ color: "hsl(38 92% 50%)" }}>em uma única plataforma</span>
            </h2>
            <p className="text-lg" style={{ color: "hsl(220 9% 60%)" }}>
              Sem integrations complexas. Sem planilha. Sem perder tempo com trabalho manual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {SOLUTIONS.map((solution) => (
              <Card key={solution.title} className="border relative overflow-hidden" style={{ background: "hsl(222 30% 10%)", borderColor: "hsl(222 20% 18%)" }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, hsl(38 92% 50% / 0.1), transparent 70%)" }} />
                <CardContent className="p-6 relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "hsl(38 92% 50% / 0.1)" }}>
                    <solution.icon className="w-6 h-6" style={{ color: "hsl(38 92% 55%)" }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: "hsl(0 0% 95%)" }}>{solution.title}</h3>
                  <p className="text-sm mb-4" style={{ color: "hsl(220 9% 60%)" }}>{solution.description}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "hsl(142 76% 40% / 0.1)", color: "hsl(142 76% 55%)" }}>
                    <CheckCircle className="w-3 h-3" />
                    {solution.highlight}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 border-t" style={{ borderColor: "hsl(222 20% 12%)", background: "hsl(222 47% 4%)" }}>
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(217 91% 60% / 0.1)", color: "hsl(217 91% 70%)" }}>
              Funcionalidades completas
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 95%)" }}>
              Mais do que agendamento. <span style={{ color: "hsl(38 92% 50%)" }}>Gestão inteligente.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {FEATURES_B2B.map((category) => (
              <Card key={category.category} className="border" style={{ background: "hsl(222 30% 8%)", borderColor: "hsl(222 20% 15%)" }}>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "hsl(38 92% 50% / 0.1)" }}>
                      <category.icon className="w-5 h-5" style={{ color: "hsl(38 92% 55%)" }} />
                    </div>
                    <CardTitle className="text-lg" style={{ color: "hsl(0 0% 95%)" }}>{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.items.map((item) => (
                    <div key={item.text} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(142 76% 50%)" }} />
                      <span className="text-sm" style={{ color: "hsl(220 9% 70%)" }}>{item.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4" style={{ background: "hsl(222 47% 6%)" }}>
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(38 92% 50% / 0.1)", color: "hsl(38 92% 55%)" }}>
              Preços transparentes
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 95%)" }}>
              Comece grátis. <span style={{ color: "hsl(38 92% 50%)" }}>Escalе quando quiser.</span>
            </h2>
            <p className="text-lg" style={{ color: "hsl(220 9% 60%)" }}>
              Sem taxa de setup. Sem compromisso. Cancele quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`relative border-2 ${plan.popular ? "border-gold" : ""}`}
                style={{
                  background: plan.popular ? "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 8%))" : "hsl(222 30% 8%)",
                  borderColor: plan.popular ? "hsl(38 92% 50%)" : "hsl(222 20% 15%)",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-4 py-1 rounded-full text-xs font-bold" style={{ background: "hsl(38 92% 50%)", color: "hsl(222 47% 11%)" }}>
                      <Star className="w-3 h-3" /> Mais Popular
                    </div>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-xl mb-1" style={{ color: "hsl(0 0% 95%)" }}>{plan.name}</CardTitle>
                  <p className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>R$</span>
                      <span className="font-display text-4xl font-bold" style={{ color: "hsl(38 92% 55%)" }}>{plan.monthlyPrice}</span>
                      <span className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>/mês</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "hsl(142 76% 55%)" }}>{plan.annualLabel} no anual</p>
                  </div>

                  <div className="space-y-2 pt-4 border-t" style={{ borderColor: "hsl(222 20% 15%)" }}>
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(142 76% 50%)" }} />
                        <span className="text-sm" style={{ color: "hsl(220 9% 70%)" }}>{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 opacity-50">
                        <span className="w-4 h-4 mt-0.5 flex-shrink-0">—</span>
                        <span className="text-sm" style={{ color: "hsl(220 9% 50%)" }}>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/login" className="block pt-4">
                    <Button
                      variant={plan.popular ? "gold" : "outline"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm" style={{ color: "hsl(220 9% 55%)" }}>
            Todos os planos incluem 7 dias de teste grátis.{" "}
            <a href="#" className="underline hover:text-white" style={{ color: "hsl(38 92% 55%)" }}>
              Compare os planos em detalhes
            </a>
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 border-t" style={{ borderColor: "hsl(222 20% 12%)", background: "hsl(222 47% 4%)" }}>
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {SOCIAL_PROOF.map((item) => (
              <div key={item.label} className="text-center">
                <div className="font-display text-3xl lg:text-4xl font-bold mb-1" style={{ color: "hsl(38 92% 55%)" }}>
                  {item.metric}
                </div>
                <div className="text-sm mb-1" style={{ color: "hsl(0 0% 95%)" }}>{item.label}</div>
                <div className="text-xs" style={{ color: "hsl(220 9% 50%)" }}>{item.source}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 47% 4%) 100%)" }}>
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ color: "hsl(0 0% 95%)" }}>
              Pronto para digitalizar sua empresa?
            </h2>
            <p className="text-xl mb-8" style={{ color: "hsl(220 9% 60%)" }}>
              Junte-se a mais de 2.500 empresas que já simplificaram suas operações com o SalaoCashBack.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button variant="gold" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 font-bold">
                  Criar Minha Conta Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Falar com Vendas
                </Button>
              </a>
            </div>
            <p className="text-sm mt-6" style={{ color: "hsl(220 9% 50%)" }}>
              Sem cartão de crédito. Setup em 5 minutos. Suporte humanizado.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPageB2B;