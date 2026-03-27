import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, MapPin, Users, DollarSign, AlertTriangle, 
  CheckCircle, Target, BarChart3, Eye, Calendar
} from 'lucide-react';
import { useFeature } from '@/hooks/useFeatureFlags';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GrowthMetric {
  city: string;
  state: string;
  barbershops_count: number;
  new_barbershops_month: number;
  monthly_revenue: number;
  growth_rate: number;
  demand_score: number;
  potential_score: number;
  competition_level: string;
}

interface GrowthInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  target_cities: string[];
  priority: string;
  confidence_score: number;
  status: string;
  created_at: string;
}

interface GrowthForecast {
  forecast_type: string;
  target_entity: string;
  current_value: number;
  forecast_3m: number;
  forecast_6m: number;
  forecast_12m: number;
  confidence_level: number;
}

interface FranchiseRanking {
  franchise_id: string;
  franchise_name: string;
  total_barbershops: number;
  new_barbershops: number;
  total_revenue: number;
  growth_rate: number;
  performance_score: number;
  ranking_position: number;
  total_franchises: number;
}

export function GrowthIntelligencePanel() {
  const { enabled: growthEnabled } = useFeature('growth_intelligence');
  const [metrics, setMetrics] = useState<GrowthMetric[]>([]);
  const [insights, setInsights] = useState<GrowthInsight[]>([]);
  const [forecasts, setForecasts] = useState<GrowthForecast[]>([]);
  const [rankings, setRankings] = useState<FranchiseRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (growthEnabled) {
      loadGrowthData();
    }
  }, [growthEnabled]);

  const loadGrowthData = async () => {
    setLoading(true);
    try {
      // Carregar métricas de crescimento
      const { data: metricsData } = await db
        .from('growth_metrics')
        .select('*')
        .order('demand_score', { ascending: false })
        .limit(20);
      
      if (metricsData) {
        setMetrics(metricsData);
      }

      // Carregar insights
      const { data: insightsData } = await db
        .from('growth_insights')
        .select('*')
        .eq('status', 'open')
        .order('priority', { ascending: false })
        .limit(10);
      
      if (insightsData) {
        setInsights(insightsData);
      }

      // Carregar previsões
      const { data: forecastsData } = await db
        .from('growth_forecasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (forecastsData) {
        setForecasts(forecastsData);
      }

      // Carregar rankings de franqueados
      const { data: rankingsData } = await db.rpc('get_franchise_rankings');
      
      if (rankingsData) {
        setRankings(rankingsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de crescimento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeGrowth = async () => {
    setAnalyzing(true);
    try {
      // Atualizar métricas
      await db.rpc('update_growth_metrics');
      
      // Gerar insights
      await db.rpc('generate_growth_insights');
      
      // Recarregar dados
      await loadGrowthData();
    } catch (error) {
      console.error('Erro ao analisar crescimento:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'market_opportunity': return 'text-green-600 bg-green-50';
      case 'growth_trend': return 'text-blue-600 bg-blue-50';
      case 'risk_alert': return 'text-red-600 bg-red-50';
      case 'performance_gap': return 'text-orange-600 bg-orange-50';
      case 'expansion_recommendation': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!growthEnabled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Inteligência de Crescimento Desativada</h3>
          <p className="text-muted-foreground mb-4">
            Ative o módulo de inteligência de crescimento para acessar este painel.
          </p>
          <Button onClick={() => window.location.href = '/admin/features'}>
            Ativar Inteligência de Crescimento
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inteligência de Crescimento</h2>
          <p className="text-muted-foreground">
            Análise avançada de métricas e insights para expansão
          </p>
        </div>
        <Button onClick={handleAnalyzeGrowth} disabled={analyzing}>
          <BarChart3 className="w-4 h-4 mr-2" />
          {analyzing ? 'Analisando...' : 'Analisar Crescimento'}
        </Button>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Cidades Monitoradas</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Alto Potencial</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {metrics.filter(m => m.potential_score > 70).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Crescimento Médio</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {metrics.length > 0 ? (metrics.reduce((acc, m) => acc + m.growth_rate, 0) / metrics.length).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Receita Total</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              R$ {metrics.reduce((acc, m) => acc + m.monthly_revenue, 0).toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights de Crescimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Insights de Crescimento
          </CardTitle>
          <CardDescription>
            Oportunidades e alertas identificados pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight) => (
              <div key={insight.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(insight.priority)}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{insight.title}</span>
                      <Badge className={`text-xs ${getInsightTypeColor(insight.insight_type)}`}>
                        {insight.insight_type}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(insight.priority)}`}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </div>
                    {insight.target_cities.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Cidades: {insight.target_cities.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Confiança: {Math.round(insight.confidence_score * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(insight.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas por Cidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Métricas por Cidade
          </CardTitle>
          <CardDescription>
            Análise detalhada por mercado local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.slice(0, 10).map((metric) => (
              <div key={`${metric.city}-${metric.state}`} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metric.city}, {metric.state}</span>
                      <Badge variant="outline" className="text-xs">
                        {metric.competition_level}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metric.barbershops_count} barbearias • {metric.new_barbershops_month} novas/mês
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <div className="text-sm">
                      <div className="font-medium">Score: {metric.demand_score}/100</div>
                      <Progress value={metric.demand_score} className="w-20 h-2" />
                    </div>
                    <div className="text-sm">
                      <div className={`font-medium ${getCompetitionColor(metric.competition_level)}`}>
                        {metric.growth_rate > 0 ? '+' : ''}{metric.growth_rate}%
                      </div>
                      <div className="text-xs text-muted-foreground">crescimento</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Previsões de Crescimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Previsões de Crescimento
          </CardTitle>
          <CardDescription>
            Projeções baseadas em modelos de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {forecasts.map((forecast) => (
              <div key={`${forecast.forecast_type}-${forecast.target_entity}`} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{forecast.forecast_type}</span>
                    <Badge variant="outline" className="text-xs">
                      {forecast.target_entity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confiança: {Math.round(forecast.confidence_level * 100)}%
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Atual</div>
                    <div className="font-medium">
                      {forecast.forecast_type === 'revenue' ? `R$ ${forecast.current_value.toLocaleString('pt-BR')}` : forecast.current_value}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">3 meses</div>
                    <div className="font-medium text-green-600">
                      {forecast.forecast_type === 'revenue' ? `R$ ${forecast.forecast_3m.toLocaleString('pt-BR')}` : forecast.forecast_3m}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">6 meses</div>
                    <div className="font-medium text-green-600">
                      {forecast.forecast_type === 'revenue' ? `R$ ${forecast.forecast_6m.toLocaleString('pt-BR')}` : forecast.forecast_6m}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">12 meses</div>
                    <div className="font-medium text-green-600">
                      {forecast.forecast_type === 'revenue' ? `R$ ${forecast.forecast_12m.toLocaleString('pt-BR')}` : forecast.forecast_12m}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ranking de Franqueados */}
      {rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Ranking de Franqueados
            </CardTitle>
            <CardDescription>
              Performance dos franqueados da rede
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankings.slice(0, 10).map((ranking, index) => (
                <div key={ranking.franchise_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index < 3 ? 'bg-yellow-500 text-white' : 'bg-gray-200'
                    }`}>
                      {ranking.ranking_position}
                    </div>
                    <div>
                      <div className="font-medium">{ranking.franchise_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {ranking.total_barbershops} barbearias • {ranking.new_barbershops} novas
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">R$ {ranking.total_revenue.toLocaleString('pt-BR')}</div>
                    <div className="text-sm text-muted-foreground">
                      {ranking.growth_rate > 0 ? '+' : ''}{ranking.growth_rate}% • Score: {ranking.performance_score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de Análise */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          As análises são baseadas em dados históricos e padrões identificados. 
          As previsões têm margem de erro e devem ser usadas como referência para decisões estratégicas.
        </AlertDescription>
      </Alert>
    </div>
  );
}
