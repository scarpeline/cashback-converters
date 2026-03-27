// @ts-nocheck
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock, Zap, Crown } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SubscriptionStatus() {
  const { subscription, loading, isActive, isExpired, daysUntilExpiry } = useSubscription();
  const { user } = useAuth();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold">Sem Assinatura</h3>
              <p className="text-sm text-muted-foreground">
                Comece com nosso plano trial de 7 dias grátis
              </p>
            </div>
            <Button onClick={() => window.location.href = '/pricing'}>
              Ver Planos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (subscription.status === 'trial') return 'bg-blue-500';
    if (isActive) return 'bg-green-500';
    if (isExpired) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getStatusText = () => {
    if (subscription.status === 'trial') return 'Trial Ativo';
    if (isActive) return 'Ativo';
    if (isExpired) return 'Expirado';
    return 'Pendente';
  };

  const getStatusIcon = () => {
    if (isActive) return <CheckCircle className="w-4 h-4" />;
    if (subscription.status === 'trial') return <Clock className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getProgressValue = () => {
    if (subscription.status === 'trial') {
      return ((7 - daysUntilExpiry) / 7) * 100;
    }
    
    const totalDays = subscription.duration_months * 30;
    const daysUsed = totalDays - daysUntilExpiry;
    return (daysUsed / totalDays) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Minha Assinatura</CardTitle>
          <Badge variant="secondary" className={`${getStatusColor()} text-white`}>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </div>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Plano Atual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plano Atual</span>
            <div className="flex items-center gap-2">
              {subscription.subscription_plans.name === 'Anual' && <Crown className="w-4 h-4 text-yellow-500" />}
              <span className="font-semibold">{subscription.subscription_plans.name}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Valor</span>
            <span>
              {subscription.subscription_plans.price === 0 
                ? 'Grátis' 
                : `R$ ${subscription.subscription_plans.price.toFixed(2)}/${subscription.subscription_plans.duration_months === 1 ? 'mês' : 'ano'}`
              }
            </span>
          </div>
        </div>

        {/* Progresso do Período */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {subscription.status === 'trial' ? 'Período Trial' : 'Período Atual'}
            </span>
            <span className="text-muted-foreground">
              {subscription.status === 'trial' 
                ? `${daysUntilExpiry} dias restantes`
                : `Expira em ${daysUntilExpiry} dias`
              }
            </span>
          </div>
          <Progress value={getProgressValue()} className="h-2" />
          <div className="text-xs text-muted-foreground">
            Início: {format(new Date(subscription.starts_at), "dd/MM/yyyy", { locale: ptBR })}
            {' • '}
            Término: {format(new Date(subscription.ends_at), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        </div>

        {/* Status do Pagamento */}
        {subscription.last_payment_at && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Último Pagamento</span>
              <span className="text-muted-foreground">
                {format(new Date(subscription.last_payment_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            {subscription.next_payment_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Próximo Pagamento</span>
                <span className="text-muted-foreground">
                  {format(new Date(subscription.next_payment_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Recursos Disponíveis */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Recursos Disponíveis</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>API Access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Relatórios</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Notificações</span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {subscription.status === 'trial' && (
            <Button 
              className="flex-1" 
              onClick={() => window.location.href = '/pricing'}
            >
              Upgrade de Plano
            </Button>
          )}
          
          {isActive && (
            <>
              <Button 
                variant="outline" 
              >
                Gerenciar Assinatura
              </Button>
              <Button 
                variant="outline"
              >
                Cancelar
              </Button>
            </>
          )}
          
          {isExpired && (
            <Button 
              className="flex-1"
              onClick={() => window.location.href = '/pricing'}
            >
              Renovar Assinatura
            </Button>
          )}
        </div>

        {/* Aviso de Expiração */}
        {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span>
                Sua assinatura expira em {daysUntilExpiry} {daysUntilExpiry === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
