// @ts-nocheck
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Crown, Zap, Shield, Sparkles } from 'lucide-react';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const featureIcons = {
  dashboard: Check,
  appointments: Check,
  professionals: Check,
  services: Check,
  clients: Check,
  reports: Check,
  notifications: Check,
  cashback: Check,
  affiliate_basic: Check,
  api_access: Zap,
  custom_domain: Crown,
  priority_support: Shield,
  advanced_analytics: Star,
  white_label: Sparkles,
  dedicated_support: Shield,
  unlimited_everything: Sparkles
};

const featureLabels = {
  dashboard: 'Dashboard Completo',
  appointments: 'Agendamentos Ilimitados',
  professionals: 'Profissionais',
  services: 'Serviços',
  clients: 'Clientes',
  reports: 'Relatórios',
  notifications: 'Notificações',
  cashback: 'Cashback',
  affiliate_basic: 'Afiliados',
  api_access: 'Acesso à API',
  custom_domain: 'Domínio Personalizado',
  priority_support: 'Suporte Prioritário',
  advanced_analytics: 'Analytics Avançado',
  white_label: 'White Label',
  dedicated_support: 'Suporte Dedicado',
  unlimited_everything: 'Recursos Ilimitados'
};

export function SubscriptionPlans() {
  const { plans, loading, createSubscription } = useSubscriptionPlans();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para assinar um plano');
      return;
    }

    setSubscribing(true);
    setSelectedPlan(planId);

    try {
      const result = await createSubscription(planId, user.id);
      
      if (result) {
        if (result.status === 'active') {
          toast.success('Assinatura ativada com sucesso!');
        } else {
          toast.info('Redirecionando para pagamento...');
        }
      }
    } catch (error) {
      console.error('Erro ao assinar plano:', error);
      toast.error('Erro ao processar assinatura');
    } finally {
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Escolha seu plano</h2>
        <p className="text-muted-foreground">
          Comece grátis e upgrade quando precisar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isTrial = plan.duration_months === 0;
          const isPopular = plan.sort_order === 2; // Trimestral
          const isAnnual = plan.duration_months === 12;
          
          return (
            <Card
              key={plan.id}
              className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  {isTrial ? 'Teste por 7 dias grátis' : `R$ ${plan.price.toFixed(2)}/${plan.duration_months === 1 ? 'mês' : plan.duration_months === 3 ? 'trimestre' : 'ano'}`}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {isTrial ? 'GRÁTIS' : `R$ ${plan.price.toFixed(2)}`}
                  </div>
                  {!isTrial && (
                    <div className="text-sm text-muted-foreground">
                      {plan.duration_months === 1 && 'por mês'}
                      {plan.duration_months === 3 && `R$ ${(plan.price / 3).toFixed(2)} por mês`}
                      {plan.duration_months === 12 && `R$ ${(plan.price / 12).toFixed(2)} por mês`}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Recursos incluídos:</h4>
                  <div className="space-y-2">
                    {/* Recursos básicos (todos os planos) */}
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Dashboard Completo</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Agendamentos Ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Pagamentos PIX e Cartão</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Cashback Configurável</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Relatórios Financeiros</span>
                    </div>

                    {/* Recursos premium (planos pagos) */}
                    {!isTrial && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="w-4 h-4 text-blue-500" />
                          <span>Acesso à API</span>
                        </div>
                        {(plan.sort_order >= 2) && (
                          <div className="flex items-center gap-2 text-sm">
                            <Crown className="w-4 h-4 text-purple-500" />
                            <span>Domínio Personalizado</span>
                          </div>
                        )}
                        {(plan.sort_order >= 2) && (
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-orange-500" />
                            <span>Suporte Prioritário</span>
                          </div>
                        )}
                        {isAnnual && (
                          <>
                            <div className="flex items-center gap-2 text-sm">
                              <Sparkles className="w-4 h-4 text-pink-500" />
                              <span>White Label</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Sparkles className="w-4 h-4 text-yellow-500" />
                              <span>Recursos Ilimitados</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing && selectedPlan !== plan.id}
                >
                  {subscribing && selectedPlan === plan.id ? (
                    'Processando...'
                  ) : isTrial ? (
                    'Começar Grátis'
                  ) : (
                    'Assinar Agora'
                  )}
                </Button>

                {isTrial && (
                  <p className="text-xs text-muted-foreground text-center">
                    7 dias grátis • Sem cartão necessário
                  </p>
                )}

                {!isTrial && isAnnual && (
                  <p className="text-xs text-green-600 text-center font-medium">
                    Economia de 44% comparado ao plano mensal
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Cancelamento a qualquer momento • Sem taxas ocultas • Suporte via chat</p>
      </div>
    </div>
  );
}
