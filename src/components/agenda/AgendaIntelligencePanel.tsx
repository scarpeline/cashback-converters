import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Target,
  Zap,
  Lightbulb,
  AlertCircle,
  UserX,
} from 'lucide-react';
import {
  getAgendaMetrics,
  analyzeDay,
  detectWeakHours,
  predictCancellation,
  generateOptimizationSuggestions,
  getAvailableSlotsForPromotion,
  type AgendaMetrics,
  type DayAnalysis,
  type CancellationPrediction,
  type OptimizationSuggestion,
} from '@/services/agendaOptimizerService';
import {
  detectOccupancyGaps,
  predictCancellations,
  type OccupancyGap,
  type CancellationPrediction as ModuleCancellationPrediction,
} from '@/modules/agenda-optimizer';

interface AgendaIntelligencePanelProps {
  barbershopId: string;
}

export function AgendaIntelligencePanel({ barbershopId }: AgendaIntelligencePanelProps) {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<AgendaMetrics | null>(null);
  const [todayAnalysis, setTodayAnalysis] = useState<DayAnalysis | null>(null);
  const [tomorrowAnalysis, setTomorrowAnalysis] = useState<DayAnalysis | null>(null);
  const [predictions, setPredictions] = useState<CancellationPrediction[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [promoSlots, setPromoSlots] = useState<any[]>([]);
  const [occupancyGaps, setOccupancyGaps] = useState<OccupancyGap[]>([]);
  const [cancellationRisks, setCancellationRisks] = useState<ModuleCancellationPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [barbershopId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, today, tomorrow, predictionsData, suggestionsData, promo, gaps, risks] = await Promise.all([
        getAgendaMetrics(barbershopId, 30),
        analyzeDay(barbershopId, new Date().toISOString().split('T')[0]),
        analyzeDay(barbershopId, new Date(Date.now() + 86400000).toISOString().split('T')[0]),
        predictCancellation(barbershopId),
        generateOptimizationSuggestions(barbershopId),
        getAvailableSlotsForPromotion(barbershopId, 7, 50),
        detectOccupancyGaps(barbershopId),
        predictCancellations(barbershopId),
      ]);

      setMetrics(metricsData);
      setTodayAnalysis(today);
      setTomorrowAnalysis(tomorrow);
      setPredictions(predictionsData.slice(0, 5));
      setSuggestions(suggestionsData);
      setPromoSlots(promo.slice(0, 10));
      setOccupancyGaps(gaps);
      setCancellationRisks(risks.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar análise', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inteligência de Agenda</h2>
          <p className="text-muted-foreground">Análise inteligente e sugestões para otimizar sua agenda</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageOccupancy || 0}%</div>
            <Progress value={metrics?.averageOccupancy || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Meta: 70%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.cancellationRate || 0}%</div>
            <Progress value={metrics?.cancellationRate || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Meta: abaixo de 10%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics?.averageTicket?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão de Perda</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics?.predictedLoss?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">Cancelamentos e no-shows</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="gaps">
            Gaps na Agenda
            {occupancyGaps.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">{occupancyGaps.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          <TabsTrigger value="slots">Slots p/ Promoção</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hoje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ocupação</span>
                  <span className="font-bold">{todayAnalysis?.occupancyRate || 0}%</span>
                </div>
                <Progress value={todayAnalysis?.occupancyRate || 0} />
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Agendados</p>
                    <p className="text-xl font-bold">{todayAnalysis?.bookedSlots || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Disponíveis</p>
                    <p className="text-xl font-bold">{todayAnalysis?.availableSlots || 0}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Faturamento Projetado</span>
                  <span className="font-bold text-green-600">R$ {todayAnalysis?.totalRevenue?.toFixed(2) || '0.00'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Amanhã</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ocupação</span>
                  <span className="font-bold">{tomorrowAnalysis?.occupancyRate || 0}%</span>
                </div>
                <Progress value={tomorrowAnalysis?.occupancyRate || 0} />
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Agendados</p>
                    <p className="text-xl font-bold">{tomorrowAnalysis?.bookedSlots || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Disponíveis</p>
                    <p className="text-xl font-bold">{tomorrowAnalysis?.availableSlots || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">
                    {tomorrowAnalysis?.predictedCancelations || 0} cancelamentos previstos
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Horários de Pico</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.peakHours && metrics.peakHours.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {metrics.peakHours.map((peak) => (
                      <Badge key={peak.hour} variant="default" className="text-sm py-1">
                        {peak.hour}:00 - {peak.occupancy.toFixed(0)}% ocupado
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sem dados de horários de pico</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gaps Tab - NEW */}
        <TabsContent value="gaps">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horários Vazios Hoje
                </CardTitle>
                <CardDescription>
                  Buracos na agenda que podem ser preenchidos com promoções ou ofertas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {occupancyGaps.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-muted-foreground">Nenhum gap significativo detectado hoje. Agenda bem ocupada!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {occupancyGaps.map((gap, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            gap.gap_minutes >= 180 ? 'bg-red-500' :
                            gap.gap_minutes >= 120 ? 'bg-orange-500' : 'bg-yellow-500'
                          }`} />
                          <div>
                            <p className="font-medium">{gap.professional_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {gap.start_time} - {gap.end_time} ({gap.gap_minutes} min)
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          gap.suggestion === 'send_promo_to_inactive' ? 'destructive' :
                          gap.suggestion === 'offer_discount' ? 'secondary' : 'outline'
                        }>
                          {gap.suggestion === 'send_promo_to_inactive' ? '📩 Enviar promo' :
                           gap.suggestion === 'offer_discount' ? '💰 Oferecer desconto' :
                           '✅ Sem ação'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cancellation risks from module */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-red-500" />
                  Risco de Cancelamento (Amanhã)
                </CardTitle>
                <CardDescription>
                  Agendamentos com risco de cancelamento baseado no histórico do cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cancellationRisks.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-muted-foreground">Nenhum risco de cancelamento detectado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cancellationRisks.map((risk) => (
                      <div key={risk.appointment_id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{risk.client_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={risk.risk_score} className="w-24" />
                            <Badge variant={risk.risk_score > 60 ? 'destructive' : risk.risk_score > 40 ? 'secondary' : 'outline'}>
                              {risk.risk_score}%
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(risk.scheduled_at).toLocaleString('pt-BR')}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {risk.risk_factors.map((factor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-primary font-medium">{risk.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Previsão de Cancelamentos</CardTitle>
              <CardDescription>
                Agendamentos com alta probabilidade de cancelamento amanhã
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground">Nenhum cancelamento previsto para amanhã</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {predictions.map((pred) => (
                    <div key={pred.appointmentId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{pred.clientName}</span>
                        </div>
                        <Badge
                          variant={pred.cancellationProbability > 50 ? 'destructive' : 'secondary'}
                        >
                          {pred.cancellationProbability}% probabilidade
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(pred.scheduledDate).toLocaleString('pt-BR')}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {pred.reasons.map((reason, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <p className="text-muted-foreground">Nenhuma sugestão no momento</p>
              </div>
            ) : (
              suggestions.map((suggestion, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Zap className={`w-5 h-5 ${
                        suggestion.type === 'promotion' ? 'text-green-500' :
                        suggestion.type === 'discount' ? 'text-blue-500' :
                        suggestion.type === 'retention' ? 'text-orange-500' :
                        'text-purple-500'
                      }`} />
                      <CardTitle className="text-base">{suggestion.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    <div>
                      <p className="text-xs text-muted-foreground">Público Alvo:</p>
                      <p className="text-sm font-medium">{suggestion.targetAudience}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Impacto Potencial:</p>
                      <p className="text-sm font-medium text-green-600">{suggestion.potentialImpact}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confiança:</span>
                      <Progress value={suggestion.confidence} className="flex-1" />
                      <span className="text-xs font-medium">{suggestion.confidence}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Promo Slots Tab */}
        <TabsContent value="slots">
          <Card>
            <CardHeader>
              <CardTitle>Horários Recomendados para Promoção</CardTitle>
              <CardDescription>
                Slots com baixa ocupação que podem ser preenchidos com descontos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {promoSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <p className="text-muted-foreground">Todos os horários estão bem ocupados!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {promoSlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {new Date(slot.date).toLocaleDateString('pt-BR')} às {slot.time}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {slot.suggestedDiscount}% desconto
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
