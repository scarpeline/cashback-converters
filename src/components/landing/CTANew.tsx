import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  MessageCircle, 
  Gift, 
  Shield, 
  Zap, 
  CheckCircle, 
  Star, 
  Users, 
  Calendar,
  Smartphone,
  Heart,
  Award,
  Crown
} from "lucide-react";

const CTA = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Aqui você pode adicionar a lógica para enviar o email
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail("");
    }, 3000);
  };

  const benefits = [
    { icon: Shield, title: "Teste 35 dias grátis", description: "Sem compromisso, cancele quando quiser" },
    { icon: Zap, title: "Setup em 5 minutos", description: "Comece a usar imediatamente" },
    { icon: Users, title: "Suporte 24/7", description: "Equipe pronta para ajudar" },
    { icon: Gift, title: "Bônus exclusivos", description: "Kit marketing e treinamento" }
  ];

  const testimonials = [
    { name: "João Silva", role: "Barbeiro", text: "Incrível! Aumentei meus lucros em 40% no primeiro mês." },
    { name: "Maria Santos", role: "Dona de Salão", text: "O melhor sistema que já usei. Recomendo!" },
    { name: "Carlos Costa", role: "Franqueado", text: "Perfeito para gerenciar múltiplas unidades." }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        
        {/* Main CTA */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2">
            Oferta Limitada
          </Badge>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white">Transforme sua barbearia</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              hoje mesmo
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Junte-se a mais de 1.500 barbearias que já aumentaram seus lucros 
            com o Salão CashBack
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/25 transform hover:scale-105 transition-all duration-300"
            >
              <Crown className="w-5 h-5 mr-2" />
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 rounded-xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Falar com Especialista
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>35 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Setup em 5 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Cancelamento a qualquer momento</span>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            
            return (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-r ${
                    index === 0 ? 'from-green-500 to-green-600' :
                    index === 1 ? 'from-blue-500 to-blue-600' :
                    index === 2 ? 'from-purple-500 to-purple-600' :
                    'from-orange-500 to-orange-600'
                  } rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-bold mb-2">{benefit.title}</h3>
                  <p className="text-gray-300 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Email Capture */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-white/20">
            <CardContent className="p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Receba uma consultoria gratuita
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Deixe seu email e nossos especialistas entrarão em contato 
                    para analisar seu negócio e mostrar como podemos ajudar.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Seu melhor email..."
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                      required
                    />
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold"
                      disabled={isSubmitted}
                    >
                      {isSubmitted ? "Enviado!" : "Quero consultoria"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Análise gratuita</div>
                      <div className="text-gray-400 text-sm">Diagnóstico completo do seu negócio</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Plano personalizado</div>
                      <div className="text-gray-400 text-sm">Recomendações sob medida</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Sem compromisso</div>
                      <div className="text-gray-400 text-sm">Totalmente gratuito</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final Testimonials */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-8">
              Últimas avaliações de clientes
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="text-white font-medium">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold"
              >
                <Star className="w-5 h-5 mr-2" />
                Ver Todas Avaliações
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl"
              >
                <Heart className="w-5 h-5 mr-2" />
                Junte-se a Nós
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
