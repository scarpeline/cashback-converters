import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Users, TrendingUp, Target, Rocket, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FranchiseSection() {
  const [activeTab, setActiveTab] = useState<'franchise' | 'master'>('franchise');

  const franchiseBenefits = [
    'Gestão completa de barbearias na sua região',
    'Comissão de 15% sobre todas as barbearias cadastradas',
    'Acesso a dashboard avançado com métricas',
    'Suporte prioritário e treinamento exclusivo',
    'Marketing automatizado para seus franqueados',
    'Ferramentas de recrutamento e expansão',
    'Relatórios detalhados de performance',
    'Acesso a rede de contatos e parcerias'
  ];

  const masterBenefits = [
    'Construa e gerencie uma rede de franqueados',
    'Comissão de 10% sobre toda a rede de franqueados',
    'Acesso a analytics avançados e previsões',
    'Programa de co-marketing com a marca',
    'Eventos exclusivos de networking',
    'Consultoria estratégica personalizada',
    'Participação nos lucros da plataforma',
    'Oportunidades de investimento prioritárias'
  ];

  const franchiseEarnings = [
    { barbershops: 5, monthly: 295, description: '5 barbearias = R$295/mês' },
    { barbershops: 10, monthly: 590, description: '10 barbearias = R$590/mês' },
    { barbershops: 25, monthly: 1475, description: '25 barbearias = R$1.475/mês' },
    { barbershops: 50, monthly: 2950, description: '50 barbearias = R$2.950/mês' },
    { barbershops: 100, monthly: 5900, description: '100 barbearias = R$5.900/mês' }
  ];

  const masterEarnings = [
    { franchises: 3, barbershops: 30, monthly: 885, description: '3 franqueados • 30 barbearias' },
    { franchises: 5, barbershops: 50, monthly: 1475, description: '5 franqueados • 50 barbearias' },
    { franchises: 10, barbershops: 100, monthly: 2950, description: '10 franqueados • 100 barbearias' },
    { franchises: 20, barbershops: 200, monthly: 5900, description: '20 franqueados • 200 barbearias' },
    { franchises: 50, barbershops: 500, monthly: 14750, description: '50 franqueados • 500 barbearias' }
  ];

  return (
    <section id="franchise" className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 30% 10%) 100%)" }}>
      <div className="container relative z-10 mx-auto">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4" style={{ background: "hsl(25 95% 50% / 0.2)", color: "hsl(25 95% 55%)" }}>
            OPORTUNIDADES DE NEGÓCIO
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            Seja um{" "}
            <span className="text-gradient-gold">Franqueado ou Master</span>
            {" "}e construa seu império
          </h2>
          <p className="text-lg lg:text-xl" style={{ color: "hsl(220 9% 60%)" }}>
            Transforme-se em um empreendedor do setor de beleza com nosso sistema completo de gestão
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border border-orange-500/30 p-1" style={{ background: "hsl(222 30% 12%)" }}>
            <button
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'franchise'
                  ? 'bg-orange-500 text-white'
                  : 'text-muted-foreground hover:text-white'
              }`}
              onClick={() => setActiveTab('franchise')}
            >
              <Crown className="w-4 h-4 mr-2" />
              Franqueado
            </button>
            <button
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'master'
                  ? 'bg-orange-500 text-white'
                  : 'text-muted-foreground hover:text-white'
              }`}
              onClick={() => setActiveTab('master')}
            >
              <Award className="w-4 h-4 mr-2" />
              Master
            </button>
          </div>
        </div>

        {/* Franqueado Content */}
        {activeTab === 'franchise' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                  <Crown className="w-6 h-6 text-orange-500" />
                  Seja um Franqueado
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Ganhe dinheiro gerenciando barbearias na sua região com nosso sistema completo de gestão
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-white">Benefícios Exclusivos:</h4>
                <div className="grid grid-cols-1 gap-3">
                  {franchiseBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <span className="text-white">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-4">
                <Button size="lg" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                  <Rocket className="w-4 h-4 mr-2" />
                  Quero ser Franqueado
                </Button>
                <p className="text-sm text-muted-foreground">
                  Sem taxa de adesão • Comissão apenas sobre resultados • Suporte completo
                </p>
              </div>
            </div>

            {/* Earnings Calculator */}
            <div className="space-y-6">
              <Card className="border-orange-500/30" style={{ background: "linear-gradient(145deg, hsl(25 95% 60%), hsl(25 95% 50%))" }}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Seus Ganhos Potenciais
                  </CardTitle>
                  <CardDescription className="text-orange-100">
                    15% de comissão sobre barbearias ativas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {franchiseEarnings.map((earning, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/10 backdrop-blur">
                      <div>
                        <div className="text-white font-medium">{earning.description}</div>
                        <div className="text-orange-100 text-sm">{earning.barbershops} barbearias na rede</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">R$ {earning.monthly.toLocaleString('pt-BR')}</div>
                        <div className="text-orange-100 text-sm">por mês</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card className="border-orange-500/30" style={{ background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))" }}>
                <CardHeader>
                  <CardTitle className="text-white">Requisitos:</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-white">Experiência em gestão ou vendas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-white">Rede de contatos locais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-white">Disponibilidade para dedicação integral</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-white">Capacidade de liderança</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Master Content */}
        {activeTab === 'master' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                  <Award className="w-6 h-6 text-orange-500" />
                  Seja um Master
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Construa e gerencie uma rede de franqueados, recebendo comissões sobre toda a estrutura
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-white">Benefícios de Master:</h4>
                <div className="grid grid-cols-1 gap-3">
                  {masterBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <span className="text-white">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-4">
                <Button size="lg" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                  <Rocket className="w-4 h-4 mr-2" />
                  Quero ser Master
                </Button>
                <p className="text-sm text-muted-foreground">
                  Oportunidade exclusiva • Alto potencial de renda • Networking premium
                </p>
              </div>
            </div>

            {/* Earnings Calculator */}
            <div className="space-y-6">
              <Card className="border-orange-500/30" style={{ background: "linear-gradient(145deg, hsl(25 95% 60%), hsl(25 95% 50%))" }}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Potencial de Ganhos Master
                  </CardTitle>
                  <CardDescription className="text-orange-100">
                    10% sobre toda a rede + participação nos resultados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {masterEarnings.map((earning, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/10 backdrop-blur">
                      <div>
                        <div className="text-white font-medium">{earning.description}</div>
                        <div className="text-orange-100 text-sm">{earning.barbershops} barbearias totais</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">R$ {earning.monthly.toLocaleString('pt-BR')}</div>
                        <div className="text-orange-100 text-sm">por mês</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card className="border-orange-500/30" style={{ background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))" }}>
                <CardHeader>
                  <CardTitle className="text-white">Requisitos Master:</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-white">Experiência comprovada em franchising</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-white">Capital para investimento inicial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-white">Liderança e habilidades de gestão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-white">Visão estratégica de negócios</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto border-orange-500/30" style={{ background: "linear-gradient(145deg, hsl(25 95% 60%), hsl(25 95% 50%))" }}>
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Comece a Construir Seu Império Hoje
              </h3>
              <p className="text-orange-100 mb-6">
                Junte-se a centenas de empreendedores que estão transformando o setor de beleza
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
                  <Users className="w-4 h-4 mr-2" />
                  Falar com Consultor
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600">
                  <Target className="w-4 h-4 mr-2" />
                  Conhecer Oportunidades
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default FranchiseSection;
