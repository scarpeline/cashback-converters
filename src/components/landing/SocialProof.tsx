import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  TrendingUp, 
  Users, 
  Calendar, 
  MessageCircle, 
  Play,
  ArrowRight,
  CheckCircle,
  Award,
  Heart,
  MapPin,
  Clock
} from "lucide-react";

const SocialProof = () => {
  const [stats, setStats] = useState({
    barbearias: 0,
    agendamentos: 0,
    clientes: 0,
    satisfacao: 0,
    crescimento: 0,
    economia: 0
  });

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Animação de contadores quando a seção fica visível
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          animateCounters();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  const animateCounters = () => {
    const targetStats = {
      barbearias: 1500,
      agendamentos: 26000000,
      clientes: 4000000,
      satisfacao: 98,
      crescimento: 340,
      economia: 45
    };

    const duration = 2500;
    const steps = 80;
    const increment = duration / steps;

    const timer = setInterval(() => {
      setStats(prev => {
        const newStats = { ...prev };
        let allComplete = true;

        Object.keys(targetStats).forEach(key => {
          const target = targetStats[key as keyof typeof targetStats];
          const current = newStats[key as keyof typeof newStats];
          
          if (current < target) {
            newStats[key as keyof typeof newStats] = Math.min(
              current + Math.ceil(target / steps),
              target
            );
            allComplete = false;
          }
        });

        if (allComplete) {
          clearInterval(timer);
        }

        return newStats;
      });
    }, increment);
  };

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    {
      name: "João Silva",
      role: "Dono da Barbearia Elite",
      location: "São Paulo, SP",
      avatar: "👨‍💼",
      rating: 5,
      text: "O Salão CashBack transformou meu negócio! A automação de WhatsApp reduziu as faltas em 80% e meu faturamento aumentou 45% no primeiro trimestre.",
      results: ["+45% Faturamento", "-80% Faltas", "+60% Clientes"],
      image: "/api/placeholder/400/300"
    },
    {
      name: "Maria Santos",
      role: "Dona do Salão Beleza Pura",
      location: "Rio de Janeiro, RJ",
      avatar: "👩‍💼",
      rating: 5,
      text: "Incível! O sistema de agendamento online e o app mobile meus clientes amam. A gestão de comissões ficou super fácil e economizo 10h por mês.",
      results: ["-10h/mês Trabalho", "+30% Agendamentos", "100% Satisfação"],
      image: "/api/placeholder/400/300"
    },
    {
      name: "Carlos Oliveira",
      role: "Barbeiro e Franqueado",
      location: "Belo Horizonte, MG",
      avatar: "👨‍🦱",
      rating: 5,
      text: "Comecei com uma barbearia e hoje tenho 3 unidades. O sistema de franquias e o marketing automático foram essenciais para essa expansão.",
      results: ["3 Unidades", "+200% Lucro", "Equipe de 12"],
      image: "/api/placeholder/400/300"
    },
    {
      name: "Ana Costa",
      role: "Dona do Studio Ana Beauty",
      location: "Curitiba, PR",
      avatar: "👩‍🦰",
      rating: 5,
      text: "O controle de pacotes e a gestão de clientes mudaram completamente meu atendimento. Hoje consigo focar no que amo: cuidar dos meus clientes!",
      results: ["+150% Clientes", "Pacotes 100%", "5 Estrelas"],
      image: "/api/placeholder/400/300"
    }
  ];

  const recentActivities = [
    {
      type: "agendamento",
      user: "Pedro Santos",
      location: "Barbearia Elite - São Paulo",
      time: "há 2 minutos",
      service: "Corte + Barba"
    },
    {
      type: "pagamento",
      user: "Maria Silva",
      location: "Salão Beleza Pura - Rio",
      time: "há 5 minutos",
      service: "Pacote 10 sessões"
    },
    {
      type: "avalicao",
      user: "João Costa",
      location: "Studio VIP - BH",
      time: "há 8 minutos",
      service: "5 estrelas ⭐⭐⭐⭐⭐"
    },
    {
      type: "cadastro",
      user: "Ana Paula",
      location: "Nova Barbearia - SP",
      time: "há 12 minutos",
      service: "Novo cliente"
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2">
            Prova Social
          </Badge>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">Junte-se a milhares de</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
              profissionais de sucesso
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Veja como o Salão CashBack está transformando barbearias e salões em todo o Brasil
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
          
          {/* Stat 1 */}
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">
                {isVisible ? stats.barbearias.toLocaleString('pt-BR') : 0}+
              </div>
              <div className="text-blue-300 text-sm font-medium">Barbearias Ativas</div>
            </CardContent>
          </Card>

          {/* Stat 2 */}
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">
                {isVisible ? (stats.agendamentos / 1000000).toFixed(1) : 0}M+
              </div>
              <div className="text-green-300 text-sm font-medium">Agendamentos</div>
            </CardContent>
          </Card>

          {/* Stat 3 */}
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">
                {isVisible ? (stats.clientes / 1000000).toFixed(1) : 0}M+
              </div>
              <div className="text-purple-300 text-sm font-medium">Clientes</div>
            </CardContent>
          </Card>

          {/* Stat 4 */}
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-orange-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">
                {isVisible ? stats.satisfacao : 0}%
              </div>
              <div className="text-orange-300 text-sm font-medium">Satisfação</div>
            </CardContent>
          </Card>

          {/* Stat 5 */}
          <Card className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 border-pink-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-pink-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">
                {isVisible ? stats.crescimento : 0}%
              </div>
              <div className="text-pink-300 text-sm font-medium">Crescimento Médio</div>
            </CardContent>
          </Card>

          {/* Stat 6 */}
          <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">
                {isVisible ? stats.economia : 0}h
              </div>
              <div className="text-cyan-300 text-sm font-medium">Economia/mês</div>
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                Atividade em Tempo Real
              </h3>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                AO VIVO
              </Badge>
            </div>
            
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 animate-slide-in"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <div>
                      <div className="text-white font-medium">{activity.user}</div>
                      <div className="text-gray-400 text-sm">{activity.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-medium">{activity.service}</div>
                    <div className="text-gray-500 text-xs">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Testimonial Content */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  Histórias de Sucesso
                </h3>
                <p className="text-gray-300 text-lg">
                  Veja como estamos transformando negócios
                </p>
              </div>
            </div>

            {/* Active Testimonial */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-white/20 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-4xl">{testimonials[activeTestimonial].avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xl font-bold text-white">
                        {testimonials[activeTestimonial].name}
                      </h4>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Verificado
                      </Badge>
                    </div>
                    <div className="text-gray-400 mb-1">
                      {testimonials[activeTestimonial].role}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <MapPin className="w-4 h-4" />
                      {testimonials[activeTestimonial].location}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-300 text-lg leading-relaxed mb-6 italic">
                  "{testimonials[activeTestimonial].text}"
                </p>

                <div className="flex flex-wrap gap-2">
                  {testimonials[activeTestimonial].results.map((result, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full border border-white/20"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white text-sm font-medium">{result}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Testimonial Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      activeTestimonial === index
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 w-8"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                  />
                ))}
              </div>
              
              <Button 
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                Ver Todos os Depoimentos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Visual Side */}
          <div className="relative">
            <div className="bg-gradient-to-br from-orange-500/20 to-blue-500/20 rounded-2xl p-8 backdrop-blur-sm border border-white/20">
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-16 h-16 text-white mx-auto mb-4" />
                  <p className="text-white font-semibold mb-2">Veja Depoimentos em Vídeo</p>
                  <p className="text-gray-400 text-sm">Histórias reais de clientes</p>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce">
              +340% Crescimento
            </div>
            <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce" style={{ animationDelay: "1s" }}>
              98% Satisfação
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-3xl font-bold text-white mb-4">
              Junte-se aos milhares que já transformaram seus negócios
            </h3>
            <p className="text-white/90 text-lg mb-6">
              Comece grátis hoje mesmo e veja os resultados na primeira semana
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold"
              >
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar com Especialista
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
