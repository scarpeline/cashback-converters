import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';

interface ReferralsPanelProps {
  partnerId: string;
}

export default function ReferralsPanel({ partnerId }: ReferralsPanelProps) {
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['partner-referrals', partnerId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('partner_referrals')
        .select(`
          *,
          users:referred_user_id (
            email,
            user_metadata
          )
        `)
        .eq('referrer_id', partnerId)
        .order('referred_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700';
      case 'completed': return 'bg-green-500/10 text-green-700';
      case 'cancelled': return 'bg-red-500/10 text-red-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Pessoas Indicadas
        </CardTitle>
        <CardDescription>
          {referrals?.length || 0} pessoas se cadastraram com seu código
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!referrals || referrals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Ninguém se cadastrou com seu código ainda
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral: any) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {referral.users?.user_metadata?.name || referral.users?.email || 'Usuário'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {referral.users?.email}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={getStatusColor(referral.status)}>
                    {getStatusLabel(referral.status)}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(referral.referred_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
