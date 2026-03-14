import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Calendar, 
  Smartphone,
  CheckCircle,
  Play,
  Star,
  MessageCircle,
  Clock,
  DollarSign,
  Shield,
  Zap
} from "lucide-react";
import logo from "@/assets/logo.png";

const Hero = () => {
  const [stats, setStats] = useState({
    barbearias: 0,
    agendamentos: 0,
    clientes: 0,
    satisfacao: 0
  });

  // Animação de contadores
  useEffect(() => {
    const targetStats = {
      barbearias: 1500,
      agendamentos: 26000000,
      clientes: 4000000,
      satisfacao: 98
    };

    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    const animateCounters = () => {
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setStats({
          barbearias: Math.floor(targetStats.barbearias * progress),
          agendamentos: Math.floor(targetStats.agendamentos * progress),
          clientes: Math.floor(targetStats.clientes * progress),
          satisfacao: Math.floor(targetStats.satisfacao * progress)
        });

        if (currentStep >= steps) {
          clearInterval(timer);
          setStats(targetStats);
        }
      }, increment);
    };

    animateCounters();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
      
      {/* Animated orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-500/20 to-transparent blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-gradient-to-r from-purple-500/10 to-transparent blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Conteúdo Principal */}
          <div className="text-center lg:text-left space-y-8">
            
            {/* Badge principal */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 animate-fade-in">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Sistema Completo para Barbearias e Salões</span>
              <Badge className="bg-white text-orange-600 hover:bg-white/90">NOVO</Badge>
            </div>

            {/* Headlines */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight">
                <span className="text-white">Transforme sua</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                  Barbearia
                </span>
                <br />
                <span className="text-white">em uma Máquina</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                  de Dinheiro
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed">
                O sistema mais completo do mercado com 
                <span className="font-bold text-orange-400"> agendamento inteligente</span>, 
                <span className="font-bold text-blue-400"> automação de marketing</span> e 
                <span className="font-bold text-green-400"> controle financeiro</span>
              </p>
            </div>

            {/* Logo animado */}
            <div className="relative my-8 lg:my-12">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl blur-2xl opacity-50 animate-pulse" />
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <img 
                  src={logo} 
                  alt="SalãoCashBack" 
                  className="w-32 sm:w-40 lg:w-48 h-auto mx-auto lg:mx-0 animate-float drop-shadow-2xl" 
                />
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-4 text-lg shadow-lg shadow-orange-500/25 transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link to="/login">
                  Começar Gratuitamente
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 text-lg"
                asChild
              >
                <Link to="/demo">
                  <Play className="w-5 h-5 mr-2" />
                  Ver Demonstração
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Teste 35 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Setup em 5 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>App inclusso</span>
              </div>
            </div>
          </div>

          {/* Stats Column */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Stat Card 1 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-black text-white">
                  {stats.barbearias.toLocaleString('pt-BR')}+
                </div>
              </div>
              <div className="text-gray-300 font-medium">Barbearias Ativas</div>
              <div className="text-gray-400 text-sm mt-1">Em todo o Brasil</div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-black text-white">
                  {(stats.agendamentos / 1000000).toFixed(1)}M+
                </div>
              </div>
              <div className="text-gray-300 font-medium">Agendamentos</div>
              <div className="text-gray-400 text-sm mt-1">Realizados no sistema</div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-black text-white">
                  {(stats.clientes / 1000000).toFixed(1)}M+
                </div>
              </div>
              <div className="text-gray-300 font-medium">Clientes Atendidos</div>
              <div className="text-gray-400 text-sm mt-1">Com satisfação garantida</div>
            </div>

            {/* Stat Card 4 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-black text-white">
                  {stats.satisfacao}%
                </div>
              </div>
              <div className="text-gray-300 font-medium">Satisfação</div>
              <div className="text-gray-400 text-sm mt-1">Dos nossos clientes</div>
            </div>

          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500/20 to-blue-500/20 backdrop-blur-md border border-white/20">
            <MessageCircle className="w-5 h-5 text-orange-400" />
            <span className="text-white font-medium">
              Dúvidas? Fale com nosso especialista agora
            </span>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              asChild
            >
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Animated background elements */}
      <div className="absolute bottom-10 left-10 animate-bounce" style={{ animationDelay: "0.5s" }}>
        <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full opacity-20 blur-xl" />
      </div>
      <div className="absolute top-20 right-20 animate-bounce" style={{ animationDelay: "1.5s" }}>
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-20 blur-xl" />
      </div>
    </section>
  );
};

export default Hero;
