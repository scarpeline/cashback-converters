import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle, 
  X, 
  Star, 
  Crown, 
  Rocket, 
  Users, 
  Zap, 
  Shield, 
  Smartphone, 
  MessageCircle, 
  TrendingUp,
  ArrowRight,
  Gift,
  Award,
  Heart
} from "lucide-react";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Iniciante",
      description: "Perfeito para barbearias pequenas que estão começando",
      price: isAnnual ? 97 : 127,
      originalPrice: isAnnual ? 1527 : 1827,
      professionals: 1,
      color: "from-blue-500 to-blue-600",
      popular: false,
      icon: Rocket,
      features: [
        { included: true, name: "Agendamento Ilimitado", description: "Sem limite de agendamentos mensais" },
        { included: true, name: "WhatsApp Automático", description: "Confirmações e lembretes automáticos" },
        { included: true, name: "App para Clientes", description: "Seus clientes marcam pelo celular" },
        { included: true, name: "Controle Financeiro Básico", description: "Fluxo de caixa simples" },
        { included: true, name: "Gestão de Clientes", description: "CRM completo com histórico" },
        { included: true, name: "Relatórios Simples", description: "Relatórios básicos de vendas" },
        { included: false, name: "Marketing Avançado", description: "Campanhas automatizadas" },
        { included: false, name: "Múltiplas Unidades", description: "Mais de uma barbearia" },
        { included: false, name: "API Integrações", description: "Integrações com outros sistemas" },
        { included: false, name: "Suporte Prioritário", description: "Atendimento dedicado 24/7" }
      ]
    },
    {
      name: "Profissional",
      description: "Ideal para barbearias em crescimento com equipe completa",
      price: isAnnual ? 147 : 197,
      originalPrice: isAnnual ? 2367 : 2827,
      professionals: 3,
      color: "from-purple-500 to-purple-600",
      popular: true,
      icon: Crown,
      features: [
        { included: true, name: "Tudo do Plano Iniciante", description: "Todas as funcionalidades básicas" },
        { included: true, name: "Até 3 Profissionais", description: "Equipe completa com permissões" },
        { included: true, name: "Marketing Automatizado", description: "Campanhas de WhatsApp e e-mail" },
        { included: true, name: "Controle de Comissões", description: "Cálculo automático por profissional" },
        { included: true, name: "Gestão de Pacotes", description: "Venda e controle de pacotes/sessões" },
        { included: true, name: "Relatórios Avançados", description: "Análise detalhada de performance" },
        { included: true, name: "Integração ASAAS", description: "Gateway de pagamento completo" },
        { included: false, name: "Franquia Digital", description: "Sistema de franquias" },
        { included: false, name: "API Completa", description: "Acesso total à API" },
        { included: false, name: "Consultoria", description: "Acompanhamento personalizado" }
      ]
    },
    {
      name: "Empresarial",
      description: "Para redes de barbearias e franquias em expansão",
      price: isAnnual ? 297 : 397,
      originalPrice: isAnnual ? 4767 : 5677,
      professionals: 10,
      color: "from-orange-500 to-orange-600",
      popular: false,
      icon: Award,
      features: [
        { included: true, name: "Tudo do Plano Profissional", description: "Funcionalidades completas" },
        { included: true, name: "Até 10 Profissionais", description: "Equipe grande com múltiplas permissões" },
        { included: true, name: "Múltiplas Unidades", description: "Gerencie várias barbearias" },
        { included: true, name: "Franquia Digital", description: "Sistema completo de franquias" },
        { included: true, name: "API Completa", description: "Integrações ilimitadas" },
        { included: true, name: "Marketing Multinível", description: "Sistema de afiliados avançado" },
        { included: true, name: "Relatórios Executivos", description: "Dashboards para diretoria" },
        { included: true, name: "Consultoria Mensal", description: "Reuniões estratégicas mensais" },
        { included: true, name: "Treinamento Online", description: "Capacitação da sua equipe" },
        { included: true, name: "Suporte VIP 24/7", description: "Canal exclusivo de atendimento" }
      ]
    },
    {
      name: "Ilimitado",
      description: "Para grandes redes que querem o máximo de performance",
      price: isAnnual ? 597 : 797,
      originalPrice: isAnnual ? 9567 : 11427,
      professionals: "Ilimitado",
      color: "from-green-500 to-green-600",
      popular: false,
      icon: Shield,
      features: [
        { included: true, name: "Tudo do Plano Empresarial", description: "Sem limitações de funcionalidades" },
        { included: true, name: "Profissionais Ilimitados", description: "Equipe sem limites" },
        { included: true, name: "Unidades Ilimitadas", description: "Expansão sem restrições" },
        { included: true, name: "White Label", description: "Sistema com sua marca" },
        { included: true, name: "Servidor Dedicado", description: "Infraestrutura exclusiva" },
        { included: true, name: "Desenvolvimento Custom", description: "Funcionalidades sob medida" },
        { included: true, name: "Inteligência Artificial", description: "Análises preditivas e IA" },
        { included: true, name: "Consultoria Presencial", description: "Visitas técnicas mensais" },
        { included: true, name: "Treinamento In Company", description: "Capacitação no local" },
        { included: true, name: "Gerente de Conta", description: "Dedicação exclusiva" }
      ]
    }
  ];

  const bonuses = [
    {
      icon: Gift,
      title: "Bônus: Kit Marketing",
      description: "Artes prontas para Instagram, Facebook e WhatsApp",
      value: "R$ 997"
    },
    {
      icon: Users,
      title: "Bônus: Treinamento Online",
      description: "Curso completo de gestão de barbearias",
      value: "R$ 497"
    },
    {
      icon: Smartphone,
      title: "Bônus: App Personalizado",
      description: "Seu próprio aplicativo com sua marca",
      value: "R$ 1.997"
    },
    {
      icon: Heart,
      title: "Bônus: Comunidade VIP",
      description: "Acesso exclusivo ao grupo de donos de sucesso",
      value: "Inestimável"
    }
  ];

  const guaranteeItems = [
    "Teste 35 dias grátis sem compromisso",
    "Cancelamento a qualquer momento",
    "Suporte completo durante todo o período",
    "Atualizações gratuitas para sempre",
    "Garantia de satisfação ou dinheiro de volta"
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2">
            Planos e Preços
          </Badge>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">Escolha o plano perfeito</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              para o seu negócio
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Todas as funcionalidades em todos os planos. A única diferença é o número de profissionais.
          </p>

          {/* Annual Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg font-medium ${!isAnnual ? "text-white" : "text-gray-400"}`}>
              Mensal
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-orange-600"
            />
            <span className={`text-lg font-medium ${isAnnual ? "text-white" : "text-gray-400"}`}>
              Anual
            </span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-2">
              Economize 20%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            
            return (
              <Card 
                key={index}
                className={`relative bg-gradient-to-br ${plan.color}/10 backdrop-blur-sm border ${plan.color}/30 hover:scale-105 transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-orange-500 shadow-2xl shadow-orange-500/25' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 font-bold">
                      MAIS POPULAR
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {plan.popular && <Star className="w-5 h-5 text-yellow-400 fill-current" />}
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </CardTitle>
                  
                  <CardDescription className="text-gray-300 text-sm">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">
                        R$ {plan.price}
                      </span>
                      <span className="text-gray-400">/mês</span>
                    </div>
                    
                    {isAnnual && (
                      <div className="mt-2">
                        <span className="text-gray-400 line-through text-sm">
                          R$ {plan.originalPrice}/ano
                        </span>
                        <div className="text-green-400 font-semibold text-sm">
                          Economia R$ {(plan.originalPrice - (plan.price * 12)).toLocaleString('pt-BR')}/ano
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2 text-gray-300">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      {plan.professionals === "Ilimitado" ? "Profissionais ilimitados" : `Até ${plan.professionals} profissionais`}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Button 
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                      plan.popular
                        ? `bg-gradient-to-r ${plan.color} text-white shadow-lg hover:shadow-xl`
                        : `bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm`
                    }`}
                  >
                    {plan.popular ? "Começar Agora" : "Escolher Plano"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          feature.included 
                            ? `bg-gradient-to-r ${plan.color}` 
                            : 'bg-gray-600'
                        }`}>
                          {feature.included ? (
                            <CheckCircle className="w-3 h-3 text-white" />
                          ) : (
                            <X className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${
                            feature.included ? "text-white" : "text-gray-500"
                          }`}>
                            {feature.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {feature.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bonuses Section */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-2xl p-8 backdrop-blur-sm border border-white/20">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">
              🎁 Bônus Exclusivos por Tempo Limitado
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {bonuses.map((bonus, index) => {
                const Icon = bonus.icon;
                
                return (
                  <Card key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-white font-bold mb-2">{bonus.title}</h4>
                      <p className="text-gray-300 text-sm mb-3">{bonus.description}</p>
                      <div className="text-green-400 font-bold">Valor: {bonus.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="text-center mt-8">
              <p className="text-white text-lg mb-4">
                <strong>Total dos bônus:</strong> R$ 3.488 em valor
              </p>
              <p className="text-gray-300 text-sm">
                *Bônus disponíveis apenas para os planos Profissional, Empresarial e Ilimitado
              </p>
            </div>
          </div>
        </div>

        {/* Guarantee Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl p-8 backdrop-blur-sm border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-3xl font-bold text-white mb-4">
              Garantia de Satisfação Total
            </h3>
            
            <p className="text-gray-300 text-lg mb-6">
              Teste sem risco por 35 dias. Se não ficar 100% satisfeito, cancelamos e devolvemos seu dinheiro.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {guaranteeItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-left">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">{item}</span>
                </div>
              ))}
            </div>
            
            <Button 
              size="lg"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg"
            >
              Começar Teste Grátis de 35 Dias
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
