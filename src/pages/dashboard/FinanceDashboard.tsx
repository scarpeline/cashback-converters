// Dashboard Financeiro Real
// Integração com pagamentos, comissões e previsões

import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, DollarSign, CreditCard, Calendar, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [financeData, setFinanceData] = useState({
    faturamento: 0,
    previsao: 0,
    comissoes: 0,
    pagamentosPendentes: 0,
    assinaturasAtivas: 0,
  });
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '12m'>('30d');

  useEffect(() => {
    carregarDados();
  }, [period]);

  async function carregarDados() {
    setLoading(true);
    
    try {
      // Calcular data de início baseada no período
      const hoje = new Date();
      const dataInicio = new Date();
      
      switch (period) {
        case '7d':
          dataInicio.setDate(hoje.getDate() - 7);
          break;
        case '30d':
          dataInicio.setDate(hoje.getDate() - 30);
          break;
        case '90d':
          dataInicio.setDate(hoje.getDate() - 90);
          break;
        case '12m':
          dataInicio.setMonth(hoje.getMonth() - 12);
          break;
      }

      // Buscar pagamentos
      const { data: pagamentos, error: pagError } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', dataInicio.toISOString())
        .eq('status', 'paid');

      // Buscar assinaturas ativas
      const { data: assinaturas, error: subError } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('status', 'ativo');

      // Buscar comissões pagas
      const { data: comissoes, error: comError } = await (supabase as any)
        .from('commissions')
        .select('*')
        .gte('created_at', dataInicio.toISOString())
        .eq('status', 'pago');

      // Buscar pagamentos pendentes
      const { data: pendentes, error: pendError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending');

      if (pagError || subError || comError || pendError) {
        throw new Error('Erro ao carregar dados financeiros');
      }

      // Calcular totais
      const faturamento = (pagamentos || []).reduce((acc, p: any) => acc + Number(p.amount), 0);
      const previsao = (assinaturas || []).reduce((acc, s: any) => acc + Number(s.value), 0);
      const comissoesTotal = (comissoes || []).reduce((acc, c: any) => acc + Number(c.amount), 0);
      const pagamentosPendentes = (pendentes || []).reduce((acc, p: any) => acc + Number(p.amount), 0);

      setFinanceData({
        faturamento,
        previsao,
        comissoes: comissoesTotal,
        pagamentosPendentes,
        assinaturasAtivas: assinaturas?.length || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados financeiros...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Visão completa de receitas, comissões e previsões
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={period === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('7d')}
          >
            7 dias
          </Button>
          <Button
            variant={period === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('30d')}
          >
            30 dias
          </Button>
          <Button
            variant={period === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('90d')}
          >
            90 dias
          </Button>
          <Button
            variant={period === '12m' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('12m')}
          >
            12 meses
          </Button>
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(financeData.faturamento)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {period === '7d' ? 'Últimos 7 dias' : 
               period === '30d' ? 'Últimos 30 dias' :
               period === '90d' ? 'Últimos 90 dias' : 'Últimos 12 meses'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão de Receita</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(financeData.previsao)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {financeData.assinaturasAtivas} assinaturas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(financeData.comissoes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Distribuído para parceiros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(financeData.pagamentosPendentes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {financeData.pagamentosPendentes > 0 ? 'Aguardando pagamento' : 'Sem pendências'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Líquido</p>
                <p className="text-lg font-bold">{formatMoney(financeData.faturamento)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Comissões</p>
                <p className="text-lg font-bold text-red-500">-{formatMoney(financeData.comissoes)}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Estimado</p>
                <p className="text-xl font-bold text-green-500">
                  {formatMoney(financeData.faturamento - financeData.comissoes)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Margem</p>
                <p className="text-xl font-bold">
                  {financeData.faturamento > 0 
                    ? ((financeData.faturamento - financeData.comissoes) / financeData.faturamento * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinaturas e Recorrência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                <p className="text-2xl font-bold">{financeData.assinaturasAtivas}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                <p className="text-2xl font-bold">{formatMoney(financeData.previsao)}</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Próximo Vencimento</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {financeData.assinaturasAtivas > 0 
                  ? 'Próximas renovações em breve' 
                  : 'Nenhuma assinatura ativa no momento'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="font-semibold">Receber Pagamentos</p>
                <p className="text-sm text-muted-foreground">Gerenciar pagamentos pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <CreditCard className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold">Comissões</p>
                <p className="text-sm text-muted-foreground">Ver distribuição de comissões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="font-semibold">Relatórios</p>
                <p className="text-sm text-muted-foreground">Exportar relatórios financeiros</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}