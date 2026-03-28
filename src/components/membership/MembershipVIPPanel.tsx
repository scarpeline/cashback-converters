import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Crown,
  Users,
  DollarSign,
  Gift,
  RefreshCw,
  Plus,
  Star,
  TrendingUp,
} from 'lucide-react';
import { getPlans, getMembershipStats, MembershipPlan } from '@/services/membershipService';

interface MembershipVIPPanelProps {
  barbershopId: string;
}

export function MembershipVIPPanel({ barbershopId }: MembershipVIPPanelProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0, totalCashback: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [plansData, statsData] = await Promise.all([
          getPlans(barbershopId),
          getMembershipStats(barbershopId),
        ]);
        setPlans(plansData);
        setStats(statsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [barbershopId]);

  if (loading) {
    return <div className="flex items-center justify-center p-8"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clube VIP</h2>
          <p className="text-muted-foreground">Gerencie planos de assinatura e membros</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Membros</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalMembers}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Membros Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.activeMembers}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Cashback Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">R$ {stats.totalCashback.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Receita</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.is_featured ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.is_featured && <Badge><Star className="w-3 h-3 mr-1" /> Destaque</Badge>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">R$ {plan.price_monthly}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>{plan.discount_percentage}% de desconto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-blue-500" />
                      <span>{plan.cashback_percentage}% cashback</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span>{plan.monthly_visits_included} visitas/mês</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Benefícios:</p>
                    <ul className="text-sm mt-1 space-y-1">
                      {plan.benefits?.map((b, i) => (
                        <li key={i}>• {b.name || b.description}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Indicações</TableHead>
                    <TableHead>Cashback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum membro VIP ainda
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
