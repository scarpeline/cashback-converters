import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Crown, 
  Store, 
  Award, 
  Target, 
  Rocket,
  ArrowUp,
  ArrowDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Network,
  Activity
} from 'lucide-react';
import { commissionService } from '@/lib/commissionService';

interface PartnerStats {
  partner: any;
  monthlyStats: {
    totalCommissions: number;
    pendingCommissions: number;
    totalIndications: number;
  };
  ranking: {
    posicao: number;
    pontuacao: number;
  };
  networkSize: number;
}

const PartnerDashboard = () => {
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'network' | 'activity'>('overview');

  useEffect(() => {
    loadPartnerStats();
  }, []);

  const loadPartnerStats = async () => {
    try {
      setLoading(true);
      // Simular ID do parceiro logado (em produção viria do contexto de autenticação)
      const partnerId = 'demo-partner-id';
      const partnerStats = await commissionService.getPartnerStats(partnerId);
      
      if (partnerStats) {
        setStats(partnerStats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityStatus = (daysInactive: number) => {
    if (daysInactive < 40) return { status: 'ativo', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    if (daysInactive < 60) return { status: 'atenção', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    if (daysInactive < 90) return { status: 'penalizado', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle };
    return { status: 'crítico', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
  };

  const getPerformanceColor = (growth: number) => {
    if (growth > 20) return 'text-green-600';
    if (growth > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, hsl(212 78% 31%) 0%, hsl(212 78% 95%)" }}>
        <div className="text-white text-xl">Carregando dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, hsl(212 78% 31%) 0%, hsl(212 78% 95%)" }}>
        <div className="text-white text-xl">Erro ao carregar dados do parceiro</div>
      </div>
    );
  }

  const activityStatus = getActivityStatus(stats.partner.dias_parado || 0);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(212 78% 31%) 0%, hsl(212 78% 95%)" }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Painel do Parceiro</h1>
              <p className="text-white/80">
                {stats.partner.tipo_parceria === 'diretor_franqueado' && 'Diretor Franqueado'}
                {stats.partner.tipo_parceria === 'franqueado' && 'Franqueado'}
                {stats.partner.tipo_parceria === 'afiliado' && 'Afiliado'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={`px-4 py-2 ${activityStatus.color}`}>
                <activityStatus.icon className="w-4 h-4 mr-2" />
                {activityStatus.status}
              </Badge>
              <Badge className="px-4 py-2 bg-white/20 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Ranking #{stats.ranking.posicao}
              </Badge>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-4 bg-transparent">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/70"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger 
                  value="commissions" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/70"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Comissões
                </TabsTrigger>
                <TabsTrigger 
                  value="network" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/70"
                >
                  <Network className="w-4 h-4 mr-2" />
                  Rede
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/70"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Atividade
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Tabs value={activeTab}>
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-8 h-8" style={{ color: "hsl(38 92% 50%)" }} />
                    <Badge className="text-green-600 bg-green-100">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      23.5%
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    R$ {stats.monthlyStats.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-600">Comissões este mês</div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8" style={{ color: "hsl(212 78% 31%)" }} />
                    <Badge className="text-blue-600 bg-blue-100">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      12%
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.networkSize}
                  </div>
                  <div className="text-sm text-gray-600">Tamanho da Rede</div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-8 h-8" style={{ color: "hsl(142 76% 36%)" }} />
                    <Badge className="text-green-600 bg-green-100">
                      {stats.monthlyStats.totalIndications >= stats.partner.meta_mensual ? 'Batida' : 'Em andamento'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.monthlyStats.totalIndications}/{stats.partner.meta_mensual}
                  </div>
                  <div className="text-sm text-gray-600">Meta mensal</div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-8 h-8" style={{ color: "hsl(38 92% 50%)" }} />
                    <Badge className={activityStatus.color}>
                      {stats.partner.dias_parado || 0} dias
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.partner.nivel_penalidade || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Nível de penalidade</div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <Card className="shadow-lg mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">
                  <TrendingUp className="w-6 h-6 inline mr-2" style={{ color: "hsl(38 92% 50%)" }} />
                  Performance Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: "hsl(38 92% 50%)" }}>
                      R$ {(stats.partner.total_comissoes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Total em comissões</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: "hsl(212 78% 31%)" }}>
                      {stats.ranking.posicao}º
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Posição no ranking</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: "hsl(142 76% 36%)" }}>
                      {stats.ranking.pontuacao.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Pontuação</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">
                  <DollarSign className="w-6 h-6 inline mr-2" style={{ color: "hsl(38 92% 50%)" }} />
                  Detalhamento de Comissões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-lg font-bold text-green-800">
                        R$ {stats.monthlyStats.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-green-600">Total do mês</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-lg font-bold text-yellow-800">
                        R$ {stats.monthlyStats.pendingCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-yellow-600">Pendente</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-800">
                        R$ {(stats.monthlyStats.totalCommissions - stats.monthlyStats.pendingCommissions).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-blue-600">Recebido</div>
                    </div>
                  </div>

                  {/* Commission Types Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Tipos de Comissão</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Rocket className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">Adesão</span>
                        </div>
                        <span className="font-bold text-green-600">R$ 2.450,00</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-orange-600" />
                          <span className="font-medium">Recorrente</span>
                        </div>
                        <span className="font-bold text-green-600">R$ 1.890,00</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">Indicação Direta</span>
                        </div>
                        <span className="font-bold text-green-600">R$ 850,00</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Network className="w-5 h-6 text-red-600" />
                          <span className="font-medium">Indicação Indireta</span>
                        </div>
                        <span className="font-bold text-green-600">R$ 420,00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    <Users className="w-6 h-6 inline mr-2" style={{ color: "hsl(212 78% 31%)" }} />
                    Estatísticas da Rede
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Indicações Diretas</span>
                      <span className="font-bold text-xl">{stats.partner.indicacoes_diretas || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Indicações Indiretas</span>
                      <span className="font-bold text-xl">{stats.partner.indicacoes_indiretas || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total na Rede</span>
                      <span className="font-bold text-xl">{stats.networkSize}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taxa de Ativação</span>
                      <span className="font-bold text-xl text-green-600">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    <Award className="w-6 h-6 inline mr-2" style={{ color: "hsl(38 92% 50%)" }} />
                    Ranking e Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Posição Atual</span>
                      <span className="font-bold text-xl" style={{ color: "hsl(38 92% 50%)" }}>#{stats.ranking.posicao}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pontuação</span>
                      <span className="font-bold text-xl">{stats.ranking.pontuacao.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Crescimento Mensal</span>
                      <span className={`font-bold text-xl flex items-center gap-1 ${getPerformanceColor(23.5)}`}>
                        <ArrowUp className="w-4 h-4" />
                        23.5%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Meta Batida</span>
                      <span className={`font-bold text-lg ${stats.monthlyStats.totalIndications >= stats.partner.meta_mensual ? 'text-green-600' : 'text-orange-600'}`}>
                        {stats.monthlyStats.totalIndications >= stats.partner.meta_mensual ? '✓ Sim' : 'Não'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Network Visualization */}
            <Card className="shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">
                  <Network className="w-6 h-6 inline mr-2" style={{ color: "hsl(212 78% 31%)" }} />
                  Visualização da Rede
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Network className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Visualização interativa da rede</p>
                    <p className="text-sm text-gray-500 mt-2">Em desenvolvimento...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    <Activity className="w-6 h-6 inline mr-2" style={{ color: "hsl(38 92% 50%)" }} />
                    Status de Atividade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${activityStatus.color}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <activityStatus.icon className="w-6 h-6" />
                        <span className="font-bold text-lg capitalize">{activityStatus.status}</span>
                      </div>
                      <div className="text-sm">
                        {stats.partner.dias_parado === 0 && 'Parceiro ativo e em dia com as metas'}
                        {stats.partner.dias_parado > 0 && stats.partner.dias_parado < 40 && `Parceiro ativo, última indicação há ${stats.partner.dias_parado} dias`}
                        {stats.partner.dias_parado >= 40 && `Atenção: ${stats.partner.dias_parado} dias sem indicação`}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Dias desde última indicação</span>
                        <span className="font-bold">{stats.partner.dias_parado || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Nível de penalidade</span>
                        <span className="font-bold text-orange-600">{stats.partner.nivel_penalidade || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Meta mensal</span>
                        <span className="font-bold">{stats.partner.meta_mensual}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    <Target className="w-6 h-6 inline mr-2" style={{ color: "hsl(142 76% 36%)" }} />
                    Metas e Desempenho
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-blue-800">Meta mensal</span>
                        <span className="font-bold text-blue-800">
                          {stats.monthlyStats.totalIndications}/{stats.partner.meta_mensual}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((stats.monthlyStats.totalIndications / stats.partner.meta_mensual) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Taxa de sucesso</span>
                        <span className="font-bold text-green-600">
                          {((stats.monthlyStats.totalIndications / stats.partner.meta_mensual) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bônus por meta</span>
                        <span className="font-bold text-green-600">
                          R$ {stats.monthlyStats.totalIndications >= stats.partner.meta_mensual ? '500,00' : '0,00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Próximo nível</span>
                        <span className="font-bold text-blue-600">
                          {Math.max(0, stats.partner.meta_mensual - stats.monthlyStats.totalIndications)} indicações
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            <Card className="shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">
                  <Calendar className="w-6 h-6 inline mr-2" style={{ color: "hsl(212 78% 31%)" }} />
                  Linha do Tempo de Atividade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <div className="font-medium text-green-800">Meta mensal batida</div>
                      <div className="text-sm text-green-600">Há 2 dias - 5 indicações realizadas</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <div className="font-medium text-blue-800">Comissão recebida</div>
                      <div className="text-sm text-blue-600">Há 5 dias - R$ 485,00</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-purple-50 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <div className="font-medium text-purple-800">Novo afiliado na rede</div>
                      <div className="text-sm text-purple-600">Há 7 dias - João Silva entrou para a rede</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 bg-orange-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
                    <div>
                      <div className="font-medium text-orange-800">Alerta de atividade</div>
                      <div className="text-sm text-orange-600">Há 15 dias - 35 dias sem nova indicação</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PartnerDashboard;
