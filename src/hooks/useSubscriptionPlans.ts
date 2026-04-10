import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  asaas_checkout_id: string | null;
  is_active: boolean;
  sort_order: number;
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Erro ao buscar planos:', error);
        toast.error('Erro ao carregar planos');
        return;
      }

      setPlans(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (planId: string, userId: string) => {
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        toast.error('Plano não encontrado');
        return null;
      }

      // Se plano trial, criar assinatura gratuita
      if (plan.duration_months === 0) {
        const { data, error } = await (supabase as any)
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            starts_at: new Date().toISOString(),
            ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
            trial_used: true
          })
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar assinatura trial:', error);
          toast.error('Erro ao ativar plano trial');
          return null;
        }

        toast.success('Plano trial ativado com sucesso!');
        return data;
      }

      // Para planos pagos, redirecionar para checkout ASAAS
      if (plan.asaas_checkout_id) {
        // Criar assinatura pendente
        const { data: subscription, error: subError } = await (supabase as any)
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'pending',
            trial_used: false
          })
          .select()
          .single();

        if (subError) {
          console.error('Erro ao criar assinatura pendente:', subError);
          toast.error('Erro ao iniciar assinatura');
          return null;
        }

        // Redirecionar para checkout ASAAS
        const checkoutUrl = `https://checkout.asaas.com/checkout/${plan.asaas_checkout_id}`;
        window.open(checkoutUrl, '_blank');
        
        return subscription;
      }

      toast.error('Plano não disponível para compra');
      return null;
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      toast.error('Erro ao processar assinatura');
      return null;
    }
  };

  const checkSubscriptionStatus = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(name, price, duration_months)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('ends_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar assinatura:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro inesperado:', error);
      return null;
    }
  };

  return {
    plans,
    loading,
    createSubscription,
    checkSubscriptionStatus,
    refetch: fetchPlans
  };
}
