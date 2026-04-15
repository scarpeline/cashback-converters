import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, DollarSign, Crown, Store, Award, Target, Rocket, ArrowUp, ArrowDown } from 'lucide-react';

const DemoPage = () => {
  const [activeView, setActiveView] = useState<'overview' | 'commissions' | 'network' | 'rankings'>('overview');
  
  // Dados simulados para demonstração
  const mockData = {
    overview: {
      totalCommissions: 15420.50,
      monthlyGrowth: 23.5,
      networkSize: 47,
      activePartners: 32,
      pendingCommissions: 2890.75,
      lastMonthCommissions: 12480.00
    },
    commissions: [
      { id: 1, partner: 'João Silva', type: 'Franqueado', amount: 485.00, date: '2026-03-10', status: 'pago' },
      { id: 2, partner: 'Maria Santos', type: 'Afiliado', amount: 194.00, date: '2026-03-10', status: 'pago' },
      { id: 3, partner: 'Pedro Costa', type: 'Diretor', amount: 750.00, date: '2026-03-09', status: 'pendente' },
      { id: 4, partner: 'Ana Oliveira', type: 'Franqueado', amount: 320.50, date: '2026-03-09', status: 'pago' },
      { id: 5, partner: 'Carlos Ferreira', type: 'Afiliado', amount: 97.00, date: '2026-03-08', status: 'pago' },
    ],
    network: [
      { level: 1, count: 12, type: 'Diretores', commission: 15.0 },
      { level: 2, count: 18, type: 'Franqueados', commission: 65.0 },
      { level: 3, count: 17, type: 'Afiliados', commission: 50.0 },
    ],
    rankings: [
      { position: 1, name: 'Roberto Mendes', type: 'Diretor', commissions: 28450.00, growth: 45.2 },
      { position: 2, name: 'Fernanda Lima', type: 'Franqueado', commissions: 22100.00, growth: 32.8 },
      { position: 3, name: 'Marcos Silva', type: 'Afiliado', commissions: 18900.00, growth: 28.5 },
      { position: 4, name: 'Patricia Costa', type: 'Franqueado', commissions: 15600.00, growth: 22.1 },
      { position: 5, name: 'Você (Demo)', type: 'Franqueado', commissions: 15420.50, growth: 23.5 },
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'text-green-600 bg-green-100';
      case 'pendente':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Diretor':
        return <Crown className="w-4 h-4" />;
      case 'Franqueado':
        return <Store className="w-4 h-4" />;
      case 'Afiliado':
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(212 78% 31%) 0%, hsl(212 78% 95%)" }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard de Parcerias</h1>
              <p className="text-white/80">Demonstração do Sistema de Gestão de Parcerias</p>
            </div>
            <Badge className="px-4 py-2 text-lg" style={{ background: "hsl(38 92% 50%)", color: "white" }}>
              MODO DEMONSTRAÇÃO
            </Badge>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
            {[
              { id: 'overview', label: 'Visão Geral', icon: <TrendingUp className="w-4 h-4" /> },
              { id: 'commissions', label: 'Comissões', icon: <DollarSign className="w-4 h-4" /> },
              { id: 'network', label: 'Rede', icon: <Users className="w-4 h-4" /> },
              { id: 'rankings', label: 'Rankings', icon: <Award className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeView === tab.id
                    ? 'bg-white text-orange-500 shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8" style={{ color: "hsl(38 92% 50%)" }} />
                  <Badge className="text-green-600 bg-green-100">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    {mockData.overview.monthlyGrowth}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {mockData.overview.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">Total em Comissões</div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8" style={{ color: "hsl(212 78% 31%)" }} />
                  <Badge className="text-orange-500 bg-orange-100">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    12%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {mockData.overview.networkSize}
                </div>
                <div className="text-sm text-gray-600">Tamanho da Rede</div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-8 h-8" style={{ color: "hsl(142 76% 36%)" }} />
                  <Badge className="text-green-600 bg-green-100">
                    Ativos
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {mockData.overview.activePartners}
                </div>
                <div className="text-sm text-gray-600">Parceiros Ativos</div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Rocket className="w-8 h-8" style={{ color: "hsl(38 92% 50%)" }} />
                  <Badge className="text-yellow-600 bg-yellow-100">
                    Pendente
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {mockData.overview.pendingCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">Comissões Pendentes</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Commissions Tab */}
        {activeView === 'commissions' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                <DollarSign className="w-6 h-6 inline mr-2" style={{ color: "hsl(38 92% 50%)" }} />
                Histórico de Comissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Parceiro</th>
                      <th className="text-left py-3 px-4">Tipo</th>
                      <th className="text-left py-3 px-4">Valor</th>
                      <th className="text-left py-3 px-4">Data</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockData.commissions.map((commission) => (
                      <tr key={commission.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{commission.partner}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(commission.type)}
                            <span>{commission.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold" style={{ color: "hsl(38 92% 50%)" }}>
                          R$ {commission.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">{commission.date}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(commission.status)}>
                            {commission.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Network Tab */}
        {activeView === 'network' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mockData.network.map((level, index) => (
              <Card key={index} className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Nível {level.level}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(level.type)}
                        <span className="font-medium">{level.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Quantidade:</span>
                      <span className="font-bold text-xl">{level.count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Comissão:</span>
                      <span className="font-bold" style={{ color: "hsl(38 92% 50%)" }}>
                        {level.commission}%
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: Math.min(level.count, 20) }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(212 78% 31%)" }} />
                        ))}
                        {level.count > 20 && (
                          <span className="text-sm font-bold">+{level.count - 20}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Rankings Tab */}
        {activeView === 'rankings' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                <Award className="w-6 h-6 inline mr-2" style={{ color: "hsl(38 92% 50%)" }} />
                Ranking de Parceiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.rankings.map((partner, index) => (
                  <div key={partner.position} className={`flex items-center justify-between p-4 rounded-lg ${
                    partner.name === 'Você (Demo)' ? 'bg-orange-50 border-2 border-orange-300' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        partner.position === 1 ? 'bg-yellow-500' :
                        partner.position === 2 ? 'bg-gray-400' :
                        partner.position === 3 ? 'bg-orange-600' :
                        'bg-gray-600'
                      }`}>
                        {partner.position}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{partner.name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {getTypeIcon(partner.type)}
                          <span>{partner.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg" style={{ color: "hsl(38 92% 50%)" }}>
                        R$ {partner.commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <ArrowUp className="w-3 h-3" />
                        <span>{partner.growth}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-white/60">
          <p>Esta é uma demonstração do sistema de parcerias SalãoCashBack</p>
          <p className="text-sm mt-2">Todos os dados são simulados para fins de demonstração</p>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
