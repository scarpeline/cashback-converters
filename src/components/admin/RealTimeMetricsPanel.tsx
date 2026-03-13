import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  Activity,
  CreditCard,
  Smartphone,
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RealTimeMetrics {
  totalUsers: number;
  activeUsers: number;
  totalBarbershops: number;
  activeBarbershops: number;
  todayRevenue: number;
  monthRevenue: number;
  todayAppointments: number;
  monthAppointments: number;
  pendingPayments: number;
  failedWebhooks: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdate: Date;
}

export const RealTimeMetricsPanel = () => {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalBarbershops: 0,
    activeBarbershops: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    todayAppointments: 0,
    monthAppointments: 0,
    pendingPayments: 0,
    failedWebhooks: 0,
    systemHealth: 'healthy',
    lastUpdate: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

      // Buscar métricas em paralelo
      const [
        usersCount,
        activeUsersCount,
        barbershopsCount,
        activeBarbershopsCount,
        todayMetrics,
        monthMetrics,
        paymentsCount,
        webhooksCount
      ] = await Promise.all([
        // Total de usuários
        supabase.from('profiles').select('id', { count: 'exact' }),
        
        // Usuários ativos (últimos 7 dias)
        supabase.from('profiles').select('id', { count: 'exact' })
          .gte('last_sign_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Total de barbearias
        supabase.from('barbershops').select('id', { count: 'exact' }),
        
        // Barbearias ativas (com agendamentos nos últimos 30 dias)
        supabase.from('barbershops').select('id', { count: 'exact' })
          .in('id', 
            supabase.from('appointments').select('barbershop_id')
              .gte('scheduled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          ),
        
        // Métricas de hoje
        supabase.from('daily_metrics').select('revenue, services_count, appointments_count')
          .eq('date', today),
        
        // Métricas do mês
        supabase.from('daily_metrics').select('revenue, services_count, appointments_count')
          .gte('date', monthStart),
        
        // Pagamentos pendentes
        supabase.from('payments').select('id', { count: 'exact' })
          .eq('status', 'pending'),
        
        // Webhooks com falha nas últimas 24h
        supabase.from('webhook_logs').select('id', { count: 'exact' })
          .lt('response_status', 200)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Calcular métricas de hoje
      const todayData = todayMetrics.data?.[0] || { revenue: 0, services_count: 0, appointments_count: 0 };
      const monthData = monthMetrics.data?.reduce((acc, day) => ({
        revenue: acc.revenue + (day.revenue || 0),
        services_count: acc.services_count + (day.services_count || 0),
        appointments_count: acc.appointments_count + (day.appointments_count || 0)
      }), { revenue: 0, services_count: 0, appointments_count: 0 });

      // Determinar saúde do sistema
      let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if ((webhooksCount.count || 0) > 10) systemHealth = 'critical';
      else if ((webhooksCount.count || 0) > 5 || (paymentsCount.count || 0) > 100) systemHealth = 'warning';

      setMetrics({
        totalUsers: usersCount.count || 0,
        activeUsers: activeUsersCount.count || 0,
        totalBarbershops: barbershopsCount.count || 0,
        activeBarbershops: activeBarbershopsCount.count || 0,
        todayRevenue: todayData.revenue || 0,
        monthRevenue: monthData.revenue || 0,
        todayAppointments: todayData.appointments_count || 0,
        monthAppointments: monthData.appointments_count || 0,
        pendingPayments: paymentsCount.count || 0,
        failedWebhooks: webhooksCount.count || 0,
        systemHealth,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // Atualizar a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Métricas em Tempo Real
          </h2>
          <p className="text-muted-foreground">
            Visão geral do sistema em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge className={getHealthColor(metrics.systemHealth)}>
            {getHealthIcon(metrics.systemHealth)}
            Sistema {metrics.systemHealth === 'healthy' ? 'Saudável' : 
                    metrics.systemHealth === 'warning' ? 'Atenção' : 'Crítico'}
          </Badge>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Última atualização: {format(metrics.lastUpdate, 'HH:mm:ss')}
          </div>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm ${
              autoRefresh 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuários Totais</CardDescription>
            <CardTitle className="text-2xl">{metrics.totalUsers.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{metrics.activeUsers} ativos esta semana</span>
              <Progress value={(metrics.activeUsers / metrics.totalUsers) * 100} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Barbearias</CardDescription>
            <CardTitle className="text-2xl">{metrics.totalBarbershops.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-green-600" />
              <span>{metrics.activeBarbershops} ativas</span>
              <Progress value={(metrics.activeBarbershops / metrics.totalBarbershops) * 100} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Faturamento Hoje</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(metrics.todayRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span>{metrics.todayAppointments} atendimentos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Faturamento Mensal</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(metrics.monthRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{metrics.monthAppointments} atendimentos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <span className="font-semibold">{metrics.pendingPayments}</span>
              </div>
              {metrics.pendingPayments > 50 && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  Atenção: Muitos pagamentos pendentes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Falhas (24h)</span>
                <span className="font-semibold">{metrics.failedWebhooks}</span>
              </div>
              {metrics.failedWebhooks > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {metrics.failedWebhooks} falhas detectadas
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Saúde do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={getHealthColor(metrics.systemHealth)}>
                  {getHealthIcon(metrics.systemHealth)}
                  {metrics.systemHealth === 'healthy' ? 'Saudável' : 
                   metrics.systemHealth === 'warning' ? 'Atenção' : 'Crítico'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics.systemHealth === 'healthy' && 'Todos os sistemas funcionando normalmente'}
                {metrics.systemHealth === 'warning' && 'Alguns sistemas precisam de atenção'}
                {metrics.systemHealth === 'critical' && 'Sistemas críticos com problemas'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos (placeholders para implementação futura) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribuição de Usuários
            </CardTitle>
            <CardDescription>
              Usuários por tipo (Clientes, Profissionais, Donos, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Gráfico em desenvolvimento...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Crescimento Mensal
            </CardTitle>
            <CardDescription>
              Evolução de usuários e faturamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Gráfico em desenvolvimento...
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
