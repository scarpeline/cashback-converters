import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, AlertTriangle, CheckCircle, TrendingUp, Users, 
  DollarSign, MapPin, Calendar, Activity, Eye
} from 'lucide-react';
import { useFeature } from '@/hooks/useFeatureFlags';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FraudAlert {
  id: string;
  barbershop_id: string;
  barbershop_name: string;
  alert_type: string;
  risk_score: number;
  description: string;
  status: string;
  created_at: string;
}

interface FraudMetric {
  barbershop_id: string;
  barbershop_name: string;
  date: string;
  total_appointments: number;
  total_payments: number;
  recorded_payments: number;
  discrepancy_amount: number;
  discrepancy_percentage: number;
  risk_level: string;
}

export function AntiFraudPanel() {
  const { enabled: antifraudEnabled } = useFeature('antifraud_system');
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [metrics, setMetrics] = useState<FraudMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (antifraudEnabled) {
      loadFraudData();
    }
  }, [antifraudEnabled]);

  const loadFraudData = async () => {
    setLoading(true);
    try {
      // Carregar alertas de fraude
      const { data: alertsData } = await supabase.rpc('get_fraud_alerts', {
        p_limit: 20
      });
      
      if (alertsData) {
        setAlerts(alertsData);
      }

      // Carregar métricas recentes
      const { data: metricsData } = await supabase
        .from('fraud_metrics')
        .select(`
          *,
          barbershops(name)
        `)
        .order('date', { ascending: false })
        .limit(20);
      
      if (metricsData) {
        setMetrics(metricsData.map(m => ({
          ...m,
          barbershop_name: m.barbershops?.name || 'Barbearia desconhecida'
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar dados anti-fraude:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeFraud = async () => {
    setAnalyzing(true);
    try {
      // Analisar todas as barbearias
      const { data: barbershops } = await supabase
        .from('barbershops')
        .select('id');
      
      if (barbershops) {
        for (const barbershop of barbershops) {
          await supabase.rpc('analyze_payment_discrepancy', {
            p_barbershop_id: barbershop.id
          });
          
          await supabase.rpc('detect_unusual_volume', {
            p_barbershop_id: barbershop.id
          });
        }
      }
      
      await loadFraudData();
    } catch (error) {
      console.error('Erro ao analisar fraudes:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('fraud_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertId);
      
      if (error) {
        throw error;
      }
      
      await loadFraudData();
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    if (score >= 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'payment_mismatch': return 'text-red-600';
      case 'unusual_volume': return 'text-orange-600';
      case 'suspicious_pattern': return 'text-purple-600';
      case 'multiple_accounts': return 'text-blue-600';
      case 'chargeback_risk': return 'text-yellow-600';
      case 'velocity_exceeded': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (!antifraudEnabled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sistema Anti-Fraude Desativado</h3>
          <p className="text-muted-foreground mb-4">
            Ative o módulo anti-fraude para acessar este painel.
          </p>
          <Button onClick={() => window.location.href = '/admin/features'}>
            Ativar Sistema Anti-Fraude
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

  const criticalAlerts = alerts.filter(a => a.risk_score >= 70);
  const highRiskAlerts = alerts.filter(a => a.risk_score >= 40 && a.risk_score < 70);
  const totalDiscrepancy = metrics.reduce((acc, m) => acc + Math.abs(m.discrepancy_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema Anti-Fraude</h2>
          <p className="text-muted-foreground">
            Detecção automática de atividades suspeitas e fraudes
          </p>
        </div>
        <Button onClick={handleAnalyzeFraud} disabled={analyzing}>
          <Eye className="w-4 h-4 mr-2" />
          {analyzing ? 'Analisando...' : 'Analisar Sistema'}
        </Button>
      </div>

      {/* Estatísticas de Risco */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Alertas Críticos</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">{criticalAlerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Alto Risco</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-orange-600">{highRiskAlerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Discrepância Total</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">
              R$ {totalDiscrepancy.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Barbearias Monitoradas</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Fraude */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Fraude
          </CardTitle>
          <CardDescription>
            Atividades suspeitas detectadas pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getRiskLevelColor(alert.status === 'resolved' ? 'low' : 'critical')}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{alert.barbershop_name}</span>
                      <Badge className={`text-xs ${getRiskScoreColor(alert.risk_score)}`}>
                        Score: {alert.risk_score}/100
                      </Badge>
                      <Badge className={`text-xs ${getAlertTypeColor(alert.alert_type)}`}>
                        {alert.alert_type}
                      </Badge>
                      {alert.status === 'resolved' && (
                        <Badge className="bg-green-500 text-white text-xs">
                          Resolvido
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {alert.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(alert.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  {alert.status !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Discrepância */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Análise de Discrepâncias
          </CardTitle>
          <CardDescription>
            Diferenças entre agendamentos e pagamentos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.map((metric) => (
              <div key={`${metric.barbershop_id}-${metric.date}`} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getRiskLevelColor(metric.risk_level)}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metric.barbershop_name}</span>
                      <Badge className={`text-xs ${getRiskLevelColor(metric.risk_level)}`}>
                        {metric.risk_level}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metric.total_appointments} agendamentos • R$ {metric.total_payments.toFixed(2)} esperado • R$ {metric.recorded_payments.toFixed(2)} registrado
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${Math.abs(metric.discrepancy_percentage) > 30 ? 'text-red-600' : 'text-green-600'}`}>
                    {metric.discrepancy_percentage > 0 ? '+' : ''}{metric.discrepancy_percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    R$ {Math.abs(metric.discrepancy_amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(metric.date), "dd/MM", { locale: ptBR })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerta de Monitoramento */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          O sistema monitora automaticamente atividades suspeitas 24/7. 
          Alertas críticos (score ≥ 70) requerem atenção imediata.
        </AlertDescription>
      </Alert>
    </div>
  );
}
