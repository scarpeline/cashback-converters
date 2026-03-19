import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

export default function CommissionManagementPanel() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'paid'>('pending');

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['admin-commissions', filterStatus],
    queryFn: async () => {
      let query = (supabase as any)
        .from('partner_commissions')
        .select(`
          *,
          partners (
            id,
            type,
            users:user_id (
              name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = (query as any).eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (commission: any) => {
      const { error } = await (supabase as any)
        .from('partner_commissions')
        .update({ status: 'approved' })
        .eq('id', commission.id);
      if (error) throw error;
      // Notificar parceiro
      await (supabase as any).from('partner_notifications').insert({
        partner_id: commission.partner_id,
        type: 'commission_approved',
        title: 'Comissão aprovada',
        message: `Sua comissão de R$ ${Number(commission.amount).toFixed(2)} foi aprovada`,
        data: { amount: commission.amount },
        read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      toast.success('Comissão aprovada');
    },
    onError: () => {
      toast.error('Erro ao aprovar comissão');
    },
  });

  const payMutation = useMutation({
    mutationFn: async (commission: any) => {
      const { error } = await supabase
        .from('partner_commissions')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', commission.id);
      if (error) throw error;
      // Notificar parceiro
      await (supabase as any).from('partner_notifications').insert({
        partner_id: commission.partner_id,
        type: 'commission_paid',
        title: 'Comissão paga',
        message: `Você recebeu R$ ${Number(commission.amount).toFixed(2)} de comissão`,
        data: { amount: commission.amount },
        read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      toast.success('Comissão marcada como paga');
    },
    onError: () => {
      toast.error('Erro ao marcar como paga');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      const { error } = await supabase
        .from('partner_commissions')
        .update({ status: 'cancelled' })
        .eq('id', commissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      toast.success('Comissão cancelada');
    },
    onError: () => {
      toast.error('Erro ao cancelar comissão');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700';
      case 'approved': return 'bg-blue-500/10 text-blue-700';
      case 'paid': return 'bg-green-500/10 text-green-700';
      case 'cancelled': return 'bg-red-500/10 text-red-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovada';
      case 'paid': return 'Paga';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'referral': return 'Indicação';
      case 'franchise_revenue': return 'Franquia';
      case 'network_revenue': return 'Rede';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          Todas
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('pending')}
        >
          <Clock className="w-3 h-3 mr-1" />
          Pendentes
        </Button>
        <Button
          variant={filterStatus === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('approved')}
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Aprovadas
        </Button>
        <Button
          variant={filterStatus === 'paid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('paid')}
        >
          <DollarSign className="w-3 h-3 mr-1" />
          Pagas
        </Button>
      </div>

      {/* Commissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Comissões</CardTitle>
          <CardDescription>
            {commissions?.length || 0} comissões encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!commissions || commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma comissão encontrada
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.map((commission: any) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">
                        {commission.partners?.users?.name || 'Parceiro'}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {commission.partners?.type}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(commission.status)}`}>
                        {getStatusLabel(commission.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {commission.partners?.users?.email}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-muted-foreground">
                        Tipo: {getTypeLabel(commission.type)}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      {commission.description && (
                        <span className="text-muted-foreground">
                          {commission.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right mr-4">
                    <p className="text-lg font-bold">
                      {formatCurrency(commission.amount)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {commission.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveMutation.mutate(commission)}
                          disabled={approveMutation.isPending}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelMutation.mutate(commission.id)}
                          disabled={cancelMutation.isPending}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}

                    {commission.status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => payMutation.mutate(commission)}
                        disabled={payMutation.isPending}
                      >
                        Marcar como Paga
                      </Button>
                    )}

                    {commission.status === 'paid' && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700">
                        ✓ Paga em {new Date(commission.paid_at).toLocaleDateString('pt-BR')}
                      </Badge>
                    )}
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
