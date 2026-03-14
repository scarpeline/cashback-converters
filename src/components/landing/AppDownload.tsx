import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Download, 
  Play, 
  Apple, 
  QrCode, 
  ArrowRight, 
  Star, 
  Shield, 
  Zap, 
  MessageCircle, 
  Calendar, 
  Users, 
  CheckCircle,
  Clock,
  Heart,
  TrendingUp
} from "lucide-react";
import React from "react";

const AppDownload = () => {
  const [activeScreen, setActiveScreen] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % appScreens.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('app-section');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  const appScreens = [
    {
      title: "Agendamento Fácil",
      description: "Marque horários em segundos",
      icon: Calendar
    },
    {
      title: "Pagamentos Móveis",
      description: "Pague com PIX e cartão",
      icon: Smartphone
    },
    {
      title: "Notificações",
      description: "Lembretes automáticos",
      icon: MessageCircle
    },
    {
      title: "Fidelidade",
      description: "Acumule pontos e recompensas",
      icon: Heart
    }
  ];

  const features = [
    {
      icon: Smartphone,
      title: "App para Clientes",
      description: "Seus clientes marcam horários, pagam e acumulam pontos de fidelidade diretamente pelo celular.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Users,
      title: "App para Profissionais",
      description: "Sua equipe acessa agenda, visualiza comissões e gerencia horários em qualquer lugar.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Calendar,
      title: "App para Donos",
      description: "Acompanhe seu negócio em tempo real, com relatórios e controle total na palma da mão.",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const stats = [
    { value: "4.8", label: "Avaliação", icon: Star },
    { value: "50K+", label: "Downloads", icon: Download },
    { value: "99.9%", label: "Uptime", icon: Shield },
    { value: "24/7", label: "Suporte", icon: MessageCircle }
  ];

  const reviews = [
    {
      name: "Carlos Silva",
      rating: 5,
      text: "O app mudou completamente como meus clientes interagem com minha barbearia. Incível!",
      role: "Barbeiro"
    },
    {
      name: "Maria Santos",
      rating: 5,
      text: "Consigo gerenciar meu salão inteiro pelo celular. Economizo horas por semana!",
      role: "Dona de Salão"
    },
    {
      name: "João Costa",
      rating: 5,
      text: "Meus clientes amam o app. As notificações de lembrete reduziram faltas em 90%.",
      role: "Gerente"
    }
  ];

  return (
    <section id="app-section" className="py-20 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2">
            Aplicativo Mobile
          </Badge>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">Gerencie tudo pelo</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              celular
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Apps completos para clientes, profissionais e donos. 
            Baixe grátis e tenha sua barbearia na palma da mão.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          
          {/* Left Side - Phone Mockup */}
          <div className="relative">
            <div className="relative mx-auto max-w-sm">
              {/* Phone Frame */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-2 shadow-2xl">
                <div className="bg-black rounded-3xl p-1">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-4">
                    
                    {/* Phone Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        <div className="text-white text-xs font-medium">9:41</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-3 bg-white rounded-sm" />
                        <div className="w-4 h-3 bg-white rounded-sm" />
                        <div className="w-6 h-3 bg-green-500 rounded-sm" />
                      </div>
                    </div>

                    {/* App Screen */}
                    <div className="bg-white rounded-2xl p-4 h-96 overflow-hidden">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl mx-auto mb-2 flex items-center justify-center">
                          <Smartphone className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Salão CashBack
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appScreens[activeScreen].title}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-r ${features[0].color} rounded-lg flex items-center justify-center`}>
                              {React.createElement(appScreens[activeScreen].icon, { 
                                className: "w-5 h-5 text-white" 
                              })}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {appScreens[activeScreen].title}
                              </div>
                              <div className="text-xs text-gray-600">
                                {appScreens[activeScreen].description}
                              </div>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </div>
                        </div>
                        
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                            <div className="flex-1">
                              <div className="h-2 bg-gray-300 rounded w-3/4 mb-1" />
                              <div className="h-2 bg-gray-300 rounded w-1/2" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                            <div className="flex-1">
                              <div className="h-2 bg-gray-300 rounded w-2/3 mb-1" />
                              <div className="h-2 bg-gray-300 rounded w-1/3" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom Navigation */}
                      <div className="flex justify-around mt-4 pt-4 border-t">
                        <div className="w-6 h-6 bg-orange-500 rounded" />
                        <div className="w-6 h-6 bg-gray-300 rounded" />
                        <div className="w-6 h-6 bg-gray-300 rounded" />
                        <div className="w-6 h-6 bg-gray-300 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-20 blur-2xl animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full opacity-20 blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
              
              {/* Screen Indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {appScreens.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveScreen(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      activeScreen === index
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 w-6"
                        : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="space-y-8">
            
            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                
                return (
                  <Card key={index} className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardContent className="p-4 text-center">
                      <Icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Download Buttons */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">
                Baixe Grátis Agora
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-xl flex items-center gap-3">
                  <Apple className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-xs">Download na</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </Button>
                
                <Button className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-xl flex items-center gap-3">
                  <Play className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-xs">Disponível no</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </Button>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-xl"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Escanear QR Code
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            O que nossos clientes dizem
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-gray-300 mb-4 italic">
                    "{review.text}"
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-medium">{review.name}</div>
                      <div className="text-gray-400 text-sm">{review.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-orange-500 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Smartphone className="w-12 h-12 text-white" />
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  App 100% Gratuito
                </h3>
                <p className="text-white/90 text-lg">
                  Baixe agora e comece a transformar sua barbearia
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold"
              >
                <Download className="w-5 h-5 mr-2" />
                Baixar Agora
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl"
              >
                Ver Demonstração
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Setup Rápido</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>Amado pelos Clientes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownload;
