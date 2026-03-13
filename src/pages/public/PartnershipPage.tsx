import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Users, TrendingUp, Target, Rocket, Award, Store, DollarSign, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const PartnershipPage = () => {
  const [activeTab, setActiveTab] = useState<'director' | 'franchisee' | 'affiliate'>('director');
  const [simulatorType, setSimulatorType] = useState<'director' | 'franchisee' | 'affiliate'>('director');
  const [clientCount, setClientCount] = useState(10);
  const [affiliateCount, setAffiliateCount] = useState(5);
  const [franchiseeCount, setFranchiseeCount] = useState(2);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);

  const directorBenefits = [
    '15% da licença de franqueados indicados',
    '10% recorrente das assinaturas das barbearias da rede',
    'Comissão direta por barbearias indicadas',
    'Dashboard avançado com métricas em tempo real',
    'Suporte prioritário 24/7',
    'Marketing automatizado para sua rede',
    'Eventos exclusivos de networking',
    'Consultoria estratégica personalizada'
  ];

  const franchiseeBenefits = [
    '65% da assinatura das barbearias indicadas',
    'Pode criar e gerenciar afiliados',
    'Configuração de comissões personalizadas',
    'Acesso a analytics detalhados',
    'Ferramentas de recrutamento',
    'Suporte técnico especializado',
    'Treinamento exclusivo',
    'Material de marketing profissional'
  ];

  const affiliateBenefits = [
    '50% da adesão inicial',
    '25% recorrente mensal',
    'Sem custo para começar',
    'Acesso a dashboard básico',
    'Links de indicação personalizados',
    'Relatórios de comissões',
    'Suporte por email',
    'Pagamentos semanais'
  ];

  const calculateEarnings = () => {
    const basePrice = 97; // Preço base SaaS
    const smsPrice = 29; // Preço SMS
    const whatsappPrice = 39; // Preço WhatsApp
    
    switch (simulatorType) {
      case 'director':
        const directorRevenue = (franchiseeCount * basePrice * 0.15) + 
                               (clientCount * (basePrice + smsPrice + whatsappPrice) * 0.10);
        return directorRevenue;
      case 'franchisee':
        return clientCount * (basePrice + smsPrice + whatsappPrice) * 0.65;
      case 'affiliate':
        const affiliateRevenue = clientCount * basePrice * 0.50;
        const recurringRevenue = clientCount * (basePrice + smsPrice + whatsappPrice) * 0.25;
        return affiliateRevenue + recurringRevenue;
      default:
        return 0;
    }
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Olá, quero entender melhor o modelo de parceria.");
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica para salvar lead
    setShowDemoCredentials(true);
    setShowLeadForm(false);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica para registrar ticket
    setShowSupportForm(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(212 78% 31%) 0%, hsl(212 78% 95%) 100%)" }}>
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 px-6 py-3 text-lg font-bold" style={{ background: "hsl(212 78% 95%)", color: "hsl(212 78% 31%)" }}>
            OPORTUNIDADES DE NEGÓCIO
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-6" style={{ color: "hsl(0 0% 100%)" }}>
            Construa seu{" "}
            <span style={{ color: "hsl(38 92% 50%)" }}>Império de Parcerias</span>
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl mb-8 max-w-3xl mx-auto" style={{ color: "hsl(0 0% 100%)" }}>
            Transforme-se em um empreendedor do setor de beleza com nosso sistema completo de gestão e comissões
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setShowLeadForm(true)}
              className="text-lg px-8 py-4 font-bold"
              style={{ background: "hsl(38 92% 50%)", color: "hsl(0 0% 100%)" }}
            >
              <Target className="w-5 h-5 mr-2" />
              Conhecer Sistema
            </Button>
            <Button 
              onClick={handleWhatsAppClick}
              variant="outline"
              className="text-lg px-8 py-4 font-bold border-2"
              style={{ borderColor: "hsl(0 0% 100%)", color: "hsl(0 0% 100%)" }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Falar com Especialista
            </Button>
          </div>
        </div>
      </section>

      {/* Partnership Models */}
      <section className="py-20 px-4" style={{ background: "hsl(212 78% 95%)" }}>
        <div className="container mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-center mb-12" style={{ color: "hsl(212 78% 31%)" }}>
            Modelos de Parceria
          </h2>
          
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-lg border-2 p-1" style={{ borderColor: "hsl(212 78% 31%)", background: "hsl(0 0% 100%)" }}>
              <button
                className={`px-6 py-3 rounded-md font-bold text-lg transition-all ${
                  activeTab === 'director'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('director')}
              >
                <Crown className="w-5 h-5 mr-2" />
                Diretor Franqueado
              </button>
              <button
                className={`px-6 py-3 rounded-md font-bold text-lg transition-all ${
                  activeTab === 'franchisee'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('franchisee')}
              >
                <Store className="w-5 h-5 mr-2" />
                Franqueado
              </button>
              <button
                className={`px-6 py-3 rounded-md font-bold text-lg transition-all ${
                  activeTab === 'affiliate'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('affiliate')}
              >
                <Users className="w-5 h-5 mr-2" />
                Afiliado
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {activeTab === 'director' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold" style={{ color: "hsl(212 78% 31%)" }}>
                    <Crown className="w-8 h-8 inline mr-2" style={{ color: "hsl(38 92% 50%)" }} />
                    Diretor Franqueado
                  </h3>
                  <p className="text-lg text-gray-600">
                    O topo da hierarquia. Construa e gerencie uma rede de franqueados, 
                    receba comissões sobre toda a estrutura.
                  </p>
                  <div className="space-y-3">
                    {directorBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button 
                      onClick={() => setShowLeadForm(true)}
                      className="font-bold"
                      style={{ background: "hsl(38 92% 50%)", color: "hsl(0 0% 100%)" }}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Conhecer Sistema
                    </Button>
                    <Button 
                      onClick={handleWhatsAppClick}
                      variant="outline"
                      className="font-bold"
                      style={{ borderColor: "hsl(212 78% 31%)", color: "hsl(212 78% 31%)" }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Falar com Especialista
                    </Button>
                    <Button 
                      onClick={() => setShowSupportForm(true)}
                      variant="outline"
                      className="font-bold"
                      style={{ borderColor: "hsl(212 78% 31%)", color: "hsl(212 78% 31%)" }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'franchisee' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold" style={{ color: "hsl(212 78% 31%)" }}>
                    <Store className="w-8 h-8 inline mr-2" style={{ color: "hsl(38 92% 50%)" }} />
                    Franqueado
                  </h3>
                  <p className="text-lg text-gray-600">
                    Gestor intermediário. Indique barbearias e afiliados, 
                    receba as maiores comissões do sistema.
                  </p>
                  <div className="space-y-3">
                    {franchiseeBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button 
                      onClick={() => setShowLeadForm(true)}
                      className="font-bold"
                      style={{ background: "hsl(38 92% 50%)", color: "hsl(0 0% 100%)" }}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Conhecer Sistema
                    </Button>
                    <Button 
                      onClick={handleWhatsAppClick}
                      variant="outline"
                      className="font-bold"
                      style={{ borderColor: "hsl(212 78% 31%)", color: "hsl(212 78% 31%)" }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Falar com Especialista
                    </Button>
                    <Button 
                      onClick={() => setShowSupportForm(true)}
                      variant="outline"
                      className="font-bold"
                      style={{ borderColor: "hsl(212 78% 31%)", color: "hsl(212 78% 31%)" }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'affiliate' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold" style={{ color: "hsl(212 78% 31%)" }}>
                    <Users className="w-8 h-8 inline mr-2" style={{ color: "hsl(38 92% 50%)" }} />
                    Afiliado
                  </h3>
                  <p className="text-lg text-gray-600">
                    Ponto de partida. Indique clientes e receba comissões 
                    atrativas sem custos iniciais.
                  </p>
                  <div className="space-y-3">
                    {affiliateBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button 
                      onClick={() => setShowLeadForm(true)}
                      className="font-bold"
                      style={{ background: "hsl(38 92% 50%)", color: "hsl(0 0% 100%)" }}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Conhecer Sistema
                    </Button>
                    <Button 
                      onClick={handleWhatsAppClick}
                      variant="outline"
                      className="font-bold"
                      style={{ borderColor: "hsl(212 78% 31%)", color: "hsl(212 78% 31%)" }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Falar com Especialista
                    </Button>
                    <Button 
                      onClick={() => setShowSupportForm(true)}
                      variant="outline"
                      className="font-bold"
                      style={{ borderColor: "hsl(212 78% 31%)", color: "hsl(212 78% 31%)" }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Card className="p-6 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold" style={{ color: "hsl(212 78% 31%)" }}>
                    <DollarSign className="w-8 h-8 inline mr-2" style={{ color: "hsl(38 92% 50%)" }} />
                    Simulador de Ganhos
                  </CardTitle>
                  <CardDescription>
                    Calcule seu potencial de renda com nosso simulador interativo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant={simulatorType === 'director' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSimulatorType('director')}
                      className="text-sm"
                    >
                      Diretor
                    </Button>
                    <Button
                      variant={simulatorType === 'franchisee' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSimulatorType('franchisee')}
                      className="text-sm"
                    >
                      Franqueado
                    </Button>
                    <Button
                      variant={simulatorType === 'affiliate' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSimulatorType('affiliate')}
                      className="text-sm"
                    >
                      Afiliado
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {simulatorType === 'director' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Franqueados: {franchiseeCount}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={franchiseeCount}
                            onChange={(e) => setFranchiseeCount(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Barbearias na rede: {clientCount}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={clientCount}
                            onChange={(e) => setClientCount(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}

                    {simulatorType === 'franchisee' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Barbearias indicadas: {clientCount}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={clientCount}
                          onChange={(e) => setClientCount(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}

                    {simulatorType === 'affiliate' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Clientes indicados: {clientCount}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={clientCount}
                          onChange={(e) => setClientCount(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-center p-6 rounded-lg" style={{ background: "hsl(212 78% 95%)" }}>
                    <div className="text-3xl font-bold mb-2" style={{ color: "hsl(38 92% 50%)" }}>
                      R$ {calculateEarnings().toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Renda mensal estimada
                    </div>
                  </div>

                  <div className="flex justify-center gap-2">
                    {Array.from({ length: Math.min(clientCount, 20) }).map((_, i) => (
                      <Store key={i} className="w-6 h-6" style={{ color: "hsl(212 78% 31%)" }} />
                    ))}
                    {clientCount > 20 && (
                      <span className="text-sm font-bold" style={{ color: "hsl(212 78% 31%)" }}>
                        +{clientCount - 20}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Conheça o Sistema</CardTitle>
              <CardDescription>
                Preencha seus dados para acessar a demonstração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome completo</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" style={{ background: "hsl(38 92% 50%)" }}>
                    Enviar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowLeadForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demo Credentials Modal */}
      {showDemoCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Acesso à Demonstração</CardTitle>
              <CardDescription>
                Use as credenciais abaixo para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-md">
                <div className="text-sm font-medium">Email:</div>
                <div className="font-mono">demo@plataforma.com</div>
                <div className="text-sm font-medium mt-2">Senha:</div>
                <div className="font-mono">demo123</div>
              </div>
              <div className="flex gap-2">
                <Link to="/demo" className="flex-1">
                  <Button className="w-full" style={{ background: "hsl(38 92% 50%)" }}>
                    Acessar Demo
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => setShowDemoCredentials(false)}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Support Form Modal */}
      {showSupportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Enviar Mensagem ao Suporte</CardTitle>
              <CardDescription>
                Registre sua dúvida ou solicitação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mensagem</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Descreva sua dúvida..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" style={{ background: "hsl(38 92% 50%)" }}>
                    Enviar Ticket
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowSupportForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PartnershipPage;
