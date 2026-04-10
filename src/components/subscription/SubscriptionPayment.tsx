import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, CreditCard, Smartphone, QrCode, Wallet } from 'lucide-react';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface PaymentFormData {
  plan_id: string;
  payment_method: 'credit_card' | 'pix' | 'debit_card';
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
  card_name?: string;
  cpf?: string;
}

export function SubscriptionPayment() {
  const { plans, loading } = useSubscriptionPlans();
  const { user } = useAuth();
  const [formData, setFormData] = useState<PaymentFormData>({
    plan_id: '',
    payment_method: 'credit_card'
  });
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'plan' | 'payment' | 'processing' | 'success'>('plan');

  const handlePlanSelect = (planId: string) => {
    setFormData(prev => ({ ...prev, plan_id }));
    setStep('payment');
  };

  const handlePaymentSubmit = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!formData.plan_id) {
      toast.error('Selecione um plano');
      return;
    }

    setProcessing(true);
    setStep('processing');

    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Criar assinatura
      const result = await createSubscription();
      
      if (result) {
        setStep('success');
        toast.success('Assinatura criada com sucesso!');
      } else {
        setStep('payment');
        toast.error('Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      setStep('payment');
      toast.error('Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const createSubscription = async () => {
    // Implementar lógica real de criação de assinatura
    // Por enquanto, simula sucesso
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pagamento Aprovado!</h2>
          <p className="text-muted-foreground mb-6">
            Sua assinatura foi ativada com sucesso. Você já pode usar todas as funcionalidades do sistema.
          </p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Ir para o Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'processing') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Processando Pagamento</h2>
          <p className="text-muted-foreground">
            Estamos processando sua assinatura. Por favor, aguarde...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'payment') {
    const selectedPlan = plans.find(p => p.id === formData.plan_id);

    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Finalizar Assinatura</CardTitle>
          <CardDescription>
            Complete seu pagamento para ativar a assinatura
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Resumo do Plano */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Plano Selecionado</span>
              <Badge variant="secondary">{selectedPlan?.name}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                R$ {selectedPlan?.price.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                {selectedPlan?.duration_months === 1 && '/mês'}
                {selectedPlan?.duration_months === 3 && '/trimestre'}
                {selectedPlan?.duration_months === 12 && '/ano'}
              </span>
            </div>
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-3">
            <Label>Método de Pagamento</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value: 'credit_card' | 'pix' | 'debit_card') =>
                setFormData(prev => ({ ...prev, payment_method: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Cartão de Crédito
                  </div>
                </SelectItem>
                <SelectItem value="debit_card">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Cartão de Débito
                  </div>
                </SelectItem>
                <SelectItem value="pix">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    PIX
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dados do Cartão */}
          {(formData.payment_method === 'credit_card' || formData.payment_method === 'debit_card') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card_name">Nome no Cartão</Label>
                <Input
                  id="card_name"
                  placeholder="João da Silva"
                  value={formData.card_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, card_name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="card_number">Número do Cartão</Label>
                <Input
                  id="card_number"
                  placeholder="0000 0000 0000 0000"
                  value={formData.card_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, card_number: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card_expiry">Validade</Label>
                  <Input
                    id="card_expiry"
                    placeholder="MM/AA"
                    value={formData.card_expiry || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_expiry: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card_cvv">CVV</Label>
                  <Input
                    id="card_cvv"
                    placeholder="123"
                    value={formData.card_cvv || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_cvv: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF do Titular</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* PIX */}
          {formData.payment_method === 'pix' && (
            <div className="space-y-4">
              <Alert>
                <QrCode className="w-4 h-4" />
                <AlertDescription>
                  Após confirmar, você será redirecionado para gerar o QR Code PIX.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep('plan')}
              disabled={processing}
            >
              Voltar
            </Button>
            <Button
              className="flex-1"
              onClick={handlePaymentSubmit}
              disabled={processing}
            >
              {processing ? 'Processando...' : 'Pagar Agora'}
            </Button>
          </div>

          {/* Segurança */}
          <div className="text-center text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-3 h-3" />
              <span>Pagamento 100% seguro</span>
            </div>
            <p>Seus dados são criptografados e protegidos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Escolha seu Plano</CardTitle>
        <CardDescription>
          Comece com nosso plano trial de 7 dias grátis
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isTrial = plan.duration_months === 0;
            const isPopular = plan.sort_order === 2;
            const isAnnual = plan.duration_months === 12;
            
            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  isPopular ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    
                    <div className="space-y-1">
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

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Dashboard Completo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Agendamentos Ilimitados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Pagamentos PIX e Cartão</span>
                      </div>
                      {!isTrial && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          <span>Acesso à API</span>
                        </div>
                      )}
                    </div>

                    <Button className="w-full" variant={isPopular ? 'default' : 'outline'}>
                      {isTrial ? 'Começar Grátis' : 'Assinar Agora'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
