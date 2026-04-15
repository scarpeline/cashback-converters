// Dashboard do Parceiro - versão integrada com sistema real
// Usa hooks/serviços reais (partners, partner_commissions, partner_referrals)

import { useAuth } from '@/lib/auth';
import { usePartnerByUserId, useDirectReferralsCount, usePartnerCommissionSummary } from '@/hooks/usePartners';
import FranqueadoDashboard from '@/pages/dashboards/FranqueadoDashboard';
import DiretorDashboard from '@/pages/dashboards/DiretorDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, TrendingUp, DollarSign, Crown, Target, Activity,
  CheckCircle, AlertTriangle, Clock, BarChart3, Network, Loader2
} from 'lucide-react';
import CommissionsPanel from '@/components/partners/CommissionsPanel';
import ReferralsPanel from '@/components/partners/ReferralsPanel';
import ReferralCodeDisplay from '@/components/partners/ReferralCodeDisplay';
import PartnerHierarchyTree from '@/components/partners/PartnerHierarchyTree';
import PartnerNotificationCenter from '@/components/partners/PartnerNotificationCenter';
import { formatCurrency } from '@/lib/formatters';

const getActivityStatus = (daysInactive: number) => {
  if (daysInactive < 40) return { label: 'Ativo', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  if (daysInactive < 60) return { label: 'Atenção', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
  if (daysInactive < 90) return { label: 'Penalizado', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle };
  return { label: 'Crítico', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
};

const PartnerDashboard = () => {
  const { user } = useAuth();
  const { data: partner, isLoading } = usePartnerByUserId(user?.id || '');
  const { data: referralCount = 0 } = useDirectReferralsCount(partner?.id || '');
  const { data: summary } = usePartnerCommissionSummary(partner?.id || '') as { data: any };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Você não está cadastrado como parceiro.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Roteamento por tipo de parceiro
  if (partner.type === 'franqueado') return <FranqueadoDashboard />;
  if (partner.type === 'diretor') return <DiretorDashboard />;

  const activityStatus = getActivityStatus(0); // sem campo dias_parado na tabela real, assume ativo

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel do Parceiro</h1>
            <p className="text-muted-foreground mt-1 capitalize">{partner.type} • Nível {partner.level}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={activityStatus.color}>
              <activityStatus.icon className="w-4 h-4 mr-1" />
              {activityStatus.label}
            </Badge>
            <Badge variant="outline" className="capitalize">
              <Crown className="w-4 h-4 mr-1" />
              {partner.type}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.paid_amount || 0)}</p>
                  <p className="text-sm text-muted-foreground">Comissões Pagas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(summary?.pending_amount || 0)}</p>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-400/10">
                  <Users className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{referralCount}</p>
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
                  <p className="text-2xl font-bold">{partner.total_indicados || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Indicados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Comissões
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Indicações
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-1">
              <Network className="w-4 h-4" />
              Rede
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Notificações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <ReferralCodeDisplay
              referralCode={partner.referral_code || ''}
              partnerName={partner.users?.name || 'Parceiro'}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-gradient-gold">{formatCurrency(summary?.total_amount || 0)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total em comissões</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{(summary?.paid_count || 0) + (summary?.approved_count || 0)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Comissões aprovadas/pagas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold capitalize">{partner.status}</p>
                  <p className="text-sm text-muted-foreground mt-1">Status da conta</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="commissions">
            <CommissionsPanel partnerId={partner.id} />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralsPanel partnerId={partner.id} />
          </TabsContent>

          <TabsContent value="network">
            <PartnerHierarchyTree partnerId={partner.id} />
          </TabsContent>

          <TabsContent value="notifications">
            <PartnerNotificationCenter partnerId={partner.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PartnerDashboard;
