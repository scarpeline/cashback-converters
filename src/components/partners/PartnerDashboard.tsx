import { useAuth } from '@/lib/auth';
import { usePartnerByUserId, useDirectReferralsCount } from '@/hooks/usePartners';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, TrendingUp, DollarSign, Bell } from 'lucide-react';
import ReferralCodeDisplay from './ReferralCodeDisplay';
import CommissionsPanel from './CommissionsPanel';
import ReferralsPanel from './ReferralsPanel';
import PartnerHierarchyTree from './PartnerHierarchyTree';
import PartnerNotificationCenter from './PartnerNotificationCenter';

export default function PartnerDashboard() {
  const { user } = useAuth();
  const { data: partner, isLoading } = usePartnerByUserId(user?.id || '');
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
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{referralCount || 0}</p>
                <p className="text-sm text-muted-foreground">Indicados Diretos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">{partner.type}</p>
                <p className="text-sm text-muted-foreground">Nível {partner.level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${partner.status === 'ativo' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <DollarSign className={`w-5 h-5 ${partner.status === 'ativo' ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${partner.status === 'ativo' ? 'text-green-600' : 'text-red-600'}`}>
                  {partner.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                </p>
                <p className="text-sm text-muted-foreground">Status da conta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="referrals">Indicações</TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-1" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ReferralCodeDisplay
            referralCode={partner.referral_code || ''}
            partnerName={partner.users?.name || 'Parceiro'}
          />
          <PartnerHierarchyTree partnerId={partner.id} />
        </TabsContent>

        <TabsContent value="commissions">
          <CommissionsPanel partnerId={partner.id} />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralsPanel partnerId={partner.id} />
        </TabsContent>

        <TabsContent value="notifications">
          <PartnerNotificationCenter partnerId={partner.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
