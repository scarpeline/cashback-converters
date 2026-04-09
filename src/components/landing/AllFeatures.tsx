import {
  Calendar, CreditCard, Gift, MessageSquare, PieChart, Shield, Users, Zap,
  Briefcase, FileText, Clock, Bell, DollarSign, BarChart3, UserCheck,
  Wallet, QrCode, Lock, Globe, Headphones, RefreshCw, Target, Award,
  Percent, Receipt, ClipboardList, Eye, Bot, Mic, CheckCircle
} from "lucide-react";

const featureCategories = [
  {
    title: "Agendamento Inteligente",
    icon: Calendar,
    color: "bg-blue-50 text-blue-500",
    features: [
      "Agendamento Online 24h",
      "Lembretes Automáticos WhatsApp",
      "Fila de Espera Inteligente",
      "Ficha do Cliente Completa",
    ]
  },
  {
    title: "IA & Automação",
    icon: Bot,
    color: "bg-purple-50 text-purple-500",
    features: [
      "Atendimento IA por Texto",
      "Atendimento IA por Áudio",
      "Automações Configuráveis",
      "Reativação de Clientes",
    ]
  },
  {
    title: "Pagamentos & Finanças",
    icon: CreditCard,
    color: "bg-green-50 text-green-500",
    features: [
      "PIX Instantâneo",
      "Cartão Crédito/Débito",
      "Split de Comissões",
      "Dashboard Financeiro",
    ]
  },
  {
    title: "Fidelização & Cashback",
    icon: Gift,
    color: "bg-pink-50 text-pink-500",
    features: [
      "Cashback Configurável",
      "Carteira Digital",
      "Sistema de Pontos",
      "Promoções Direcionadas",
    ]
  },
  {
    title: "Marketing & Parceiros",
    icon: Users,
    color: "bg-orange-50 text-orange-500",
    features: [
      "Programa de Afiliados",
      "Comissões Automáticas",
      "Rastreamento de Conversões",
      "Ganhos em Tempo Real",
    ]
  },
  {
    title: "Multi-Nicho & Gestão",
    icon: PieChart,
    color: "bg-cyan-50 text-cyan-500",
    features: [
      "8+ Setores Suportados",
      "Múltiplos Perfis",
      "Dashboard 360°",
      "Relatórios Exportáveis",
    ]
  },
];

const AllFeatures = () => {
  return (
    <section id="todas-funcionalidades" className="py-20 px-4 bg-slate-50">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-sm font-medium text-blue-600 mb-6">
            Plataforma Completa
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Tudo que seu negócio precisa em <span className="text-orange-500">uma só plataforma</span>
          </h2>
          <p className="text-slate-600">
            Agendamento com IA, pagamentos, marketing e fidelização — tudo automatizado
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCategories.map((category) => (
            <div key={category.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl ${category.color.split(' ')[0]} flex items-center justify-center`}>
                  <category.icon className={`w-6 h-6 ${category.color.split(' ')[1]}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {category.title}
                </h3>
              </div>

              <ul className="space-y-3">
                {category.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-white border border-slate-200">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-slate-900">
                Todas funcionalidades a partir de
              </p>
              <p className="text-sm text-slate-600">
                R$ 16,65/mês no plano anual • 7 dias grátis
              </p>
            </div>
            <a href="#pricing" className="px-6 py-3 rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
              Ver Planos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AllFeatures;
