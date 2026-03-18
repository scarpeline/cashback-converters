import { useAuth } from '@/lib/auth';
import { usePartner, useDirectReferralsCount } from '@/hooks/usePartners';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, TrendingUp, DollarSign } from 'lucide-react';
import ReferralCodeDisplay from './ReferralCodeDisplay';
import CommissionsPanel from './CommissionsPanel';
import ReferralsPanel from './ReferralsPanel';
import PartnerHierarchyTree from './PartnerHierarchyTree';

export default function PartnerDashboard() {
  const { user } = useAuth();
  const { data: partner, isLoading } = usePartner(user?.id || '');
  const { data: referralCount } = useDirectReferralsCount(partner?.id || '');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Você não é um parceiro registrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Painel do Parceiro</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas indicações e comissões
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Indicados Diretos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pessoas que se cadastraram com seu código
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tipo de Parceiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{partner.type}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nível {partner.level}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${partner.status === 'ativo' ? 'text-green-600' : 'text-red-600'}`}>
              {partner.status === 'ativo' ? '✅ Ativo' : '❌ Bloqueado'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sua conta está {partner.status}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code */}
      <ReferralCodeDisplay
        referralCode={partner.referral_code || ''}
        partnerName={partner.users?.name || 'Parceiro'}
      />

      {/* Referrals and Hierarchy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReferralsPanel partnerId={partner.id} />
        <PartnerHierarchyTree partnerId={partner.id} />
      </div>

      {/* Commissions */}
      <CommissionsPanel partnerId={partner.id} />
    </div>
  );
}
