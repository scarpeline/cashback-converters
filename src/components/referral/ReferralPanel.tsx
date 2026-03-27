import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Gift,
  Copy,
  Share2,
  Check,
  DollarSign,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import {
  getMyReferralCode,
  applyReferralCode,
  getMyReferrals,
  getReferralsByMe,
  getReferralStats,
  getReferralShareOptions,
  Referral,
  ReferralStats,
} from '@/services/referralService';

interface ReferralPanelProps {
  userId: string;
}

export function ReferralPanel({ userId }: ReferralPanelProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [applyCode, setApplyCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referredByMe, setReferredByMe] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLinks, setShareLinks] = useState<{ whatsapp: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [referralCode, myReferrals, byMe, referralStats] = await Promise.all([
        getMyReferralCode(userId),
        getMyReferrals(userId),
        getReferralsByMe(userId),
        getReferralStats(userId),
      ]);

      setCode(referralCode);
      setReferrals(myReferrals);
      setReferredByMe(byMe);
      setStats(referralStats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCode = async () => {
    if (!applyCode.trim()) {
      toast({ title: 'Erro', description: 'Digite um código de indicação', variant: 'destructive' });
      return;
    }

    try {
      const result = await applyReferralCode(userId, applyCode);
      if (result.success) {
        toast({
          title: 'Código aplicado!',
          description: `Você ganhou R$ ${result.reward?.amount} de cashback!`,
        });
        setShowApplyDialog(false);
        setApplyCode('');
        loadData();
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao aplicar código', variant: 'destructive' });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: 'Código copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const links = await getReferralShareOptions(userId);
    setShareLinks(links);
    setShowShareDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Indique Amigos</h2>
          <p className="text-muted-foreground">Ganhe cashback indicando amigos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowApplyDialog(true)}>
            <Gift className="w-4 h-4 mr-2" /> Usar Código
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Seu Código de Indicação</p>
              <p className="text-3xl font-bold tracking-wider">{code}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopyCode}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm opacity-80 mt-2">
            Compartilhe seu código e ganhe R$ 10 de cashback para cada amigo que se cadastrar!
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total de Indicações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              {stats?.totalReferrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {stats?.completedReferrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-orange-500" />
              {stats?.pendingReferrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cashback Ganho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              R$ {stats?.cashbackEarned?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my-referrals">
        <TabsList>
          <TabsTrigger value="my-referrals">Amigos Indicados</TabsTrigger>
          <TabsTrigger value="referral-history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="my-referrals">
          <Card>
            <CardContent className="p-0">
              {referrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum amigo indicado ainda</p>
                  <p className="text-sm">Compartilhe seu código para começar!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {referral.referred_user_name || 'Usuário novo'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            referral.status === 'completed' || referral.status === 'rewarded'
                              ? 'default'
                              : referral.status === 'pending'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {referral.status === 'completed' || referral.status === 'rewarded'
                            ? 'Concluído'
                            : referral.status === 'pending'
                            ? 'Pendente'
                            : 'Cancelado'}
                        </Badge>
                        {referral.reward_amount && (
                          <p className="text-sm text-green-600 mt-1">
                            +R$ {referral.reward_amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referral-history">
          <Card>
            <CardContent className="p-0">
              {referredByMe.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Você ainda não foi indicado por ninguém</p>
                </div>
              ) : (
                <div className="divide-y">
                  {referredByMe.map((referral) => (
                    <div key={referral.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Você foi indicado</p>
                        <p className="text-sm text-muted-foreground">
                          Código: {referral.referral_code}
                        </p>
                      </div>
                      <div className="text-right">
                        {referral.reward_amount && (
                          <p className="text-lg font-bold text-green-600">
                            +R$ {referral.reward_amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usar Código de Indicação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Digite o código de indicação de um amigo para ganhar cashback.
            </p>
            <Input
              placeholder="Ex: INDICA-ABC12345"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
            />
            <Button className="w-full" onClick={handleApplyCode}>
              Aplicar Código
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Código</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Compartilhe seu código de indicação:
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-lg font-bold tracking-wider text-center">{code}</p>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(shareLinks?.whatsapp, '_blank')}
              >
                <Share2 className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(shareLinks?.email, '_blank')}
              >
                <Share2 className="w-4 h-4 mr-2" /> Email
              </Button>
              <Button variant="outline" className="w-full" onClick={handleCopyCode}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copiado!' : 'Copiar Código'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
