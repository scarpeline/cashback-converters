import { usePartnerCommissionSummary, usePartnerCommissions } from '@/hooks/usePartners';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface CommissionsPanelProps {
  partnerId: string;
}

export default function CommissionsPanel({ partnerId }: CommissionsPanelProps) {
  const { data: summary, isLoading: summaryLoading } = usePartnerCommissionSummary(partnerId) as { data: any; isLoading: boolean };
  const { data: commissions, isLoading: commissionsLoading } = usePartnerCommissions(partnerId) as { data: any[]; isLoading: boolean };

  if (summaryLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700';
      case 'approved': return 'bg-blue-500/10 text-blue-700';
      case 'paid': return 'bg-green-500/10 text-green-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovada';
      case 'paid': return 'Paga';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.pending_amount || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.pending_count || 0} comissões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.approved_amount || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.approved_count || 0} comissões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.paid_amount || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.paid_count || 0} comissões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.total_amount || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todas as comissões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
          <CardDescription>
            Últimas comissões geradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !commissions || commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma comissão registrada ainda
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.map((commission: any) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium capitalize">
                        {commission.type.replace(/_/g, ' ')}
                      </p>
                      <Badge variant="outline" className={getStatusColor(commission.status)}>
                        {getStatusLabel(commission.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {commission.description || 'Sem descrição'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatCurrency(commission.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
