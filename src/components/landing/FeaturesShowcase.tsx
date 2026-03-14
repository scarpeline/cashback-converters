import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MessageCircle, 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  Smartphone, 
  Shield, 
  Zap, 
  Clock, 
  CheckCircle, 
  Star, 
  BarChart3, 
  FileText, 
  Settings, 
  Heart, 
  Award, 
  Target, 
  Rocket, 
  Crown,
  ArrowRight,
  Play,
  Repeat
} from "lucide-react";
import React from "react";

const FeaturesShowcase = () => {
  const [activeTab, setActiveTab] = useState("agenda");

  const features = {
    agenda: {
      title: "Agenda Inteligente",
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
      description: "Sistema de agendamento avançado com automação completa",
      items: [
        {
          title: "Agendamento Online 24/7",
          description: "Seus clientes marcam horários a qualquer momento pelo link personalizado",
          icon: Clock,
          included: true
        },
        {
          title: "Confirmação Automática por WhatsApp",
          description: "Reduza faltas em até 80% com lembretes automáticos",
          icon: MessageCircle,
          included: true
        },
        {
          title: "Controle de Salas e Profissionais",
          description: "Otimize o uso dos seus recursos e evite conflitos",
          icon: Users,
          included: true
        },
        {
          title: "Lista de Espera Inteligente",
          description: "Preencha horários vagos automaticamente com clientes em espera",
          icon: Users,
          included: true
        },
        {
          title: "Agendamentos Recorrentes",
          description: "Clientes podem marcar sessões recorrentes com um clique",
          icon: Repeat,
          included: true
        },
        {
          title: "Visão Completa da Agenda",
          description: "Calendário semanal, mensal e daily view com todos os detalhes",
          icon: Calendar,
          included: true
        }
      ]
    },
    financeiro: {
      title: "Controle Financeiro",
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      description: "Gestão financeira completa para maximizar seus lucros",
      items: [
        {
          title: "Fluxo de Caixa em Tempo Real",
          description: "Acompanhe entradas e saídas com dashboards interativos",
          icon: TrendingUp,
          included: true
        },
        {
          title: "Controle de Comissões",
          description: "Cálculo automático de comissões por profissional ou serviço",
          icon: DollarSign,
          included: true
        },
        {
          title: "Gestão de Pacotes e Sessões",
          description: "Venda pacotes de serviços e controle as sessões utilizadas",
          icon: Package,
          included: true
        },
        {
          title: "Pagamentos por PIX",
          description: "Receba pagamentos instantâneos com PIX e PIX Cobrança",
          icon: Zap,
          included: true
        },
        {
          title: "Relatórios de Vendas",
          description: "Análise detalhada do faturamento e performance",
          icon: BarChart3,
          included: true
        },
        {
          title: "Contas a Pagar/Receber",
          description: "Controle completo de obrigações financeiras",
          icon: FileText,
          included: true
        }
      ]
    },
    marketing: {
      title: "Marketing e Automação",
      icon: Rocket,
      color: "from-purple-500 to-purple-600",
      description: "Ferramentas de marketing para atrair e reter clientes",
      items: [
        {
          title: "WhatsApp Marketing",
          description: "Campanhas automatizadas com segmentação avançada",
          icon: MessageCircle,
          included: true
        },
        {
          title: "Prova Social em Tempo Real",
          description: "Popups de agendamentos e avaliações recentes",
          icon: Star,
          included: true
        },
        {
          title: "Programa de Fidelidade",
          description: "Sistema de pontos e recompensas para clientes fiéis",
          icon: Heart,
          included: true
        },
        {
          title: "Campanhas de Reativação",
          description: "Recupere clientes ausentes com mensagens personalizadas",
          icon: Target,
          included: true
        },
        {
          title: "Indicações Premiadas",
          description: "Transforme clientes em promotores da sua marca",
          icon: Award,
          included: true
        },
        {
          title: "Análise de Marketing",
          description: "Métricas detalhadas do ROI das suas campanhas",
          icon: BarChart3,
          included: true
        }
      ]
    },
    clientes: {
      title: "Gestão de Clientes",
      icon: Users,
      color: "from-orange-500 to-orange-600",
      description: "CRM completo para conhecer e encantar seus clientes",
      items: [
        {
          title: "Ficha de Anamnese Digital",
          description: "Histórico completo de tratamentos e preferências",
          icon: FileText,
          included: true
        },
        {
          title: "Prontuário Eletrônico",
          description: "Registros médicos e evolução dos tratamentos",
          icon: Shield,
          included: true
        },
        {
          title: "Galeria de Antes/Depois",
          description: "Armazene fotos do progresso dos clientes",
          icon: Star,
          included: true
        },
        {
          title: "Controle de Aniversários",
          description: "Envie mensagens automáticas de aniversário",
          icon: Heart,
          included: true
        },
        {
          title: "Segmentação Avançada",
          description: "Crie grupos personalizados para campanhas direcionadas",
          icon: Users,
          included: true
        },
        {
          title: "Histórico Completo",
          description: "Todos os atendimentos, compras e interações",
          icon: Clock,
          included: true
        }
      ]
    },
    mobile: {
      title: "App Mobile Incluso",
      icon: Smartphone,
      color: "from-pink-500 to-pink-600",
      description: "Aplicativo completo para clientes e profissionais",
      items: [
        {
          title: "App para Clientes",
          description: "Seus clientes marcam horários e pagam pelo celular",
          icon: Smartphone,
          included: true
        },
        {
          title: "App para Profissionais",
          description: "Sua equipe acessa agenda e comissões pelo app",
          icon: Users,
          included: true
        },
        {
          title: "Notificações Push",
          description: "Alertas automáticos de agendamentos e promoções",
          icon: MessageCircle,
          included: true
        },
        {
          title: "Pagamentos Móveis",
          description: "Aceite cartão e PIX diretamente no app",
          icon: DollarSign,
          included: true
        },
        {
          title: "Modo Offline",
          description: "Acesso a informações essenciais sem internet",
          icon: Shield,
          included: true
        },
        {
          title: "Sincronização Instantânea",
          description: "Dados atualizados em tempo real entre dispositivos",
          icon: Zap,
          included: true
        }
      ]
    }
  };

  const tabs = [
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "financeiro", label: "Financeiro", icon: DollarSign },
    { id: "marketing", label: "Marketing", icon: Rocket },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "mobile", label: "App Mobile", icon: Smartphone }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2">
            Funcionalidades Completas
          </Badge>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">Tudo o que você precisa</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              em um só sistema
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            O software mais completo do mercado com todas as ferramentas para 
            automatizar sua barbearia e aumentar seus lucros
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const feature = features[tab.id as keyof typeof features];
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r ${feature.color} text-white shadow-lg` 
                    : "border-white/20 text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Active Feature Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Feature Info */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 bg-gradient-to-r ${features[activeTab as keyof typeof features].color} rounded-2xl flex items-center justify-center shadow-lg`}>
                {React.createElement(features[activeTab as keyof typeof features].icon, { 
                  className: "w-8 h-8 text-white" 
                })}
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {features[activeTab as keyof typeof features].title}
                </h3>
                <p className="text-gray-300 text-lg">
                  {features[activeTab as keyof typeof features].description}
                </p>
              </div>
            </div>

            {/* Feature Items */}
            <div className="space-y-4">
              {features[activeTab as keyof typeof features].items.map((item, index) => {
                const ItemIcon = item.icon;
                
                return (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.included ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                className={`bg-gradient-to-r ${features[activeTab as keyof typeof features].color} text-white px-8 py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300`}
                asChild
              >
                <Link to="/demo">
                  <Play className="w-5 h-5 mr-2" />
                  Ver Demonstração
                </Link>
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 rounded-xl"
                asChild
              >
                <Link to="/pricing">
                  Ver Planos
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Visual Side */}
          <div className="relative">
            <div className="sticky top-8">
              {/* Main Card */}
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-white/20 shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-white">
                      {features[activeTab as keyof typeof features].title}
                    </CardTitle>
                    <div className={`w-12 h-12 bg-gradient-to-r ${features[activeTab as keyof typeof features].color} rounded-xl flex items-center justify-center`}>
                      {React.createElement(features[activeTab as keyof typeof features].icon, { 
                        className: "w-6 h-6 text-white" 
                      })}
                    </div>
                  </div>
                  <CardDescription className="text-gray-400 text-lg">
                    {features[activeTab as keyof typeof features].description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Progress indicators */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Funcionalidades Ativas</span>
                      <span className="text-white font-bold">
                        {features[activeTab as keyof typeof features].items.filter(item => item.included).length}/
                        {features[activeTab as keyof typeof features].items.length}
                      </span>
                    </div>
                    
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-full bg-gradient-to-r ${features[activeTab as keyof typeof features].color} rounded-full transition-all duration-500`}
                        style={{
                          width: `${(features[activeTab as keyof typeof features].items.filter(item => item.included).length / features[activeTab as keyof typeof features].items.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">24/7</div>
                      <div className="text-sm text-gray-400">Disponibilidade</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">100%</div>
                      <div className="text-sm text-gray-400">Integrado</div>
                    </div>
                  </div>

                  {/* Testimonial */}
                  <div className="bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-white text-sm italic">
                      "Essa funcionalidade transformou completamente meu negócio. 
                      Aumento meus lucros em 40% no primeiro mês!"
                    </p>
                    <p className="text-gray-400 text-xs mt-2">- João Silva, Barbearia Elite</p>
                  </div>
                </CardContent>
              </Card>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full opacity-20 blur-2xl animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-20 blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-2xl p-8 backdrop-blur-sm border border-white/20">
            <h3 className="text-3xl font-bold text-white mb-4">
              Todas as funcionalidades em todos os planos
            </h3>
            <p className="text-gray-300 text-lg mb-6">
              Não cobramos extras por funcionalidades. Você tem acesso a tudo 
              desde o plano básico.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg"
              asChild
            >
              <Link to="/pricing">
                <Crown className="w-5 h-5 mr-2" />
                Ver Planos e Preços
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;
