import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import CommissionManagementPanel from '@/components/admin/CommissionManagementPanel';
import { formatCurrency } from '@/lib/formatters';

export default function CommissionsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['commission-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_commissions')
        .select('status, amount');

      if (error) throw error;

      const stats = {
        pending: 0,
        approved: 0,
        paid: 0,
        total: 0,
      };

      data?.forEach((commission: any) => {
        stats.total += commission.amount;
        if (commission.status === 'pending') stats.pending += commission.amount;
        if (commission.status === 'approved') stats.approved += commission.amount;
        if (commission.status === 'paid') stats.paid += commission.amount;
      });

      return stats;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Comissões</h1>
        <p className="text-muted-foreground mt-1">
          Aprove, pague e acompanhe as comissões dos parceiros
        </p>
      </div>

      {/* Stats */}
      {!isLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.pending)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando aprovação
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
              <div className="text-2xl font-bold">{formatCurrency(stats.approved)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Prontas para pagamento
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
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Já processadas
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
              <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Todas as comissões
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Management Panel */}
      <CommissionManagementPanel />

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Como funciona</CardTitle>
          <CardDescription>
            Fluxo de comissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-700 flex items-center justify-center font-bold text-xs">1</div>
            <div>
              <p className="font-medium">Pendente</p>
              <p className="text-muted-foreground">Comissão é gerada automaticamente quando um pagamento é confirmado</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-700 flex items-center justify-center font-bold text-xs">2</div>
            <div>
              <p className="font-medium">Aprovada</p>
              <p className="text-muted-foreground">Admin aprova a comissão após validação</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/10 text-green-700 flex items-center justify-center font-bold text-xs">3</div>
            <div>
              <p className="font-medium">Paga</p>
              <p className="text-muted-foreground">Comissão é processada e transferida para o parceiro</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
